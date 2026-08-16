import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params;
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
      include: {
        priceHistory: { orderBy: { timestamp: 'asc' }, take: 100 },
        trades: { orderBy: { executedAt: 'desc' }, take: 20 },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Calculate order book depth from pending orders
    const pendingOrders = await prisma.order.findMany({
      where: {
        companyId: company.id,
        status: { in: ['PENDING', 'PARTIALLY_FILLED'] },
      },
    });

    const bidMap = new Map<number, { quantity: number; count: number }>();
    const askMap = new Map<number, { quantity: number; count: number }>();

    for (const o of pendingOrders) {
      const price = Number(o.price.toFixed(2));
      if (o.side === 'BUY') {
        const curr = bidMap.get(price) || { quantity: 0, count: 0 };
        bidMap.set(price, { quantity: curr.quantity + o.remainingQuantity, count: curr.count + 1 });
      } else {
        const curr = askMap.get(price) || { quantity: 0, count: 0 };
        askMap.set(price, { quantity: curr.quantity + o.remainingQuantity, count: curr.count + 1 });
      }
    }

    const bids = Array.from(bidMap.entries())
      .map(([price, val]) => ({ price, quantity: val.quantity, ordersCount: val.count }))
      .sort((a, b) => b.price - a.price)
      .slice(0, 5);

    const asks = Array.from(askMap.entries())
      .map(([price, val]) => ({ price, quantity: val.quantity, ordersCount: val.count }))
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);

    const bidTotal = bids.reduce((acc, b) => acc + b.quantity, 0);
    const askTotal = asks.reduce((acc, a) => acc + a.quantity, 0);
    const combinedTotal = bidTotal + askTotal || 1;

    const depth = {
      bids,
      asks,
      bidTotal,
      askTotal,
      bidRatio: Number(((bidTotal / combinedTotal) * 100).toFixed(1)),
      askRatio: Number(((askTotal / combinedTotal) * 100).toFixed(1)),
    };

    return NextResponse.json({
      company,
      depth,
      priceHistory: company.priceHistory,
      recentTrades: company.trades,
    });
  } catch (error: any) {
    console.error('Error fetching company details:', error);
    return NextResponse.json({ error: 'Failed to fetch company details' }, { status: 500 });
  }
}
