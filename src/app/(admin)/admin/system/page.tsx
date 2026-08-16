'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/common/AdminSidebar';
import { Header } from '@/components/common/Header';
import { Server, RefreshCw, Download, ShieldCheck, Activity, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const PERF_TIMELINE = [
  { time: '00:00', cpu: 35, mem: 60, disk: 50, net: 65 },
  { time: '06:00', cpu: 40, mem: 65, disk: 52, net: 70 },
  { time: '12:00', cpu: 48, mem: 72, disk: 55, net: 78 },
  { time: '18:00', cpu: 42, mem: 68, disk: 56, net: 72 },
  { time: '00:00', cpu: 42, mem: 68, disk: 56, net: 72 },
];

const SERVICES_STATUS = [
  { name: 'Operational', value: 10, pct: '83.33%', color: '#10B981' },
  { name: 'Degraded', value: 1, pct: '8.33%', color: '#F59E0B' },
  { name: 'Down', value: 1, pct: '8.33%', color: '#EF4444' },
];

export default function AdminSystemMonitorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [health, setHealth] = useState<any>({});

  const fetchSystemData = () => {
    fetch('/api/admin/system-health')
      .then(res => res.json())
      .then(data => {
        if (data.health) setHealth(data.health);
      });
  };

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 5000);
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
              <h1 className="text-2xl font-bold text-white">System Monitor</h1>
              <p className="text-xs text-slate-400">Real-time system health, performance and infrastructure monitoring</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </button>
              <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30">
                <Download className="h-3.5 w-3.5" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* 6 Top Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">System Uptime</div>
              <div className="text-2xl font-extrabold text-emerald-400">{health.apiHealth || '99.98%'}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Server Status</div>
              <div className="text-2xl font-extrabold text-emerald-400">{health.status || 'Healthy'}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Avg. Response Time</div>
              <div className="text-2xl font-extrabold text-purple-400">{health.averageLatency || '45ms'}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Queue Length</div>
              <div className="text-2xl font-extrabold text-white">{health.queueLength || 0}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Error Rate</div>
              <div className="text-2xl font-extrabold text-emerald-400">{health.errorRate || '0.00%'}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Throughput (req/s)</div>
              <div className="text-2xl font-extrabold text-white">{health.ordersPerSec || 0}</div>
            </div>
          </div>

          {/* Main Grid Row 1: Server Performance + System Health + Services Status */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 trade-card p-5 space-y-4">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Server Performance</h3>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-[#0B0E14] border border-[#1E2638]">
                  <div className="text-[10px] text-slate-500 font-semibold">CPU Usage</div>
                  <div className="text-xl font-extrabold text-blue-400 mt-1">42%</div>
                  <div className="text-[9px] text-emerald-400">↑ 6%</div>
                </div>
                <div className="p-2 rounded bg-[#0B0E14] border border-[#1E2638]">
                  <div className="text-[10px] text-slate-500 font-semibold">Memory Usage</div>
                  <div className="text-xl font-extrabold text-emerald-400 mt-1">68%</div>
                  <div className="text-[9px] text-emerald-400">↑ 4%</div>
                </div>
                <div className="p-2 rounded bg-[#0B0E14] border border-[#1E2638]">
                  <div className="text-[10px] text-slate-500 font-semibold">Disk Usage</div>
                  <div className="text-xl font-extrabold text-purple-400 mt-1">56%</div>
                  <div className="text-[9px] text-emerald-400">↑ 3%</div>
                </div>
                <div className="p-2 rounded bg-[#0B0E14] border border-[#1E2638]">
                  <div className="text-[10px] text-slate-500 font-semibold">Network I/O</div>
                  <div className="text-xl font-extrabold text-amber-400 mt-1">72%</div>
                  <div className="text-[9px] text-emerald-400">↑ 8%</div>
                </div>
              </div>

              <div className="h-40 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={PERF_TIMELINE}>
                    <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E2638', color: '#fff', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="cpu" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="mem" stroke="#10B981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="disk" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="net" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">System Health</h3>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'Web Server', st: 'Healthy', up: '99.99%', lat: '120 ms' },
                  { name: 'API Server', st: 'Healthy', up: '99.98%', lat: '135 ms' },
                  { name: 'Database', st: 'Healthy', up: '99.97%', lat: '98 ms' },
                  { name: 'Cache Server', st: 'Healthy', up: '99.99%', lat: '45 ms' },
                  { name: 'Message Queue', st: 'Healthy', up: '100%', lat: '67 ms' },
                  { name: 'File Storage', st: 'Healthy', up: '99.96%', lat: '112 ms' },
                ].map((c) => (
                  <div key={c.name} className="flex justify-between items-center p-1.5 rounded bg-[#0B0E14]">
                    <span className="font-bold text-white">{c.name}</span>
                    <span className="text-emerald-400 font-semibold text-[10px]">● {c.st} ({c.up})</span>
                    <span className="text-slate-400 text-[10px]">{c.lat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 trade-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Services Status</h3>
              <div className="flex flex-col items-center">
                <div className="h-28 w-28 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={SERVICES_STATUS} innerRadius={28} outerRadius={46} dataKey="value">
                        {SERVICES_STATUS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <div className="text-[9px] text-slate-400">Total Services</div>
                    <div className="text-xs font-bold text-white">12</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-2 border-t border-[#1E2638]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-red-400 font-bold">● Payment Gateway</span>
                  <span className="text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">DOWN</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-400 font-bold">● Market Data Feed</span>
                  <span className="text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">DEGRADED</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
