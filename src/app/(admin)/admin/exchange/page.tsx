'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/common/AdminSidebar';
import { Header } from '@/components/common/Header';
import { Zap, RefreshCw, Filter, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis } from 'recharts';

export default function AdminLiveExchangePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterSide, setFilterSide] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [liveTradesFilter, setLiveTradesFilter] = useState('All');
  const [heatmapFilter, setHeatmapFilter] = useState('By Performance');
  const [health, setHealth] = useState<any>({});
  const [feed, setFeed] = useState<{orders: any[], trades: any[]}>({ orders: [], trades: [] });
  const [marketStats, setMarketStats] = useState<any>(null);
  const [isSimulatorRunning, setIsSimulatorRunning] = useState(false);

  const fetchExchangeData = () => {
    Promise.all([
      fetch('/api/admin/system-health').then(res => res.json()),
      fetch('/api/admin/exchange-feed').then(res => res.json()),
      fetch('/api/analytics/market').then(res => res.json()),
      fetch('/api/admin/simulator').then(res => res.json())
    ]).then(([healthData, feedData, marketData, simData]) => {
      if (healthData.health) setHealth(healthData.health);
      if (feedData.orders) setFeed(feedData);
      if (marketData.marketStats) setMarketStats(marketData.marketStats);
      if (simData.status) setIsSimulatorRunning(simData.status.isRunning);
    });
  };

  useEffect(() => {
    fetchExchangeData();
    const interval = setInterval(fetchExchangeData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <AdminSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">Live Exchange</h1>
                {isSimulatorRunning ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Market Open
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Market Closed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Real-time order flow, trades, and market activity</p>
            </div>

            <button className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Top 6 Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Orders / Sec</div>
              <div className="text-2xl font-extrabold text-white">{Math.round(health.ordersPerSec || 0)}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Trades / Sec</div>
              <div className="text-2xl font-extrabold text-white">{Math.round(health.matchesPerSec || 0)}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Pending Orders</div>
              <div className="text-2xl font-extrabold text-white">{health.queueLength?.toLocaleString() || 0}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">API Health</div>
              <div className="text-2xl font-extrabold text-white">{health.apiHealth || '99.9%'}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Match Rate</div>
              <div className="text-2xl font-extrabold text-white">
                {health.ordersPerSec > 0 ? Math.min(100, (health.matchesPerSec / health.ordersPerSec) * 100).toFixed(1) : 0}%
              </div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Avg. Latency</div>
              <div className="text-2xl font-extrabold text-emerald-400">{health.averageLatency || '45 ms'}</div>
            </div>
          </div>

          {/* Main Grid Row 1: Live Order Feed + Live Trades + Heatmap */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Live Order Feed Table (5 cols) */}
            <div className="lg:col-span-5 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">Live Order Feed</h3>
                <div className="flex gap-1 text-[10px] font-bold">
                  {['ALL', 'BUY', 'SELL'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterSide(s as any)}
                      className={`rounded px-2 py-0.5 ${filterSide === s ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-[#1E2638] text-slate-500 font-semibold">
                      <th className="pb-2">Time</th>
                      <th className="pb-2">Order ID</th>
                      <th className="pb-2">User ID</th>
                      <th className="pb-2">Company</th>
                      <th className="pb-2">Side</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2 text-right">Price</th>
                      <th className="pb-2 text-right">Qty</th>
                      <th className="pb-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]/40">
                    {feed.orders.filter(o => filterSide === 'ALL' || o.side === filterSide).map((o: any) => (
                      <tr key={o.oid} className="hover:bg-[#1E2638]/40">
                        <td className="py-2 text-slate-500 font-mono text-[10px]">{o.time}</td>
                        <td className="py-2 text-slate-400 font-mono text-[10px]">{o.oid}</td>
                        <td className="py-2 text-blue-400 font-mono text-[10px]">{o.uid}</td>
                        <td className="py-2 font-bold text-white">{o.sym}</td>
                        <td className="py-2 font-bold text-[10px]">
                          <span className={o.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}>{o.side}</span>
                        </td>
                        <td className="py-2 text-slate-400 text-[10px]">{o.type}</td>
                        <td className="py-2 text-right font-semibold text-white">₹{o.price}</td>
                        <td className="py-2 text-right text-slate-300 font-semibold">{o.qty}</td>
                        <td className="py-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${o.st === 'FILLED' ? 'bg-emerald-500/20 text-emerald-400' : o.st === 'OPEN' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>
                            {o.st}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Trades Feed (3 cols) */}
            <div className="lg:col-span-3 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">Live Trades</h3>
                <select 
                  className="bg-[#0B0E14] border border-[#1E2638] rounded text-[10px] text-slate-400 py-0.5 px-1 outline-none"
                  value={liveTradesFilter}
                  onChange={(e) => setLiveTradesFilter(e.target.value)}
                >
                  <option value="All">All Companies</option>
                  {Array.from(new Set(feed.trades.map(t => t.sym))).map(sym => (
                    <option key={sym as string} value={sym as string}>{sym as string}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 text-xs">
                {feed.trades.filter(t => liveTradesFilter === 'All' || t.sym === liveTradesFilter).map((t: any, idx: number) => (
                  <div key={idx} className="p-2 rounded bg-[#0B0E14] border border-[#1E2638]/40 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{t.time}</span>
                      <span className="font-bold text-emerald-400">₹{t.price} ({t.qty})</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-white">{t.sym}</span>
                      <span className="text-slate-400"><span className="text-emerald-400">{t.buy}</span> / <span className="text-red-400">{t.sell}</span></span>
                    </div>
                  </div>
                ))}
                {feed.trades.filter(t => liveTradesFilter === 'All' || t.sym === liveTradesFilter).length === 0 && (
                  <div className="text-slate-500 text-center py-4">No recent trades found for {liveTradesFilter}.</div>
                )}
              </div>
            </div>

            {/* Market Activity Heatmap (4 cols) */}
            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">Market Activity Heatmap</h3>
                <select 
                  className="bg-[#0B0E14] border border-[#1E2638] rounded text-[10px] text-slate-400 py-0.5 px-1 outline-none"
                  value={heatmapFilter}
                  onChange={(e) => setHeatmapFilter(e.target.value)}
                >
                  <option value="By Performance">By Performance</option>
                  <option value="By Volume">By Volume</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
                {[...(marketStats?.sectorPerformance || [])].sort((a: any, b: any) => {
                   return heatmapFilter === 'By Volume' ? b.volume - a.volume : parseFloat(b.change) - parseFloat(a.change);
                }).slice(0, 8).map((s: any) => (
                  <div key={s.name} className={`p-2.5 rounded border ${s.green ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400' : 'bg-red-600/20 border-red-500/40 text-red-400'}`}>
                    {s.name}<br/>
                    <span className="text-[9px]">{heatmapFilter === 'By Volume' ? `${(s.volume/1000).toFixed(1)}k Vol` : s.change}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
