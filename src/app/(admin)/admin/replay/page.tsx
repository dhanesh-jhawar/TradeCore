'use client';

import React, { useState } from 'react';
import { AdminSidebar } from '@/components/common/AdminSidebar';
import { Header } from '@/components/common/Header';
import { Play, Pause, RotateCcw, Upload, Plus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

// Mock data removed in favor of API

export default function AdminReplayEnginePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [session, setSession] = useState<any>(null);
  const [currentTickIndex, setCurrentTickIndex] = useState(0);

  React.useEffect(() => {
    fetch('/api/admin/companies')
      .then(r => r.json())
      .then(data => {
        if (data.companies) {
          setCompanies(data.companies);
          if (data.companies.length > 0) setSelectedSymbol(data.companies[0].sym);
        }
      });
  }, []);

  React.useEffect(() => {
    if (!selectedSymbol) return;
    setSession(null);
    setCurrentTickIndex(0);
    setIsPlaying(false);
    fetch(`/api/admin/replay?symbol=${selectedSymbol}`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) setSession(data);
      });
  }, [selectedSymbol]);

  React.useEffect(() => {
    if (!isPlaying || !session?.ticks || currentTickIndex >= session.ticks.length - 1) {
      if (currentTickIndex >= (session?.ticks?.length || 1) - 1) setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentTickIndex(prev => prev + 1);
    }, 1000 / speed);
    return () => clearTimeout(timer);
  }, [isPlaying, speed, session, currentTickIndex]);

  const currentTick = session?.ticks?.[currentTickIndex];
  const chartData = session?.ticks?.slice(0, currentTickIndex + 1).map((t: any) => ({ time: t.timestamp, price: t.price })) || [];

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <AdminSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Replay Engine</h1>
              <p className="text-xs text-slate-400">Simulate market scenarios and replay historical data for analysis and testing</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition">
                <Upload className="h-3.5 w-3.5" />
                <span>Import Data</span>
              </button>
              <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30">
                <Plus className="h-3.5 w-3.5" />
                <span>New Replay</span>
              </button>
            </div>
          </div>

          {/* Replay Setup Control Bar */}
          <div className="trade-card p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold block">Select Company</label>
                <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)} className="mt-1 rounded-lg border border-[#1E2638] bg-[#0B0E14] px-3 py-1.5 font-bold text-white focus:outline-none">
                  {companies.map(c => <option key={c.sym} value={c.sym}>{c.sym} - {c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-semibold block">Start Time</label>
                <input type="text" value={session?.ticks?.[0]?.timestamp || '--:--'} readOnly className="mt-1 rounded-lg border border-[#1E2638] bg-[#0B0E14] px-3 py-1.5 font-bold text-white focus:outline-none w-24 text-center" />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-semibold block">End Time</label>
                <input type="text" value={session?.ticks?.[session.ticks.length - 1]?.timestamp || '--:--'} readOnly className="mt-1 rounded-lg border border-[#1E2638] bg-[#0B0E14] px-3 py-1.5 font-bold text-white focus:outline-none w-24 text-center" />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-semibold block">Playback Speed ({speed}x)</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="mt-2 w-28 accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-semibold block">Initial Capital (₹)</label>
                <input type="text" defaultValue="10,00,000" className="mt-1 rounded-lg border border-[#1E2638] bg-[#0B0E14] px-3 py-1.5 font-bold text-white focus:outline-none w-28 text-center" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{isPlaying ? 'Pause Replay' : 'Start Replay'}</span>
              </button>
              <button onClick={() => { setIsPlaying(false); setCurrentTickIndex(0); }} className="flex items-center gap-1.5 rounded-xl border border-[#1E2638] bg-[#121722] px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:text-white">
                <RotateCcw className="h-4 w-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Main Grid Row 1: Candlestick Replay + Replay Order Book */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 trade-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-3">
                <div>
                  <h3 className="text-xs font-bold text-white">Market Replay • {session?.companyName || 'Loading...'}</h3>
                  <div className="text-sm font-extrabold text-emerald-400 mt-0.5">₹{currentTick?.price?.toFixed(2) || '0.00'} <span className="text-xs text-slate-400">Vol: {currentTick?.volume || 0}</span></div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                  Replay Time: {currentTick?.timestamp || '--:--'}
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E2638', color: '#fff', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="price" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1E2638] text-xs">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 rounded bg-blue-600 text-white">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <span className="text-slate-400 font-mono">{currentTick?.timestamp || '--:--'} / {session?.ticks?.[session.ticks.length - 1]?.timestamp || '--:--'}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max={Math.max(0, (session?.ticks?.length || 1) - 1)} 
                  value={currentTickIndex} 
                  onChange={(e) => { setCurrentTickIndex(Number(e.target.value)); setIsPlaying(false); }}
                  className="w-2/3 accent-blue-600 cursor-pointer" 
                />
              </div>
            </div>

            {/* Replay Order Book (4 cols) */}
            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2638] pb-2 text-xs">
                <h3 className="font-bold text-white">Order Book (Replay)</h3>
                <div className="flex gap-1 text-[10px] font-bold">
                  <button className="px-2 py-0.5 rounded bg-blue-600 text-white">NSE</button>
                  <button className="px-2 py-0.5 rounded text-slate-500">BSE</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 mb-1">Bids</div>
                  <div className="space-y-1 font-mono text-[11px]">
                    {(currentTick?.orderBook?.bids || []).map((b: any, i: number) => (
                      <div key={i} className="flex justify-between text-emerald-400"><span>{b.price}</span><span>{b.quantity}</span></div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-red-400 mb-1">Asks</div>
                  <div className="space-y-1 font-mono text-[11px]">
                    {(currentTick?.orderBook?.asks || []).map((a: any, i: number) => (
                      <div key={i} className="flex justify-between text-red-400"><span>{a.price}</span><span>{a.quantity}</span></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xs pt-2 border-t border-[#1E2638] text-slate-400">
                <span>Total Bid: <strong className="text-white">{currentTick?.orderBook?.bidTotal || 0}</strong></span>
                <span>Total Ask: <strong className="text-white">{currentTick?.orderBook?.askTotal || 0}</strong></span>
              </div>
            </div>
          </div>

          {/* Main Grid Row 2: Replay Trades + Simulated Portfolio + Summary */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Replay Trades (Live Feed)</h3>
              <div className="space-y-1.5 text-xs">
                {(currentTick?.recentTrades || []).map((t: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-1.5 rounded bg-[#0B0E14] text-[11px]">
                    <span className="text-slate-500 font-mono text-[10px]">{t.time}</span>
                    <span className="font-bold text-white">{selectedSymbol}</span>
                    <span className="font-bold text-white">₹{t.price}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${t.side === 'B' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{t.side === 'B' ? 'BUY' : 'SELL'}</span>
                  </div>
                ))}
                {(!currentTick?.recentTrades || currentTick.recentTrades.length === 0) && (
                  <div className="text-slate-500 text-center py-4">No recent trades in this window</div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Event Log</h3>
              <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto">
                <div className="p-2 rounded bg-[#0B0E14] border border-[#1E2638]">
                  <span className="text-blue-400 font-bold">[{currentTick?.eventType || 'INFO'}]</span> <span className="text-slate-300">{currentTick?.description || 'Waiting for events...'}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 trade-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Replay Summary</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Company</span><span className="font-bold text-white">{session?.companyName || '--'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Ticks Processed</span><span className="font-bold text-white">{currentTickIndex + 1} / {session?.totalTicks || 0}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Volume</span><span className="font-bold text-white">{currentTick?.volume || 0}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">Status</span><span className={`font-bold px-2 py-0.5 rounded text-[10px] ${isPlaying ? 'text-emerald-400 bg-emerald-500/20' : 'text-amber-400 bg-amber-500/20'}`}>{isPlaying ? '🟢 Running' : '⏸ Paused'}</span></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
