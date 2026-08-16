'use client';

import React, { useState } from 'react';
import { UserSidebar } from '@/components/common/UserSidebar';
import { Header } from '@/components/common/Header';
import { Bell, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function AlertsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState([
    { id: 1, symbol: 'TCS', target: 3550.0, condition: 'ABOVE', current: 3524.2, status: 'ACTIVE' },
    { id: 2, symbol: 'RELIANCE', target: 2900.0, condition: 'ABOVE', current: 2914.35, status: 'TRIGGERED' },
    { id: 3, symbol: 'INFY', target: 1550.0, condition: 'BELOW', current: 1590.4, status: 'ACTIVE' },
    { id: 4, symbol: 'HDFCBANK', target: 1700.0, condition: 'ABOVE', current: 1678.9, status: 'ACTIVE' },
  ]);

  const [symbol, setSymbol] = useState('TCS');
  const [target, setTarget] = useState(3600);
  const [condition, setCondition] = useState('ABOVE');

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert = {
      id: Date.now(),
      symbol,
      target: Number(target),
      condition,
      current: 3524.2,
      status: 'ACTIVE',
    };
    setAlerts([newAlert, ...alerts]);
  };

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <UserSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bell className="h-6 w-6 text-blue-500" />
              <span>Price Alerts Manager</span>
            </h1>
            <p className="text-sm text-slate-400">Set instant price triggers for your watched stocks</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Create Alert Form */}
            <div className="lg:col-span-5 trade-card p-5 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-[#1E2638] pb-2">Set New Price Alert</h3>
              <form onSubmit={handleAddAlert} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Stock Symbol</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-[#1E2638] bg-[#0B0E14] px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full rounded-xl border border-[#1E2638] bg-[#0B0E14] px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none"
                  >
                    <option value="ABOVE">Price Rises Above (&gt;=)</option>
                    <option value="BELOW">Price Drops Below (&lt;=)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400">Target Price (₹)</label>
                  <input
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-[#1E2638] bg-[#0B0E14] px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Price Alert</span>
                </button>
              </form>
            </div>

            {/* Active Alerts List */}
            <div className="lg:col-span-7 trade-card p-5 space-y-3">
              <h3 className="text-sm font-bold text-white border-b border-[#1E2638] pb-2">Your Active & Triggered Alerts</h3>
              <div className="space-y-2.5">
                {alerts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0E14] border border-[#1E2638]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 font-bold text-blue-400 text-xs">
                        {a.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{a.symbol}</div>
                        <div className="text-xs text-slate-400">
                          Notify when price is <strong>{a.condition}</strong> ₹{a.target.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                        a.status === 'TRIGGERED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {a.status}
                      </span>
                      <button
                        onClick={() => setAlerts(alerts.filter((item) => item.id !== a.id))}
                        className="text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
