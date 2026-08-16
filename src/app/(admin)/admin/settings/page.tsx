'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/common/AdminSidebar';
import { useWebSocket } from '@/components/WebSocketProvider';
import { Header } from '@/components/common/Header';
import { Settings, Shield, Sliders, DollarSign, Save, Play, Square, Activity } from 'lucide-react';

export default function AdminSettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Simulator State
  const [simStatus, setSimStatus] = useState<any>(null);
  const [simIntensity, setSimIntensity] = useState(5);
  const [simMaxOrders, setSimMaxOrders] = useState(200);
  const [simVolatility, setSimVolatility] = useState(1.0);

  const { subscribe } = useWebSocket('ADMIN', (event) => {
    if (event.eventType === 'SIMULATOR_UPDATED') {
      setSimStatus(event.payload);
    }
  });

  useEffect(() => {
    fetchSimulatorStatus();
  }, []);

  const fetchSimulatorStatus = async () => {
    try {
      const res = await fetch('/api/admin/simulator');
      if (res.ok) {
        const data = await res.json();
        setSimStatus(data.status);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulatorAction = async (action: 'START' | 'STOP' | 'UPDATE_CONFIG') => {
    try {
      const payload: any = { action };
      if (action === 'UPDATE_CONFIG') {
        payload.config = {
          intensity: simIntensity,
          maxOrdersPerSec: simMaxOrders,
          volatilityMultiplier: simVolatility,
        };
      }

      const res = await fetch('/api/admin/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSimStatus(data.status);
        if (action === 'UPDATE_CONFIG') {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <AdminSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="h-6 w-6 text-purple-500" />
              <span>Admin Exchange Settings</span>
            </h1>
            <p className="text-sm text-slate-400">Configure matching engine, brokerage rules, and exchange parameters</p>
          </div>

          {saved && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 text-sm font-semibold">
              Settings updated successfully!
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SIMULATOR CONTROLS */}
            <div className="trade-card p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-[#1E2638] pb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-400" />
                  <span>Market Simulator</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${simStatus?.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                  <span className="text-xs font-bold text-slate-300">
                    {simStatus?.isRunning ? 'RUNNING' : 'STOPPED'}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleSimulatorAction('START')}
                  disabled={simStatus?.isRunning}
                  className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-4 py-3 text-xs font-bold hover:bg-emerald-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-4 w-4" /> Start Simulator
                </button>
                <button
                  onClick={() => handleSimulatorAction('STOP')}
                  disabled={!simStatus?.isRunning}
                  className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 px-4 py-3 text-xs font-bold hover:bg-rose-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Square className="h-4 w-4" /> Stop Simulator
                </button>
              </div>

              {simStatus && (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#0B0E14] rounded-xl p-3 border border-[#1E2638]">
                    <div className="text-slate-500 mb-1">Active Bots</div>
                    <div className="font-bold text-lg text-white">{simStatus.activeBots}</div>
                  </div>
                  <div className="bg-[#0B0E14] rounded-xl p-3 border border-[#1E2638]">
                    <div className="text-slate-500 mb-1">In-Flight Orders</div>
                    <div className="font-bold text-lg text-orange-400">{simStatus.inFlightOrders}</div>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-[#1E2638]">
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-2 block">
                    Traffic Intensity (1-10): {simIntensity}
                  </label>
                  <input 
                    type="range" min="1" max="10" 
                    value={simIntensity}
                    onChange={(e) => setSimIntensity(parseInt(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-2 block">
                    Max Orders / Sec
                  </label>
                  <input 
                    type="number" 
                    value={simMaxOrders}
                    onChange={(e) => setSimMaxOrders(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-[#1E2638] bg-[#0B0E14] px-3.5 py-2.5 text-white font-bold text-xs" 
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-2 block">
                    Volatility Multiplier
                  </label>
                  <input 
                    type="number" step="0.1"
                    value={simVolatility}
                    onChange={(e) => setSimVolatility(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-[#1E2638] bg-[#0B0E14] px-3.5 py-2.5 text-white font-bold text-xs" 
                  />
                </div>
                
                <button
                  onClick={() => handleSimulatorAction('UPDATE_CONFIG')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 transition"
                >
                  <Sliders className="h-4 w-4" />
                  <span>Update Simulator Config</span>
                </button>
              </div>
            </div>

            {/* DEFAULT SETTINGS */}
            <div className="trade-card p-6 space-y-6">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white border-b border-[#1E2638] pb-2 flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-blue-400" />
                    <span>Matching Engine Parameters</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 font-semibold">Matching Algorithm</label>
                      <select className="w-full mt-1 rounded-xl border border-[#1E2638] bg-[#0B0E14] px-3.5 py-2.5 text-white font-bold">
                        <option>Price-Time Priority (FIFO)</option>
                        <option>Pro-Rata Allocation</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white border-b border-[#1E2638] pb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    <span>Brokerage & Transaction Fees</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 font-semibold">Equity Brokerage Rate (%)</label>
                      <input type="text" defaultValue="0.05%" className="w-full mt-1 rounded-xl border border-[#1E2638] bg-[#0B0E14] px-3.5 py-2.5 text-white font-bold" />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold">STT Rate (%)</label>
                      <input type="text" defaultValue="0.10%" className="w-full mt-1 rounded-xl border border-[#1E2638] bg-[#0B0E14] px-3.5 py-2.5 text-white font-bold" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Static Config</span>
                </button>
              </form>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
