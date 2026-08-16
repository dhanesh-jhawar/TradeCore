import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector');
    const search = searchParams.get('search');
    const filter = searchParams.get('filter'); // 'gainers' | 'losers' | 'all'

    let whereClause: any = {};
    if (sector && sector !== 'All Sectors') {
      whereClause.sector = sector;
    }
    if (search) {
      whereClause.OR = [
        { symbol: { contains: search.toUpperCase() } },
        { companyName: { contains: search } },
      ];
    }

    let companies = await prisma.company.findMany({
      where: whereClause,
      orderBy: { marketCap: 'desc' },
    });

    if (filter === 'gainers') {
      companies = companies
        .filter((c) => c.currentPrice > c.previousClose)
        .sort((a, b) => (b.currentPrice - b.previousClose) / b.previousClose - (a.currentPrice - a.previousClose) / a.previousClose);
    } else if (filter === 'losers') {
      companies = companies
        .filter((c) => c.currentPrice < c.previousClose)
        .sort((a, b) => (a.currentPrice - a.previousClose) / a.previousClose - (b.currentPrice - b.previousClose) / b.previousClose);
    }

    const totalCount = 100;
    const advancersCount = companies.filter((c) => c.currentPrice > c.previousClose).length;
    const declinersCount = companies.filter((c) => c.currentPrice < c.previousClose).length;
    const unchangedCount = totalCount - advancersCount - declinersCount;
    const totalVolume = companies.reduce((acc, c) => acc + c.volume, 0);

    return NextResponse.json({
      companies,
      summary: {
        totalCompanies: 100,
        advancers: advancersCount,
        decliners: declinersCount,
        unchanged: Math.max(0, unchangedCount),
        totalVolume,
      },
    });
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
