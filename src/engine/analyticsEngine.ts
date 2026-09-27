import { prisma } from '@/lib/prisma';
import { OrderBookManager } from './orderBook';

export interface ExplanationFactor {
  label: string;
  value: string;
  direction: 'positive' | 'negative' | 'neutral';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface MovementExplanation {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  direction: 'RISING' | 'FALLING' | 'FLAT';
  summary: string;
  observedFactors: ExplanationFactor[];
  metrics: {
    buyPressurePercent: number;
    sellPressurePercent: number;
    orderImbalancePercent: number;
    bidDepthTotal: number;
    askDepthTotal: number;
    tradeVolume: number;
    avgTradeSize: number;
    largeTradeRatio: number;
  };
}

export class AnalyticsEngine {
  /**
   * Analyze observed market order flow and price movement for a given company
   */
  public static async analyzeMovement(symbol: string): Promise<MovementExplanation> {
    const company = await prisma.company.findUnique({
      where: { symbol },
      include: {
        trades: { orderBy: { executedAt: 'desc' }, take: 100 },
        orders: { orderBy: { createdAt: 'desc' }, take: 200 },
      },
    });

    if (!company) {
      return null;
    }

    const price = company.currentPrice;
    const prevClose = company.previousClose;
    const change = Number((price - prevClose).toFixed(2));
    const changePercent = Number(((change / prevClose) * 100).toFixed(2));
    const direction = change > 0.05 ? 'RISING' : change < -0.05 ? 'FALLING' : 'FLAT';

    // Calculate level-5 order book depth
    const book = OrderBookManager.getBook(company.id);
    const depth = book.getDepth(5);
    const bidTotal = depth.bids.reduce((sum, b) => sum + b.volume, 0);
    const askTotal = depth.asks.reduce((sum, a) => sum + a.volume, 0);

    // Calculate trade metrics from recent trades
    const recentTrades = company.trades;
    const tradeVolume = recentTrades.reduce((acc, t) => acc + t.quantity, 0);
    const avgTradeSize = recentTrades.length > 0 ? Math.round(tradeVolume / recentTrades.length) : 0;
    const largeTrades = recentTrades.filter((t) => t.quantity >= avgTradeSize * 2);
    const largeTradeRatio = recentTrades.length > 0 ? Number(((largeTrades.length / recentTrades.length) * 100).toFixed(1)) : 0;

    // Order pressure analysis
    const buyOrdersCount = company.orders.filter((o) => o.side === 'BUY').length;
    const sellOrdersCount = company.orders.filter((o) => o.side === 'SELL').length;
    const totalOrdersCount = buyOrdersCount + sellOrdersCount || 1;

    const buyPressurePercent = Number(((buyOrdersCount / totalOrdersCount) * 100).toFixed(1));
    const sellPressurePercent = Number((100 - buyPressurePercent).toFixed(1));
    const orderImbalancePercent = Number((((buyOrdersCount - sellOrdersCount) / totalOrdersCount) * 100).toFixed(1));

    // Construct observed factors
    const observedFactors: ExplanationFactor[] = [];

    if (direction === 'RISING') {
      observedFactors.push({
        label: 'Buy-Side Volume Pressure',
        value: `+${buyPressurePercent}%`,
        direction: 'positive',
        impact: 'HIGH',
      });
      observedFactors.push({
        label: 'Order Imbalance Shift',
        value: `+${orderImbalancePercent}%`,
        direction: 'positive',
        impact: 'HIGH',
      });
      observedFactors.push({
        label: 'Ask Liquidity Depletion',
        value: `${askTotal} shares available`,
        direction: 'negative',
        impact: 'MEDIUM',
      });
      observedFactors.push({
        label: 'Institutional Block Orders',
        value: `${largeTradeRatio}% of volume`,
        direction: 'positive',
        impact: 'HIGH',
      });
    } else if (direction === 'FALLING') {
      observedFactors.push({
        label: 'Sell-Side Volume Pressure',
        value: `+${sellPressurePercent}%`,
        direction: 'negative',
        impact: 'HIGH',
      });
      observedFactors.push({
        label: 'Negative Order Imbalance',
        value: `${orderImbalancePercent}%`,
        direction: 'negative',
        impact: 'HIGH',
      });
      observedFactors.push({
        label: 'Bid Support Liquidity',
        value: `${bidTotal} shares bids`,
        direction: 'neutral',
        impact: 'MEDIUM',
      });
      observedFactors.push({
        label: 'Large Sell Order Executions',
        value: `${largeTradeRatio}% of volume`,
        direction: 'negative',
        impact: 'HIGH',
      });
    } else {
      observedFactors.push({
        label: 'Balanced Order Flow',
        value: `${buyPressurePercent}% B / ${sellPressurePercent}% S`,
        direction: 'neutral',
        impact: 'LOW',
      });
      observedFactors.push({
        label: 'Stable Bid-Ask Spread',
        value: 'Minimal variance',
        direction: 'neutral',
        impact: 'LOW',
      });
    }

    // Factual summary generation
    let summary = '';
    if (direction === 'RISING') {
      summary = `${company.companyName} (${symbol}) experienced a ${changePercent}% price increase during the observed period. The movement coincided with strong buy-side order dominance (${buyPressurePercent}%), elevated order imbalance (+${orderImbalancePercent}%), and reduced sell-side liquidity across the order book levels.`;
    } else if (direction === 'FALLING') {
      summary = `${company.companyName} (${symbol}) declined by ${Math.abs(changePercent)}% during the observed period. This contraction was driven by aggressive sell-side pressure (${sellPressurePercent}%), negative order imbalance (${orderImbalancePercent}%), and heavy ask order arrivals exceeding current bid depth.`;
    } else {
      summary = `${company.companyName} (${symbol}) remained relatively unchanged (+${changePercent}%). Order flow shows a balanced distribution between buy bids and sell asks with steady market depth.`;
    }

    return {
      symbol,
      companyName: company.companyName,
      price,
      change,
      changePercent,
      direction,
      summary,
      observedFactors,
      metrics: {
        buyPressurePercent,
        sellPressurePercent,
        orderImbalancePercent,
        bidDepthTotal: bidTotal,
        askDepthTotal: askTotal,
        tradeVolume,
        avgTradeSize,
        largeTradeRatio,
      },
    };
  }

  /**
   * Calculate rolling statistics for a company over standard time windows
   */
  public static async getCompanyRollingStats(symbol: string) {
    const company = await prisma.company.findUnique({
      where: { symbol },
    });

    if (!company) {
      return null;
    }

    const now = Date.now();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    // Fetch all trades and orders from the last day
    const trades = await prisma.trade.findMany({
      where: { companyId: company.id, executedAt: { gte: oneDayAgo } },
      orderBy: { executedAt: 'desc' },
    });

    const orders = await prisma.order.findMany({
      where: { companyId: company.id, createdAt: { gte: oneDayAgo } },
      orderBy: { createdAt: 'desc' },
    });

    const periods = [
      { label: '1m', ms: 60 * 1000 },
      { label: '5m', ms: 5 * 60 * 1000 },
      { label: '15m', ms: 15 * 60 * 1000 },
      { label: '1h', ms: 60 * 60 * 1000 },
      { label: '1d', ms: 24 * 60 * 60 * 1000 },
    ];

    const stats = periods.map((p) => {
      const cutoff = new Date(now - p.ms);
      
      const periodTrades = trades.filter(t => t.executedAt >= cutoff);
      const periodOrders = orders.filter(o => o.createdAt >= cutoff);

      let volume = 0;
      let buyVolume = 0;
      let sellVolume = 0;
      let largestTrade = 0;
      
      periodTrades.forEach(t => {
        volume += t.quantity;
        if (t.quantity > largestTrade) largestTrade = t.quantity;
      });

      const tradeCount = periodTrades.length;
      const avgTradeSize = tradeCount > 0 ? Math.round(volume / tradeCount) : 0;

      const buyOrdersList = periodOrders.filter(o => o.side === 'BUY');
      const sellOrdersList = periodOrders.filter(o => o.side === 'SELL');
      
      const buyOrders = buyOrdersList.length;
      const sellOrders = sellOrdersList.length;
      
      buyOrdersList.forEach(o => buyVolume += o.quantity);
      sellOrdersList.forEach(o => sellVolume += o.quantity);

      const orderImbalance = (buyOrders + sellOrders) > 0 
        ? ((buyOrders - sellOrders) / (buyOrders + sellOrders)) * 100 
        : 0;

      // Price Change computation
      let priceChange = 0;
      let priceChangePercent = 0;
      if (tradeCount > 0) {
        const earliestTrade = periodTrades[periodTrades.length - 1]; // Because it's sorted desc
        const latestTrade = periodTrades[0];
        priceChange = Number((latestTrade.price - earliestTrade.price).toFixed(2));
        priceChangePercent = Number(((priceChange / earliestTrade.price) * 100).toFixed(2));
      } else {
        // Fallback if no trades in this exact window
        priceChange = Number((company.currentPrice - company.previousClose).toFixed(2));
        priceChangePercent = Number(((priceChange / company.previousClose) * 100).toFixed(2));
      }

      return {
        period: p.label,
        priceChange,
        priceChangePercent,
        volume,
        buyVolume,
        sellVolume,
        buyOrders,
        sellOrders,
        orderImbalance: Number(orderImbalance.toFixed(2)),
        tradeCount,
        avgTradeSize,
        largestTrade,
      };
    });

    return stats;
  }

  /**
   * Calculate market-wide analytics, including sector performance, snapshot data, and aggregate metrics.
   */
  public static async getMarketAnalytics() {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        sector: true,
        currentPrice: true,
        previousClose: true,
        volume: true,
        marketCap: true,
      }
    });

    const sectors: Record<string, { totalCompanies: number, up: number, down: number, totalChangePct: number, volume: number }> = {};
    let advancers = 0;
    let decliners = 0;
    let unchanged = 0;
    let totalVolume = 0;
    let totalMarketCap = 0;

    companies.forEach(c => {
      const change = c.currentPrice - c.previousClose;
      const changePct = c.previousClose > 0 ? (change / c.previousClose) * 100 : 0;
      
      if (change > 0) advancers++;
      else if (change < 0) decliners++;
      else unchanged++;

      totalVolume += c.volume;
      totalMarketCap += c.marketCap;

      if (!sectors[c.sector]) {
        sectors[c.sector] = { totalCompanies: 0, up: 0, down: 0, totalChangePct: 0, volume: 0 };
      }
      sectors[c.sector].totalCompanies++;
      sectors[c.sector].totalChangePct += changePct;
      sectors[c.sector].volume += c.volume;
      if (change > 0) sectors[c.sector].up++;
      else if (change < 0) sectors[c.sector].down++;
    });

    const sectorPerformance = Object.entries(sectors).map(([name, data]) => ({
      name,
      volume: data.volume,
      change: `${(data.totalChangePct / data.totalCompanies) >= 0 ? '+' : ''}${(data.totalChangePct / data.totalCompanies).toFixed(2)}%`,
      green: data.totalChangePct >= 0
    })).sort((a, b) => parseFloat(b.change) - parseFloat(a.change)); // Default sort best performing first

    // Build market snapshot
    const snapshotData = [];
    const now = Date.now();
    let currentIdxValue = 24500; // Baseline index
    
    for (let i = 5; i >= 0; i--) {
      const time = new Date(now - i * 30 * 60 * 1000);
      const trend = advancers > decliners ? 1 : -1;
      currentIdxValue += (trend * (Math.random() * 50 + 10));
      
      snapshotData.push({
        time: time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
        value: Number(currentIdxValue.toFixed(2))
      });
    }

    return {
      advancers,
      decliners,
      unchanged,
      totalVolume,
      totalMarketCap, // Return raw to let UI format it
      sectorPerformance,
      snapshotData,
    };
  }
}
