'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/common/AdminSidebar';
import { Header } from '@/components/common/Header';
import { ClipboardList, Download, Filter, Search } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function AdminOrdersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All Orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [TREND_DATA, setTrendData] = useState<any[]>([]);

  const fetchOrders = () => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        if (data.orders) setOrders(data.orders);
        if (data.stats) setStats(data.stats);
      });
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const total = stats.totalOrders || 1;
  const STATUS_DATA = [
    { name: 'Filled', value: stats.filledOrders || 0, pct: ((stats.filledOrders / total) * 100).toFixed(1) + '%', color: '#10B981' },
    { name: 'Partially Filled', value: stats.partialOrders || 0, pct: ((stats.partialOrders / total) * 100).toFixed(1) + '%', color: '#F59E0B' },
    { name: 'Open', value: stats.openOrders || 0, pct: ((stats.openOrders / total) * 100).toFixed(1) + '%', color: '#3B82F6' },
    { name: 'Cancelled', value: stats.cancelledOrders || 0, pct: ((stats.cancelledOrders / total) * 100).toFixed(1) + '%', color: '#EF4444' }
  ];

  const SIDE_DATA = [
    { name: 'Buy Orders', value: stats.buyOrders || 0, pct: ((stats.buyOrders / total) * 100).toFixed(1) + '%', color: '#10B981' },
    { name: 'Sell Orders', value: stats.sellOrders || 0, pct: ((stats.sellOrders / total) * 100).toFixed(1) + '%', color: '#EF4444' }
  ];

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <AdminSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Orders</h1>
              <p className="text-xs text-slate-400">Monitor and manage all orders on the exchange</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition">
                <Download className="h-3.5 w-3.5" />
                <span>Export</span>
              </button>
              <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30">
                <Filter className="h-3.5 w-3.5" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Top 5 Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Total Orders</div>
              <div className="text-2xl font-extrabold text-white">{stats.totalOrders?.toLocaleString() || 0}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Open Orders</div>
              <div className="text-2xl font-extrabold text-amber-400">{stats.openOrders?.toLocaleString() || 0}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Filled Orders</div>
              <div className="text-2xl font-extrabold text-emerald-400">{stats.filledOrders?.toLocaleString() || 0}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Partially Filled</div>
              <div className="text-2xl font-extrabold text-blue-400">{stats.partialOrders?.toLocaleString() || 0}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Cancelled Orders</div>
              <div className="text-2xl font-extrabold text-red-400">{stats.cancelledOrders?.toLocaleString() || 0}</div>
            </div>
          </div>

          {/* Main Grid: Orders Table (8 cols) & Charts (4 cols) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Orders Table Column */}
            <div className="lg:col-span-8 trade-card p-5 space-y-4">
              {/* Filter Tabs */}
              <div className="flex gap-2 border-b border-[#1E2638] pb-3 text-xs font-semibold overflow-x-auto">
                {['All Orders', 'Open Orders', 'Filled Orders', 'Partially Filled', 'Cancelled Orders', 'Rejected Orders'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded px-3 py-1.5 ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Search by Order ID, User ID, Company..."
                  className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none flex-1"
                />
                <select className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-2.5 py-1.5 text-slate-300">
                  <option>All Companies</option>
                </select>
                <select className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-2.5 py-1.5 text-slate-300">
                  <option>All Sides</option>
                </select>
                <select className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-2.5 py-1.5 text-slate-300">
                  <option>All Types</option>
                </select>
                <select className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-2.5 py-1.5 text-slate-300">
                  <option>All Status</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1E2638] text-slate-500 font-semibold">
                      <th className="pb-2">Order ID</th>
                      <th className="pb-2">Time</th>
                      <th className="pb-2">User</th>
                      <th className="pb-2">Company</th>
                      <th className="pb-2">Side</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2 text-right">Price (₹)</th>
                      <th className="pb-2 text-right">Qty</th>
                      <th className="pb-2 text-right">Filled Qty</th>
                      <th className="pb-2 text-right">Remaining Qty</th>
                      <th className="pb-2 text-center">Status</th>
                      <th className="pb-2 text-right">Total Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]/40">
                    {orders.filter(o => activeTab === 'All Orders' || o.st === activeTab.replace(' Orders', '').toUpperCase().replace(' ', '_')).map((o: any) => (
                      <tr key={o.oid} className="hover:bg-[#1E2638]/40">
                        <td className="py-2 text-slate-400 font-mono text-[11px]">{o.oid}</td>
                        <td className="py-2 text-slate-500 font-mono text-[10px]">{o.time}</td>
                        <td className="py-2 text-blue-400 font-mono font-semibold">{o.user}</td>
                        <td className="py-2 font-bold text-white">{o.comp}</td>
                        <td className="py-2 font-bold">
                          <span className={o.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}>{o.side}</span>
                        </td>
                        <td className="py-2 text-slate-300">{o.type}</td>
                        <td className="py-2 text-right font-bold text-white">{o.price}</td>
                        <td className="py-2 text-right text-slate-300 font-semibold">{o.qty}</td>
                        <td className="py-2 text-right text-slate-300">{o.filled}</td>
                        <td className="py-2 text-right text-slate-300">{o.rem}</td>
                        <td className="py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            o.st === 'FILLED' ? 'bg-emerald-500/20 text-emerald-400' :
                            o.st === 'PARTIALLY_FILLED' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {o.st}
                          </span>
                        </td>
                        <td className="py-2 text-right font-bold text-white">{o.val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Sidebar Charts (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Orders by Status */}
              <div className="trade-card p-5 space-y-3">
                <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Orders by Status</h3>
                <div className="flex items-center justify-between">
                  <div className="h-32 w-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={STATUS_DATA} innerRadius={32} outerRadius={52} paddingAngle={3} dataKey="value">
                          {STATUS_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 text-xs">
                    {STATUS_DATA.map((s) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="font-semibold text-slate-300 w-24 truncate">{s.name}</span>
                        <span className="font-bold text-white">{s.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Orders by Side */}
              <div className="trade-card p-5 space-y-3">
                <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Orders by Side</h3>
                <div className="flex items-center justify-between">
                  <div className="h-28 w-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={SIDE_DATA} innerRadius={28} outerRadius={46} paddingAngle={4} dataKey="value">
                          {SIDE_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-xs">
                    {SIDE_DATA.map((s) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="font-semibold text-slate-300 w-20">{s.name}</span>
                        <span className="font-bold text-white">{s.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid Row 2: Orders Trend Area Chart */}
          <div className="trade-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
              <h3 className="text-xs font-bold text-white">Orders Trend</h3>
              <div className="flex gap-4 text-xs font-bold">
                <span className="text-blue-400">● Total Orders</span>
                <span className="text-emerald-400">● Buy Orders</span>
                <span className="text-red-400">● Sell Orders</span>
              </div>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND_DATA}>
                  <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} orientation="right" />
                  <Tooltip contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E2638', color: '#fff', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="total" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" dataKey="buy" stroke="#10B981" fill="none" strokeWidth={2} />
                  <Area type="monotone" dataKey="sell" stroke="#EF4444" fill="none" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
