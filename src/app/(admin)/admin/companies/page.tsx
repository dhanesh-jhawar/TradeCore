'use client';

import React, { useState } from 'react';
import { AdminSidebar } from '@/components/common/AdminSidebar';
import { Header } from '@/components/common/Header';
import { Building2, Plus, Upload, Filter, Eye, Edit3, MoreHorizontal } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts';

// Static arrays removed, using API data

export default function AdminCompaniesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const fetchCompanies = () => {
    fetch('/api/admin/companies')
      .then(res => res.json())
      .then(data => {
        if (data.companies) {
          setCompanies(data.companies);
          if (!selectedCompany && data.companies.length > 0) {
            setSelectedCompany(data.companies[0]);
          }
        }
        if (data.stats) setStats(data.stats);
      });
  };

  React.useEffect(() => {
    fetchCompanies();
    const interval = setInterval(fetchCompanies, 5000);
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
              <h1 className="text-2xl font-bold text-white">Companies</h1>
              <p className="text-xs text-slate-400">Manage and monitor all listed companies on the exchange</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition">
                <Upload className="h-3.5 w-3.5" />
                <span>Import Companies</span>
              </button>
              <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30">
                <Plus className="h-3.5 w-3.5" />
                <span>Add Company</span>
              </button>
            </div>
          </div>

          {/* 6 Top Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Total Companies</div>
              <div className="text-2xl font-extrabold text-white">{stats.totalCompanies || 0}</div>
              <div className="text-[10px] font-semibold text-emerald-400">Active: {stats.totalCompanies || 0}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Active Companies</div>
              <div className="text-2xl font-extrabold text-emerald-400">{stats.totalCompanies || 0}</div>
              <div className="text-[10px] font-semibold text-emerald-400">100% of total</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Suspended Companies</div>
              <div className="text-2xl font-extrabold text-amber-400">0</div>
              <div className="text-[10px] font-semibold text-slate-500">0% of total</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Delisted Companies</div>
              <div className="text-2xl font-extrabold text-red-400">0</div>
              <div className="text-[10px] font-semibold text-slate-500">0% of total</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Total Market Cap</div>
              <div className="text-2xl font-extrabold text-white">₹{((stats.totalMarketCap || 0) / 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 })} Cr</div>
              <div className="text-[10px] font-semibold text-emerald-400">+2.42% vs yesterday</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Total Volume (24h)</div>
              <div className="text-2xl font-extrabold text-white">₹{((stats.totalVolume || 0) / 10000000).toFixed(2)} Cr</div>
              <div className="text-[10px] font-semibold text-emerald-400">+8.29% vs yesterday</div>
            </div>
          </div>

          {/* Main Grid: Companies Table (8 cols) & Company Details Panel (4 cols) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 trade-card p-5 space-y-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Search by name or symbol..."
                  className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none flex-1"
                />
                <select className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-2.5 py-1.5 text-slate-300">
                  <option>All Sectors</option>
                </select>
                <select className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-2.5 py-1.5 text-slate-300">
                  <option>All Industries</option>
                </select>
                <select className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-2.5 py-1.5 text-slate-300">
                  <option>All Status</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1E2638] text-slate-500 font-semibold">
                      <th className="pb-2">Symbol</th>
                      <th className="pb-2">Company Name</th>
                      <th className="pb-2">Sector</th>
                      <th className="pb-2">Industry</th>
                      <th className="pb-2 text-right">Current Price</th>
                      <th className="pb-2 text-right">24h Change</th>
                      <th className="pb-2 text-right">Volume (24h)</th>
                      <th className="pb-2 text-right">Market Cap</th>
                      <th className="pb-2 text-center">Status</th>
                      <th className="pb-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]/40">
                    {companies.map((c) => (
                      <tr key={c.sym} className={`hover:bg-[#1E2638]/40 cursor-pointer ${selectedCompany?.sym === c.sym ? 'bg-[#1E2638]/20 border-l-2 border-blue-500' : 'border-l-2 border-transparent'}`} onClick={() => setSelectedCompany(c)}>
                        <td className="py-2 font-bold text-blue-400">{c.sym}</td>
                        <td className="py-2 font-semibold text-white truncate max-w-[150px]">{c.name}</td>
                        <td className="py-2 text-slate-300">{c.sec}</td>
                        <td className="py-2 text-slate-400 text-[11px]">{c.ind}</td>
                        <td className="py-2 text-right font-bold text-white">{c.price}</td>
                        <td className={`py-2 text-right font-bold ${c.chg.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{c.chg}</td>
                        <td className="py-2 text-right text-slate-300">{c.vol}</td>
                        <td className="py-2 text-right text-slate-300 font-semibold">{c.mcap}</td>
                        <td className="py-2 text-center">
                          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold">ACTIVE</span>
                        </td>
                        <td className="py-2 text-center flex items-center justify-center gap-1">
                          <button className="text-slate-400 hover:text-white"><Eye className="h-3.5 w-3.5" /></button>
                          <button className="text-slate-400 hover:text-white"><Edit3 className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Company Inspector Panel (4 cols) */}
            <div className="lg:col-span-4 trade-card p-5 space-y-4">
              {selectedCompany ? (
                <>
                  <div className="flex justify-between items-start border-b border-[#1E2638] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{selectedCompany.name}</span>
                        <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded">ACTIVE</span>
                      </div>
                      <div className="text-xs text-slate-400">{selectedCompany.sym} • {selectedCompany.ind}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl font-extrabold text-white">{selectedCompany.price} <span className={`text-xs font-bold ${selectedCompany.chg.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{selectedCompany.chg} ({((selectedCompany.raw?.currentPrice || 0) - (selectedCompany.raw?.previousClose || 0)).toFixed(2)})</span></div>
                    <div className="grid grid-cols-4 text-center text-[10px] pt-1 text-slate-400">
                      <div>24h High<br/><strong className="text-white">₹{selectedCompany.raw?.dayHigh?.toFixed(2)}</strong></div>
                      <div>24h Low<br/><strong className="text-white">₹{selectedCompany.raw?.dayLow?.toFixed(2)}</strong></div>
                      <div>Open<br/><strong className="text-white">₹{selectedCompany.raw?.openPrice?.toFixed(2)}</strong></div>
                      <div>Prev Close<br/><strong className="text-white">₹{selectedCompany.raw?.previousClose?.toFixed(2)}</strong></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-[#1E2638]">
                    <div>
                      <div className="text-slate-500">Volume (24h)</div>
                      <div className="font-bold text-white">{selectedCompany.vol}</div>
                      <div className="text-[10px] text-emerald-400">+12.35% vs yesterday</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Market Cap</div>
                      <div className="font-bold text-white">{selectedCompany.mcap}</div>
                      <div className="text-[10px] text-emerald-400">+1.82% vs yesterday</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs pt-2 border-t border-[#1E2638]">
                    <div className="flex justify-between"><span className="text-slate-500">Sector</span><span className="font-bold text-white">{selectedCompany.sec}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Industry</span><span className="font-bold text-white">{selectedCompany.ind}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Listing Date</span><span className="font-semibold text-white">{new Date(selectedCompany.raw?.createdAt || Date.now()).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Base Price</span><span className="font-semibold text-white">₹{selectedCompany.raw?.basePrice?.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Total Shares</span><span className="font-bold text-white">{((selectedCompany.raw?.marketCap || 0) / (selectedCompany.raw?.currentPrice || 1) / 10000000).toFixed(2)} Cr</span></div>
                  </div>

                  <button className="w-full py-2 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-500 transition">
                    View Full Analysis →
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  Select a company to view details
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Sector Distribution + Market Cap Distribution + Sector Performance */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Sector Distribution</h3>
              <div className="flex items-center justify-between">
                <div className="h-32 w-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.sectorDist || []} innerRadius={30} outerRadius={50} dataKey="val">
                        {(stats.sectorDist || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 text-xs overflow-y-auto max-h-32">
                  {(stats.sectorDist || []).map((s: any) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-semibold text-slate-300 w-28 truncate">{s.name}</span>
                      <span className="font-bold text-white">{s.val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Market Cap Distribution</h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.mcapDist || []}>
                    <XAxis dataKey="range" stroke="#64748B" fontSize={9} />
                    <YAxis hide />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Sector Performance (24h)</h3>
              <div className="space-y-2 text-xs overflow-y-auto max-h-32">
                {(stats.sectorPerf || []).map((s: any) => (
                  <div key={s.name} className="flex justify-between items-center">
                    <span className="font-semibold text-slate-300">{s.name}</span>
                    <span className={`font-bold ${s.pos ? 'text-emerald-400' : 'text-red-400'}`}>{s.chg}</span>
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
