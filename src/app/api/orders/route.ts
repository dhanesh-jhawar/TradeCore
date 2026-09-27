import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStateMachine } from '@/engine/orderStateMachine';
import { MatchingEngine } from '@/engine/matchingEngine';
import { ExchangeQueue } from '@/engine/exchangeQueue';
import { getAuthSession } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let whereClause: any = { userId: session.userId };
    if (status && status !== 'ALL') {
      if (status === 'PENDING') {
        whereClause.status = { in: ['NEW', 'VALIDATED', 'OPEN'] };
      } else {
        whereClause.status = status;
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: { company: true, events: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { symbol, side, orderType, price, quantity, clientOrderId } = body;
    const receivedAt = Date.now();

    if (!symbol || !side || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid order parameters' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (ExchangeQueue.getDepth(company.id) > 5000) {
      return NextResponse.json({ error: 'Exchange overloaded. Try again later.' }, { status: 429 });
    }

    const executionPrice = orderType === 'MARKET' ? company.currentPrice : Number(price);

    // 1. Submit through state machine
    const submitted = await OrderStateMachine.submitOrder({
      clientOrderId: clientOrderId || crypto.randomUUID(),
      userId: session.userId,
      companyId: company.id,
      side,
      orderType: orderType || 'LIMIT',
      price: executionPrice,
      quantity,
    });

    // 2. Validate
    const validated = await OrderStateMachine.validateOrder(submitted.id);
    if (validated.status === 'REJECTED') {
      const reason = (validated as any).rejectedReason || 'Order rejected during validation';
      return NextResponse.json({ error: reason, order: validated }, { status: 400 });
    }

    // 3. Process match through queue for serialization
    const validatedAt = Date.now();
    const result = await ExchangeQueue.enqueueAndWait(company.id, validated.id, { receivedAt, validatedAt });

    return NextResponse.json({
      order: validated,
      matches: result.matches,
      finalStatus: result.finalStatus,
      message: result && result.matches && result.matches.length > 0 ? `Order executed! ${result.matches.reduce((acc: number, m: any) => acc + m.matchedQuantity, 0)} shares filled.` : 'Order placed and queued in order book.',
    });
  } catch (error: any) {
    console.error('Error placing order:', error);
    return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 500 });
  }
}
