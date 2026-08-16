'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/common/AdminSidebar';
import { Header } from '@/components/common/Header';
import { useWebSocket } from '@/components/WebSocketProvider';
import { BookOpen, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function AdminOrderBookPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [symbol, setSymbol] = useState('TCS');
  
  const [company, setCompany] = useState<any>(null);
  const [depth, setDepth] = useState<any>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch all companies for search
  useEffect(() => {
    fetch('/api/companies')
      .then(res => res.json())
      .then(data => {
        if (data.companies) {
          setCompanies(data.companies);
          if (!companies.length && data.companies.length > 0) {
            setSymbol(data.companies[0].symbol);
          }
        }
      });
  }, []);

  const fetchStockData = () => {
    if (!symbol) return;
    fetch(`/api/companies/${symbol}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.company) setCompany(data.company);
        if (data.depth) setDepth(data.depth);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStockData();
    setIsDropdownOpen(false);
  }, [symbol]);

  useWebSocket(`MARKET_${symbol}`, (event) => {
    if (event.eventType === 'ORDER_BOOK_UPDATED') {
      setDepth(event.payload);
    } else if (event.eventType === 'PRICE_UPDATED') {
      setCompany((prev: any) => prev ? { ...prev, currentPrice: event.payload.price, volume: prev.volume + event.payload.volume } : prev);
    }
  });

  const filteredCompanies = companies.filter(c => 
    c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Process data for charts and tables
  const bids = depth?.bids || [];
  const asks = depth?.asks || [];
  
  const bidDepth = bids.reduce((acc: number, b: any) => acc + b.quantity, 0);
  const askDepth = asks.reduce((acc: number, a: any) => acc + a.quantity, 0);
  const bidOrders = bids.reduce((acc: number, b: any) => acc + (b.ordersCount || 1), 0);
  const askOrders = asks.reduce((acc: number, a: any) => acc + (a.ordersCount || 1), 0);
  const bidValue = bids.reduce((acc: number, b: any) => acc + (b.price * b.quantity), 0);
  const askValue = asks.reduce((acc: number, a: any) => acc + (a.price * a.quantity), 0);

  const bidRatio = bidDepth + askDepth > 0 ? (bidDepth / (bidDepth + askDepth)) * 100 : 50;
  const askRatio = bidDepth + askDepth > 0 ? (askDepth / (bidDepth + askDepth)) * 100 : 50;
  
  const bestBid = bids.length > 0 ? bids[0].price : 0;
  const bestAsk = asks.length > 0 ? asks[0].price : 0;
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
  const spreadPct = bestAsk > 0 ? (spread / bestAsk) * 100 : 0;

  // Chart Data
  const chartData: any[] = [];
  [...bids].reverse().forEach((b: any) => {
    chartData.push({ price: b.price, buyDepth: b.quantity, sellDepth: 0 });
  });
  if (chartData.length > 0 && asks.length > 0) {
    chartData.push({ price: bestBid + spread / 2, buyDepth: 0, sellDepth: 0 }); // Midpoint
  }
  asks.forEach((a: any) => {
    chartData.push({ price: a.price, buyDepth: 0, sellDepth: a.quantity });
  });

  const change = company ? company.currentPrice - company.previousClose : 0;
  const changePct = company ? (change / company.previousClose) * 100 : 0;
  const isGreen = change >= 0;

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <AdminSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>Order Book ⓘ</span>
              </h1>
              <p className="text-xs text-slate-400">Real-time market depth and order book analysis</p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={fetchStockData} className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </button>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Auto Refresh (WebSocket)</span>
              </div>
            </div>
          </div>

          {/* Metrics Top Bar */}
          <div className="trade-card p-4 flex flex-wrap items-center justify-between gap-4 overflow-visible">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search symbol (e.g. TCS)"
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="w-full rounded-lg border border-[#1E2638] bg-[#0B0E14] px-3 py-1.5 text-sm font-bold text-white focus:outline-none"
              />
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-[#1E2638] bg-[#121722] shadow-xl z-50">
                  {filteredCompanies.map(c => (
                    <div 
                      key={c.symbol}
                      className="px-3 py-2 text-sm hover:bg-[#1E2638] cursor-pointer"
                      onClick={() => {
                        setSymbol(c.symbol);
                        setSearchQuery("");
                      }}
                    >
                      <span className="font-bold">{c.symbol}</span> - <span className="text-slate-400 text-xs">{c.companyName}</span>
                    </div>
                  ))}
                  {filteredCompanies.length === 0 && (
                    <div className="px-3 py-2 text-sm text-slate-400">No results found</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-slate-400">
              <div>
                <div className="text-[10px] text-slate-500">Last Price</div>
                <div className={`font-bold text-sm ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
                  ₹{company?.currentPrice?.toFixed(2) || '0.00'} <span className="text-[10px]">{change > 0 ? '+' : ''}{change.toFixed(2)} ({changePct.toFixed(2)}%)</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">24h High</div>
                <div className="font-semibold text-white text-sm">₹{company?.dayHigh?.toFixed(2) || '0.00'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">24h Low</div>
                <div className="font-semibold text-white text-sm">₹{company?.dayLow?.toFixed(2) || '0.00'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Volume (24h)</div>
                <div className="font-semibold text-white text-sm">{company?.volume?.toLocaleString() || '0'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Avg. Spread</div>
                <div className="font-semibold text-white text-sm">₹{spread.toFixed(2)} ({spreadPct.toFixed(2)}%)</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Market Status</div>
                <div className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Open <span className="text-slate-500 font-normal">Closes 03:30 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid Row 1: Bids + Depth Chart + Asks */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* 10 Level Buy Bids Table (4 cols) */}
            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2 text-xs">
                <h3 className="font-bold text-emerald-400">Buy Orders (Bids)</h3>
                <span className="text-[10px] text-slate-500">Total Quantity: {bidDepth.toLocaleString()}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-slate-500 font-semibold border-b border-[#1E2638]/40">
                      <th className="pb-1.5">Price (₹)</th>
                      <th className="pb-1.5 text-right">Quantity</th>
                      <th className="pb-1.5 text-right">Orders</th>
                      <th className="pb-1.5 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]/30">
                    {bids.slice(0, 10).map((b: any, i: number) => (
                      <tr key={i} className="hover:bg-[#1E2638]/30">
                        <td className="py-1 font-bold text-emerald-400">{b.price.toFixed(2)}</td>
                        <td className="py-1 text-right text-slate-300 font-semibold">{b.quantity}</td>
                        <td className="py-1 text-right text-slate-500">{b.ordersCount || 1}</td>
                        <td className="py-1 text-right text-slate-400 font-mono text-[10px]">{(b.price * b.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                    {bids.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-500 text-xs">No buy orders</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between text-[11px] border-t border-[#1E2638] pt-2 text-slate-400">
                <span>Buy Depth: <strong className="text-white">{bidDepth.toLocaleString()}</strong></span>
                <span>Buy Orders: <strong className="text-white">{bidOrders.toLocaleString()}</strong></span>
                <span>Buy Value: <strong className="text-emerald-400">₹{(bidValue / 10000000).toFixed(2)} Cr</strong></span>
              </div>
            </div>

            {/* Market Depth Chart & Summary (4 cols) */}
            <div className="lg:col-span-4 trade-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2 text-xs">
                <h3 className="font-bold text-white">Market Depth ⓘ</h3>
                <span className="text-[10px] text-slate-500">10 Levels ▾</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <XAxis dataKey="price" stroke="#64748B" fontSize={10} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E2638', color: '#fff', borderRadius: '8px' }} />
                    <Area type="step" dataKey="buyDepth" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                    <Area type="step" dataKey="sellDepth" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-[#1E2638] bg-[#0B0E14] p-3 text-xs space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-emerald-400">Best Bid: ₹{bestBid.toFixed(2)}</span>
                  <span className="text-slate-400">Spread: ₹{spread.toFixed(2)} ({spreadPct.toFixed(2)}%)</span>
                  <span className="text-red-400">Best Ask: ₹{bestAsk.toFixed(2)}</span>
                </div>
                <div className="space-y-1 pt-1 border-t border-[#1E2638]">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Buy/Sell Ratio</span>
                    <span>{bidRatio.toFixed(1)}% Buy / {askRatio.toFixed(1)}% Sell</span>
                  </div>
                  <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-800">
                    <div className="bg-emerald-500 h-full" style={{ width: `${bidRatio}%` }} />
                    <div className="bg-red-500 h-full" style={{ width: `${askRatio}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 10 Level Sell Asks Table (4 cols) */}
            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2 text-xs">
                <h3 className="font-bold text-red-400">Sell Orders (Asks)</h3>
                <span className="text-[10px] text-slate-500">Total Quantity: {askDepth.toLocaleString()}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-slate-500 font-semibold border-b border-[#1E2638]/40">
                      <th className="pb-1.5">Price (₹)</th>
                      <th className="pb-1.5 text-right">Quantity</th>
                      <th className="pb-1.5 text-right">Orders</th>
                      <th className="pb-1.5 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]/30">
                    {asks.slice(0, 10).map((a: any, i: number) => (
                      <tr key={i} className="hover:bg-[#1E2638]/30">
                        <td className="py-1 font-bold text-red-400">{a.price.toFixed(2)}</td>
                        <td className="py-1 text-right text-slate-300 font-semibold">{a.quantity}</td>
                        <td className="py-1 text-right text-slate-500">{a.ordersCount || 1}</td>
                        <td className="py-1 text-right text-slate-400 font-mono text-[10px]">{(a.price * a.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                    {asks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-500 text-xs">No sell orders</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between text-[11px] border-t border-[#1E2638] pt-2 text-slate-400">
                <span>Sell Depth: <strong className="text-white">{askDepth.toLocaleString()}</strong></span>
                <span>Sell Orders: <strong className="text-white">{askOrders.toLocaleString()}</strong></span>
                <span>Sell Value: <strong className="text-red-400">₹{(askValue / 10000000).toFixed(2)} Cr</strong></span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
