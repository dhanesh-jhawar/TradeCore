'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ArrowRight,
  ChevronRight,
  BarChart2,
  Activity,
  Clock,
  ShieldCheck,
  Headphones,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const TCS_CHART_DATA = [
  { time: '09:15', price: 3448 },
  { time: '09:45', price: 3462 },
  { time: '10:30', price: 3485 },
  { time: '11:15', price: 3470 },
  { time: '11:45', price: 3510 },
  { time: '12:30', price: 3495 },
  { time: '13:00', price: 3520 },
  { time: '13:45', price: 3505 },
  { time: '14:15', price: 3535 },
  { time: '15:00', price: 3518 },
  { time: '15:30', price: 3524.20 },
];

export default function LandingPage() {
  const [timeframe, setTimeframe] = useState('1D');

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      {/* Top Navbar */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">TradeCore</span>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
          <Link href="/" className="text-white hover:text-blue-400">Home</Link>
          <Link href="/markets" className="hover:text-white">Markets</Link>
          <Link href="/features" className="hover:text-white">Features</Link>
          <Link href="/company" className="hover:text-white">Company</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white">
            Login
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
          >
            <span>Sign Up</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column Text */}
          <div className="space-y-6 lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-medium text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Live Exchange • Real-time Market Data</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:leading-tight">
              Trade Smarter.{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Analyze Deeper.
              </span>{' '}
              Learn Better.
            </h1>

            <p className="max-w-xl text-base text-slate-400 sm:text-lg leading-relaxed">
              TradeCore is a real-time stock exchange simulation and market intelligence platform with advanced analytics, live order book, and AI-powered insights for 100+ companies.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-blue-600/30 transition hover:bg-blue-500"
              >
                <span>Start Trading Now</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/markets"
                className="flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold text-slate-300 hover:text-white transition"
              >
                <span>Explore Markets</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right Column Market Overview Card */}
          <div className="space-y-4 lg:col-span-6">
            {/* Top Index Tickers Bar */}
            <div className="rounded-xl border border-[#1E2638] bg-[#121722] p-4">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-semibold text-slate-400">Market Overview</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Market Open
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-[#0B0E14] p-2.5 border border-[#1E2638]">
                  <div className="text-[10px] text-slate-400">NIFTY 50</div>
                  <div className="text-xs font-bold text-white">24,834.85</div>
                  <div className="text-[10px] font-semibold text-emerald-400">+1.23%</div>
                </div>
                <div className="rounded-lg bg-[#0B0E14] p-2.5 border border-[#1E2638]">
                  <div className="text-[10px] text-slate-400">SENSEX</div>
                  <div className="text-xs font-bold text-white">81,330.56</div>
                  <div className="text-[10px] font-semibold text-emerald-400">+1.08%</div>
                </div>
                <div className="rounded-lg bg-[#0B0E14] p-2.5 border border-[#1E2638]">
                  <div className="text-[10px] text-slate-400">BANK NIFTY</div>
                  <div className="text-xs font-bold text-white">52,398.90</div>
                  <div className="text-[10px] font-semibold text-emerald-400">+1.76%</div>
                </div>
                <div className="rounded-lg bg-[#0B0E14] p-2.5 border border-[#1E2638]">
                  <div className="text-[10px] text-slate-400">FINNIFTY</div>
                  <div className="text-xs font-bold text-white">23,540.70</div>
                  <div className="text-[10px] font-semibold text-emerald-400">+1.39%</div>
                </div>
              </div>
            </div>

            {/* TCS Featured Interactive Live Chart Card */}
            <div className="rounded-xl border border-[#1E2638] bg-[#121722] p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400">TCS</div>
                  <div className="text-sm font-semibold text-slate-200">Tata Consultancy Services</div>
                </div>
                <Link
                  href="/market/TCS"
                  className="rounded-lg border border-[#1E2638] bg-[#0B0E14] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-blue-500 hover:text-white"
                >
                  View Full Chart
                </Link>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">₹3,524.20</span>
                <span className="text-xs font-bold text-emerald-400">+2.21%</span>
              </div>

              {/* Timeframe selector tabs */}
              <div className="mt-4 flex gap-2 border-b border-[#1E2638] pb-3 text-xs font-semibold">
                {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`rounded px-2.5 py-1 ${
                      timeframe === tf ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Area Line Chart */}
              <div className="mt-4 h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={TCS_CHART_DATA}>
                    <defs>
                      <linearGradient id="tcsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="#64748B" fontSize={10} hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E2638', color: '#fff', borderRadius: '8px' }}
                      formatter={(val: any) => [`₹${val}`, 'Price']}
                    />
                    <Area type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#tcsGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Stat Cards Bar */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[#1E2638] bg-[#121722] p-6 sm:grid-cols-3 lg:grid-cols-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white">100+</div>
              <div className="text-xs font-semibold text-slate-300">Companies</div>
              <div className="text-[10px] text-slate-500">Diverse portfolio</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white">2.5M+</div>
              <div className="text-xs font-semibold text-slate-300">Total Trades</div>
              <div className="text-[10px] text-slate-500">Live exchange data</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white">Real-time</div>
              <div className="text-xs font-semibold text-slate-300">Analytics</div>
              <div className="text-[10px] text-slate-500">Live market insights</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white">99.9%</div>
              <div className="text-xs font-semibold text-slate-300">Uptime</div>
              <div className="text-[10px] text-slate-500">Reliable platform</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white">24/7</div>
              <div className="text-xs font-semibold text-slate-300">Support</div>
              <div className="text-[10px] text-slate-500">Expert assistance</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
