import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch trades where the user is either the buyer or the seller
    const trades = await prisma.trade.findMany({
      where: {
        OR: [
          { buyerId: session.userId },
          { sellerId: session.userId }
        ]
      },
      include: { company: true },
      orderBy: { executedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ trades });
  } catch (error: any) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}
