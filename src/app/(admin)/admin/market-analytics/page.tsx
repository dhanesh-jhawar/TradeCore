'use client';

import React, { useState } from 'react';
import { AdminSidebar } from '@/components/common/AdminSidebar';
import { Header } from '@/components/common/Header';
import { TrendingUp, Download, AlertTriangle, ArrowUpRight, ArrowDownRight, Bell, Calendar } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ComposedChart, Line } from 'recharts';

const INDEX_PERF = [
  { date: '5 Aug', val: 23200 },
  { date: '6 Aug', val: 23800 },
  { date: '7 Aug', val: 24100 },
  { date: '8 Aug', val: 23900 },
  { date: '9 Aug', val: 24250 },
  { date: '10 Aug', val: 24400 },
  { date: '11 Aug', val: 24528.90 },
];

const VOLUME_TRADES_DATA = [
  { date: '5 Aug', volume: 60, trades: 14000 },
  { date: '6 Aug', volume: 75, trades: 18000 },
  { date: '7 Aug', volume: 68, trades: 16000 },
  { date: '8 Aug', volume: 82, trades: 21000 },
  { date: '9 Aug', volume: 70, trades: 17500 },
  { date: '11 Aug', volume: 82.45, trades: 21350 },
];

const SECTOR_PERF = [
  { name: 'Information Tech.', val: 3.21 },
  { name: 'Financial Services', val: 2.85 },
  { name: 'Energy', val: 1.92 },
  { name: 'FMCG', val: 1.45 },
  { name: 'Automobile', val: 0.98 },
  { name: 'Pharma', val: -0.35 },
  { name: 'Metal', val: -0.78 },
  { name: 'Real Estate', val: -1.12 },
  { name: 'Telecom', val: -1.45 },
  { name: 'Utilities', val: -1.85 },
];

export default function AdminMarketAnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [gainerTab, setGainerTab] = useState<'GAINERS' | 'LOSERS'>('GAINERS');

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <AdminSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Market Analytics</h1>
              <p className="text-xs text-slate-400">Comprehensive market overview and analysis</p>
            </div>

            <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30">
              <Download className="h-3.5 w-3.5" />
              <span>Export Report</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-[#1E2638] pb-3 text-xs font-semibold overflow-x-auto">
            {['Overview', 'Market Overview', 'Sector Analysis', 'Advanced Metrics', 'Market Heatmap', 'Reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded px-3 py-1.5 ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* 6 Top Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Total Market Cap</div>
              <div className="text-2xl font-extrabold text-white">₹48,52,360 Cr</div>
              <div className="text-[10px] font-semibold text-emerald-400">+2.42% vs prev. 7D</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Total Volume</div>
              <div className="text-2xl font-extrabold text-white">₹82.45 Cr</div>
              <div className="text-[10px] font-semibold text-emerald-400">+8.29% vs prev. 7D</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Total Trades</div>
              <div className="text-2xl font-extrabold text-white">91,234</div>
              <div className="text-[10px] font-semibold text-emerald-400">+4.86% vs prev. 7D</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Avg. Daily Trades</div>
              <div className="text-2xl font-extrabold text-white">13,033</div>
              <div className="text-[10px] font-semibold text-emerald-400">+5.12% vs prev. 7D</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Market Volatility (VIX)</div>
              <div className="text-2xl font-extrabold text-emerald-400">13.45</div>
              <div className="text-[10px] font-semibold text-emerald-400">-3.24% vs prev. 7D</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Market Sentiment</div>
              <div className="text-2xl font-extrabold text-emerald-400">Bullish</div>
              <div className="text-[10px] font-semibold text-slate-400">62% positive sentiment</div>
            </div>
          </div>

          {/* Main Grid Row 1: Index Perf (5 cols) + Volume & Trades (4 cols) + Breadth (3 cols) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 trade-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b border-[#1E2638] pb-3">
                <div>
                  <h3 className="text-xs font-bold text-white">Market Index Performance</h3>
                  <div className="text-sm font-extrabold text-emerald-400 mt-0.5">24,528.90 <span className="text-xs">+156.30 (0.64%)</span></div>
                </div>
                <div className="flex gap-1 text-[10px] font-bold">
                  {['NIFTY 50', 'NIFTY 100', 'NIFTY 200', 'SENSEX'].map((idx, i) => (
                    <button key={idx} className={`px-2 py-1 rounded ${i === 0 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{idx}</button>
                  ))}
                </div>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={INDEX_PERF}>
                    <XAxis dataKey="date" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} domain={['dataMin - 500', 'dataMax + 500']} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E2638', color: '#fff', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="val" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 trade-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-3">
                <h3 className="text-xs font-bold text-white">Market Volume & Trades</h3>
                <span className="text-[10px] text-slate-500 font-semibold">Daily ▾</span>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={VOLUME_TRADES_DATA}>
                    <XAxis dataKey="date" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E2638', color: '#fff', borderRadius: '8px' }} />
                    <Bar dataKey="volume" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="trades" stroke="#10B981" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-3 trade-card p-5 space-y-4">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Market Breadth</h3>
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#0B0E14] border border-[#1E2638]">
                <div className="text-3xl font-extrabold text-emerald-400">62%</div>
                <div className="text-xs font-bold text-white mt-1">Advancing Market</div>
                <div className="space-y-1 w-full text-[11px] font-semibold mt-3 text-slate-400">
                  <div className="flex justify-between"><span className="text-emerald-400">● Advancing</span><span>62% (62)</span></div>
                  <div className="flex justify-between"><span className="text-red-400">● Declining</span><span>32% (32)</span></div>
                  <div className="flex justify-between"><span className="text-amber-400">● Unchanged</span><span>6% (6)</span></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-[#0B0E14] border border-[#1E2638]">
                  <div className="text-[10px] text-slate-500">New Highs</div>
                  <div className="font-extrabold text-emerald-400 text-base">14</div>
                </div>
                <div className="p-2 rounded bg-[#0B0E14] border border-[#1E2638]">
                  <div className="text-[10px] text-slate-500">New Lows</div>
                  <div className="font-extrabold text-red-400 text-base">8</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid Row 2: Sector Performance + Top Gainers/Losers */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">Sector Performance (vs previous 7 days)</h3>
                <span className="text-[10px] text-slate-500 font-semibold">By Market Cap ▾</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SECTOR_PERF} layout="vertical">
                    <XAxis type="number" stroke="#64748B" fontSize={10} />
                    <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={9} width={100} />
                    <Bar dataKey="val" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <div className="flex gap-2 text-xs font-bold">
                  <button onClick={() => setGainerTab('GAINERS')} className={gainerTab === 'GAINERS' ? 'text-emerald-400 border-b-2 border-emerald-400 pb-1' : 'text-slate-500'}>Top Gainers</button>
                  <button onClick={() => setGainerTab('LOSERS')} className={gainerTab === 'LOSERS' ? 'text-red-400 border-b-2 border-red-400 pb-1' : 'text-slate-500'}>Top Losers</button>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { sym: 'TCS', price: '₹3,524.20', change: '+76.40', pct: '+2.21%' },
                  { sym: 'INFY', price: '₹1,615.00', change: '+34.80', pct: '+2.20%' },
                  { sym: 'RELIANCE', price: '₹2,720.45', change: '+48.20', pct: '+1.82%' },
                  { sym: 'WIPRO', price: '₹412.35', change: '+5.75', pct: '+1.41%' },
                  { sym: 'LT', price: '₹3,256.45', change: '+32.65', pct: '+1.01%' },
                ].map((s) => (
                  <div key={s.sym} className="flex justify-between items-center p-1.5 rounded hover:bg-[#1E2638]/40">
                    <span className="font-bold text-white w-20">{s.sym}</span>
                    <span className="text-slate-300 font-semibold">{s.price}</span>
                    <span className="text-emerald-400 font-bold">{s.change} ({s.pct})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Grid Row 3: Recent Market Events + Market Alerts + Most Active */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 trade-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Recent Market Events</h3>
              <div className="space-y-2 text-xs">
                {[
                  { time: '11 Aug 10:15 AM', evt: 'TCS Q2 Results Announced', imp: 'High', type: 'Earnings', det: 'Q2 Net Profit ↑ 12.4% YoY' },
                  { time: '10 Aug 02:30 PM', evt: 'RBI Policy Announcement', imp: 'Medium', type: 'Policy', det: 'Repo Rate unchanged at 6.50%' },
                  { time: '09 Aug 11:20 AM', evt: 'Global Market Rally', imp: 'High', type: 'Global', det: 'US Markets close higher' },
                ].map((e, i) => (
                  <div key={i} className="p-2 rounded bg-[#0B0E14] border border-[#1E2638] space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{e.time}</span>
                      <span className="bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded text-[9px]">{e.imp} Impact</span>
                    </div>
                    <div className="font-bold text-white">{e.evt}</div>
                    <div className="text-[10px] text-slate-400">{e.det}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">Market Alerts</h3>
                <span className="text-[10px] text-blue-400 cursor-pointer">View All Alerts →</span>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { title: 'NIFTY 50 crossed above 24,500', time: '11 Aug 2026, 10:32 AM', icon: '🟢' },
                  { title: 'RELIANCE volume spike detected', time: '11 Aug 2026, 10:18 AM', icon: '⚠️' },
                  { title: 'HDFCBANK unusual sell pressure', time: '11 Aug 2026, 09:45 AM', icon: '🔴' },
                  { title: 'INFY new 52-week high', time: '11 Aug 2026, 09:30 AM', icon: 'ℹ️' },
                ].map((a, i) => (
                  <div key={i} className="flex gap-2 p-2 rounded bg-[#0B0E14] border border-[#1E2638]">
                    <span>{a.icon}</span>
                    <div>
                      <div className="font-bold text-white">{a.title}</div>
                      <div className="text-[10px] text-slate-500">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 trade-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Most Active by Volume</h3>
              <div className="space-y-2 text-xs">
                {[
                  { sym: 'TCS', vol: '15.84 Cr', trades: '10,982' },
                  { sym: 'RELIANCE', vol: '12.41 Cr', trades: '9,214' },
                  { sym: 'INFY', vol: '9.87 Cr', trades: '7,621' },
                  { sym: 'HDFCBANK', vol: '6.23 Cr', trades: '5,214' },
                  { sym: 'ICICIBANK', vol: '5.62 Cr', trades: '4,812' },
                ].map((m) => (
                  <div key={m.sym} className="flex justify-between items-center p-1.5 rounded hover:bg-[#1E2638]/40">
                    <span className="font-bold text-white">{m.sym}</span>
                    <span className="font-bold text-emerald-400">{m.vol}</span>
                    <span className="text-[10px] text-slate-400">{m.trades} trades</span>
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
