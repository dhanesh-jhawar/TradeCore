import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runInvariantTests() {
  console.log('Running Invariant Tests...\n');
  let errors = 0;

  try {
    // 1. Wallets cannot have negative available balances (assuming reserved could technically exceed temporarily in edge cases, but total should never be negative)
    const negativeWallets = await prisma.wallet.findMany({
      where: {
        totalBalance: { lt: 0 }
      }
    });
    if (negativeWallets.length > 0) {
      console.error(`❌ Invariant Violation: Found ${negativeWallets.length} wallets with negative balance.`);
      errors++;
    } else {
      console.log('✅ All wallets have positive or zero balance.');
    }

    // 2. Portfolios cannot have negative quantities
    const negativePortfolios = await prisma.portfolioHolding.findMany({
      where: {
        quantity: { lt: 0 }
      }
    });
    if (negativePortfolios.length > 0) {
      console.error(`❌ Invariant Violation: Found ${negativePortfolios.length} portfolios with negative quantity.`);
      errors++;
    } else {
      console.log('✅ All portfolios have positive or zero quantity.');
    }

    // 3. Orders cannot have filledQuantity > quantity
    const overfilledOrders = await prisma.order.findMany({
      where: {
        filledQuantity: { gt: prisma.order.fields.quantity }
      }
    });
    // Fallback if field comparison fails in prisma
    const allOrders = await prisma.order.findMany();
    const badOrders = allOrders.filter(o => o.filledQuantity > o.quantity);
    if (badOrders.length > 0) {
      console.error(`❌ Invariant Violation: Found ${badOrders.length} orders with filledQuantity > quantity.`);
      errors++;
    } else {
      console.log('✅ All orders have filledQuantity <= quantity.');
    }

    // 4. Fully filled orders must have status FILLED
    const incorrectlyOpenOrders = allOrders.filter(o => o.filledQuantity === o.quantity && o.status !== 'FILLED' && o.status !== 'CANCELLED');
    if (incorrectlyOpenOrders.length > 0) {
      console.error(`❌ Invariant Violation: Found ${incorrectlyOpenOrders.length} fully filled orders that are not marked FILLED.`);
      errors++;
    } else {
      console.log('✅ All fully filled orders have correct status.');
    }

  } catch (error) {
    console.error('Error running invariant tests:', error);
    errors++;
  } finally {
    await prisma.$disconnect();
  }

  if (errors > 0) {
    console.error(`\nTests finished with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All invariant tests passed!`);
    process.exit(0);
  }
}

runInvariantTests();
