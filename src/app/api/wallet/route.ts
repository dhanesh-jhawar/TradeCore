import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.userId },
      include: {
        transactions: { orderBy: { timestamp: 'desc' }, take: 20 },
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    return NextResponse.json({ wallet });
  } catch (error: any) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, amount } = body; // DEPOSIT or WITHDRAWAL

    const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const val = Number(amount);
    if (isNaN(val) || val <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    let newBalance = wallet.availableBalance;
    if (action === 'DEPOSIT') {
      newBalance += val;
    } else if (action === 'WITHDRAWAL') {
      if (newBalance < val) {
        return NextResponse.json({ error: 'Insufficient funds for withdrawal' }, { status: 400 });
      }
      newBalance -= val;
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: newBalance,
        totalBalance: newBalance + wallet.usedMargin,
        transactions: {
          create: {
            type: action,
            amount: val,
            description: `${action} of ₹${val.toLocaleString()}`,
          },
        },
      },
      include: { transactions: { orderBy: { timestamp: 'desc' } } },
    });

    return NextResponse.json({ wallet: updatedWallet, message: `${action} of ₹${val.toLocaleString()} successful!` });
  } catch (error: any) {
    console.error('Error processing wallet transaction:', error);
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
  }
}
