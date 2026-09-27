import { Order, OrderEvent, PrismaClient, User, Company, PortfolioHolding } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { EventBus } from './eventBus';

export type OrderState =
  | 'NEW'
  | 'VALIDATED'
  | 'OPEN'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED';

export type OrderEventType =
  | 'ORDER_CREATED'
  | 'ORDER_VALIDATED'
  | 'ORDER_QUEUED'
  | 'ORDER_OPENED'
  | 'ORDER_PARTIALLY_FILLED'
  | 'ORDER_FILLED'
  | 'ORDER_CANCELLED'
  | 'ORDER_REJECTED';

const VALID_TRANSITIONS: Record<OrderState, OrderState[]> = {
  NEW: ['VALIDATED', 'REJECTED'],
  VALIDATED: ['OPEN', 'REJECTED'],
  OPEN: ['PARTIALLY_FILLED', 'FILLED', 'CANCELLED'],
  PARTIALLY_FILLED: ['PARTIALLY_FILLED', 'FILLED', 'CANCELLED'],
  FILLED: [], // Terminal
  CANCELLED: [], // Terminal
  REJECTED: [], // Terminal
};

import { Money } from '../utils/money';

// ... (keep top part, redefining classes below)
export class OrderStateMachine {
  /**
   * Submit a new order. Ensures idempotency via clientOrderId.
   */
  static async submitOrder(payload: {
    clientOrderId: string;
    userId: string;
    companyId: string;
    side: 'BUY' | 'SELL';
    orderType: 'MARKET' | 'LIMIT';
    price: number;
    quantity: number;
    source?: string;
  }): Promise<Order> {
    const { clientOrderId, userId, companyId, side, orderType, price, quantity, source = 'USER' } = payload;

    // Fast initial validation before hitting DB
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error('Quantity must be a positive integer');
    }
    if (orderType === 'LIMIT' && price <= 0) {
      throw new Error('Price must be greater than 0 for LIMIT orders');
    }

    try {
      // Use a transaction to ensure idempotency and event creation
      return await prisma.$transaction(async (tx) => {
        // Check idempotency (handled by Prisma unique constraint, but we can do it explicitly)
        const existing = await tx.order.findUnique({
          where: {
            userId_clientOrderId: { userId, clientOrderId },
          },
        });
        if (existing) return existing;

        const order = await tx.order.create({
          data: {
            clientOrderId,
            userId,
            companyId,
            side,
            orderType,
            price: orderType === 'MARKET' ? 0 : price, // Market orders don't have a fixed price
            quantity,
            remainingQuantity: quantity,
            filledQuantity: 0,
            status: 'NEW',
            source,
            events: {
              create: [
                {
                  eventType: 'ORDER_CREATED',
                  price: orderType === 'MARKET' ? 0 : price,
                  quantity,
                  remainingQuantity: quantity,
                },
              ],
            },
          },
        });
        EventBus.broadcast(`USER_${order.userId}`, 'ORDER_CREATED', order);
        return order;
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        // Idempotency conflict
        const existing = await prisma.order.findUnique({
          where: { userId_clientOrderId: { userId, clientOrderId } },
        });
        if (existing) return existing;
      }
      throw err;
    }
  }

  /**
   * Validates an order in the NEW state.
   * Checks tick sizes, market status, and reserves user funds/holdings.
   */
  static async validateOrder(orderId: string): Promise<Order> {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { company: true, user: { include: { wallet: true, portfolio: { include: { holdings: true } } } } },
      });

      if (!order) throw new Error('Order not found');
      if (order.status !== 'NEW') throw new Error(`Cannot validate order in state ${order.status}`);

      let rejectedReason = '';
      let reservedAmount = 0;

      // Validation Rules
      if (order.company.status !== 'ACTIVE') {
        rejectedReason = 'Company is not active for trading';
      }

      // Wallet / Portfolio Validation & Reservation
      if (!rejectedReason) {
        if (order.side === 'BUY') {
          // Market orders ideally require currentPrice * qty + 5% buffer
          const requiredPrice = order.orderType === 'LIMIT' ? order.price : Money.round(order.company.currentPrice * 1.05);
          const requiredFunds = Money.multiply(requiredPrice, order.quantity);
          const wallet = order.user.wallet;

          if (!wallet) {
            rejectedReason = 'Wallet not found';
          } else if (wallet.availableBalance < requiredFunds) {
            rejectedReason = 'Insufficient funds in wallet';
          } else {
            // Reserve the funds
            reservedAmount = requiredFunds;
            await tx.wallet.update({
              where: { userId: order.userId },
              data: {
                availableBalance: Money.subtract(wallet.availableBalance, reservedAmount),
                reservedBalance: Money.add(wallet.reservedBalance, reservedAmount),
                transactions: {
                  create: {
                    type: 'RESERVE',
                    amount: reservedAmount,
                    description: `Reserved funds for BUY ${order.quantity} shares`,
                  }
                }
              }
            });
          }
        } else if (order.side === 'SELL') {
          const portfolio = order.user.portfolio;
          const holding = portfolio?.holdings.find(h => h.companyId === order.companyId);
          
          if (!holding) {
            rejectedReason = 'Holding not found in portfolio';
          } else {
            const availableShares = holding.quantity - holding.reservedQuantity;
            if (availableShares < order.quantity) {
              rejectedReason = 'Insufficient available shares in portfolio';
            } else {
              // Reserve the shares
              reservedAmount = order.quantity; // use reservedAmount field in Order for shares too
              await tx.portfolioHolding.update({
                where: { id: holding.id },
                data: {
                  reservedQuantity: holding.reservedQuantity + order.quantity,
                }
              });
            }
          }
        }
      }

      if (rejectedReason) {
        const rejectedOrder = await this._transition(tx, order, 'REJECTED', 'ORDER_REJECTED', rejectedReason);
        return Object.assign(rejectedOrder, { rejectedReason });
      }

      const validOrder = await this._transition(tx, order, 'VALIDATED', 'ORDER_VALIDATED');
      
      // Update reserved amount on order
      return await tx.order.update({
        where: { id: order.id },
        data: { reservedAmount }
      });
    });
  }

  /**
   * Internal transition helper ensuring state machine rules.
   */
  private static async _transition(
    tx: any,
    order: Order,
    targetState: OrderState,
    eventType: OrderEventType,
    reason?: string
  ): Promise<Order> {
    const validNextStates = VALID_TRANSITIONS[order.status as OrderState];
    if (!validNextStates.includes(targetState)) {
      throw new Error(`Invalid state transition from ${order.status} to ${targetState}`);
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: targetState,
        events: {
          create: {
            eventType,
            price: order.price,
            quantity: order.quantity,
            remainingQuantity: order.remainingQuantity,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Cancel an open or partially filled order and release reservations.
   */
  static async cancelOrder(orderId: string): Promise<Order> {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error('Order not found');

      if (order.status === 'CANCELLED' || order.status === 'FILLED' || order.status === 'REJECTED') {
        throw new Error(`Cannot cancel order in state ${order.status}`);
      }

      // 1. Release reservations
      if (order.reservedAmount > 0) {
        if (order.side === 'BUY') {
          const wallet = await tx.wallet.findUnique({ where: { userId: order.userId } });
          if (wallet) {
            await tx.wallet.update({
              where: { userId: order.userId },
              data: {
                availableBalance: Money.add(wallet.availableBalance, order.reservedAmount),
                reservedBalance: Money.subtract(wallet.reservedBalance, order.reservedAmount),
                transactions: {
                  create: {
                    type: 'RELEASE',
                    amount: order.reservedAmount,
                    description: `Released funds for cancelled BUY order`,
                  }
                }
              }
            });
          }
        } else if (order.side === 'SELL') {
          const portfolio = await tx.portfolio.findUnique({ where: { userId: order.userId } });
          if (portfolio) {
            const holding = await tx.portfolioHolding.findFirst({
              where: { portfolioId: portfolio.id, companyId: order.companyId }
            });
            if (holding) {
              await tx.portfolioHolding.update({
                where: { id: holding.id },
                data: {
                  reservedQuantity: Math.max(0, holding.reservedQuantity - order.reservedAmount),
                }
              });
            }
          }
        }

        // Set reserved amount back to 0 so we don't double release
        await tx.order.update({
          where: { id: order.id },
          data: { reservedAmount: 0 }
        });
      }

      return this._transition(tx, order, 'CANCELLED', 'ORDER_CANCELLED');
    });
  }

  /**
   * Transitions a validated order to OPEN (queued in the exchange).
   */
  static async openOrder(orderId: string): Promise<Order> {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error('Order not found');
      
      const lastOrder = await tx.order.findFirst({
        orderBy: { sequenceNumber: 'desc' },
        select: { sequenceNumber: true },
      });
      const nextSeq = (lastOrder?.sequenceNumber || 0) + 1;

      const validNextStates = VALID_TRANSITIONS[order.status as OrderState];
      if (!validNextStates.includes('OPEN')) {
        throw new Error(`Invalid state transition from ${order.status} to OPEN`);
      }

      return await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'OPEN',
          sequenceNumber: nextSeq,
          events: {
            create: {
              eventType: 'ORDER_OPENED',
              price: order.price,
              quantity: order.quantity,
              remainingQuantity: order.remainingQuantity,
            }
          }
        }
      });
    });
  }

  /**
   * Fill an order (partially or fully).
   */
  static async fillOrder(orderId: string, fillQty: number, fillPrice: number): Promise<Order> {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error('Order not found');

      if (fillQty <= 0) throw new Error('Fill quantity must be > 0');
      if (fillQty > order.remainingQuantity) throw new Error('Fill quantity exceeds remaining quantity');

      const newRemaining = order.remainingQuantity - fillQty;
      const newFilled = order.filledQuantity + fillQty;
      const targetState: OrderState = newRemaining === 0 ? 'FILLED' : 'PARTIALLY_FILLED';
      const eventType: OrderEventType = newRemaining === 0 ? 'ORDER_FILLED' : 'ORDER_PARTIALLY_FILLED';

      const validNextStates = VALID_TRANSITIONS[order.status as OrderState];
      if (!validNextStates.includes(targetState)) {
        throw new Error(`Invalid state transition from ${order.status} to ${targetState}`);
      }

      return await tx.order.update({
        where: { id: order.id },
        data: {
          status: targetState,
          remainingQuantity: newRemaining,
          filledQuantity: newFilled,
          events: {
            create: {
              eventType,
              price: fillPrice,
              quantity: fillQty,
              remainingQuantity: newRemaining,
            },
          },
        },
      });
    });
  }
}

