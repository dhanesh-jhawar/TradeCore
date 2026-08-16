import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || '100'), 500);

    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const priceHistory = await prisma.priceHistory.findMany({
      where: { companyId: company.id },
      orderBy: { timestamp: 'asc' },
      take: limit,
    });

    return NextResponse.json({
      symbol: company.symbol,
      companyName: company.companyName,
      currentPrice: company.currentPrice,
      priceHistory,
    });
  } catch (error: any) {
    console.error('Error fetching price history:', error);
    return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 500 });
  }
}
