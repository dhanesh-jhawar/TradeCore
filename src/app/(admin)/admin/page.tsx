'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/common/AdminSidebar';
import { Header } from '@/components/common/Header';
import {
  Users,
  ClipboardList,
  History,
  TrendingUp,
  Clock,
  Target,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';

const MARKET_OVERVIEW_DATA = [
  { time: '09:15', orders: 12450, trades: 8400, volume: 15.2 },
  { time: '10:00', orders: 24500, trades: 14200, volume: 28.4 },
  { time: '11:00', orders: 38200, trades: 21500, volume: 42.1 },
  { time: '12:00', orders: 45100, trades: 26800, volume: 51.8 },
  { time: '13:00', orders: 62300, trades: 38400, volume: 68.5 },
  { time: '14:00', orders: 75800, trades: 44200, volume: 76.2 },
  { time: '15:00', orders: 92450, trades: 51800, volume: 82.4 },
];

const VOLUME_ANALYSIS_DATA = [
  { name: 'Technology', value: 34.2, pct: '41.5%', color: '#3B82F6' },
  { name: 'Financials', value: 24.5, pct: '29.7%', color: '#10B981' },
  { name: 'Energy', value: 12.8, pct: '15.5%', color: '#F59E0B' },
  { name: 'Healthcare', value: 8.4, pct: '10.2%', color: '#8B5CF6' },
  { name: 'Others', value: 2.5, pct: '3.1%', color: '#64748B' },
];

const BREADTH_DATA = [
  { date: '11:00', adv: 1245, dec: 980 },
  { date: '12:00', adv: 1450, dec: 1100 },
  { date: '13:00', adv: 1650, dec: 950 },
  { date: '14:00', adv: 1842, dec: 958 },
];

export default function AdminDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gainersIndex, setGainersIndex] = useState('NIFTY 50');
  
  const [metrics, setMetrics] = useState<any>({
    totalUsers: 0, totalOrders: 0, totalTrades: 0, totalVolume: 0, pendingOrders: 0, matchRate: 0
  });
  const [health, setHealth] = useState<any>({});
  const [marketStats, setMarketStats] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);

  const fetchDashboardData = () => {
    Promise.all([
      fetch('/api/admin/dashboard').then(res => res.json()),
      fetch('/api/admin/system-health').then(res => res.json()),
      fetch('/api/analytics/market').then(res => res.json()),
      fetch('/api/companies').then(res => res.json())
    ]).then(([dashData, healthData, marketData, compData]) => {
      if (dashData.metrics) setMetrics(dashData.metrics);
      if (healthData.health) setHealth(healthData.health);
      if (marketData.marketStats) setMarketStats(marketData.marketStats);
      if (compData.companies) setCompanies(compData.companies);
    });
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
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
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>Analytics Dashboard 👋</span>
              </h1>
              <p className="text-xs text-slate-400">Real-time overview of your exchange and market performance</p>
            </div>

            <button className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* 6 Top Admin Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="trade-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Users</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">{metrics.totalUsers.toLocaleString()}</div>
            </div>

            <div className="trade-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Orders</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ClipboardList className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">{metrics.totalOrders.toLocaleString()}</div>
            </div>

            <div className="trade-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Trades</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <History className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">{metrics.totalTrades.toLocaleString()}</div>
            </div>

            <div className="trade-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Trading Volume</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">{(metrics.totalVolume / 100000).toFixed(2)} L</div>
            </div>

            <div className="trade-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Pending Orders</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">{metrics.pendingOrders.toLocaleString()}</div>
            </div>

            <div className="trade-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Match Rate</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Target className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">{metrics.matchRate}%</div>
              <div className="text-[10px] font-semibold text-emerald-400">+2.38% vs yesterday</div>
            </div>
          </div>

          {/* Main Grid Row 1: Market Overview + Top Gainers + Top Losers */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Market Overview Chart */}
            <div className="lg:col-span-6 trade-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Market Overview</h3>
                  <div className="text-[11px] text-slate-500">Real-time overview of market activity</div>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1 text-blue-400"><span className="h-2 w-2 rounded-full bg-blue-400" /> Orders</span>
                  <span className="flex items-center gap-1 text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Trades</span>
                  <span className="flex items-center gap-1 text-purple-400"><span className="h-2 w-2 rounded-full bg-purple-400" /> Volume (₹ Cr)</span>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={MARKET_OVERVIEW_DATA}>
                    <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} orientation="left" />
                    <Tooltip contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E2638', color: '#fff', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="trades" stroke="#10B981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="volume" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Summary Bar */}
              <div className="grid grid-cols-5 text-center text-xs border-t border-[#1E2638] pt-3">
                <div>
                  <div className="text-[10px] text-slate-500">Orders</div>
                  <div className="font-bold text-white">182,450</div>
                  <div className="text-[9px] text-emerald-400">+4.97%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Trades</div>
                  <div className="font-bold text-white">91,234</div>
                  <div className="text-[9px] text-emerald-400">+4.86%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Volume</div>
                  <div className="font-bold text-white">₹82.45 Cr</div>
                  <div className="text-[9px] text-emerald-400">+8.29%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Avg. Order Size</div>
                  <div className="font-bold text-white">₹45,134</div>
                  <div className="text-[9px] text-emerald-400">+3.21%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Avg. Trade Size</div>
                  <div className="font-bold text-white">₹90,425</div>
                  <div className="text-[9px] text-emerald-400">+6.18%</div>
                </div>
              </div>
            </div>

            {/* Top Gainers */}
            <div className="lg:col-span-3 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E2638]">
                <h3 className="text-xs font-bold text-white">Top Gainers</h3>
                <span className="text-[10px] text-blue-400 font-semibold cursor-pointer">View All</span>
              </div>
              <div className="flex gap-1 border-b border-[#1E2638] pb-2 text-[10px] font-bold">
                {['NIFTY 50', 'NIFTY 100', 'NASDAQ', 'S&P 500'].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setGainersIndex(idx)}
                    className={`rounded px-1.5 py-0.5 ${gainersIndex === idx ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                  >
                    {idx}
                  </button>
                ))}
              </div>
              <div className="space-y-2 text-xs">
                {companies.sort((a, b) => ((b.currentPrice - b.previousClose)/b.previousClose) - ((a.currentPrice - a.previousClose)/a.previousClose)).slice(0, 5).map((g) => {
                  const change = g.currentPrice - g.previousClose;
                  const pct = (change / g.previousClose) * 100;
                  return (
                  <div key={g.symbol} className="flex items-center justify-between p-1.5 rounded hover:bg-[#1E2638]/40">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600/20 font-bold text-blue-400 text-[10px]">
                        {g.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">{g.symbol}</div>
                        <div className="text-[9px] text-slate-500">{g.companyName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-xs">₹{g.currentPrice.toFixed(2)}</div>
                      <div className="text-[10px] font-bold text-emerald-400">+{change.toFixed(2)} (+{pct.toFixed(2)}%)</div>
                    </div>
                  </div>
                )})}
              </div>
            </div>

            {/* Top Losers */}
            <div className="lg:col-span-3 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E2638]">
                <h3 className="text-xs font-bold text-white">Top Losers</h3>
                <span className="text-[10px] text-blue-400 font-semibold cursor-pointer">View All</span>
              </div>
              <div className="flex gap-1 border-b border-[#1E2638] pb-2 text-[10px] font-bold">
                {['NIFTY 50', 'NIFTY 100', 'NASDAQ', 'S&P 500'].map((idx) => (
                  <button key={idx} className="rounded px-1.5 py-0.5 text-slate-500">{idx}</button>
                ))}
              </div>
              <div className="space-y-2 text-xs">
                {companies.sort((a, b) => ((a.currentPrice - a.previousClose)/a.previousClose) - ((b.currentPrice - b.previousClose)/b.previousClose)).slice(0, 5).map((l) => {
                  const change = l.currentPrice - l.previousClose;
                  const pct = (change / l.previousClose) * 100;
                  return (
                  <div key={l.symbol} className="flex items-center justify-between p-1.5 rounded hover:bg-[#1E2638]/40">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-red-600/20 font-bold text-red-400 text-[10px]">
                        {l.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">{l.symbol}</div>
                        <div className="text-[9px] text-slate-500">{l.companyName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-xs">₹{l.currentPrice.toFixed(2)}</div>
                      <div className="text-[10px] font-bold text-red-400">{change.toFixed(2)} ({pct.toFixed(2)}%)</div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>

          {/* Main Grid Row 2: Heatmap + Volume Analysis + Market Breadth */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Exchange Heatmap */}
            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Exchange Heatmap</h3>
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                {marketStats?.sectorPerformance?.slice(0, 12).map((s: any) => (
                  <div key={s.name} className={`p-3 rounded-lg border ${s.green ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400' : 'bg-red-600/20 border-red-500/40 text-red-400'}`}>
                    <div className="truncate text-[10px] font-bold">{s.name}</div>
                    <span className="text-[10px]">{s.change}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Volume Analysis Donut Chart */}
            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">Volume Analysis</h3>
                <div className="flex gap-1 text-[10px] font-bold">
                  <button className="px-2 py-0.5 rounded bg-blue-600 text-white">By Value</button>
                  <button className="px-2 py-0.5 rounded text-slate-400">By Volume</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="h-36 w-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={VOLUME_ANALYSIS_DATA} innerRadius={35} outerRadius={58} paddingAngle={3} dataKey="value">
                        {VOLUME_ANALYSIS_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 text-xs">
                  {VOLUME_ANALYSIS_DATA.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-300 w-24 truncate">{item.name}</span>
                      <span className="font-bold text-white">₹{item.value} Cr ({item.pct})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-xs border-t border-[#1E2638] flex justify-between">
                <span className="text-slate-400">Total Market Volume</span>
                <span className="font-extrabold text-white">₹82.45 Cr <span className="text-emerald-400 text-[10px]">+8.29%</span></span>
              </div>
            </div>

            {/* Market Breadth Bar Chart */}
            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">Market Breadth</h3>
                <div className="flex gap-3 text-[10px] font-bold">
                  <span className="text-emerald-400">● Advances</span>
                  <span className="text-red-400">● Declines</span>
                  <span className="text-amber-400">● Unchanged</span>
                </div>
              </div>

              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={BREADTH_DATA}>
                    <XAxis dataKey="date" stroke="#64748B" fontSize={9} />
                    <YAxis hide />
                    <Bar dataKey="adv" fill="#10B981" />
                    <Bar dataKey="dec" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 text-center text-xs pt-1 border-t border-[#1E2638]">
                <div>
                  <div className="text-[10px] text-slate-500">Advances</div>
                  <div className="font-bold text-emerald-400">1,842 (65%)</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Declines</div>
                  <div className="font-bold text-red-400">958 (33.8%)</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Unchanged</div>
                  <div className="font-bold text-amber-400">52 (1.2%)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Real-Time Performance Sparklines Bar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
            <div className="trade-card p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Orders per second</div>
                <div className="text-xl font-extrabold text-white">42</div>
              </div>
              <div className="h-8 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MARKET_OVERVIEW_DATA}>
                    <Area type="monotone" dataKey="orders" stroke="#3B82F6" fill="none" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="trade-card p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Trades per second</div>
                <div className="text-xl font-extrabold text-white">21</div>
              </div>
              <div className="h-8 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MARKET_OVERVIEW_DATA}>
                    <Area type="monotone" dataKey="trades" stroke="#8B5CF6" fill="none" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="trade-card p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Average Latency</div>
                <div className="text-xl font-extrabold text-emerald-400">45 ms</div>
              </div>
              <div className="h-8 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MARKET_OVERVIEW_DATA}>
                    <Area type="monotone" dataKey="volume" stroke="#10B981" fill="none" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="trade-card p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Uptime</div>
                <div className="text-xl font-extrabold text-blue-400">{health.apiHealth || '99.9%'}</div>
              </div>
              <div className="h-8 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MARKET_OVERVIEW_DATA}>
                    <Area type="monotone" dataKey="orders" stroke="#3B82F6" fill="none" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
