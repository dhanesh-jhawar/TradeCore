import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { symbol: true } }
      }
    });

    const trades = await prisma.trade.findMany({
      take: 10,
      orderBy: { executedAt: 'desc' },
      include: {
        company: { select: { symbol: true } },
        buyer: { select: { id: true } },
        seller: { select: { id: true } }
      }
    });

    return NextResponse.json({
      orders: orders.map(o => ({
        time: new Date(o.createdAt).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
        oid: o.id.split('-')[0].toUpperCase(), // Short ID
        uid: o.userId.split('-')[0].toUpperCase(),
        sym: o.company.symbol,
        side: o.side,
        type: o.orderType,
        price: o.price ? o.price.toFixed(2) : '—',
        qty: o.quantity,
        st: o.status
      })),
      trades: trades.map(t => ({
        time: new Date(t.executedAt).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
        sym: t.company.symbol,
        price: t.price.toFixed(2),
        qty: t.quantity,
        buy: t.buyerId.split('-')[0].toUpperCase(),
        sell: t.sellerId.split('-')[0].toUpperCase()
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
