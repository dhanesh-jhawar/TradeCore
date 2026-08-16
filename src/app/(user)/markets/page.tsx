'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserSidebar } from '@/components/common/UserSidebar';
import { Header } from '@/components/common/Header';
import {
  TrendingUp,
  TrendingDown,
  LineChart,
  Star,
  Search,
  Filter,
  LayoutGrid,
  List,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface Company {
  id: string;
  symbol: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  openingPrice: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap: number;
}

const MARKET_SNAPSHOT_DATA = [
  { time: '09:15', value: 24600 },
];

export default function MarketsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [summary, setSummary] = useState<any>({
    totalCompanies: 0,
    advancers: 0,
    decliners: 0,
    unchanged: 0,
    totalVolume: 0,
  });
  const [marketStats, setMarketStats] = useState<any>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'gainers' | 'losers'>('all');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let url = `/api/companies?filter=${filterTab}`;
    if (selectedSector !== 'All Sectors') url += `&sector=${encodeURIComponent(selectedSector)}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.companies) {
          setCompanies(data.companies);
        }
      })
      .catch(() => {});

    fetch('/api/analytics/market')
      .then((res) => res.json())
      .then((data) => {
        if (data.marketStats) {
          setMarketStats(data.marketStats);
          setSummary({
            totalCompanies: data.marketStats.advancers + data.marketStats.decliners + data.marketStats.unchanged,
            advancers: data.marketStats.advancers,
            decliners: data.marketStats.decliners,
            unchanged: data.marketStats.unchanged,
            totalVolume: data.marketStats.totalVolume,
            totalMarketCap: data.marketStats.totalMarketCap,
          });
        }
      })
      .catch(() => {});
  }, [filterTab, selectedSector, searchQuery]);

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <UserSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Top Indices Ticker Bar */}
        <div className="flex items-center gap-6 border-b border-[#1E2638] bg-[#121722]/60 px-6 py-2.5 overflow-x-auto text-xs relative">
          <div className="flex items-center gap-2 pr-20">
            <span className="font-bold text-slate-400">NIFTY 50</span>
            <span className="font-extrabold text-white">24,834.85</span>
            <span className="font-bold text-emerald-400">+1.23%</span>
          </div>
          <div className="h-3 w-px bg-[#1E2638]" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">SENSEX</span>
            <span className="font-extrabold text-white">81,330.56</span>
            <span className="font-bold text-emerald-400">+1.08%</span>
          </div>
          <div className="h-3 w-px bg-[#1E2638]" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">BANK NIFTY</span>
            <span className="font-extrabold text-white">52,398.90</span>
            <span className="font-bold text-emerald-400">+1.76%</span>
          </div>
          <div className="h-3 w-px bg-[#1E2638]" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">FINNIFTY</span>
            <span className="font-extrabold text-white">23,540.70</span>
            <span className="font-bold text-emerald-400">+1.39%</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Title & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Markets</h1>
              <p className="text-sm text-slate-400">Track all 100+ companies in real-time</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex rounded-lg border border-[#1E2638] bg-[#121722] p-1 text-xs font-semibold">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`rounded px-3 py-1.5 ${filterTab === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterTab('gainers')}
                  className={`rounded px-3 py-1.5 ${filterTab === 'gainers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Top Gainers
                </button>
                <button
                  onClick={() => setFilterTab('losers')}
                  className={`rounded px-3 py-1.5 ${filterTab === 'losers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Top Losers
                </button>
              </div>

              {/* Sector Dropdown */}
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="rounded-lg border border-[#1E2638] bg-[#121722] px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
              >
                <option value="All Sectors">All Sectors</option>
                <option value="IT Services">IT Services</option>
                <option value="Banking">Banking</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Energy & Utilities">Energy & Utilities</option>
                <option value="Automotive">Automotive</option>
                <option value="Telecommunications">Telecommunications</option>
                <option value="FMCG & Consumer">FMCG & Consumer</option>
                <option value="Metals & Mining">Metals & Mining</option>
                <option value="Pharmaceuticals">Pharmaceuticals</option>
                <option value="Infrastructure & Realty">Infrastructure & Realty</option>
              </select>

              <div className="flex gap-1 rounded-lg border border-[#1E2638] bg-[#121722] p-1">
                <button className="rounded p-1 text-slate-400 hover:text-white">
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button className="rounded bg-blue-600 p-1 text-white">
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Top Summary Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="trade-card p-4">
              <div className="text-xs font-semibold text-slate-400">Total Companies</div>
              <div className="text-2xl font-extrabold text-white mt-1">{summary.totalCompanies}</div>
              <div className="mt-2 flex items-center gap-3 text-[10px] font-semibold text-slate-400">
                <span className="text-emerald-400">Active {summary.totalCompanies}</span>
                <span className="text-red-400">Inactive 0</span>
              </div>
            </div>

            <div className="trade-card p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Advancers</span>
                <span className="text-emerald-400 font-bold">{summary.totalCompanies > 0 ? Math.round((summary.advancers / summary.totalCompanies) * 100) : 0}%</span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">{summary.advancers}</div>
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-800">
                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${summary.totalCompanies > 0 ? (summary.advancers / summary.totalCompanies) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="trade-card p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Decliners</span>
                <span className="text-red-400 font-bold">{summary.totalCompanies > 0 ? Math.round((summary.decliners / summary.totalCompanies) * 100) : 0}%</span>
              </div>
              <div className="text-2xl font-extrabold text-red-400 mt-1">{summary.decliners}</div>
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-800">
                <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${summary.totalCompanies > 0 ? (summary.decliners / summary.totalCompanies) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="trade-card p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Unchanged</span>
                <span className="text-amber-400 font-bold">{summary.totalCompanies > 0 ? Math.round((summary.unchanged / summary.totalCompanies) * 100) : 0}%</span>
              </div>
              <div className="text-2xl font-extrabold text-amber-400 mt-1">{summary.unchanged}</div>
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-800">
                <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${summary.totalCompanies > 0 ? (summary.unchanged / summary.totalCompanies) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="trade-card p-4">
              <div className="text-xs font-semibold text-slate-400">Total Volume</div>
              <div className="text-2xl font-extrabold text-white mt-1">{summary.totalVolume > 100000 ? (summary.totalVolume / 100000).toFixed(2) + ' L' : summary.totalVolume}</div>
              <div className="text-xs font-semibold text-emerald-400 mt-1">Observed</div>
            </div>
          </div>

          {/* Main Grid: Companies Table (8 cols) & Market Sidebar (4 cols) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* 100 Companies Table */}
            <div className="lg:col-span-8 trade-card p-5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1E2638] text-slate-400 font-semibold">
                      <th className="pb-3 w-8">#</th>
                      <th className="pb-3">Company</th>
                      <th className="pb-3 text-right">Price</th>
                      <th className="pb-3 text-right">Change</th>
                      <th className="pb-3 text-right">Change %</th>
                      <th className="pb-3 text-right">Volume</th>
                      <th className="pb-3 text-right">Market Cap</th>
                      <th className="pb-3 text-right">Day High</th>
                      <th className="pb-3 text-right">Day Low</th>
                      <th className="pb-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]/50">
                    {companies.map((c, idx) => {
                      const change = Number((c.currentPrice - c.previousClose).toFixed(2));
                      const changePct = Number(((change / c.previousClose) * 100).toFixed(2));
                      const isGreen = change >= 0;

                      return (
                        <tr key={c.id} className="hover:bg-[#1E2638]/40 transition">
                          <td className="py-3 text-slate-500 font-medium">{idx + 1}</td>
                          <td className="py-3">
                            <Link href={`/market/${c.symbol}`} className="flex items-center gap-3 group">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 font-bold text-blue-400 text-xs group-hover:scale-105 transition">
                                {c.symbol.slice(0, 3)}
                              </div>
                              <div>
                                <div className="font-bold text-white group-hover:text-blue-400 transition">
                                  {c.symbol}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
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
                          <td className="py-3 text-right text-emerald-400 font-medium">₹{c.dayHigh.toFixed(2)}</td>
                          <td className="py-3 text-right text-red-400 font-medium">₹{c.dayLow.toFixed(2)}</td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                href={`/market/${c.symbol}`}
                                className="p-1 text-slate-400 hover:text-blue-400 transition"
                                title="View Chart"
                              >
                                <LineChart className="h-4 w-4" />
                              </Link>
                              <button className="p-1 text-slate-400 hover:text-amber-400 transition" title="Add to Watchlist">
                                <Star className="h-4 w-4" />
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

            {/* Right Sidebar: Market Snapshot Chart & Sector Performance */}
            <div className="lg:col-span-4 space-y-6">
              {/* Market Snapshot Card */}
              <div className="trade-card p-5 space-y-4 relative">
                <h3 className="text-sm font-bold text-white">Market Snapshot</h3>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={marketStats?.snapshotData || MARKET_SNAPSHOT_DATA}>
                      <defs>
                        <linearGradient id="snapshotGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fill="url(#snapshotGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 border-t border-[#1E2638] pt-3 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Market Cap</span>
                    <span className="font-bold text-white">₹{summary.totalMarketCap || 0} L Cr</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Volume</span>
                    <span className="font-bold text-white">{summary.totalVolume > 100000 ? (summary.totalVolume / 100000).toFixed(2) + ' L' : summary.totalVolume}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Average PE Ratio</span>
                    <span className="font-bold text-white">24.35</span>
                  </div>
                </div>
              </div>

              {/* Sector Performance List */}
              <div className="trade-card p-5 space-y-3 relative">
                <div className="flex items-center justify-between pb-2 pr-16">
                  <h3 className="text-sm font-bold text-white">Sector Performance</h3>
                  <button className="text-xs font-semibold text-blue-400 hover:underline">View All</button>
                </div>
                <div className="space-y-2.5 text-xs">
                  {marketStats?.sectorPerformance?.map((s: any) => (
                    <div key={s.name} className="flex items-center justify-between p-2 rounded bg-[#0B0E14]/40 border border-[#1E2638]/40">
                      <span className="font-semibold text-slate-300">{s.name}</span>
                      <span className={`font-bold ${s.green ? 'text-emerald-400' : 'text-red-400'}`}>
                        {s.change}
                      </span>
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
