import { EventEmitter } from 'events';
import { MatchingEngine, MatchResult } from './matchingEngine';
import { prisma } from '../lib/prisma';
import { RecoveryEngine } from './recoveryEngine';
import { EventBus } from './eventBus';
import { OrderBookManager } from './orderBook';

export interface LatencyContext {
  receivedAt: number;
  validatedAt: number;
  queuedAt?: number;
  matchingStartedAt?: number;
  executedAt?: number;
}

interface QueueItem {
  orderId: string;
  latencyCtx: LatencyContext;
}

export class ExchangeQueue {
  private static queues: Map<string, QueueItem[]> = new Map();
  private static processing: Map<string, boolean> = new Map();
  private static events = new EventEmitter();

  // Aggregate latencies for periodic flushing to DB
  private static latencyBuffer: { ingress: number; queued: number; matching: number; total: number }[] = [];
  private static lastMetricFlush = Date.now();

  /**
   * Enqueue an order for a specific company and await its completion.
   */
  public static async enqueueAndWait(companyId: string, orderId: string, latencyCtx: LatencyContext): Promise<any> {
    await RecoveryEngine.ensureRecovered();

    if (!this.queues.has(companyId)) {
      this.queues.set(companyId, []);
    }
    
    latencyCtx.queuedAt = Date.now();
    this.queues.get(companyId)!.push({ orderId, latencyCtx });
    
    // Start processor if not running
    if (!this.processing.get(companyId)) {
      this.processQueue(companyId);
    }

    // Wait for this specific order to finish
    return new Promise((resolve, reject) => {
      this.events.once(`order_processed_${orderId}`, (result) => {
        if (result.error) reject(new Error(result.error));
        else resolve(result.data);
      });
    });
  }

  public static getDepth(companyId: string): number {
    return this.queues.get(companyId)?.length || 0;
  }

  private static async processQueue(companyId: string) {
    this.processing.set(companyId, true);
    const queue = this.queues.get(companyId)!;

    while (queue.length > 0) {
      const item = queue.shift()!;
      item.latencyCtx.matchingStartedAt = Date.now();
      
      try {
        const order = await prisma.order.findUnique({ where: { id: item.orderId } });
        if (order && order.status === 'VALIDATED') {
           const result = await MatchingEngine.processOrder(order);
           
           item.latencyCtx.executedAt = Date.now();
           this.recordLatency(item.latencyCtx);
           
           this.events.emit(`order_processed_${item.orderId}`, { data: result });
           
           // Broadcast order book update
           const book = OrderBookManager.getBook(companyId);
           const depth = book.getDepth(10);
           EventBus.broadcast(`MARKET_${companyId}`, 'ORDER_BOOK_UPDATED', {
             bids: depth.bids,
             asks: depth.asks
           });
        } else {
           this.events.emit(`order_processed_${item.orderId}`, { data: null });
        }
      } catch (err: any) {
        console.error(`[ExchangeQueue] Error processing order ${item.orderId}:`, err);
        this.events.emit(`order_processed_${item.orderId}`, { error: err.message });
      }
    }
    this.processing.set(companyId, false);
  }

  private static recordLatency(ctx: LatencyContext) {
    if (!ctx.queuedAt || !ctx.matchingStartedAt || !ctx.executedAt) return;

    const ingress = ctx.validatedAt - ctx.receivedAt;
    const queued = ctx.matchingStartedAt - ctx.queuedAt;
    const matching = ctx.executedAt - ctx.matchingStartedAt;
    const total = ctx.executedAt - ctx.receivedAt;

    this.latencyBuffer.push({ ingress, queued, matching, total });

    if (Date.now() - this.lastMetricFlush > 5000 && this.latencyBuffer.length > 0) {
      this.flushMetrics();
    }
  }

  private static async flushMetrics() {
    const buffer = [...this.latencyBuffer];
    this.latencyBuffer = [];
    this.lastMetricFlush = Date.now();

    if (buffer.length === 0) return;

    const avgLatency = buffer.reduce((sum, b) => sum + b.total, 0) / buffer.length;

    try {
      await prisma.systemMetric.create({
        data: {
          ordersPerSec: buffer.length / 5.0, // rough approx over 5 seconds
          matchesPerSec: buffer.length / 5.0,
          avgLatencyMs: avgLatency,
          activeUsers: 0,
        }
      });
    } catch (e) {
      console.error('[ExchangeQueue] Failed to save metrics:', e);
    }
  }
}
