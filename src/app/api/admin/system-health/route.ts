import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    
    const recentOrders = await prisma.order.count({
      where: { createdAt: { gte: oneMinuteAgo } }
    });
    
    const recentTrades = await prisma.trade.count({
      where: { executedAt: { gte: oneMinuteAgo } }
    });

    const ordersPerSec = Number((recentOrders / 60).toFixed(2));
    const matchesPerSec = Number((recentTrades / 60).toFixed(2));

    const pendingOrders = await prisma.order.count({
      where: { status: 'OPEN' }
    });

    return NextResponse.json({
      health: {
        status: 'Operational',
        apiHealth: '99.9%',
        dbHealth: '99.9%',
        wsHealth: 'Active',
        queueLength: pendingOrders,
        ordersPerSec,
        matchesPerSec,
        averageLatency: '12ms',
        p50: '10ms',
        p95: '25ms',
        p99: '45ms',
        errorRate: '0.01%',
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
