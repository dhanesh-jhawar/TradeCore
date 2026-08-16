import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { OrderStateMachine } from '../orderStateMachine';
import { MatchingEngine } from '../matchingEngine';
import { OrderBookManager } from '../orderBook';
import crypto from 'crypto';
import { Money } from '../../utils/money';

const prisma = new PrismaClient();

describe('MatchingEngine & OrderBook Integration', () => {
  let buyerId: string;
  let sellerId: string;
  let companyId: string;

  beforeAll(async () => {
    // Setup test users
    const buyer = await prisma.user.create({
      data: {
        name: 'Buyer',
        email: `buyer-${Date.now()}@example.com`,
        passwordHash: 'hash',
        wallet: { create: { availableBalance: 100000 } },
        portfolio: { create: {} }
      },
    });
    buyerId = buyer.id;

    const seller = await prisma.user.create({
      data: {
        name: 'Seller',
        email: `seller-${Date.now()}@example.com`,
        passwordHash: 'hash',
        wallet: { create: { availableBalance: 100000 } },
        portfolio: { create: {} }
      },
      include: { portfolio: true }
    });
    sellerId = seller.id;

    const company = await prisma.company.create({
      data: {
        symbol: `MCH${Date.now()}`,
        companyName: 'Match Engine Test',
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

    // Seed seller holding
    await prisma.portfolioHolding.create({
      data: {
        portfolioId: seller.portfolio!.id,
        companyId: company.id,
        quantity: 10000,
        averagePrice: 50,
        currentPrice: 100,
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(() => {
    OrderBookManager.clearAll(); // Clear in-memory book before each test
  });

  const submitAndMatch = async (userId: string, side: 'BUY' | 'SELL', orderType: 'LIMIT' | 'MARKET', price: number, quantity: number) => {
    const order = await OrderStateMachine.submitOrder({
      clientOrderId: crypto.randomUUID(),
      userId,
      companyId,
      side,
      orderType,
      price,
      quantity,
    });
    const validated = await OrderStateMachine.validateOrder(order.id);
    const result = await MatchingEngine.processOrder(validated);
    return { order: validated, ...result };
  };

  it('1. Limit order added to empty book (No compatible order)', async () => {
    const { finalStatus, matches } = await submitAndMatch(buyerId, 'BUY', 'LIMIT', 100, 10);
    expect(matches.length).toBe(0);
    expect(finalStatus).toBe('OPEN');

    const book = OrderBookManager.getBook(companyId);
    expect(book.getBestBid()?.price).toBe(100);
    expect(book.getBestBid()?.totalVolume).toBe(10);
  });

  it('2. Full match (BUY meets SELL)', async () => {
    // Post Sell
    await submitAndMatch(sellerId, 'SELL', 'LIMIT', 100, 10);
    
    // Cross Buy
    const res = await submitAndMatch(buyerId, 'BUY', 'LIMIT', 100, 10);
    
    expect(res.finalStatus).toBe('FILLED');
    expect(res.matches.length).toBe(1);
    expect(res.matches[0].matchedQuantity).toBe(10);
    expect(res.matches[0].executionPrice).toBe(100);

    const book = OrderBookManager.getBook(companyId);
    expect(book.getBestBid()).toBeNull();
    expect(book.getBestAsk()).toBeNull();
  });

  it('3. Partial match', async () => {
    // Post Sell 20
    await submitAndMatch(sellerId, 'SELL', 'LIMIT', 100, 20);
    
    // Cross Buy 5
    const res = await submitAndMatch(buyerId, 'BUY', 'LIMIT', 100, 5);
    
    expect(res.finalStatus).toBe('FILLED'); // The incoming buy is fully filled
    expect(res.matches.length).toBe(1);
    expect(res.matches[0].matchedQuantity).toBe(5);

    const book = OrderBookManager.getBook(companyId);
    expect(book.getBestAsk()?.totalVolume).toBe(15); // Resting sell is partially filled, 15 remaining
  });

  it('4. Multi-match sweeping the book', async () => {
    // 10 @ 101
    await submitAndMatch(sellerId, 'SELL', 'LIMIT', 101, 10);
    // 20 @ 102
    await submitAndMatch(sellerId, 'SELL', 'LIMIT', 102, 20);
    // 30 @ 103
    await submitAndMatch(sellerId, 'SELL', 'LIMIT', 103, 30);

    // Buy 45 @ 105 (willing to pay up to 105, crosses all 3)
    const res = await submitAndMatch(buyerId, 'BUY', 'LIMIT', 105, 45);

    expect(res.finalStatus).toBe('FILLED'); // Buy order filled completely
    expect(res.matches.length).toBe(3);
    
    expect(res.matches[0].matchedQuantity).toBe(10);
    expect(res.matches[0].executionPrice).toBe(101); // Price priority: best ask first
    
    expect(res.matches[1].matchedQuantity).toBe(20);
    expect(res.matches[1].executionPrice).toBe(102);

    expect(res.matches[2].matchedQuantity).toBe(15);
    expect(res.matches[2].executionPrice).toBe(103);

    const book = OrderBookManager.getBook(companyId);
    expect(book.getBestAsk()?.price).toBe(103);
    expect(book.getBestAsk()?.totalVolume).toBe(15); // 30 - 15 = 15 remaining
  });

  it('5. Market order sweeping', async () => {
    // Book has 15 remaining at 103 from previous test (if not cleared, but we clear in beforeEach)
    await submitAndMatch(sellerId, 'SELL', 'LIMIT', 105, 10);
    
    // Buy market 15
    const res = await submitAndMatch(buyerId, 'BUY', 'MARKET', 0, 15);
    
    expect(res.matches.length).toBe(1);
    expect(res.matches[0].matchedQuantity).toBe(10);
    expect(res.matches[0].executionPrice).toBe(105);
    
    // Because it's MARKET, the remaining 5 cannot rest in the book, it must be cancelled.
    expect(res.finalStatus).toBe('PARTIALLY_FILLED_AND_CANCELLED');
    
    const dbOrder = await prisma.order.findUnique({ where: { id: res.order.id } });
    expect(dbOrder?.status).toBe('CANCELLED');
    expect(dbOrder?.filledQuantity).toBe(10);
    expect(dbOrder?.remainingQuantity).toBe(5);
  });

  it('6. FIFO queue execution on same-price', async () => {
    const o1 = await submitAndMatch(sellerId, 'SELL', 'LIMIT', 100, 10);
    const o2 = await submitAndMatch(sellerId, 'SELL', 'LIMIT', 100, 10);
    const o3 = await submitAndMatch(sellerId, 'SELL', 'LIMIT', 100, 10);

    const res = await submitAndMatch(buyerId, 'BUY', 'LIMIT', 100, 15);

    expect(res.matches.length).toBe(2);
    // Should match o1 completely, then o2 partially
    expect(res.matches[0].sellOrderId).toBe(o1.order.id);
    expect(res.matches[0].matchedQuantity).toBe(10);
    expect(res.matches[1].sellOrderId).toBe(o2.order.id);
    expect(res.matches[1].matchedQuantity).toBe(5);
  });

  it('7. Negative quantity prevention (Invariant check)', async () => {
    // Handled by state machine validate before matching
    const o = await OrderStateMachine.submitOrder({
      clientOrderId: crypto.randomUUID(),
      userId: buyerId,
      companyId,
      side: 'BUY',
      orderType: 'LIMIT',
      price: 100,
      quantity: -5,
    }).catch(e => e.message);

    expect(o).toMatch(/Quantity must be a positive integer/);
  });

  it('8. Money exactly calculated and wallets updated correctly', async () => {
    // Check wallet before
    const buyerWalletBefore = await prisma.wallet.findUnique({ where: { userId: buyerId } });
    
    // Add sell 10 @ 50.12 = 501.20
    await submitAndMatch(sellerId, 'SELL', 'LIMIT', 50.12, 10);
    
    // Buy 10 @ 50.12
    await submitAndMatch(buyerId, 'BUY', 'LIMIT', 50.12, 10);

    // Check wallet after
    const buyerWalletAfter = await prisma.wallet.findUnique({ where: { userId: buyerId } });
    
    const diff = Money.subtract(buyerWalletBefore!.availableBalance, buyerWalletAfter!.availableBalance);
    expect(diff).toBe(501.20);
  });
});
