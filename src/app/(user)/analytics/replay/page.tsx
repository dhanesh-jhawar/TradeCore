'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserSidebar } from '@/components/common/UserSidebar';
import { Header } from '@/components/common/Header';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Clock,
  Activity,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function ReplayEnginePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [symbol, setSymbol] = useState('TCS');
  const [session, setSession] = useState<any>(null);

  const [currentTickIndex, setCurrentTickIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 5x, 10x, 50x, 100x

  useEffect(() => {
    fetch(`/api/analytics/replay/${symbol}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          setSession(data.session);
          setCurrentTickIndex(0);
          setIsPlaying(false);
        }
      })
      .catch(() => {});
  }, [symbol]);

  // Automated playback timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && session && session.ticks.length > 0) {
      const intervalMs = Math.max(100, 1000 / playbackSpeed);
      timer = setInterval(() => {
        setCurrentTickIndex((prev) => {
          if (prev >= session.ticks.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, session, playbackSpeed]);

  const currentTick = session?.ticks[currentTickIndex] || null;
  const historyData = session ? session.ticks.slice(0, currentTickIndex + 1) : [];

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <UserSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Back & Title Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link href="/analytics" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:underline mb-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Analytics</span>
              </Link>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <RotateCcw className="h-6 w-6 text-purple-500" />
                <span>Market Replay Engine</span>
              </h1>
              <p className="text-sm text-slate-400">Reconstruct historical market order flow tick-by-tick.</p>
            </div>

            {/* Stock Selector */}
            <div className="flex items-center gap-2">
              {['TCS', 'RELIANCE', 'INFY', 'HDFCBANK'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSymbol(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    symbol === s ? 'bg-purple-600 text-white shadow-lg' : 'border border-[#1E2638] bg-[#121722] text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Replay Player Controls Bar */}
          <div className="trade-card p-4 flex flex-wrap items-center justify-between gap-4 border-purple-500/30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentTickIndex(0)}
                className="p-2 text-slate-400 hover:text-white rounded-lg border border-[#1E2638] bg-[#0B0E14]"
                title="Restart"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentTickIndex((prev) => Math.max(0, prev - 1))}
                className="p-2 text-slate-400 hover:text-white rounded-lg border border-[#1E2638] bg-[#0B0E14]"
                title="Step Back"
              >
                <Rewind className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-xs font-extrabold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={() => setCurrentTickIndex((prev) => Math.min(session?.ticks.length - 1 || 0, prev + 1))}
                className="p-2 text-slate-400 hover:text-white rounded-lg border border-[#1E2638] bg-[#0B0E14]"
                title="Step Forward"
              >
                <FastForward className="h-4 w-4" />
              </button>
            </div>

            {/* Playback Speed Selectors */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Speed:</span>
              {[1, 5, 10, 50, 100].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                    playbackSpeed === spd ? 'bg-purple-600 text-white' : 'border border-[#1E2638] bg-[#0B0E14] text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}×
                </button>
              ))}
            </div>

            {/* Timeline Progress Slider */}
            <div className="flex items-center gap-3 flex-1 max-w-xs">
              <span className="text-xs font-mono text-slate-400">{currentTick?.timestamp || '09:15:00'}</span>
              <input
                type="range"
                min={0}
                max={(session?.ticks.length || 1) - 1}
                value={currentTickIndex}
                onChange={(e) => setCurrentTickIndex(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="text-xs font-bold text-purple-400">{currentTickIndex + 1}/{session?.ticks.length || 12}</span>
            </div>
          </div>

          {/* Main Replay Reconstruction Dashboard */}
          {currentTick && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Reconstructed Price Chart (6 cols) */}
              <div className="lg:col-span-6 trade-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1E2638] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{symbol} Reconstructed Chart</h3>
                    <div className="text-xs text-slate-400">{currentTick.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-white">₹{currentTick.price.toFixed(2)}</div>
                    <div className="text-xs font-bold text-emerald-400">Step {currentTick.step}</div>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData}>
                      <defs>
                        <linearGradient id="replayGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} />
                      <YAxis domain={['auto', 'auto']} stroke="#64748B" fontSize={10} orientation="right" />
                      <Tooltip contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E2638', color: '#fff', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="price" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#replayGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Reconstructed Order Book (3 cols) */}
              <div className="lg:col-span-3 trade-card p-5 space-y-3">
                <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Reconstructed Order Book</h3>
                <div className="grid grid-cols-2 text-[10px] font-bold text-slate-500">
                  <span>Bid (Buy)</span>
                  <span className="text-right">Ask (Sell)</span>
                </div>
                <div className="space-y-1.5 text-xs font-semibold">
                  {currentTick.orderBook.bids.slice(0, 5).map((bid: any, i: number) => {
                    const ask = currentTick.orderBook.asks[i] || { price: currentTick.price + 1, quantity: 1000 };
                    return (
                      <div key={i} className="flex justify-between py-1 px-1.5 rounded bg-[#0B0E14]/40 border border-[#1E2638]/30">
                        <span className="text-emerald-400">₹{bid.price.toFixed(2)} ({bid.quantity})</span>
                        <span className="text-red-400">₹{ask.price.toFixed(2)} ({ask.quantity})</span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-2 text-[10px] text-slate-400 flex justify-between">
                  <span>Bid Ratio: {currentTick.orderBook.bidRatio}%</span>
                  <span>Ask Ratio: {currentTick.orderBook.askRatio}%</span>
                </div>
              </div>

              {/* Trade Feed & Event Timeline (3 cols) */}
              <div className="lg:col-span-3 trade-card p-5 space-y-4">
                <h3 className="text-xs font-bold text-white border-b border-[#1E2638] pb-2">Event Timeline Stream</h3>
                <div className="space-y-2 text-xs">
                  {session.ticks.slice(0, currentTickIndex + 1).reverse().map((t: any, idx: number) => (
                    <div key={idx} className={`p-2 rounded border text-[11px] ${idx === 0 ? 'border-purple-500/50 bg-purple-500/10 font-bold' : 'border-[#1E2638]/40 bg-[#0B0E14]/40 text-slate-400'}`}>
                      <div className="text-purple-400">{t.timestamp}</div>
                      <div>{t.eventType} @ ₹{t.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
