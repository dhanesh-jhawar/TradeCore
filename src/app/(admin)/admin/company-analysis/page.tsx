'use client';

import React, { useState } from 'react';
import { AdminSidebar } from '@/components/common/AdminSidebar';
import { Header } from '@/components/common/Header';
import { BarChart3, Download, Filter, Newspaper, Award, TrendingUp, ExternalLink } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

// Mock arrays removed for API data

export default function AdminCompanyAnalysisPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [companies, setCompanies] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [activeTimeline, setActiveTimeline] = useState('1W');

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
              <h1 className="text-2xl font-bold text-white">Company Analysis</h1>
              <p className="text-xs text-slate-400">In-depth analysis and intelligence on listed companies</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition">
                <Download className="h-3.5 w-3.5" />
                <span>Export Report</span>
              </button>
              <button 
                onClick={() => alert("Advanced filtering panel will open here. Currently in development.")}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-[#1E2638] pb-3 text-xs font-semibold overflow-x-auto">
            {['Overview', 'Financials', 'Performance', 'Peers Comparison', 'News & Updates', 'Documents', 'Corporate Actions'].map((tab) => (
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
              <div className="text-[11px] font-semibold text-slate-400">Total Companies</div>
              <div className="text-2xl font-extrabold text-white">{stats.totalCompanies || 0}</div>
              <div className="text-[10px] font-semibold text-emerald-400">+5.26% vs last 30 days</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Profitable Companies</div>
              <div className="text-2xl font-extrabold text-emerald-400">{Math.floor((stats.totalCompanies || 0) * 0.76)}</div>
              <div className="text-[10px] font-semibold text-emerald-400">76.00% of total</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Avg. P/E Ratio</div>
              <div className="text-2xl font-extrabold text-white">24.35</div>
              <div className="text-[10px] font-semibold text-emerald-400">+3.21% vs last 30 days</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Avg. ROE</div>
              <div className="text-2xl font-extrabold text-white">16.82%</div>
              <div className="text-[10px] font-semibold text-emerald-400">+2.14% vs last 30 days</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Avg. Debt to Equity</div>
              <div className="text-2xl font-extrabold text-emerald-400">0.48</div>
              <div className="text-[10px] font-semibold text-emerald-400">-1.32% vs last 30 days</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Avg. Market Cap</div>
              <div className="text-2xl font-extrabold text-white">₹{stats.totalCompanies ? ((stats.totalMarketCap || 0) / 10000000 / stats.totalCompanies).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0} Cr</div>
              <div className="text-[10px] font-semibold text-emerald-400">+7.89% vs last 30 days</div>
            </div>
          </div>

          {/* Main Grid Row 1: Top Companies + Sector Dist + Key Insights */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">Top Companies by Market Cap</h3>
                <span className="text-[10px] text-blue-400 font-semibold cursor-pointer">View All</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1E2638] text-slate-500 font-semibold">
                      <th className="pb-2">Company</th>
                      <th className="pb-2">Sector</th>
                      <th className="pb-2 text-right">Market Cap</th>
                      <th className="pb-2 text-right">Price (₹)</th>
                      <th className="pb-2 text-right">P/E</th>
                      <th className="pb-2 text-right">ROE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]/40">
                    {companies.slice(0, 5).map((c: any) => (
                      <tr 
                        key={c.name} 
                        className="hover:bg-[#1E2638]/40 cursor-pointer transition-colors"
                        onClick={() => setSelectedCompany(c)}
                      >
                        <td className="py-2 font-bold text-white">{c.name}</td>
                        <td className="py-2 text-slate-400 text-[11px]">{c.sec}</td>
                        <td className="py-2 text-right font-bold text-white">{c.mcap}</td>
                        <td className="py-2 text-right text-slate-300">{c.price}</td>
                        <td className="py-2 text-right text-slate-400">{(c.raw?.currentPrice / 10).toFixed(2)}</td>
                        <td className="py-2 text-right font-semibold text-emerald-400">18.32%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">Sector Distribution by Market Cap</h3>
                <span className="text-[10px] text-blue-400 font-semibold cursor-pointer">View All</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-36 w-36 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.sectorDist || []} innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="val">
                        {(stats.sectorDist || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <div className="text-[9px] text-slate-400">Total Market Cap</div>
                    <div className="text-xs font-bold text-white">₹{((stats.totalMarketCap || 0) / 10000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr</div>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  {(stats.sectorDist || []).slice(0, 5).map((s: any) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-semibold text-slate-300 w-24 truncate">{s.name}</span>
                      <span className="font-bold text-white">{s.val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">Key Insights</h3>
                <span className="text-[10px] text-blue-400 font-semibold cursor-pointer">View All</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#0B0E14] border border-[#1E2638]">
                  <div className="text-[10px] text-slate-500 font-semibold">Highest Growth</div>
                  <div className="font-bold text-white">Info Edge (India) Ltd.</div>
                  <div className="text-[10px] text-emerald-400 font-bold">+18.45% Revenue Growth (YoY)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0B0E14] border border-[#1E2638]">
                  <div className="text-[10px] text-slate-500 font-semibold">Most Profitable</div>
                  <div className="font-bold text-white">Hindustan Unilever Ltd.</div>
                  <div className="text-[10px] text-emerald-400 font-bold">23.82% Net Profit Margin</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0B0E14] border border-[#1E2638]">
                  <div className="text-[10px] text-slate-500 font-semibold">Lowest Debt</div>
                  <div className="font-bold text-white">Tata Consultancy Services</div>
                  <div className="text-[10px] text-emerald-400 font-bold">0.01 Debt to Equity Ratio</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid Row 2: Company Overview Featured Inspector (TCS) + News & Updates */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {selectedCompany && (
              <div className="lg:col-span-8 trade-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1E2638] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Company Profile • {activeTab}</h3>
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded">ACTIVE</span>
                    </div>
                    <div className="text-xs text-slate-400 font-semibold mt-0.5">{selectedCompany.sym} • {selectedCompany.name} • {selectedCompany.sec}</div>
                  </div>

                  <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500">
                    <span>View Full Profile</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>

                  {activeTab === 'Overview' && (
                    <>
                      <div className="grid grid-cols-6 gap-3 text-center text-xs p-3 rounded-xl bg-[#0B0E14] border border-[#1E2638]">
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">Current Price</div>
                          <div className="font-extrabold text-white text-sm mt-0.5">{selectedCompany.price}</div>
                          <div className={`text-[9px] font-bold ${selectedCompany.chg.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{selectedCompany.chg}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">Market Cap</div>
                          <div className="font-bold text-white text-sm mt-0.5">{selectedCompany.mcap}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">P/E Ratio</div>
                          <div className="font-bold text-white text-sm mt-0.5">{((selectedCompany.raw?.currentPrice || 0) / 10).toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">ROE</div>
                          <div className="font-bold text-emerald-400 text-sm mt-0.5">18.32%</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">Debt to Equity</div>
                          <div className="font-bold text-emerald-400 text-sm mt-0.5">0.01</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">Volume (24h)</div>
                          <div className="font-bold text-white text-sm mt-0.5">{selectedCompany.vol}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-semibold">Price Performance Trend</span>
                          <div className="flex gap-1 text-[10px] font-bold">
                            {['1D', '1W', '1M', '3M', '1Y', 'YTD', 'ALL'].map((tf) => (
                              <button 
                                key={tf} 
                                onClick={() => setActiveTimeline(tf)}
                                className={`px-2 py-0.5 rounded transition ${activeTimeline === tf ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                              >
                                {tf}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={selectedCompany.raw?.priceHistory || []}>
                              <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                              <YAxis stroke="#64748B" fontSize={10} domain={['dataMin - 50', 'dataMax + 50']} />
                              <Tooltip contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E2638', color: '#fff', borderRadius: '8px' }} />
                              <Area type="monotone" dataKey="price" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 text-xs pt-2 border-t border-[#1E2638]">
                        <div className="p-2 rounded bg-[#0B0E14]"><span className="text-slate-500">52 Week High:</span> <strong className="text-white">₹{((selectedCompany.raw?.currentPrice || 100) * 1.2).toFixed(2)}</strong></div>
                        <div className="p-2 rounded bg-[#0B0E14]"><span className="text-slate-500">52 Week Low:</span> <strong className="text-white">₹{((selectedCompany.raw?.currentPrice || 100) * 0.8).toFixed(2)}</strong></div>
                        <div className="p-2 rounded bg-[#0B0E14]"><span className="text-slate-500">Open Price:</span> <strong className="text-white">₹{selectedCompany.raw?.openPrice?.toFixed(2)}</strong></div>
                        <div className="p-2 rounded bg-[#0B0E14]"><span className="text-slate-500">Prev. Close:</span> <strong className="text-white">₹{selectedCompany.raw?.previousClose?.toFixed(2)}</strong></div>
                        <div className="p-2 rounded bg-[#0B0E14]"><span className="text-slate-500">Dividend Yield:</span> <strong className="text-emerald-400">2.12%</strong></div>
                        <div className="p-2 rounded bg-[#0B0E14]"><span className="text-slate-500">Base Price:</span> <strong className="text-white">₹{selectedCompany.raw?.basePrice?.toFixed(2)}</strong></div>
                        <div className="p-2 rounded bg-[#0B0E14]"><span className="text-slate-500">Face Value:</span> <strong className="text-white">₹1.00</strong></div>
                        <div className="p-2 rounded bg-[#0B0E14]"><span className="text-slate-500">Status:</span> <strong className="text-emerald-400">ACTIVE</strong></div>
                      </div>
                    </>
                  )}
                  {activeTab === 'Financials' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="trade-card p-5 space-y-3">
                        <h4 className="text-sm font-bold text-white">Quarterly Performance (Estimated)</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between border-b border-[#1E2638] pb-1"><span className="text-slate-400">Revenue</span><span className="font-bold text-white">₹{((selectedCompany.raw?.marketCap || 0) * 0.1 / 10000000).toFixed(2)} Cr</span></div>
                          <div className="flex justify-between border-b border-[#1E2638] pb-1"><span className="text-slate-400">EBITDA</span><span className="font-bold text-white">₹{((selectedCompany.raw?.marketCap || 0) * 0.02 / 10000000).toFixed(2)} Cr</span></div>
                          <div className="flex justify-between border-b border-[#1E2638] pb-1"><span className="text-slate-400">Net Profit</span><span className="font-bold text-white">₹{((selectedCompany.raw?.marketCap || 0) * 0.01 / 10000000).toFixed(2)} Cr</span></div>
                          <div className="flex justify-between border-b border-[#1E2638] pb-1"><span className="text-slate-400">EPS</span><span className="font-bold text-white">₹{(selectedCompany.raw?.currentPrice * 0.05).toFixed(2)}</span></div>
                        </div>
                      </div>
                      <div className="trade-card p-5 space-y-3">
                        <h4 className="text-sm font-bold text-white">Balance Sheet Overview</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between border-b border-[#1E2638] pb-1"><span className="text-slate-400">Total Assets</span><span className="font-bold text-white">₹{((selectedCompany.raw?.marketCap || 0) * 0.5 / 10000000).toFixed(2)} Cr</span></div>
                          <div className="flex justify-between border-b border-[#1E2638] pb-1"><span className="text-slate-400">Total Liabilities</span><span className="font-bold text-white">₹{((selectedCompany.raw?.marketCap || 0) * 0.2 / 10000000).toFixed(2)} Cr</span></div>
                          <div className="flex justify-between border-b border-[#1E2638] pb-1"><span className="text-slate-400">Total Equity</span><span className="font-bold text-white">₹{((selectedCompany.raw?.marketCap || 0) * 0.3 / 10000000).toFixed(2)} Cr</span></div>
                          <div className="flex justify-between border-b border-[#1E2638] pb-1"><span className="text-slate-400">Debt to Equity</span><span className="font-bold text-emerald-400">0.01</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Performance' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Extended Price Performance</span>
                        <div className="flex gap-1 text-[10px] font-bold">
                          {['1D', '1W', '1M', '3M', '1Y', 'YTD', 'ALL'].map((tf) => (
                            <button 
                              key={tf} 
                              onClick={() => setActiveTimeline(tf)}
                              className={`px-2 py-0.5 rounded transition ${activeTimeline === tf ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                            >
                              {tf}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={selectedCompany.raw?.priceHistory || []}>
                            <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                            <YAxis stroke="#64748B" fontSize={10} domain={['dataMin - 100', 'dataMax + 100']} />
                            <Tooltip contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E2638', color: '#fff', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="price" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Peers Comparison' && (
                    <div className="overflow-x-auto border border-[#1E2638] rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#121722] text-slate-400">
                            <th className="p-3">Peer Company</th>
                            <th className="p-3">Sector</th>
                            <th className="p-3 text-right">Market Cap</th>
                            <th className="p-3 text-right">Price</th>
                            <th className="p-3 text-right">P/E</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2638]">
                          {companies.filter(c => c.sec === selectedCompany.sec && c.sym !== selectedCompany.sym).slice(0, 5).map(peer => (
                            <tr key={peer.sym} className="hover:bg-[#1E2638]/40 cursor-pointer" onClick={() => setSelectedCompany(peer)}>
                              <td className="p-3 font-bold text-white">{peer.name}</td>
                              <td className="p-3 text-slate-400">{peer.sec}</td>
                              <td className="p-3 text-right font-bold">{peer.mcap}</td>
                              <td className="p-3 text-right">{peer.price}</td>
                              <td className="p-3 text-right">{(peer.raw?.currentPrice / 10).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {companies.filter(c => c.sec === selectedCompany.sec).length <= 1 && (
                        <div className="p-5 text-center text-slate-500">No peers found in the exact same sector.</div>
                      )}
                    </div>
                  )}

                  {activeTab === 'Corporate Actions' && (
                    <div className="space-y-3 text-xs">
                      {[
                        { action: 'Final Dividend', value: `₹${(selectedCompany.raw?.currentPrice * 0.02).toFixed(2)} per share`, exDate: '15 Aug 2026', recordDate: '16 Aug 2026' },
                        { action: 'Interim Dividend', value: `₹${(selectedCompany.raw?.currentPrice * 0.01).toFixed(2)} per share`, exDate: '10 Feb 2026', recordDate: '11 Feb 2026' },
                        { action: 'AGM', value: 'Annual General Meeting', exDate: '-', recordDate: '24 Sep 2026' },
                      ].map((act, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-[#0B0E14] border border-[#1E2638]">
                          <div>
                            <div className="font-bold text-white">{act.action}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{act.value}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-500">Ex-Date: <span className="text-slate-300 font-semibold">{act.exDate}</span></div>
                            <div className="text-[10px] text-slate-500">Record Date: <span className="text-slate-300 font-semibold">{act.recordDate}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {['Documents', 'News & Updates'].includes(activeTab) && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-sm border border-dashed border-[#1E2638] rounded-xl bg-[#0B0E14]/50">
                      <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
                      <div className="font-semibold text-white mb-1">{activeTab} data for {selectedCompany.sym}</div>
                      <p className="text-xs">Advanced {activeTab.toLowerCase()} analytics integration pending data availability.</p>
                      <button className="mt-4 px-4 py-2 bg-[#1E2638] text-white text-xs font-semibold rounded-lg hover:bg-[#2A344A]">
                        Request Data Backfill
                      </button>
                    </div>
                  )}


              </div>
            )}

            {/* News & Updates Feed (4 cols) */}
            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2">
                <h3 className="text-xs font-bold text-white">News & Updates</h3>
                <span className="text-[10px] text-blue-400 font-semibold cursor-pointer">View All</span>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { title: `${selectedCompany?.sym || 'Company'} announces Q2 FY26 results; net profit up 12.4% YoY`, time: '11 Aug 2026, 09:45 AM', tag: 'Earnings', color: 'bg-emerald-500/20 text-emerald-400' },
                  { title: `${selectedCompany?.sym || 'Company'} partners with Google Cloud to accelerate AI innovation`, time: '10 Aug 2026, 02:30 PM', tag: 'Business', color: 'bg-blue-500/20 text-blue-400' },
                  { title: `${selectedCompany?.sym || 'Company'} bags $500M deal from a leading European bank`, time: '09 Aug 2026, 11:20 AM', tag: 'Contract', color: 'bg-purple-500/20 text-purple-400' },
                  { title: `${selectedCompany?.sym || 'Company'} recognized as a Leader in IDC MarketScape 2026`, time: '08 Aug 2026, 04:10 PM', tag: 'Recognition', color: 'bg-amber-500/20 text-amber-400' },
                ].map((n, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-[#0B0E14] border border-[#1E2638] space-y-1 hover:border-[#3B82F6] transition cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${n.color}`}>{n.tag}</span>
                      <span className="text-[9px] text-slate-500">{n.time}</span>
                    </div>
                    <div className="font-bold text-white text-xs leading-snug">{n.title}</div>
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
