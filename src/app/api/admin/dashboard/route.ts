import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
    const totalOrders = await prisma.order.count();
    const totalTrades = await prisma.trade.count();
    
    const volumeResult = await prisma.trade.aggregate({
      _sum: { quantity: true }
    });
    const totalVolume = volumeResult._sum.quantity || 0;
    
    const pendingOrders = await prisma.order.count({
      where: { status: { in: ['OPEN', 'PARTIALLY_FILLED'] } }
    });

    const matchRate = totalOrders > 0 
      ? Number(((totalTrades * 2 / totalOrders) * 100).toFixed(1))
      : 0; // Each trade fulfills up to 2 orders

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalOrders,
        totalTrades,
        totalVolume,
        pendingOrders,
        matchRate
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
