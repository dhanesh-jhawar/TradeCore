'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/common/AdminSidebar';
import { Header } from '@/components/common/Header';
import { FileText, Download, Filter, RefreshCw, Eye } from 'lucide-react';

export default function AdminEventLogsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  const fetchLogs = () => {
    fetch('/api/admin/logs')
      .then(res => res.json())
      .then(data => {
        if (data.logs) setLogs(data.logs);
      });
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      if (autoRefresh) fetchLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <AdminSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Event Logs</h1>
              <p className="text-xs text-slate-400">Track all system activities, user actions, and important events in real-time</p>
            </div>

            <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30">
              <Download className="h-3.5 w-3.5" />
              <span>Export Logs</span>
            </button>
          </div>

          {/* 6 Top Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Total Events</div>
              <div className="text-2xl font-extrabold text-white">125,642</div>
              <div className="text-[10px] font-semibold text-emerald-400">+12.35% vs last 7 days</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Critical Events</div>
              <div className="text-2xl font-extrabold text-red-400">328</div>
              <div className="text-[10px] font-semibold text-red-400">+8.21% vs last 7 days</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Warning Events</div>
              <div className="text-2xl font-extrabold text-amber-400">1,245</div>
              <div className="text-[10px] font-semibold text-emerald-400">+5.48% vs last 7 days</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Info Events</div>
              <div className="text-2xl font-extrabold text-blue-400">124,069</div>
              <div className="text-[10px] font-semibold text-emerald-400">+12.67% vs last 7 days</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Error Events</div>
              <div className="text-2xl font-extrabold text-purple-400">87</div>
              <div className="text-[10px] font-semibold text-emerald-400">+3.11% vs last 7 days</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Success Events</div>
              <div className="text-2xl font-extrabold text-emerald-400">97.54%</div>
              <div className="text-[10px] font-semibold text-emerald-400">+1.25% vs last 7 days</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="trade-card p-4 flex flex-wrap gap-2 text-xs">
            <input
              type="text"
              placeholder="Search by keyword, module, user..."
              className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none flex-1 min-w-[200px]"
            />
            <select className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-2.5 py-1.5 text-slate-300">
              <option>All Levels</option>
              <option>INFO</option>
              <option>SUCCESS</option>
              <option>WARNING</option>
              <option>ERROR</option>
            </select>
            <select className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-2.5 py-1.5 text-slate-300">
              <option>All Modules</option>
            </select>
            <select className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-2.5 py-1.5 text-slate-300">
              <option>All Users</option>
            </select>
            <button className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3 py-1.5 text-slate-300 hover:text-white">
              <Filter className="h-3.5 w-3.5" />
              <span>More Filters</span>
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3 py-1.5 text-slate-300 hover:text-white">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Event Logs Table */}
          <div className="trade-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2638] pb-3">
              <h3 className="text-xs font-bold text-white">Event Logs</h3>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
                  <span>Auto Refresh</span>
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="h-4 w-4 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E2638] text-slate-500 font-semibold">
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Level</th>
                    <th className="pb-2">Event</th>
                    <th className="pb-2">Module</th>
                    <th className="pb-2">User</th>
                    <th className="pb-2">IP Address</th>
                    <th className="pb-2">Details</th>
                    <th className="pb-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2638]/40">
                  {logs.map((l, i) => (
                    <tr key={i} className="hover:bg-[#1E2638]/40">
                      <td className="py-2 text-slate-500 font-mono text-[10px]">{new Date(l.timestamp).toLocaleString()}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          l.level === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                          l.level === 'INFO' ? 'bg-blue-500/20 text-blue-400' :
                          l.level === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {l.level}
                        </span>
                      </td>
                      <td className="py-2 font-bold text-white">{l.action}</td>
                      <td className="py-2 text-slate-400">{l.entityType}</td>
                      <td className="py-2 text-blue-400 font-mono">{l.userId || 'system'}</td>
                      <td className="py-2 text-slate-500 font-mono text-[11px]">{l.ipAddress || '127.0.0.1'}</td>
                      <td className="py-2 text-slate-300">{l.details}</td>
                      <td className="py-2 text-center">
                        <button className="rounded bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-blue-500">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
