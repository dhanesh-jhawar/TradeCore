import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');

    let trades = await prisma.trade.findMany({
      orderBy: { executedAt: 'desc' },
      include: {
        company: { select: { symbol: true } },
      }
    });

    if (filter === "Today's Trades") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      trades = trades.filter(t => t.executedAt.getTime() >= todayStart.getTime());
    } else if (filter === 'Large Trades') {
      trades = trades.filter(t => (t.price * t.quantity) > 100000);
    } else if (filter === 'Company-wise') {
      trades = trades.sort((a, b) => a.company.symbol.localeCompare(b.company.symbol));
    } else if (filter === 'User-wise') {
      trades = trades.sort((a, b) => a.buyerId.localeCompare(b.buyerId));
    }

    const totalTrades = trades.length;
    let totalVolume = 0;
    let maxTradeValue = 0;
    
    // For size distribution
    let sizeAbove10L = { count: 0, vol: 0 };
    let size1Lto10L = { count: 0, vol: 0 };
    let size10Kto1L = { count: 0, vol: 0 };
    let sizeBelow10K = { count: 0, vol: 0 };

    // Grouping for "Trades by Company (Top 10)"
    const compStats: Record<string, { trades: number, vol: number }> = {};
    
    // Grouping for "Volume Over Time" (Simplified to 6 buckets of 4 hours based on executedAt)
    const timeBuckets: Record<string, { total: number, buy: number, sell: number }> = {
      '00:00': { total: 0, buy: 0, sell: 0 },
      '04:00': { total: 0, buy: 0, sell: 0 },
      '08:00': { total: 0, buy: 0, sell: 0 },
      '12:00': { total: 0, buy: 0, sell: 0 },
      '16:00': { total: 0, buy: 0, sell: 0 },
      '20:00': { total: 0, buy: 0, sell: 0 }
    };

    trades.forEach((t) => {
      const val = t.price * t.quantity;
      totalVolume += val;
      if (val > maxTradeValue) maxTradeValue = val;
      
      const sym = t.company.symbol;
      if (!compStats[sym]) compStats[sym] = { trades: 0, vol: 0 };
      compStats[sym].trades += 1;
      compStats[sym].vol += val;

      if (val >= 1000000) { sizeAbove10L.count++; sizeAbove10L.vol += val; }
      else if (val >= 100000) { size1Lto10L.count++; size1Lto10L.vol += val; }
      else if (val >= 10000) { size10Kto1L.count++; size10Kto1L.vol += val; }
      else { sizeBelow10K.count++; sizeBelow10K.vol += val; }

      const hour = new Date(t.executedAt).getHours();
      let bucket = '00:00';
      if (hour >= 20) bucket = '20:00';
      else if (hour >= 16) bucket = '16:00';
      else if (hour >= 12) bucket = '12:00';
      else if (hour >= 8) bucket = '08:00';
      else if (hour >= 4) bucket = '04:00';
      
      const valInCr = val / 10000000;
      timeBuckets[bucket].total += valInCr;
      
      // Deterministically split into buy/sell based on trade ID
      if (t.id.charCodeAt(0) % 2 === 0) timeBuckets[bucket].buy += valInCr;
      else timeBuckets[bucket].sell += valInCr;
    });

    const averageTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;
    
    // Top 10 Companies
    const topCompanies = Object.entries(compStats)
      .map(([sym, stats]) => ({
        sym,
        trades: stats.trades.toLocaleString(),
        vol: `₹${(stats.vol / 10000000).toFixed(2)} Cr`,
        pct: totalVolume > 0 ? `${((stats.vol / totalVolume) * 100).toFixed(2)}%` : '0%'
      }))
      .sort((a, b) => parseFloat(b.pct) - parseFloat(a.pct))
      .slice(0, 10);

    const volumeOverTime = Object.entries(timeBuckets).map(([time, stats]) => ({
      time,
      total: parseFloat(stats.total.toFixed(2)),
      buy: parseFloat(stats.buy.toFixed(2)),
      sell: parseFloat(stats.sell.toFixed(2))
    }));

    // Trade Side
    const buyTrades = trades.filter(t => t.id.charCodeAt(0) % 2 === 0).length;
    const sellTrades = totalTrades - buyTrades;
    const buyPct = totalTrades > 0 ? ((buyTrades / totalTrades) * 100).toFixed(2) : '50';
    const sellPct = totalTrades > 0 ? ((sellTrades / totalTrades) * 100).toFixed(2) : '50';

    const tradeSideData = [
      { name: 'Buy Trades', value: buyTrades, pct: `${buyPct}%`, color: '#10B981' },
      { name: 'Sell Trades', value: sellTrades, pct: `${sellPct}%`, color: '#EF4444' }
    ];

    const formatSizeVol = (v: number) => `₹${(v / 10000000).toFixed(2)} Cr`;
    const formatSizePct = (v: number) => totalVolume > 0 ? `${((v / totalVolume) * 100).toFixed(2)}%` : '0%';

    const tradeSizeDistribution = [
      { range: 'Above ₹10 Lakhs', trades: sizeAbove10L.count.toLocaleString(), vol: formatSizeVol(sizeAbove10L.vol), pct: formatSizePct(sizeAbove10L.vol), color: 'bg-emerald-500' },
      { range: '₹1 Lakh - ₹10 Lakhs', trades: size1Lto10L.count.toLocaleString(), vol: formatSizeVol(size1Lto10L.vol), pct: formatSizePct(size1Lto10L.vol), color: 'bg-blue-500' },
      { range: '₹10K - ₹1 Lakh', trades: size10Kto1L.count.toLocaleString(), vol: formatSizeVol(size10Kto1L.vol), pct: formatSizePct(size10Kto1L.vol), color: 'bg-amber-500' },
      { range: 'Below ₹10K', trades: sizeBelow10K.count.toLocaleString(), vol: formatSizeVol(sizeBelow10K.vol), pct: formatSizePct(sizeBelow10K.vol), color: 'bg-slate-500' },
    ];

    return NextResponse.json({
      trades: trades.slice(0, 50).map(t => {
        const val = t.price * t.quantity;
        return {
          tid: t.id.split('-')[0].toUpperCase(),
          time: new Date(t.executedAt).toLocaleTimeString(),
          timestamp: new Date(t.executedAt).getTime(),
          comp: t.company.symbol,
          buy: t.buyerId.split('-')[0].toUpperCase(),
          sell: t.sellerId.split('-')[0].toUpperCase(),
          p: t.price.toFixed(2),
          q: t.quantity,
          val: `₹${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          valRaw: val,
          side: t.id.charCodeAt(0) % 2 === 0 ? 'BUY' : 'SELL'
        };
      }),
      stats: {
        totalTrades,
        totalVolume,
        averageTradeSize,
        maxTradeValue,
        topCompanies,
        volumeOverTime,
        tradeSideData,
        tradeSizeDistribution
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
