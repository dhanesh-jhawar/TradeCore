import { PrismaClient } from '@prisma/client';
import { OrderStateMachine } from '../src/engine/orderStateMachine.ts';
import { ExchangeQueue } from '../src/engine/exchangeQueue.ts';
import crypto from 'crypto';

const prisma = new PrismaClient();

const SYMBOLS = ['TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'ICICIBANK'];
const SIDES = ['BUY', 'SELL'];
const TYPES = ['MARKET', 'LIMIT'];

async function runStressTest() {
  console.log('Starting internal stress test...');
  let users = await prisma.user.findMany({ take: 5 });
  if (users.length === 0) {
    console.log('No users found in DB for stress testing.');
    process.exit(1);
  }

  let companies = await prisma.company.findMany({ where: { symbol: { in: SYMBOLS } } });
  if (companies.length === 0) {
    console.log('No companies found in DB for stress testing.');
    process.exit(1);
  }

  const promises = [];
  
  for (let i = 0; i < 100; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const side = SIDES[Math.floor(Math.random() * SIDES.length)];
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    const quantity = Math.floor(Math.random() * 50) + 1;
    const price = type === 'LIMIT' ? company.currentPrice + (side === 'BUY' ? -10 : 10) : company.currentPrice;

    promises.push((async () => {
      try {
        const submitted = await OrderStateMachine.submitOrder({
          clientOrderId: crypto.randomUUID(),
          userId: user.id,
          companyId: company.id,
          side: side as 'BUY' | 'SELL',
          orderType: type as 'MARKET' | 'LIMIT',
          price,
          quantity,
        });

        const validated = await OrderStateMachine.validateOrder(submitted.id);
        if (validated.status === 'REJECTED') {
          return;
        }

        await ExchangeQueue.enqueueAndWait(company.id, validated.id, { receivedAt: Date.now(), validatedAt: Date.now() });
      } catch (err) {
        // Validation fails if not enough balance, expected in random stress test
      }
    })());
  }

  await Promise.allSettled(promises);
  console.log('Stress test completed.');
  process.exit(0);
}

runStressTest();
