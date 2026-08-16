import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { marketCap: 'desc' },
      include: {
        _count: {
          select: { trades: true }
        }
      }
    });

    const totalCompanies = companies.length;
    let totalMarketCap = 0;
    let totalVolume = 0;

    const sectorCounts: Record<string, number> = {};
    const marketCapRanges = {
      '<1,000': 0,
      '1,000-5,000': 0,
      '5,000-10,000': 0,
      '10,000-50,000': 0,
      '>50,000': 0
    };

    const sectorPerformance: Record<string, { total: number, pos: number }> = {};

    companies.forEach((c) => {
      totalMarketCap += c.marketCap;
      totalVolume += c.volume;

      const sector = c.sector || 'Others';
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;

      const mcapCr = c.marketCap / 10000000;
      if (mcapCr < 1000) marketCapRanges['<1,000']++;
      else if (mcapCr < 5000) marketCapRanges['1,000-5,000']++;
      else if (mcapCr < 10000) marketCapRanges['5,000-10,000']++;
      else if (mcapCr < 50000) marketCapRanges['10,000-50,000']++;
      else marketCapRanges['>50,000']++;

      const chg = c.currentPrice - c.previousClose;
      if (!sectorPerformance[sector]) sectorPerformance[sector] = { total: 0, pos: 0 };
      sectorPerformance[sector].total++;
      if (chg >= 0) sectorPerformance[sector].pos++;
    });

    const sectorDist = Object.entries(sectorCounts)
      .map(([name, val], index) => ({
        name,
        val: Math.round((val / totalCompanies) * 100),
        color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#64748B'][index % 7]
      }))
      .sort((a, b) => b.val - a.val);

    const mcapDist = Object.entries(marketCapRanges).map(([range, count]) => ({ range, count }));

    const sectorPerf = Object.entries(sectorPerformance)
      .map(([name, { total, pos }]) => {
        const pct = (pos / total) * 100;
        return {
          name,
          chg: pct >= 50 ? `+${(pct - 50).toFixed(1)}%` : `-${(50 - pct).toFixed(1)}%`,
          pos: pct >= 50
        };
      })
      .sort((a, b) => (b.pos ? 1 : 0) - (a.pos ? 1 : 0));

    return NextResponse.json({
      companies: companies.map(c => {
        const chg = c.currentPrice - c.previousClose;
        const chgPct = (chg / c.previousClose) * 100;
        return {
          sym: c.symbol,
          name: c.companyName,
          sec: c.sector,
          ind: c.industry,
          price: `₹${c.currentPrice.toFixed(2)}`,
          chg: `${chg > 0 ? '+' : ''}${chgPct.toFixed(2)}%`,
          vol: `${(c.volume / 10000000).toFixed(2)} Cr`,
          mcap: `₹${(c.marketCap / 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 })} Cr`,
          raw: c // Keep raw data for inspector
        };
      }),
      stats: {
        totalCompanies,
        totalMarketCap,
        totalVolume,
        sectorDist,
        mcapDist,
        sectorPerf
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
