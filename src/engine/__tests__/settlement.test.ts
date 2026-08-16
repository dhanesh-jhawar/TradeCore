import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { OrderStateMachine } from '../orderStateMachine';
import { MatchingEngine } from '../matchingEngine';
import { OrderBookManager } from '../orderBook';
import crypto from 'crypto';
import { Money } from '../../utils/money';

const prisma = new PrismaClient();

describe('Financial Settlement Integration', () => {
  let buyerId: string;
  let sellerId: string;
  let companyId: string;

  beforeAll(async () => {
    const buyer = await prisma.user.create({
      data: {
        name: 'Settlement Buyer',
        email: `settle-buyer-${Date.now()}@example.com`,
        passwordHash: 'hash',
        wallet: { create: { availableBalance: 1000 } }, // exactly 1000
        portfolio: { create: {} }
      },
    });
    buyerId = buyer.id;

    const seller = await prisma.user.create({
      data: {
        name: 'Settlement Seller',
        email: `settle-seller-${Date.now()}@example.com`,
        passwordHash: 'hash',
        wallet: { create: { availableBalance: 0 } },
        portfolio: { create: {} }
      },
      include: { portfolio: true }
    });
    sellerId = seller.id;

    const company = await prisma.company.create({
      data: {
        symbol: `SET${Date.now()}`,
        companyName: 'Settlement Test',
        sector: 'Tech',
        industry: 'Software',
        currentPrice: 100,
        openingPrice: 100,
        previousClose: 100,
        dayHigh: 100,
        dayLow: 100,
        marketCap: 1000000,
        tickSize: 0.01,
        status: 'ACTIVE',
      },
    });
    companyId = company.id;

    await prisma.portfolioHolding.create({
      data: {
        portfolioId: seller.portfolio!.id,
        companyId: company.id,
        quantity: 10,
        averagePrice: 50,
        currentPrice: 100,
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    OrderBookManager.clearAll();
  });

  it('1. Buy Reservation: Insufficient funds rejects order', async () => {
    // Buyer has 1000. Try to buy 11 @ 100 = 1100
    const o = await OrderStateMachine.submitOrder({
      clientOrderId: crypto.randomUUID(),
      userId: buyerId,
      companyId,
      side: 'BUY',
      orderType: 'LIMIT',
      price: 100,
      quantity: 11,
    });
    
    const validated = await OrderStateMachine.validateOrder(o.id);
    expect(validated.status).toBe('REJECTED');

    const evts = await prisma.orderEvent.findMany({ where: { orderId: o.id } });
    expect(evts.some(e => e.eventType === 'ORDER_REJECTED')).toBe(true);

    const wallet = await prisma.wallet.findUnique({ where: { userId: buyerId } });
    expect(wallet?.availableBalance).toBe(1000); // untouched
    expect(wallet?.reservedBalance).toBe(0);
  });

  it('2. Sell Reservation: Insufficient shares rejects order', async () => {
    // Seller has 10 shares. Try to sell 11.
    const o = await OrderStateMachine.submitOrder({
      clientOrderId: crypto.randomUUID(),
      userId: sellerId,
      companyId,
      side: 'SELL',
      orderType: 'LIMIT',
      price: 100,
      quantity: 11,
    });

    const validated = await OrderStateMachine.validateOrder(o.id);
    expect(validated.status).toBe('REJECTED');
  });

  it('3. Successful Reservation and Cancellation', async () => {
    // Buyer reserves 10 @ 100 = 1000
    const o = await OrderStateMachine.submitOrder({
      clientOrderId: crypto.randomUUID(),
      userId: buyerId,
      companyId,
      side: 'BUY',
      orderType: 'LIMIT',
      price: 100,
      quantity: 10,
    });

    await OrderStateMachine.validateOrder(o.id);
    await OrderStateMachine.openOrder(o.id); // now it's OPEN

    let wallet = await prisma.wallet.findUnique({ where: { userId: buyerId } });
    expect(wallet?.availableBalance).toBe(0);
    expect(wallet?.reservedBalance).toBe(1000);

    // Cancel order
    await OrderStateMachine.cancelOrder(o.id);

    wallet = await prisma.wallet.findUnique({ where: { userId: buyerId } });
    expect(wallet?.availableBalance).toBe(1000); // funds returned
    expect(wallet?.reservedBalance).toBe(0);
  });

  it('4. Full Fill Settlement and PnL generation', async () => {
    // Post Sell 5 @ 100 (reserves 5 shares)
    const sellReq = await OrderStateMachine.submitOrder({
      clientOrderId: crypto.randomUUID(),
      userId: sellerId,
      companyId,
      side: 'SELL',
      orderType: 'LIMIT',
      price: 100,
      quantity: 5,
    });
    const valSell = await OrderStateMachine.validateOrder(sellReq.id);
    await OrderStateMachine.openOrder(valSell.id); // needed to enter pipeline in a real app, though matching engine processes validated directly
    
    // Add to book manually since we are bypassing open order queue listener in this test
    OrderBookManager.getBook(companyId).addOrder({
      orderId: valSell.id,
      userId: sellerId,
      companyId,
      side: 'SELL',
      price: 100,
      quantity: 5,
      sequenceNumber: 1
    });

    const pBefore = await prisma.portfolioHolding.findFirst({ where: { companyId, portfolio: { userId: sellerId } } });
    expect(pBefore?.reservedQuantity).toBe(5); // reserved

    // Buyer buys 5 @ 100 (reserves 500)
    const buyReq = await OrderStateMachine.submitOrder({
      clientOrderId: crypto.randomUUID(),
      userId: buyerId,
      companyId,
      side: 'BUY',
      orderType: 'LIMIT',
      price: 100,
      quantity: 5,
    });
    const valBuy = await OrderStateMachine.validateOrder(buyReq.id);

    // Match
    await MatchingEngine.processOrder(valBuy);

    // Check Buyer Wallet
    const bWallet = await prisma.wallet.findUnique({ where: { userId: buyerId } });
    expect(bWallet?.availableBalance).toBe(500); // 1000 - 500
    expect(bWallet?.reservedBalance).toBe(0);
    expect(bWallet?.totalBalance).toBe(999500); // (Started with 1,000,000 default total, spent 500)
    
    // Check Seller Portfolio PnL
    const sPort = await prisma.portfolioHolding.findFirst({ where: { companyId, portfolio: { userId: sellerId } } });
    expect(sPort?.quantity).toBe(5);
    expect(sPort?.reservedQuantity).toBe(0);
    
    // Revenue = 5 * 100 = 500. Avg price was 50. Cost = 250. Realized PnL = 250.
    expect(sPort?.realizedPnL).toBe(250);

    const sWallet = await prisma.wallet.findUnique({ where: { userId: sellerId } });
    expect(sWallet?.availableBalance).toBe(500); // gained 500
  });
});
