import { prisma } from '../lib/prisma';
import { OrderBookManager } from './orderBook';

export class RecoveryEngine {
  private static isRecovered = false;
  private static isRecovering = false;
  private static recoveryPromise: Promise<void> | null = null;

  /**
   * Called to ensure the in-memory state is rebuilt before processing any new orders.
   */
  public static async ensureRecovered(): Promise<void> {
    if (this.isRecovered) return;
    
    if (this.isRecovering && this.recoveryPromise) {
      return this.recoveryPromise;
    }

    this.isRecovering = true;
    this.recoveryPromise = this.executeRecovery();
    await this.recoveryPromise;
    this.isRecovered = true;
    this.isRecovering = false;
  }

  private static async executeRecovery(): Promise<void> {
    console.log('[RecoveryEngine] Starting exchange recovery...');
    
    // Clear any potentially stale partial memory state (e.g. from hot-reload)
    OrderBookManager.clearAll();

    // 1. Fetch all pending limit orders, strictly ordered by sequence number (FIFO)
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: { in: ['OPEN', 'PARTIALLY_FILLED'] },
        orderType: 'LIMIT', // Only LIMIT orders rest in the book
      },
      orderBy: { sequenceNumber: 'asc' },
    });

    console.log(`[RecoveryEngine] Found ${pendingOrders.length} pending orders to reconstruct.`);

    // 2. Rebuild the books sequentially
    for (const order of pendingOrders) {
      const book = OrderBookManager.getBook(order.companyId);
      book.addOrder({
        orderId: order.id,
        userId: order.userId,
        companyId: order.companyId,
        side: order.side as 'BUY' | 'SELL',
        price: order.price,
        quantity: order.remainingQuantity,
        sequenceNumber: order.sequenceNumber,
      });
    }

    console.log('[RecoveryEngine] Exchange recovery completed successfully.');
  }
}
