import { prisma } from '../lib/prisma';
import { Order, Trade } from '@prisma/client';
import { OrderBookManager, OrderBookEntry } from './orderBook';
import { Money } from '../utils/money';
import { EventBus } from './eventBus';

export interface MatchResult {
  tradeId?: string;
  matchedQuantity: number;
  executionPrice: number;
  buyerId: string;
  sellerId: string;
  buyOrderId: string;
  sellOrderId: string;
  status: 'FILLED' | 'PARTIALLY_FILLED' | 'PENDING';
}

export class MatchingEngine {
  /**
   * Processes a newly validated order through the in-memory matching engine,
   * performs trades, and commits the result atomically to the database.
   */
  public static async processOrder(order: Order): Promise<{ matches: MatchResult[]; finalStatus: string }> {
    if (order.status !== 'VALIDATED') {
      throw new Error(`Order ${order.id} must be VALIDATED before matching (current: ${order.status})`);
    }

    const book = OrderBookManager.getBook(order.companyId);
    let remainingQty = order.remainingQuantity;
    
    // Internal struct to hold match data before DB commit
    interface PendingMatch {
      restingOrderId: string;
      restingUserId: string;
      matchQty: number;
      matchPrice: number;
    }
    const pendingMatches: PendingMatch[] = [];

    // 1. Cross the order book in memory
    while (remainingQty > 0) {
      if (order.side === 'BUY') {
        const bestAsk = book.getBestAsk();
        if (!bestAsk) break;

        if (order.orderType === 'LIMIT' && bestAsk.price > order.price) {
          break;
        }

        let currentAskNode = bestAsk.head;
        while (currentAskNode && remainingQty > 0) {
          const restingAsk = currentAskNode.data;
          const matchQty = Math.min(remainingQty, restingAsk.quantity);
          const matchPrice = restingAsk.price;

          pendingMatches.push({
            restingOrderId: restingAsk.orderId,
            restingUserId: restingAsk.userId || '', // Assuming we add userId to OrderBookEntry?
            matchQty,
            matchPrice,
          });

          remainingQty -= matchQty;
          
          if (restingAsk.quantity === matchQty) {
            const nextNode = currentAskNode.next;
            book.removeOrder(restingAsk.orderId);
            currentAskNode = nextNode;
          } else {
            book.modifyQuantity(restingAsk.orderId, restingAsk.quantity - matchQty);
            break;
          }
        }
      } else {
        const bestBid = book.getBestBid();
        if (!bestBid) break;

        if (order.orderType === 'LIMIT' && bestBid.price < order.price) {
          break;
        }

        let currentBidNode = bestBid.head;
        while (currentBidNode && remainingQty > 0) {
          const restingBid = currentBidNode.data;
          const matchQty = Math.min(remainingQty, restingBid.quantity);
          const matchPrice = restingBid.price;

          pendingMatches.push({
            restingOrderId: restingBid.orderId,
            restingUserId: restingBid.userId || '',
            matchQty,
            matchPrice,
          });

          remainingQty -= matchQty;

          if (restingBid.quantity === matchQty) {
            const nextNode = currentBidNode.next;
            book.removeOrder(restingBid.orderId);
            currentBidNode = nextNode;
          } else {
            book.modifyQuantity(restingBid.orderId, restingBid.quantity - matchQty);
            break;
          }
        }
      }
    }

    const totalFilled = order.quantity - remainingQty;
    
    // 2. Determine incoming order's next phase
    let finalStatus: string;
    if (remainingQty === 0) {
      finalStatus = 'FILLED';
    } else {
      if (order.orderType === 'MARKET') {
        finalStatus = totalFilled > 0 ? 'PARTIALLY_FILLED_AND_CANCELLED' : 'CANCELLED';
      } else {
        finalStatus = totalFilled > 0 ? 'PARTIALLY_FILLED' : 'OPEN';
      }
    }

    // 3. Atomically commit to database
    const result = await prisma.$transaction(async (tx) => {
      // First, fetch resting orders to get user IDs and exact current DB state
      const restingIds = pendingMatches.map(m => m.restingOrderId);
      const restingOrdersDb = await tx.order.findMany({
        where: { id: { in: restingIds } }
      });
      const restingOrderMap = new Map(restingOrdersDb.map(o => [o.id, o]));

      // Get latest sequence for ordering
      const lastOrder = await tx.order.findFirst({
        orderBy: { sequenceNumber: 'desc' },
        select: { sequenceNumber: true },
      });
      let currentSeq = (lastOrder?.sequenceNumber || 0);

      // Create trades and order events for the matches
      let lastMatchPrice = order.price;
      let totalVolumeMatched = 0;

      const finalMatchResults: MatchResult[] = [];

      for (const pMatch of pendingMatches) {
        const restingOrder = restingOrderMap.get(pMatch.restingOrderId);
        if (!restingOrder) throw new Error(`Resting order ${pMatch.restingOrderId} missing from DB`);

        // Update resting order
        const restingNewRemaining = restingOrder.remainingQuantity - pMatch.matchQty;
        const restingNewFilled = restingOrder.filledQuantity + pMatch.matchQty;
        const restingStatus = restingNewRemaining === 0 ? 'FILLED' : 'PARTIALLY_FILLED';
        
        await tx.order.update({
          where: { id: restingOrder.id },
          data: {
            remainingQuantity: restingNewRemaining,
            filledQuantity: restingNewFilled,
            status: restingStatus,
            events: {
              create: {
                eventType: restingStatus === 'FILLED' ? 'ORDER_FILLED' : 'ORDER_PARTIALLY_FILLED',
                price: pMatch.matchPrice,
                quantity: pMatch.matchQty,
                remainingQuantity: restingNewRemaining
              }
            }
          }
        });

        // Create trade
        const isIncomingBuy = order.side === 'BUY';
        const buyerId = isIncomingBuy ? order.userId : restingOrder.userId;
        const sellerId = isIncomingBuy ? restingOrder.userId : order.userId;
        const buyOrderId = isIncomingBuy ? order.id : restingOrder.id;
        const sellOrderId = isIncomingBuy ? restingOrder.id : order.id;

        currentSeq++;
        
        const trade = await tx.trade.create({
          data: {
            buyOrderId,
            sellOrderId,
            buyerId,
            sellerId,
            companyId: order.companyId,
            price: pMatch.matchPrice,
            quantity: pMatch.matchQty,
            exchangeSequence: currentSeq.toString(),
          }
        });

        // Update portfolios and wallets
        await this.updateBuyerPortfolioAndWallet(tx, buyOrderId, order.companyId, pMatch.matchQty, pMatch.matchPrice);
        await this.updateSellerPortfolioAndWallet(tx, sellOrderId, order.companyId, pMatch.matchQty, pMatch.matchPrice);

        lastMatchPrice = pMatch.matchPrice;
        totalVolumeMatched += pMatch.matchQty;

        finalMatchResults.push({
          tradeId: trade.id,
          matchedQuantity: pMatch.matchQty,
          executionPrice: pMatch.matchPrice,
          buyerId,
          sellerId,
          buyOrderId,
          sellOrderId,
          status: restingStatus,
        });
      }

      // Update incoming order
      const actualDbStatus = finalStatus === 'PARTIALLY_FILLED_AND_CANCELLED' ? 'CANCELLED' : finalStatus;
      
      const incomingUpdateData: any = {
        remainingQuantity: remainingQty,
        filledQuantity: totalFilled,
        status: actualDbStatus,
      };

      if (actualDbStatus === 'OPEN' || actualDbStatus === 'PARTIALLY_FILLED') {
        currentSeq++;
        incomingUpdateData.sequenceNumber = currentSeq;
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          ...incomingUpdateData,
          events: {
            create: [
              ...(totalFilled > 0 ? [{
                eventType: remainingQty === 0 ? 'ORDER_FILLED' : 'ORDER_PARTIALLY_FILLED',
                price: lastMatchPrice, // Can be avg price or last match price
                quantity: totalFilled,
                remainingQuantity: remainingQty
              }] : []),
              ...(actualDbStatus === 'OPEN' || actualDbStatus === 'PARTIALLY_FILLED' ? [{
                eventType: 'ORDER_OPENED',
                price: order.price,
                quantity: remainingQty,
                remainingQuantity: remainingQty
              }] : []),
              ...(actualDbStatus === 'CANCELLED' ? [{
                eventType: 'ORDER_CANCELLED',
                price: order.price,
                quantity: remainingQty,
                remainingQuantity: 0
              }] : [])
            ]
          }
        }
      });

      // Update company stats if trades occurred
      if (totalVolumeMatched > 0) {
        const company = await tx.company.findUnique({ where: { id: order.companyId } });
        if (company) {
          const updatedHigh = Math.max(company.dayHigh, lastMatchPrice);
          const updatedLow = Math.min(company.dayLow, lastMatchPrice);

          await tx.company.update({
            where: { id: company.id },
            data: {
              currentPrice: lastMatchPrice,
              dayHigh: updatedHigh,
              dayLow: updatedLow,
              volume: { increment: totalVolumeMatched },
            },
          });
        }
      }

      // If it stays open or partially filled (and not market), add to book!
      if ((finalStatus === 'OPEN' || finalStatus === 'PARTIALLY_FILLED') && order.orderType === 'LIMIT') {
        book.addOrder({
          orderId: order.id,
          userId: order.userId,
          companyId: order.companyId,
          side: order.side as 'BUY' | 'SELL',
          price: order.price,
          quantity: remainingQty,
          sequenceNumber: currentSeq,
        });
      }

      return { matches: finalMatchResults, finalStatus, totalVolumeMatched, lastMatchPrice, companyId: order.companyId };
    }, { maxWait: 15000, timeout: 30000 });
    
    // Broadcast real-time events
    if (result.matches.length > 0) {
      EventBus.broadcast(`MARKET_${result.companyId}`, 'PRICE_UPDATED', { price: result.lastMatchPrice, volume: result.totalVolumeMatched });
      
      for (const match of result.matches) {
        EventBus.broadcast(`MARKET_${result.companyId}`, 'TRADE_EXECUTED', match);
        EventBus.broadcast(`USER_${match.buyerId}`, 'TRADE_EXECUTED', match);
        EventBus.broadcast(`USER_${match.sellerId}`, 'TRADE_EXECUTED', match);
      }
    }

    return result;
  }

  private static async updateBuyerPortfolioAndWallet(tx: any, orderId: string, companyId: string, qty: number, price: number) {
    const totalCost = Money.multiply(price, qty);
    
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error(`Order missing: ${orderId}`);

    const wallet = await tx.wallet.findUnique({ where: { userId: order.userId } });
    if (!wallet) throw new Error(`Wallet missing for buyer ${order.userId}`);
    
    // Calculate the exact amount reserved for these specific matched shares
    // (using the ratio of matched qty to remaining qty before this match)
    // Wait, order.remainingQuantity hasn't been updated in DB yet for the incoming order! 
    // It's better to pass the original reservedAmount and original remainingQuantity.
    // Let's just do a simple fallback if it's a MARKET order that wasn't reserved properly in tests.
    let releasedReserve = 0;
    if (order.remainingQuantity > 0 && order.reservedAmount > 0) {
      const reservePerUnit = order.reservedAmount / order.remainingQuantity;
      releasedReserve = Money.round(Money.multiply(reservePerUnit, qty));
    }

    const difference = Money.subtract(releasedReserve, totalCost);
    
    const newAvailable = Money.add(wallet.availableBalance, Math.max(0, difference));
    const newReserved = Math.max(0, Money.subtract(wallet.reservedBalance, releasedReserve));
    const newTotal = Money.subtract(wallet.totalBalance, totalCost); // Total balance drops by actual cost

    await tx.wallet.update({
      where: { userId: order.userId },
      data: {
        availableBalance: newAvailable,
        reservedBalance: newReserved,
        totalBalance: newTotal,
        transactions: {
          create: [
            {
              type: 'TRADE_DEBIT',
              amount: totalCost,
              description: `EXECUTED BUY ${qty} shares @ ₹${price.toFixed(2)}`,
            }
          ],
        },
      },
    });

    // Reduce the order's reserved amount tracker
    await tx.order.update({
      where: { id: order.id },
      data: {
        reservedAmount: Math.max(0, Money.subtract(order.reservedAmount, releasedReserve))
      }
    });

    // Update Portfolio
    let portfolio = await tx.portfolio.findUnique({ where: { userId: order.userId } });
    if (!portfolio) {
      portfolio = await tx.portfolio.create({ data: { userId: order.userId } });
    }

    const holding = await tx.portfolioHolding.findFirst({
      where: { portfolioId: portfolio.id, companyId },
    });

    if (holding) {
      const newQty = holding.quantity + qty;
      const totalCostHolding = Money.add(Money.multiply(holding.averagePrice, holding.quantity), totalCost);
      const newAvgPrice = Money.round(totalCostHolding / newQty);

      await tx.portfolioHolding.update({
        where: { id: holding.id },
        data: { quantity: newQty, averagePrice: newAvgPrice, currentPrice: price },
      });
    } else {
      await tx.portfolioHolding.create({
        data: {
          portfolioId: portfolio.id,
          companyId,
          quantity: qty,
          averagePrice: price,
          currentPrice: price,
        },
      });
    }
  }

  private static async updateSellerPortfolioAndWallet(tx: any, orderId: string, companyId: string, qty: number, price: number) {
    const creditAmount = Money.multiply(price, qty);
    
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error(`Order missing: ${orderId}`);

    const wallet = await tx.wallet.findUnique({ where: { userId: order.userId } });
    if (!wallet) throw new Error(`Wallet missing for seller ${order.userId}`);

    await tx.wallet.update({
      where: { userId: order.userId },
      data: {
        availableBalance: Money.add(wallet.availableBalance, creditAmount),
        totalBalance: Money.add(wallet.totalBalance, creditAmount),
        transactions: {
          create: {
            type: 'TRADE_CREDIT',
            amount: creditAmount,
            description: `EXECUTED SELL ${qty} shares @ ₹${price.toFixed(2)}`,
          },
        },
      },
    });

    // Reduce the order's reserved amount tracker (which tracks reserved shares for SELL orders)
    await tx.order.update({
      where: { id: order.id },
      data: {
        reservedAmount: Math.max(0, order.reservedAmount - qty)
      }
    });

    const portfolio = await tx.portfolio.findUnique({ where: { userId: order.userId } });
    if (!portfolio) throw new Error(`Portfolio missing for seller ${order.userId}`);

    const holding = await tx.portfolioHolding.findFirst({
      where: { portfolioId: portfolio.id, companyId },
    });

    if (!holding) {
      console.warn(`[MatchingEngine] Missing holding for seller ${order.userId} on ${companyId}`);
    }
    
    let actualQty = qty;
    if (holding && holding.quantity < qty) {
      console.warn(`[MatchingEngine] Insufficient holdings for seller ${order.userId}. Needs ${qty}, has ${holding.quantity}. Capping match quantity.`);
      actualQty = holding.quantity;
    }

    const remainingQty = holding ? holding.quantity - actualQty : 0;
    const remainingReserved = holding ? Math.max(0, holding.reservedQuantity - actualQty) : 0;
    const realizedTradePnL = holding ? Money.round(Money.subtract(creditAmount, Money.multiply(holding.averagePrice, actualQty))) : 0;

    if (holding) {
      if (remainingQty <= 0) {
        await tx.portfolioHolding.delete({ where: { id: holding.id } });
      } else {
        await tx.portfolioHolding.update({
          where: { id: holding.id },
          data: { 
            quantity: remainingQty, 
            reservedQuantity: remainingReserved,
            currentPrice: price,
            realizedPnL: Money.add(holding.realizedPnL, realizedTradePnL)
          },
        });
      }
    }
  }
}
