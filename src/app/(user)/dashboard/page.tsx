'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserSidebar } from '@/components/common/UserSidebar';
import { useWebSocket } from '@/components/WebSocketProvider';
import { Header } from '@/components/common/Header';
import { ChatbotWidget } from '@/components/chat/ChatbotWidget';
import {
  Eye,
  TrendingUp,
  Briefcase,
  Wallet as WalletIcon,
  Info,
  Maximize2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  ArrowUpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PORTFOLIO_PERFORMANCE_DATA = [
  { time: '09:15', value: 468000 },
  { time: '10:00', value: 472500 },
  { time: '11:00', value: 476000 },
  { time: '12:00', value: 474200 },
  { time: '13:00', value: 480500 },
  { time: '14:00', value: 486000 },
  { time: '15:00', value: 482650.75 },
];

const DONUT_DATA = [
  { name: 'TCS', value: 38.7, color: '#3B82F6' },
  { name: 'RELIANCE', value: 28.6, color: '#8B5CF6' },
  { name: 'HDFCBANK', value: 16.2, color: '#10B981' },
  { name: 'INFY', value: 10.8, color: '#F59E0B' },
  { name: 'Others', value: 5.7, color: '#64748B' },
];

export default function UserDashboard() {
  const [timeframe, setTimeframe] = useState('1D');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const fetchDashboardData = () => {
    fetch('/api/portfolio').then(r => r.json()).then(d => { if(d.portfolio) setPortfolio(d.portfolio) }).catch(() => {});
    fetch('/api/wallet').then(r => r.json()).then(d => { if(d.wallet) setWallet(d.wallet) }).catch(() => {});
  };

  useEffect(() => {
    fetchDashboardData();
    fetch('/api/auth/me').then(r => r.json()).then(d => { if(d.user) setUserId(d.user.id) }).catch(() => {});
  }, []);

  useWebSocket(userId ? `USER_${userId}` : null, (event) => {
    if (['TRADE_EXECUTED', 'ORDER_CREATED', 'ORDER_FILLED', 'ORDER_PARTIALLY_FILLED', 'ORDER_CANCELLED'].includes(event.eventType)) {
      fetchDashboardData();
    }
  });

  let totalInvested = 0;
  let totalCurrent = 0;
  const holdings = portfolio?.holdings || [];
  holdings.forEach((h: any) => {
    totalInvested += h.quantity * h.averagePrice;
    totalCurrent += h.quantity * h.company.currentPrice;
  });
  const pnl = totalCurrent - totalInvested;
  const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
  const isGreen = pnl >= 0;

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <UserSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Welcome back, Arjun! 👋
              </h1>
              <p className="text-sm text-slate-400">Here's what's happening in your portfolio today.</p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#1E2638] bg-[#121722] px-4 py-2 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Market Open</span>
              <span className="text-slate-400">• 09:47:32 AM - 11 Aug 2026</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="trade-card p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <Eye className="h-4 w-4" />
                  </div>
                  <span>Portfolio Value</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">₹{totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className={`text-xs font-semibold mt-1 ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isGreen ? '+' : '-'}₹{Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2 })} ({isGreen ? '+' : ''}{pnlPct.toFixed(2)}%)
                </div>
              </div>
              <div className="h-8 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PORTFOLIO_PERFORMANCE_DATA}>
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fillOpacity={0.1} fill="#3B82F6" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="trade-card p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span>Overall P&L</span>
                </div>
              </div>
              <div>
                <div className={`text-2xl font-extrabold ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isGreen ? '+' : '-'}₹{Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className={`text-xs font-semibold mt-1 ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isGreen ? '+' : ''}{pnlPct.toFixed(2)}%
                </div>
              </div>
              <div className="h-8 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PORTFOLIO_PERFORMANCE_DATA}>
                    <Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} fillOpacity={0.1} fill="#8B5CF6" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="trade-card p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <span>Invested Amount</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">₹{totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className="text-xs text-slate-400 mt-1">across {holdings.length} positions</div>
              </div>
            </div>

            <div className="trade-card p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <WalletIcon className="h-4 w-4" />
                  </div>
                  <span>Buying Power</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">₹{wallet?.availableBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</div>
                <div className="text-xs text-slate-400 mt-1">Available margin</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              <div className="trade-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1E2638]">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">Portfolio Performance</h2>
                    <Info className="h-4 w-4 text-slate-500 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 rounded-lg border border-[#1E2638] bg-[#0B0E14] p-1 text-xs font-semibold">
                      {['1D', '1W', '1M', '3M', '6M', '1Y', 'All'].map((tf) => (
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
                    <button className="rounded-lg border border-[#1E2638] bg-[#0B0E14] p-1.5 text-slate-400 hover:text-white">
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={PORTFOLIO_PERFORMANCE_DATA}>
                      <defs>
                        <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis
                        domain={[465000, 490000]}
                        stroke="#64748B"
                        fontSize={11}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        orientation="right"
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E2638', color: '#fff', borderRadius: '8px' }}
                        formatter={(val: any) => [`₹${val.toLocaleString()}`, 'Portfolio Value']}
                      />
                      <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#portfolioGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="trade-card p-5">
                  <div className="flex items-center justify-between pb-3">
                    <h3 className="text-sm font-bold text-white">Your Holdings</h3>
                    <Link href="/portfolio" className="text-xs font-semibold text-blue-400 hover:underline">
                      View All
                    </Link>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 text-[11px] font-semibold text-slate-500 pb-1 border-b border-[#1E2638]">
                      <span className="col-span-2">Stock</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">LTP</span>
                      <span className="text-right">P&L</span>
                    </div>

                    {[
                      { sym: 'TCS', name: 'Tata Consultancy Ser.', qty: 50, avg: '₹3,410.00', ltp: '₹3,524.20', pnl: '+₹5,710.00 (+3.35%)', green: true },
                      { sym: 'RELIANCE', name: 'Reliance Industries', qty: 30, avg: '₹2,720.00', ltp: '₹2,914.35', pnl: '+₹5,830.50 (+7.14%)', green: true },
                      { sym: 'INFY', name: 'Infosys Limited', qty: 100, avg: '₹1,615.00', ltp: '₹1,590.40', pnl: '-₹2,460.00 (-1.52%)', green: false },
                      { sym: 'HDFCBANK', name: 'HDFC Bank Limited', qty: 40, avg: '₹1,620.00', ltp: '₹1,678.90', pnl: '+₹2,356.00 (+3.64%)', green: true },
                    ].map((h) => (
                      <div key={h.sym} className="grid grid-cols-5 items-center text-xs py-1.5 border-b border-[#1E2638]/50 hover:bg-[#1E2638]/30 px-1 rounded">
                        <div className="col-span-2 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600/20 font-bold text-blue-400 text-[10px]">
                            {h.sym.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{h.sym}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[90px]">{h.name}</div>
                          </div>
                        </div>
                        <div className="text-right font-medium text-slate-300">{h.qty}</div>
                        <div className="text-right font-semibold text-white">{h.ltp}</div>
                        <div className={`text-right font-bold text-[11px] ${h.green ? 'text-emerald-400' : 'text-red-400'}`}>
                          {h.pnl}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3">
                    <Link href="/portfolio" className="text-xs font-semibold text-blue-400 hover:underline">
                      View Full Portfolio →
                    </Link>
                  </div>
                </div>

                <div className="trade-card p-5">
                  <div className="flex items-center justify-between pb-3">
                    <h3 className="text-sm font-bold text-white">Recent Orders</h3>
                    <Link href="/orders" className="text-xs font-semibold text-blue-400 hover:underline">
                      View All
                    </Link>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { side: 'BUY', sym: 'TCS', qty: 50, price: '₹3,520.00', status: 'MATCHED', green: true },
                      { side: 'SELL', sym: 'INFY', qty: 30, price: '₹1,595.00', status: 'PENDING', amber: true },
                      { side: 'BUY', sym: 'HDFCBANK', qty: 20, price: '₹1,675.00', status: 'MATCHED', green: true },
                      { side: 'SELL', sym: 'RELIANCE', qty: 10, price: '₹2,920.00', status: 'PENDING', amber: true },
                    ].map((o, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-2 px-2 rounded border border-[#1E2638]/40 bg-[#0B0E14]/40">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {o.side}
                          </span>
                          <span className="font-bold text-white">{o.sym}</span>
                          <span className="text-[11px] text-slate-400">Qty: {o.qty}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-200">{o.price}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.green ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3">
                    <Link href="/orders" className="text-xs font-semibold text-blue-400 hover:underline">
                      View All Orders →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="trade-card p-5">
                <div className="flex items-center justify-between pb-3">
                  <h3 className="text-sm font-bold text-white">Watchlist</h3>
                  <Link href="/watchlist" className="text-xs font-semibold text-blue-400 hover:underline">
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {[
                    { sym: 'TCS', name: 'Tata Consultancy Ser.', price: '₹3,524.20', change: '+2.21%', green: true },
                    { sym: 'RELIANCE', name: 'Reliance Industries', price: '₹2,914.35', change: '+1.87%', green: true },
                    { sym: 'HDFCBANK', name: 'HDFC Bank Limited', price: '₹1,678.90', change: '+1.32%', green: true },
                    { sym: 'INFY', name: 'Infosys Limited', price: '₹1,590.40', change: '-0.48%', green: false },
                    { sym: 'ICICIBANK', name: 'ICICI Bank Limited', price: '₹1,168.75', change: '-0.72%', green: false },
                  ].map((w) => (
                    <Link
                      key={w.sym}
                      href={`/market/${w.sym}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1E2638]/50 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 font-bold text-blue-400 text-xs">
                          {w.sym.slice(0, 3)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{w.sym}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[100px]">{w.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-white">{w.price}</div>
                        <div className={`text-[10px] font-bold ${w.green ? 'text-emerald-400' : 'text-red-400'}`}>
                          {w.change}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#1E2638] py-2 text-xs font-semibold text-blue-400 hover:border-blue-500 hover:bg-blue-500/5 transition">
                  <Plus className="h-4 w-4" />
                  <span>Add Stocks</span>
                </button>
              </div>

              <div className="trade-card p-5">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-sm font-bold text-white">Portfolio Allocation</h3>
                  <Link href="/portfolio" className="text-xs font-semibold text-blue-400 hover:underline">
                    View Details
                  </Link>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="h-36 w-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={DONUT_DATA} innerRadius={38} outerRadius={60} paddingAngle={4} dataKey="value">
                          {DONUT_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {DONUT_DATA.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-slate-300 w-16">{item.name}</span>
                        <span className="font-bold text-white">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="trade-card p-5 space-y-3">
                <h3 className="text-sm font-bold text-white">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/market/TCS"
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-[#1E2638] bg-[#0B0E14] hover:border-emerald-500 hover:bg-emerald-500/10 transition group"
                  >
                    <ArrowUpRight className="h-6 w-6 text-emerald-400 group-hover:scale-110 transition" />
                    <span className="text-xs font-bold text-white mt-1">Buy Stock</span>
                  </Link>

                  <Link
                    href="/market/TCS"
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-[#1E2638] bg-[#0B0E14] hover:border-red-500 hover:bg-red-500/10 transition group"
                  >
                    <ArrowDownRight className="h-6 w-6 text-red-400 group-hover:scale-110 transition" />
                    <span className="text-xs font-bold text-white mt-1">Sell Stock</span>
                  </Link>

                  <Link
                    href="/wallet"
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-[#1E2638] bg-[#0B0E14] hover:border-blue-500 hover:bg-blue-500/10 transition group"
                  >
                    <PlusCircle className="h-6 w-6 text-blue-400 group-hover:scale-110 transition" />
                    <span className="text-xs font-bold text-white mt-1">Deposit</span>
                  </Link>

                  <Link
                    href="/wallet"
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-[#1E2638] bg-[#0B0E14] hover:border-purple-500 hover:bg-purple-500/10 transition group"
                  >
                    <ArrowUpCircle className="h-6 w-6 text-purple-400 group-hover:scale-110 transition" />
                    <span className="text-xs font-bold text-white mt-1">Withdraw</span>
                  </Link>
                </div>
              </div>

              <ChatbotWidget />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

