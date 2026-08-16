'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserSidebar } from '@/components/common/UserSidebar';
import { Header } from '@/components/common/Header';
import {
  Star,
  Plus,
  Edit,
  Bell,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Newspaper,
  ChevronRight,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const WATCHLIST_PERFORMANCE_DATA = [
  { time: '09:15', value: 1.0 },
  { time: '10:00', value: 1.25 },
  { time: '11:00', value: 1.15 },
  { time: '12:00', value: 1.45 },
  { time: '13:00', value: 1.55 },
  { time: '14:00', value: 1.65 },
];

export default function WatchlistPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [watchlistStocks, setWatchlistStocks] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/companies')
      .then((res) => res.json())
      .then((data) => {
        if (data.companies) {
          // Take first 12 companies as core watchlist
          setWatchlistStocks(data.companies.slice(0, 12));
        }
      })
      .catch(() => {});
  }, []);

  const totalValue = watchlistStocks.reduce((acc, c) => acc + c.currentPrice, 0);
  const totalPrevValue = watchlistStocks.reduce((acc, c) => acc + c.previousClose, 0);
  const todaysChange = totalValue - totalPrevValue;
  const todaysChangePct = totalPrevValue ? (todaysChange / totalPrevValue) * 100 : 0;
  
  const sortedByChange = [...watchlistStocks].sort((a, b) => {
    const aChange = (a.currentPrice - a.previousClose) / a.previousClose;
    const bChange = (b.currentPrice - b.previousClose) / b.previousClose;
    return bChange - aChange;
  });
  
  const topGainer = sortedByChange[0];
  const topLoser = sortedByChange[sortedByChange.length - 1];

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <UserSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Title & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Star className="h-6 w-6 text-blue-500 fill-blue-500" />
                <span>Watchlist</span>
              </h1>
              <p className="text-sm text-slate-400">Track and monitor your favourite stocks</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition">
                <Edit className="h-4 w-4" />
                <span>Edit Watchlist</span>
              </button>
              <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition">
                <Plus className="h-4 w-4" />
                <span>Add Stock</span>
              </button>
            </div>
          </div>

          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="trade-card p-4">
              <div className="text-xs font-semibold text-slate-400">Total Watchlist</div>
              <div className="text-2xl font-extrabold text-white mt-1">{watchlistStocks.length}</div>
              <div className="text-[10px] text-slate-500 mt-1">Stocks tracked</div>
            </div>

            <div className="trade-card p-4">
              <div className="text-xs font-semibold text-slate-400">Index Value</div>
              <div className="text-2xl font-extrabold text-white mt-1">₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className={`text-xs font-semibold mt-1 ${todaysChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {todaysChange >= 0 ? '+' : ''}₹{todaysChange.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({todaysChange >= 0 ? '+' : ''}{todaysChangePct.toFixed(2)}%)
              </div>
            </div>

            <div className="trade-card p-4">
              <div className="text-xs font-semibold text-slate-400">Today's Change</div>
              <div className={`text-2xl font-extrabold mt-1 ${todaysChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {todaysChange >= 0 ? '+' : ''}₹{todaysChange.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className={`text-xs font-semibold mt-1 ${todaysChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {todaysChange >= 0 ? '+' : ''}{todaysChangePct.toFixed(2)}%
              </div>
            </div>

            <div className="trade-card p-4">
              <div className="text-xs font-semibold text-slate-400">Top Gainer</div>
              <div className="text-xl font-bold text-white mt-1">{topGainer?.symbol || '-'}</div>
              <div className="text-xs font-semibold text-emerald-400 mt-0.5">
                {topGainer ? `+${(((topGainer.currentPrice - topGainer.previousClose) / topGainer.previousClose) * 100).toFixed(2)}%` : '-'}
              </div>
            </div>

            <div className="trade-card p-4">
              <div className="text-xs font-semibold text-slate-400">Top Loser</div>
              <div className="text-xl font-bold text-white mt-1">{topLoser?.symbol || '-'}</div>
              <div className="text-xs font-semibold text-red-400 mt-0.5">
                {topLoser ? `${(((topLoser.currentPrice - topLoser.previousClose) / topLoser.previousClose) * 100).toFixed(2)}%` : '-'}
              </div>
            </div>
          </div>

          {/* Main Content Grid: Table (8 cols) & Sidebar (4 cols) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Watchlist Stocks Table */}
            <div className="lg:col-span-8 trade-card p-5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1E2638] text-slate-400 font-semibold">
                      <th className="pb-3 w-8"></th>
                      <th className="pb-3">Company</th>
                      <th className="pb-3 text-right">Price</th>
                      <th className="pb-3 text-right">Change</th>
                      <th className="pb-3 text-right">Change %</th>
                      <th className="pb-3 text-right">Volume</th>
                      <th className="pb-3 text-right">Market Cap</th>
                      <th className="pb-3 text-center">Day Range</th>
                      <th className="pb-3 text-center">Chart</th>
                      <th className="pb-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]/50">
                    {watchlistStocks.map((c) => {
                      const change = Number((c.currentPrice - c.previousClose).toFixed(2));
                      const changePct = Number(((change / c.previousClose) * 100).toFixed(2));
                      const isGreen = change >= 0;

                      return (
                        <tr key={c.id} className="hover:bg-[#1E2638]/40 transition">
                          <td className="py-3">
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400 cursor-pointer" />
                          </td>
                          <td className="py-3">
                            <Link href={`/market/${c.symbol}`} className="flex items-center gap-3 group">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 font-bold text-blue-400 text-xs group-hover:scale-105 transition">
                                {c.symbol.slice(0, 3)}
                              </div>
                              <div>
                                <div className="font-bold text-white group-hover:text-blue-400 transition">
                                  {c.symbol}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                                  {c.companyName}
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td className="py-3 text-right font-bold text-white">₹{c.currentPrice.toFixed(2)}</td>
                          <td className={`py-3 text-right font-semibold ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isGreen ? `+${change}` : change}
                          </td>
                          <td className={`py-3 text-right font-bold ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isGreen ? `+${changePct}%` : `${changePct}%`}
                          </td>
                          <td className="py-3 text-right text-slate-300">{c.volume.toLocaleString()}</td>
                          <td className="py-3 text-right text-slate-300">₹{c.marketCap} Cr</td>
                          {/* Day Range visual bar */}
                          <td className="py-3 text-center px-2">
                            <div className="w-24 mx-auto space-y-1">
                              <div className="flex justify-between text-[9px] text-slate-500">
                                <span>₹{c.dayLow.toFixed(0)}</span>
                                <span>₹{c.dayHigh.toFixed(0)}</span>
                              </div>
                              <div className="relative h-1.5 w-full rounded-full bg-slate-800">
                                <div
                                  className="absolute top-0 bottom-0 rounded-full bg-blue-500"
                                  style={{ left: '20%', right: '20%' }}
                                />
                                <div
                                  className="absolute top-0 bottom-0 w-2 h-2 -mt-0.25 rounded-full bg-white border border-blue-600 shadow"
                                  style={{ left: '60%' }}
                                />
                              </div>
                            </div>
                          </td>
                          {/* Mini Sparkline Chart */}
                          <td className="py-3 text-center px-1">
                            <div className="h-6 w-16 mx-auto">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={WATCHLIST_PERFORMANCE_DATA}>
                                  <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={isGreen ? '#22C55E' : '#EF4444'}
                                    strokeWidth={1.5}
                                    fill="none"
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button className="p-1 text-slate-400 hover:text-white">
                                <Bell className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-slate-400 hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Sidebar: Watchlist Performance, Top Movers & News */}
            <div className="lg:col-span-4 space-y-6">
              {/* Watchlist Performance Card */}
              <div className="trade-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Watchlist Performance</h3>
                  <span className="text-xs text-slate-400 font-semibold">1D ▾</span>
                </div>
                <div className="text-xs text-slate-400">Change %</div>
                <div className="text-xl font-extrabold text-emerald-400">+1.65%</div>
                <div className="h-32 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={WATCHLIST_PERFORMANCE_DATA}>
                      <defs>
                        <linearGradient id="wlGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Area type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} fill="url(#wlGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Movers Widget */}
              <div className="trade-card p-5 space-y-3 relative">
                <div className="flex items-center justify-between pb-2 border-b border-[#1E2638] pr-16">
                  <h3 className="text-sm font-bold text-white">Top Movers</h3>
                  <div className="flex rounded border border-[#1E2638] bg-[#0B0E14] text-[10px] font-bold">
                    <button className="px-2 py-1 bg-blue-600 text-white rounded">Gainers</button>
                    <button className="px-2 py-1 text-slate-400 hover:text-white">Losers</button>
                  </div>
                </div>
                <div className="space-y-2.5 text-xs">
                  {sortedByChange.slice(0, 5).map((m, idx) => (
                    <div key={m.symbol} className="flex items-center justify-between p-2 rounded bg-[#0B0E14]/40 border border-[#1E2638]/40">
                      <div className="flex items-center gap-2.5">
                        <span className="text-slate-500 font-bold text-[10px] w-3">{idx + 1}</span>
                        <span className="font-bold text-white">{m.symbol}</span>
                      </div>
                      <span className="font-bold text-emerald-400">+{(((m.currentPrice - m.previousClose) / m.previousClose) * 100).toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
                <div className="pt-1">
                  <Link href="/markets" className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1">
                    <span>View All Movers</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Watchlist News Widget */}
              <div className="trade-card p-5 space-y-3 relative">
                <div className="flex items-center justify-between pb-2 border-b border-[#1E2638] pr-16">
                  <h3 className="text-sm font-bold text-white">Watchlist News</h3>
                  <button className="text-xs font-semibold text-blue-400 hover:underline">View All</button>
                </div>
                <div className="space-y-3 text-xs">
                  {[
                    { headline: 'TCS announces Q1 results beat estimates', time: '2 hours ago' },
                    { headline: 'HDFC Bank reports strong growth in advances', time: '4 hours ago' },
                    { headline: 'Reliance Industries expands retail footprint', time: '6 hours ago' },
                    { headline: 'Infosys wins major digital transformation deal', time: '1 day ago' },
                  ].map((n, idx) => (
                    <div key={idx} className="space-y-1 pb-2 border-b border-[#1E2638]/40 last:border-0 last:pb-0">
                      <div className="font-semibold text-slate-200 hover:text-blue-400 cursor-pointer transition">
                        {n.headline}
                      </div>
                      <div className="text-[10px] text-slate-500">{n.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
