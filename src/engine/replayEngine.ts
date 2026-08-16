import { prisma } from '@/lib/prisma';
export interface DepthSnapshot {
  bids: { price: number; quantity: number; ordersCount: number }[];
  asks: { price: number; quantity: number; ordersCount: number }[];
  bidTotal: number;
  askTotal: number;
  bidRatio: number;
  askRatio: number;
}

export interface ReplayTick {
  step: number;
  timestamp: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  eventType: string;
  description: string;
  orderBook: DepthSnapshot;
  recentTrades: { time: string; price: number; quantity: number; side: string }[];
}

export interface ReplaySession {
  symbol: string;
  companyName: string;
  totalTicks: number;
  ticks: ReplayTick[];
}

export class ReplayEngine {
  /**
   * Reconstruct historical market replay timeline for a company
   */
  public static async buildReplaySession(symbol: string): Promise<ReplaySession> {
    const company = await prisma.company.findUnique({
      where: { symbol },
      include: {
        priceHistory: { orderBy: { timestamp: 'asc' } },
        trades: { orderBy: { executedAt: 'asc' }, take: 50 },
        orders: { include: { events: true }, orderBy: { createdAt: 'asc' }, take: 100 },
      },
    });

    if (!company) {
      throw new Error(`Company with symbol ${symbol} not found`);
    }

    const ticks: ReplayTick[] = [];
    const history = company.priceHistory;

    // Fetch all events and trades once for the company to reconstruct state efficiently
    const allEvents = await prisma.orderEvent.findMany({
      where: { order: { companyId: company.id } },
      include: { order: { select: { side: true } } },
      orderBy: { timestamp: 'asc' }
    });

    const allTrades = await prisma.trade.findMany({
      where: { companyId: company.id },
      orderBy: { executedAt: 'asc' }
    });

    let eventIdx = 0;
    let tradeIdx = 0;

    // In-memory orderbook state: Map of orderId -> { price, quantity, side }
    const activeOrders = new Map<string, { price: number; quantity: number; side: string }>();

    for (let i = 0; i < history.length; i++) {
      const point = history[i];
      const timeStr = new Date(point.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      });

      // Advance events up to this timestamp
      while (eventIdx < allEvents.length && allEvents[eventIdx].timestamp <= point.timestamp) {
        const ev = allEvents[eventIdx];
        if (['ORDER_QUEUED', 'ORDER_PARTIALLY_FILLED'].includes(ev.eventType)) {
          if (ev.remainingQuantity > 0) {
            activeOrders.set(ev.orderId, { price: ev.price, quantity: ev.remainingQuantity, side: ev.order.side });
          } else {
            activeOrders.delete(ev.orderId);
          }
        } else if (['ORDER_FILLED', 'ORDER_CANCELLED', 'ORDER_REJECTED'].includes(ev.eventType)) {
          activeOrders.delete(ev.orderId);
        }
        eventIdx++;
      }

      // Aggregate current orderbook state from activeOrders
      const bidMap = new Map<number, { quantity: number; ordersCount: number }>();
      const askMap = new Map<number, { quantity: number; ordersCount: number }>();
      let bidTotal = 0;
      let askTotal = 0;

      activeOrders.forEach((o) => {
        if (o.side === 'BUY') {
          const b = bidMap.get(o.price) || { quantity: 0, ordersCount: 0 };
          b.quantity += o.quantity;
          b.ordersCount += 1;
          bidMap.set(o.price, b);
          bidTotal += o.quantity;
        } else {
          const a = askMap.get(o.price) || { quantity: 0, ordersCount: 0 };
          a.quantity += o.quantity;
          a.ordersCount += 1;
          askMap.set(o.price, a);
          askTotal += o.quantity;
        }
      });

      const bids = Array.from(bidMap.entries())
        .map(([price, data]) => ({ price, ...data }))
        .sort((a, b) => b.price - a.price)
        .slice(0, 5);

      const asks = Array.from(askMap.entries())
        .map(([price, data]) => ({ price, ...data }))
        .sort((a, b) => a.price - b.price)
        .slice(0, 5);

      // Collect trades that occurred in the window between the previous point and this point
      const prevTimestamp = i > 0 ? history[i - 1].timestamp : new Date(0);
      const recentTrades: { time: string; price: number; quantity: number; side: string }[] = [];
      
      while (tradeIdx < allTrades.length && allTrades[tradeIdx].executedAt <= point.timestamp) {
        const t = allTrades[tradeIdx];
        if (t.executedAt > prevTimestamp) {
          recentTrades.push({
            time: new Date(t.executedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
            price: t.price,
            quantity: t.quantity,
            side: t.price >= point.open ? 'B' : 'S' // Approximate side for display
          });
        }
        tradeIdx++;
      }

      // Generate a description string from the most recent event if available
      let currentEvent = 'SNAPSHOT_UPDATE';
      if (eventIdx > 0 && eventIdx - 1 < allEvents.length) {
        currentEvent = allEvents[eventIdx - 1].eventType;
      }
      
      ticks.push({
        step: i + 1,
        timestamp: timeStr,
        price: point.close,
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
        volume: point.volume,
        eventType: currentEvent,
        description: `${timeStr} - ${currentEvent} on ${symbol} @ ₹${point.close.toFixed(2)} (Vol: ${point.volume})`,
        orderBook: {
          bids,
          asks,
          bidTotal,
          askTotal,
          bidRatio: bidTotal + askTotal > 0 ? Number(((bidTotal / (bidTotal + askTotal)) * 100).toFixed(1)) : 0,
          askRatio: bidTotal + askTotal > 0 ? Number(((askTotal / (bidTotal + askTotal)) * 100).toFixed(1)) : 0,
        },
        recentTrades: recentTrades.slice(-5), // Take last 5 trades for this tick window
      });
    }

    return {
      symbol,
      companyName: company.companyName,
      totalTicks: ticks.length,
      ticks,
    };
  }
}
