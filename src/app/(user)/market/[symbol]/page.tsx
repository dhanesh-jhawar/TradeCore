'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { UserSidebar } from '@/components/common/UserSidebar';
import { useWebSocket } from '@/components/WebSocketProvider';
import { Header } from '@/components/common/Header';
import {
  ArrowLeft,
  Star,
  Bell,
  SlidersHorizontal,
  Maximize2,
  Minus,
  Plus,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function StockTradingPage() {
  const params = useParams();
  const symbolStr = (params?.symbol as string) || 'TCS';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [company, setCompany] = useState<any>(null);
  const [depth, setDepth] = useState<any>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);

  // Order Form State
  const [activeTab, setActiveTab] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET' | 'SL' | 'SL-M'>('LIMIT');
  const [price, setPrice] = useState<number>(3524.20);
  const [quantity, setQuantity] = useState<number>(100);

  const [timeframe, setTimeframe] = useState('1D');
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<any>(null);

  const fetchStockData = () => {
    fetch(`/api/companies/${symbolStr}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.company) {
          setCompany(data.company);
          if (!price || price === 3524.20) setPrice(data.company.currentPrice);
        }
        if (data.depth) setDepth(data.depth);
        if (data.priceHistory) {
          const formatted = data.priceHistory.map((pt: any) => ({
            time: new Date(pt.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            price: pt.close,
            volume: pt.volume,
          }));
          setPriceHistory(formatted);
        }
        if (data.recentTrades) setRecentTrades(data.recentTrades);
      })
      .catch(() => {});

    fetch('/api/wallet')
      .then((res) => res.json())
      .then((data) => {
        if (data.wallet) setWallet(data.wallet);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStockData();
    // Re-fetch everything fully on symbol change, then rely on WebSocket for diffs
  }, [symbolStr]);

  useWebSocket(`MARKET_${symbolStr}`, (event) => {
    if (event.eventType === 'ORDER_BOOK_UPDATED') {
      setDepth(event.payload);
    } else if (event.eventType === 'PRICE_UPDATED') {
      setCompany((prev: any) => prev ? { ...prev, currentPrice: event.payload.price, volume: prev.volume + event.payload.volume } : prev);
      setPriceHistory((prev: any) => {
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const newHist = [...prev, { time, price: event.payload.price, volume: event.payload.volume }];
        return newHist.slice(-50); // Keep last 50 data points
      });
    } else if (event.eventType === 'TRADE_EXECUTED') {
      setRecentTrades((prev: any) => {
        const t = { 
          ...event.payload, 
          executedAt: Date.now(), 
          price: event.payload.executionPrice, 
          quantity: event.payload.matchedQuantity 
        };
        const newTrades = [t, ...prev];
        return newTrades.slice(0, 20);
      });
    }
  });

  // Financial calculations
  const orderValue = price * quantity;
  const brokerage = Number((orderValue * 0.0003).toFixed(2));
  const stt = Number((orderValue * 0.00025).toFixed(2));
  const gst = Number(((brokerage + stt) * 0.18).toFixed(2));
  const totalPayable = Number((orderValue + brokerage + stt + gst).toFixed(2));

  const handlePlaceOrder = async () => {
    setError(null);
    setNotification(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbolStr,
          side: activeTab,
          orderType,
          price,
          quantity,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification(data.message || 'Order placed successfully!');
        fetchStockData();
        setTimeout(() => setNotification(null), 5000);
      } else {
        setError(data.error || 'Failed to place order');
      }
    } catch (err: any) {
      setError('Error placing order');
    }
  };

  if (!company) {
    return (
      <div className="flex min-h-screen bg-[#0B0E14] text-white">
        <UserSidebar isOpen={sidebarOpen} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-slate-400 font-semibold animate-pulse">Loading {symbolStr} Exchange Data...</div>
        </div>
      </div>
    );
  }

  const change = Number((company.currentPrice - company.previousClose).toFixed(2));
  const changePct = Number(((change / company.previousClose) * 100).toFixed(2));
  const isGreen = change >= 0;

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <UserSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Subheader: Back link & Stock Header */}
          <div className="space-y-4">
            <Link
              href="/markets"
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Markets</span>
            </Link>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-bold text-white text-base shadow-lg shadow-blue-500/20">
                  {company.symbol.slice(0, 3)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">{company.companyName}</h1>
                    <span className="text-lg font-bold text-slate-400">{company.symbol}</span>
                    <span className="ml-2 flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="rounded bg-[#1E2638] px-1.5 py-0.5 font-semibold text-slate-300">NSE</span>
                    <span>•</span>
                    <span>{company.sector}</span>
                    <span>•</span>
                    <span>Large Cap</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3 py-2 text-xs font-semibold text-slate-300 hover:border-amber-500 hover:text-white transition">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span>Add to Watchlist</span>
                </button>
                <button className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3 py-2 text-xs font-semibold text-slate-300 hover:border-blue-500 hover:text-white transition">
                  <Bell className="h-4 w-4 text-blue-400" />
                  <span>Set Alert</span>
                </button>
              </div>
            </div>

            {/* Price & Stat Metrics Bar */}
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#1E2638] pb-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-white">₹{company.currentPrice.toFixed(2)}</span>
                  <span className={`text-base font-bold ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isGreen ? `+${change} (+${changePct}%)` : `${change} (${changePct}%)`}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  11 Aug 2026, 10:32:45 AM IST • <span className="text-emerald-400 font-semibold">Market Open</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-xs text-slate-400">
                <div>
                  <div className="text-[10px] text-slate-500">Open</div>
                  <div className="font-semibold text-white">₹{company.openingPrice.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">High</div>
                  <div className="font-semibold text-emerald-400">₹{company.dayHigh.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Low</div>
                  <div className="font-semibold text-red-400">₹{company.dayLow.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Prev. Close</div>
                  <div className="font-semibold text-white">₹{company.previousClose.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Volume</div>
                  <div className="font-semibold text-white">{company.volume.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Market Cap</div>
                  <div className="font-semibold text-white">₹{company.marketCap} L Cr</div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification / Error Alerts */}
          {notification && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              <span>{notification}</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-400 text-sm font-semibold">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Grid: Chart & Order Form (8 cols) vs Order Book (4 cols) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left 8 Cols: Chart & Order Form */}
            <div className="lg:col-span-8 space-y-6">
              {/* Interactive Candlestick / Line Chart */}
              <div className="trade-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#1E2638]">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`rounded px-2.5 py-1 ${
                          timeframe === tf ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1 rounded-lg border border-[#1E2638] bg-[#0B0E14] px-2.5 py-1 text-xs text-slate-300 hover:text-white">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />
                      <span>Indicators</span>
                    </button>
                    <button className="rounded-lg border border-[#1E2638] bg-[#0B0E14] p-1.5 text-slate-400 hover:text-white">
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Composed Price & Volume Chart */}
                <div className="mt-4 h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={priceHistory.length > 0 ? priceHistory : [{ time: '10:00', price: company.currentPrice, volume: 1000 }]}>
                      <defs>
                        <linearGradient id="stockArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis yAxisId="price" domain={['auto', 'auto']} stroke="#64748B" fontSize={11} orientation="right" />
                      <YAxis yAxisId="volume" domain={[0, 'auto']} hide />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E2638', color: '#fff', borderRadius: '8px' }}
                      />
                      <Bar yAxisId="volume" dataKey="volume" fill="#1E2638" opacity={0.6} />
                      <Area yAxisId="price" type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={2.5} fill="url(#stockArea)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Order Form & Preview Section */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Buy / Sell Controls */}
                <div className="trade-card p-5 space-y-4">
                  {/* Buy / Sell Tabs */}
                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#1E2638] bg-[#0B0E14] p-1">
                    <button
                      onClick={() => setActiveTab('BUY')}
                      className={`rounded-lg py-2 text-xs font-extrabold transition ${
                        activeTab === 'BUY' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setActiveTab('SELL')}
                      className={`rounded-lg py-2 text-xs font-extrabold transition ${
                        activeTab === 'SELL' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sell
                    </button>
                  </div>

                  {/* Order Type Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Order Type</label>
                    <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                      {['LIMIT', 'MARKET', 'SL', 'SL-M'].map((ot) => (
                        <button
                          key={ot}
                          onClick={() => setOrderType(ot as any)}
                          className={`rounded-lg border py-1.5 ${
                            orderType === ot
                              ? 'border-blue-500 bg-blue-600/20 text-blue-400 font-bold'
                              : 'border-[#1E2638] bg-[#0B0E14] text-slate-400 hover:text-white'
                          }`}
                        >
                          {ot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-slate-400">Price (₹)</span>
                      <span className="text-slate-500">Best Ask: ₹{(company.currentPrice + 0.3).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center rounded-xl border border-[#1E2638] bg-[#0B0E14] px-3 py-2">
                      <button onClick={() => setPrice(Math.max(1, Number((price - 0.5).toFixed(2))))} className="text-slate-400 hover:text-white">
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        step="0.05"
                        value={price}
                        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent text-center font-extrabold text-white focus:outline-none"
                      />
                      <button onClick={() => setPrice(Number((price + 0.5).toFixed(2)))} className="text-slate-400 hover:text-white">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-slate-400">Quantity (Shares)</span>
                      <span className="text-slate-500">Available: 250 Shares</span>
                    </div>
                    <div className="flex items-center rounded-xl border border-[#1E2638] bg-[#0B0E14] px-3 py-2">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 10))} className="text-slate-400 hover:text-white">
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full bg-transparent text-center font-extrabold text-white focus:outline-none"
                      />
                      <button onClick={() => setQuantity(quantity + 10)} className="text-slate-400 hover:text-white">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 text-xs font-semibold text-slate-400 flex justify-between">
                    <span>Total (₹)</span>
                    <span className="font-bold text-white">₹{orderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handlePlaceOrder}
                    className={`w-full rounded-xl py-3 text-sm font-extrabold text-white shadow-xl transition ${
                      activeTab === 'BUY'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                        : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                    }`}
                  >
                    {activeTab === 'BUY' ? `Buy ${symbolStr}` : `Sell ${symbolStr}`}
                  </button>
                  <div className="text-[10px] text-center text-slate-500">
                    Available Balance: <span className="font-bold text-white">₹{wallet?.availableBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</span>
                  </div>
                </div>

                {/* Order Preview Breakdown */}
                <div className="trade-card p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-[#1E2638] pb-2">Order Preview</h3>
                  <div className="space-y-2.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Stock</span>
                      <span className="font-bold text-white">{symbolStr} (NSE)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Order Type</span>
                      <span className="font-bold text-blue-400">{orderType} {activeTab}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price</span>
                      <span className="font-bold text-white">₹{price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity</span>
                      <span className="font-bold text-white">{quantity} Shares</span>
                    </div>
                    <div className="flex justify-between border-t border-[#1E2638] pt-2">
                      <span>Order Value</span>
                      <span className="font-bold text-white">₹{orderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Brokerage (0.03%)</span>
                      <span className="font-semibold text-slate-300">₹{brokerage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>STT (0.025%)</span>
                      <span className="font-semibold text-slate-300">₹{stt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%)</span>
                      <span className="font-semibold text-slate-300">₹{gst}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#1E2638] pt-3 text-sm font-bold">
                      <span className="text-white">Total Payable</span>
                      <span className="text-emerald-400">₹{totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-[11px] text-blue-300 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Limit order will be placed to buy {quantity} shares of {symbolStr} at ₹{price.toFixed(2)} or better through TradeCore engine.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live Order Book Depth & Recent Trades */}
            <div className="lg:col-span-4 space-y-6">
              {/* Order Book Level 5 */}
              <div className="trade-card p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#1E2638]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <span>Order Book</span>
                    <span className="text-slate-500">ⓘ</span>
                  </div>
                  <span className="text-xs font-semibold text-blue-400">Level 5 ▾</span>
                </div>

                {/* Bids vs Asks Header */}
                <div className="grid grid-cols-4 text-[10px] font-bold text-slate-500 pb-1">
                  <span>Bid Price</span>
                  <span className="text-right">Bid Qty</span>
                  <span className="text-right">Ask Price</span>
                  <span className="text-right">Ask Qty</span>
                </div>

                {/* Level 5 Rows */}
                <div className="space-y-1.5 text-xs font-semibold">
                  {depth?.bids && depth?.asks ? (
                    depth.bids.slice(0, 5).map((bid: any, i: number) => {
                      const ask = depth.asks[i] || { price: price + (i + 1) * 0.5, quantity: 1000 };
                      return (
                        <div key={i} className="grid grid-cols-4 items-center py-1 rounded bg-[#0B0E14]/40 px-1 border border-[#1E2638]/30">
                          <span className="text-emerald-400 font-bold">₹{bid.price.toFixed(2)}</span>
                          <span className="text-right text-slate-300">{bid.quantity.toLocaleString()}</span>
                          <span className="text-right text-red-400 font-bold">₹{ask.price.toFixed(2)}</span>
                          <span className="text-right text-slate-300">{ask.quantity.toLocaleString()}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-500 py-4 text-center">Loading depth...</div>
                  )}
                </div>

                {/* Bid / Ask Progress Bar */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-emerald-400">64.7% Bid Total 17,200</span>
                    <span className="text-red-400">35.3% Ask Total 13,600</span>
                  </div>
                  <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-800">
                    <div className="bg-emerald-500 h-full" style={{ width: '64.7%' }} />
                    <div className="bg-red-500 h-full" style={{ width: '35.3%' }} />
                  </div>
                </div>
              </div>

              {/* Recent Trades Feed */}
              <div className="trade-card p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#1E2638]">
                  <h3 className="text-xs font-bold text-white">Recent Trades</h3>
                  <Link href="/trades" className="text-[11px] font-semibold text-blue-400 hover:underline">
                    View All Trades →
                  </Link>
                </div>

                <div className="grid grid-cols-4 text-[10px] font-bold text-slate-500 pb-1">
                  <span>Time</span>
                  <span className="text-right">Price (₹)</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Type</span>
                </div>

                <div className="space-y-2 text-xs">
                  {recentTrades.length > 0 ? (
                    recentTrades.slice(0, 8).map((t, idx) => (
                      <div key={idx} className="grid grid-cols-4 items-center py-1 px-1 rounded hover:bg-[#1E2638]/40">
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.executedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                        </span>
                        <span className="text-right font-bold text-emerald-400">₹{t.price.toFixed(2)}</span>
                        <span className="text-right text-slate-300 font-semibold">{t.quantity}</span>
                        <span className={`text-right font-bold ${t.buyerId === t.sellerId ? 'text-amber-400' : 'text-emerald-400'}`}>
                          -
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 py-4 text-center">No recent trades</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
