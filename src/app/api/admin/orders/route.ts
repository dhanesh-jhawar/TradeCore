import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { symbol: true } }
      }
    });

    const totalOrders = await prisma.order.count();
    const openOrders = await prisma.order.count({ where: { status: 'OPEN' } });
    const filledOrders = await prisma.order.count({ where: { status: 'FILLED' } });
    const partialOrders = await prisma.order.count({ where: { status: 'PARTIALLY_FILLED' } });
    const cancelledOrders = await prisma.order.count({ where: { status: 'CANCELLED' } });

    const buyOrders = await prisma.order.count({ where: { side: 'BUY' } });
    const sellOrders = await prisma.order.count({ where: { side: 'SELL' } });

    return NextResponse.json({
      orders: orders.map(o => ({
        oid: o.id.split('-')[0].toUpperCase(),
        time: new Date(o.createdAt).toLocaleTimeString(),
        user: o.userId.split('-')[0].toUpperCase(),
        comp: o.company.symbol,
        side: o.side,
        type: o.orderType,
        price: o.price ? o.price.toFixed(2) : '—',
        qty: o.quantity,
        filled: o.filledQuantity,
        rem: o.quantity - o.filledQuantity,
        st: o.status,
        val: ((o.price || 0) * o.quantity).toFixed(2)
      })),
      stats: {
        totalOrders, openOrders, filledOrders, partialOrders, cancelledOrders, buyOrders, sellOrders
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
