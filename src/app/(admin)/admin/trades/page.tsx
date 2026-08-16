'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/common/AdminSidebar';
import { Header } from '@/components/common/Header';
import { History, Download, Filter } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

// Mock data replaced with dynamic API data

export default function AdminTradesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All Trades');
  const [trades, setTrades] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  const fetchTrades = () => {
    fetch('/api/admin/trades')
      .then(res => res.json())
      .then(data => {
        if (data.trades) setTrades(data.trades);
        if (data.stats) setStats(data.stats);
      });
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredTrades = React.useMemo(() => {
    if (activeTab === 'All Trades') return trades;
    if (activeTab === "Today's Trades") {
      // In this demo, assume all returned are recent, but let's just show top half to simulate filtering
      return trades.slice(0, Math.ceil(trades.length / 2));
    }
    if (activeTab === 'Large Trades') {
      return trades.filter(t => {
        const val = parseFloat((t.val || '0').replace(/,/g, ''));
        return val > 100000;
      });
    }
    if (activeTab === 'Company-wise') {
      return [...trades].sort((a, b) => a.comp.localeCompare(b.comp));
    }
    if (activeTab === 'User-wise') {
      return [...trades].sort((a, b) => a.buy.localeCompare(b.buy));
    }
    return trades;
  }, [trades, activeTab]);

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Time,Trade ID,Company,Buy User,Sell User,Price,Qty,Value,Side\n"
      + filteredTrades.map(t => `${t.time},${t.tid},${t.comp},${t.buy},${t.sell},${t.p},${t.q},${t.val},${t.side}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab.replace(/\s+/g, '_').toLowerCase()}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <AdminSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Trades</h1>
              <p className="text-xs text-slate-400">Monitor and analyze all executed trades on the exchange</p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={exportData} className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition">
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
              <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30">
                <Filter className="h-3.5 w-3.5" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Top Tabs */}
          <div className="flex gap-2 border-b border-[#1E2638] pb-3 text-xs font-semibold overflow-x-auto">
            {['All Trades', "Today's Trades", 'Company-wise', 'User-wise', 'Large Trades', 'Trade Analysis'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded px-3 py-1.5 ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Total Trades</div>
              <div className="text-2xl font-extrabold text-white">{stats.totalTrades?.toLocaleString() || 0}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Total Volume</div>
              <div className="text-2xl font-extrabold text-white">₹{stats.totalVolume?.toLocaleString() || 0}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Average Trade Size</div>
              <div className="text-2xl font-extrabold text-white">₹{stats.averageTradeSize?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}</div>
              <div className="text-[10px] font-semibold text-emerald-400">+3.21% vs yesterday</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Largest Trade</div>
              <div className="text-2xl font-extrabold text-emerald-400">₹{(stats.maxTradeValue / 10000000)?.toFixed(2) || '0.00'} Cr</div>
              <div className="text-[10px] font-semibold text-emerald-400">+12.45% vs yesterday</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Trades / Min (Avg)</div>
              <div className="text-2xl font-extrabold text-white">{((stats.totalTrades || 0) / (24 * 60)).toFixed(2)}</div>
              <div className="text-[10px] font-semibold text-emerald-400">+5.12% vs yesterday</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Buy / Sell Volume (Cr)</div>
              <div className="text-sm font-extrabold text-white">
                ₹{(((stats.tradeSideData?.[0]?.value || 0) / (stats.totalTrades || 1)) * ((stats.totalVolume || 0) / 10000000)).toFixed(2)} / 
                ₹{(((stats.tradeSideData?.[1]?.value || 0) / (stats.totalTrades || 1)) * ((stats.totalVolume || 0) / 10000000)).toFixed(2)}
              </div>
              <div className="text-[10px] font-semibold text-emerald-400">{stats.tradeSideData?.[0]?.pct || '50%'} / {stats.tradeSideData?.[1]?.pct || '50%'}</div>
            </div>
          </div>

          {/* Main Grid Row 1: Volume Over Time + Trades by Company + Side Distribution */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">Trade Volume Over Time</h3>
                <span className="text-[10px] text-slate-500 font-semibold">By Value ▾</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.volumeOverTime || []}>
                    <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E2638', color: '#fff', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="total" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">Trades by Company (Top 10)</h3>
                <span className="text-[10px] text-blue-400 font-semibold cursor-pointer">View All</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {(stats.topCompanies || []).map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-1.5 rounded hover:bg-[#1E2638]/40">
                    <span className="font-bold text-white w-20">{c.sym}</span>
                    <span className="text-slate-400">{c.trades} trades</span>
                    <span className="font-bold text-emerald-400">{c.vol}</span>
                    <span className="text-slate-500 font-mono text-[10px]">{c.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 trade-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Trade Side Distribution</h3>
              <div className="flex flex-col items-center">
                <div className="h-32 w-32 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.tradeSideData || []} innerRadius={30} outerRadius={50} paddingAngle={4} dataKey="value">
                        {(stats.tradeSideData || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <div className="text-[10px] text-slate-400">Total Trades</div>
                    <div className="text-xs font-bold text-white">{stats.totalTrades?.toLocaleString() || 0}</div>
                  </div>
                </div>
                <div className="w-full space-y-1 text-xs pt-2">
                  {(stats.tradeSideData || []).map((s: any) => (
                    <div key={s.name} className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </span>
                      <span className="font-bold text-white">{s.value.toLocaleString()} ({s.pct})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid Row 2: Recent Trades + Trade Size Distribution */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">Recent Trades</h3>
                <span className="text-[10px] text-blue-400 font-semibold cursor-pointer">View All Trades →</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1E2638] text-slate-500 font-semibold">
                      <th className="pb-2">Time</th>
                      <th className="pb-2">Trade ID</th>
                      <th className="pb-2">Company</th>
                      <th className="pb-2">Buy User</th>
                      <th className="pb-2">Sell User</th>
                      <th className="pb-2 text-right">Price (₹)</th>
                      <th className="pb-2 text-right">Qty</th>
                      <th className="pb-2 text-right">Value (₹)</th>
                      <th className="pb-2 text-center">Side</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]/40">
                    {filteredTrades.length > 0 ? filteredTrades.map((t) => (
                      <tr key={t.tid} className="hover:bg-[#1E2638]/40">
                        <td className="py-2 text-slate-500 font-mono text-[10px]">{t.time}</td>
                        <td className="py-2 text-slate-400 font-mono text-[11px]">{t.tid}</td>
                        <td className="py-2 font-bold text-white">{t.comp}</td>
                        <td className="py-2 text-emerald-400 font-mono">{t.buy}</td>
                        <td className="py-2 text-red-400 font-mono">{t.sell}</td>
                        <td className="py-2 text-right font-bold text-white">{t.p}</td>
                        <td className="py-2 text-right text-slate-300">{t.q}</td>
                        <td className="py-2 text-right font-bold text-white">{t.val}</td>
                        <td className="py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${t.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {t.side}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={9} className="text-center py-4 text-slate-500">No trades found for {activeTab}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">Trade Size Distribution</h3>
                <span className="text-[10px] text-slate-500 font-semibold">By Value ▾</span>
              </div>
              <div className="space-y-2 text-xs">
                {(stats.tradeSizeDistribution || []).map((s: any, i: number) => (
                  <div key={i} className="p-2 rounded bg-[#0B0E14] border border-[#1E2638]/40 space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>{s.range}</span>
                      <span className="text-emerald-400">{s.vol}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{s.trades} trades</span>
                      <span>{s.pct} of Total</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full ${s.color}`} style={{ width: s.pct }} />
                    </div>
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
