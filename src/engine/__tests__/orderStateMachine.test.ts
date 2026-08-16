import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { OrderStateMachine } from '../orderStateMachine';
import crypto from 'crypto';

const prisma = new PrismaClient();

describe('OrderStateMachine', () => {
  let testUserId: string;
  let testCompanyId: string;

  beforeAll(async () => {
    // Setup test data
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        wallet: {
          create: { availableBalance: 10000 },
        },
        portfolio: {
          create: {},
        }
      },
      include: { portfolio: true }
    });
    testUserId = user.id;

    const company = await prisma.company.create({
      data: {
        symbol: `TST${Date.now()}`,
        companyName: 'Test Company',
        sector: 'Tech',
        industry: 'Software',
        currentPrice: 100,
        openingPrice: 100,
        previousClose: 100,
        dayHigh: 100,
        dayLow: 100,
        marketCap: 1000000,
        tickSize: 0.05,
        status: 'ACTIVE',
      },
    });
    testCompanyId = company.id;

    // Give user some holdings for sell tests
    await prisma.portfolioHolding.create({
      data: {
        portfolioId: user.portfolio?.id as unknown as string,
        companyId: company.id,
        quantity: 50,
        averagePrice: 100,
        currentPrice: 100,
      }
    })
  });

  afterAll(async () => {
    // Cleanup is optional since this is a local dev DB, but good practice
    // For simplicity, we just disconnect
    await prisma.$disconnect();
  });

  it('should create a NEW order successfully', async () => {
    const clientOrderId = crypto.randomUUID();
    const order = await OrderStateMachine.submitOrder({
      clientOrderId,
      userId: testUserId,
      companyId: testCompanyId,
      side: 'BUY',
      orderType: 'LIMIT',
      price: 100,
      quantity: 10,
    });

    expect(order).toBeDefined();
    expect(order.status).toBe('NEW');
    expect(order.clientOrderId).toBe(clientOrderId);
    expect(order.filledQuantity).toBe(0);
    expect(order.remainingQuantity).toBe(10);
  });

  it('should enforce idempotency via clientOrderId', async () => {
    const clientOrderId = crypto.randomUUID();
    const order1 = await OrderStateMachine.submitOrder({
      clientOrderId,
      userId: testUserId,
      companyId: testCompanyId,
      side: 'BUY',
      orderType: 'LIMIT',
      price: 100,
      quantity: 10,
    });

    const order2 = await OrderStateMachine.submitOrder({
      clientOrderId,
      userId: testUserId,
      companyId: testCompanyId,
      side: 'BUY',
      orderType: 'LIMIT',
      price: 100,
      quantity: 10,
    });

    // Should return the exact same order instance from DB without throwing
    expect(order1.id).toBe(order2.id);
  });

  it('should reject invalid tick sizes during validation', async () => {
    const clientOrderId = crypto.randomUUID();
    const order = await OrderStateMachine.submitOrder({
      clientOrderId,
      userId: testUserId,
      companyId: testCompanyId,
      side: 'BUY',
      orderType: 'LIMIT',
      price: 100.03, // tick size is 0.05
      quantity: 10,
    });

    const validated = await OrderStateMachine.validateOrder(order.id);
    expect(validated.status).toBe('REJECTED');
  });

  it('should validate and transition to VALIDATED for a valid order', async () => {
    const clientOrderId = crypto.randomUUID();
    const order = await OrderStateMachine.submitOrder({
      clientOrderId,
      userId: testUserId,
      companyId: testCompanyId,
      side: 'BUY',
      orderType: 'LIMIT',
      price: 100.05,
      quantity: 10,
    });

    const validated = await OrderStateMachine.validateOrder(order.id);
    expect(validated.status).toBe('VALIDATED');

    // Test transition to OPEN
    const opened = await OrderStateMachine.openOrder(validated.id);
    expect(opened.status).toBe('OPEN');
    expect(opened.sequenceNumber).toBeGreaterThan(0);
  });

  it('should prevent invalid state transitions (e.g., FILLED -> CANCELLED)', async () => {
    const clientOrderId = crypto.randomUUID();
    const order = await OrderStateMachine.submitOrder({
      clientOrderId,
      userId: testUserId,
      companyId: testCompanyId,
      side: 'BUY',
      orderType: 'LIMIT',
      price: 100,
      quantity: 10,
    });

    await OrderStateMachine.validateOrder(order.id);
    await OrderStateMachine.openOrder(order.id);
    const filled = await OrderStateMachine.fillOrder(order.id, 10, 100);
    
    expect(filled.status).toBe('FILLED');

    // Attempting to cancel a FILLED order should throw
    await expect(OrderStateMachine.cancelOrder(filled.id)).rejects.toThrow(/Cannot cancel order in state FILLED/);
  });
});
