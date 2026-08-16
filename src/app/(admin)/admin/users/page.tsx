'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/common/AdminSidebar';
import { Header } from '@/components/common/Header';
import { Users, Download, Upload, Filter, Eye, Edit3, MoreHorizontal } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis } from 'recharts';

// Removed mock data for API properties

export default function AdminUsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const fetchUsers = () => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (data.users) setUsers(data.users);
        if (data.stats) setStats(data.stats);
      });
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "User ID,Name,Email,Role,Wallet Balance,Portfolio Value,Last Active\n"
      + users.map(u => `${u.uid},${u.name},${u.email},${u.role},${u.wallet},${u.port},${u.last}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Basic mock import
    if (e.target.files && e.target.files.length > 0) {
      alert(`Imported ${e.target.files[0].name} successfully! (Mock)`);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.uid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All Status' || u.st === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <AdminSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Users</h1>
              <p className="text-xs text-slate-400">Manage and monitor all users on the platform</p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={exportData} className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition">
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
              <button onClick={() => document.getElementById('import-input')?.click()} className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition">
                <Upload className="h-3.5 w-3.5" />
                <span>Import Users</span>
                <input id="import-input" type="file" accept=".csv" className="hidden" onChange={handleImport} />
              </button>
              <button onClick={() => { setSearchTerm(''); setRoleFilter('All Roles'); setStatusFilter('All Status'); }} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30">
                <Filter className="h-3.5 w-3.5" />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>

          {/* 6 Top Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Total Users</div>
              <div className="text-2xl font-extrabold text-white">{stats.totalUsers || 0}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Active Users</div>
              <div className="text-2xl font-extrabold text-emerald-400">{stats.activeUsers || 0}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">New Users (7D)</div>
              <div className="text-2xl font-extrabold text-purple-400">0</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">KYC Pending</div>
              <div className="text-2xl font-extrabold text-amber-400">0</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Total Wallet Balance</div>
              <div className="text-2xl font-extrabold text-white">₹{stats.totalWallet?.toLocaleString() || 0}</div>
            </div>

            <div className="trade-card p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Total Portfolio Value</div>
              <div className="text-2xl font-extrabold text-white">₹{stats.totalPortfolio?.toLocaleString() || 0}</div>
            </div>
          </div>

          {/* Main Grid: Users Table (8 cols) & Growth Charts (4 cols) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 trade-card p-5 space-y-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Search by name, email or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none flex-1"
                />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-2.5 py-1.5 text-slate-300">
                  <option>All Roles</option>
                  <option>USER</option>
                  <option>ADMIN</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-2.5 py-1.5 text-slate-300">
                  <option>All Status</option>
                  <option>ACTIVE</option>
                  <option>SUSPENDED</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1E2638] text-slate-500 font-semibold">
                      <th className="pb-2">User ID</th>
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Role</th>
                      <th className="pb-2">KYC Status</th>
                      <th className="pb-2 text-right">Wallet Balance</th>
                      <th className="pb-2 text-right">Portfolio Value</th>
                      <th className="pb-2">Last Active</th>
                      <th className="pb-2 text-center">Status</th>
                      <th className="pb-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]/40">
                    {filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-[#1E2638]/40">
                        <td className="py-2 text-blue-400 font-mono text-[11px] font-bold">{u.uid}</td>
                        <td className="py-2 font-bold text-white">{u.name}</td>
                        <td className="py-2 text-slate-400 text-[11px]">{u.email}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${u.kyc === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {u.kyc}
                          </span>
                        </td>
                        <td className="py-2 text-right font-semibold text-white">₹{parseFloat(u.wallet).toLocaleString()}</td>
                        <td className="py-2 text-right font-semibold text-emerald-400">₹{parseFloat(u.port).toLocaleString()}</td>
                        <td className="py-2 text-slate-500 text-[10px]">{u.last}</td>
                        <td className="py-2 text-center">
                          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold">{u.st}</span>
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

            {/* Right Sidebar Charts */}
            <div className="lg:col-span-4 space-y-6">
              <div className="trade-card p-5 space-y-3">
                <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Users Growth (Last 30 Days)</h3>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.usersGrowth || []}>
                      <XAxis dataKey="date" stroke="#64748B" fontSize={10} />
                      <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="trade-card p-5 space-y-3">
                <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Users by Status</h3>
                <div className="flex items-center justify-between">
                  <div className="h-28 w-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.usersByStatus || []} innerRadius={28} outerRadius={46} dataKey="value">
                          {(stats.usersByStatus || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    {(stats.usersByStatus || []).map((s: any) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="font-semibold text-slate-300 w-20">{s.name}</span>
                        <span className="font-bold text-white">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Top Users by Portfolio Value</h3>
              <div className="space-y-2 text-xs">
                {users.slice().sort((a, b) => parseFloat(b.port) - parseFloat(a.port)).slice(0, 4).map((u, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded bg-[#0B0E14]">
                    <span className="font-bold text-white">{u.name}</span>
                    <span className="font-extrabold text-emerald-400">₹{parseFloat(u.port).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">KYC Verification Status</h3>
              <div className="flex items-center justify-between">
                <div className="h-28 w-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.kycVerification || []} innerRadius={26} outerRadius={44} dataKey="value">
                        {(stats.kycVerification || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 text-xs">
                  {(stats.kycVerification || []).map((k: any) => (
                    <div key={k.name} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: k.color }} />
                      <span className="font-semibold text-slate-300 w-16">{k.name}</span>
                      <span className="font-bold text-white">{k.value} ({k.pct})</span>
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
