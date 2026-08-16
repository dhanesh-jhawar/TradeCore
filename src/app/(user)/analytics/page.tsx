'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserSidebar } from '@/components/common/UserSidebar';
import { Header } from '@/components/common/Header';
import {
  BarChart3,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info,
  RotateCcw,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [symbol, setSymbol] = useState('TCS');
  const [report, setReport] = useState<any>(null);
  const [rollingStats, setRollingStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = (sym: string) => {
    setLoading(true);
    Promise.all([
      fetch(`/api/analytics/why/${sym}`).then((res) => res.json()),
      fetch(`/api/analytics/company/${sym}`).then((res) => res.json())
    ])
      .then(([whyData, statsData]) => {
        if (whyData.report) setReport(whyData.report);
        if (statsData.stats) setRollingStats(statsData.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport(symbol);
  }, [symbol]);

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <UserSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Title */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-500" />
                <span>Market Intelligence & Analytics</span>
              </h1>
              <p className="text-sm text-slate-400">
                Understand <strong>what happened in the market and why</strong> based on observed exchange order flow.
              </p>
            </div>

            <Link
              href="/analytics/replay"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:opacity-95 transition"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Open Market Replay Engine</span>
            </Link>
          </div>

          {/* Stock Search Bar */}
          <div className="trade-card p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Enter stock symbol (e.g. TCS, RELIANCE, INFY)..."
                className="w-full bg-transparent text-sm text-white font-bold placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              {['TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'TATAMOTORS'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSymbol(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    symbol === s ? 'bg-blue-600 text-white' : 'border border-[#1E2638] bg-[#0B0E14] text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 font-semibold animate-pulse">
              Analyzing TradeCore observed order flow for {symbol}...
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Signature Feature Card: "Why Did the Stock Move?" */}
              <div className="trade-card p-6 border-blue-500/40 bg-gradient-to-br from-[#121722] to-[#161F33] space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2638] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-400" />
                      <h2 className="text-xl font-extrabold text-white">Why Did {report.symbol} Move?</h2>
                      <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-400">
                        Observed Market Explanation
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{report.companyName}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-white">₹{report.price.toFixed(2)}</div>
                    <div className={`text-xs font-bold ${report.direction === 'RISING' ? 'text-emerald-400' : report.direction === 'FALLING' ? 'text-red-400' : 'text-slate-400'}`}>
                      {report.change >= 0 ? `+${report.change}` : report.change} ({report.changePercent}%)
                    </div>
                  </div>
                </div>

                {/* Natural Language Factual Explanation Box */}
                <div className="rounded-xl border border-blue-500/30 bg-[#0B0E14]/80 p-5 space-y-2">
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">Factual Summary</div>
                  <p className="text-sm font-medium text-slate-200 leading-relaxed">
                    {report.summary}
                  </p>
                </div>

                {/* Observed Quantitative Factors */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Observed Market Drivers
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {report.observedFactors.map((factor: any, idx: number) => (
                      <div key={idx} className="rounded-xl border border-[#1E2638] bg-[#0B0E14] p-4 space-y-1">
                        <div className="text-xs text-slate-400 font-semibold">{factor.label}</div>
                        <div className={`text-lg font-extrabold ${factor.direction === 'positive' ? 'text-emerald-400' : factor.direction === 'negative' ? 'text-red-400' : 'text-amber-400'}`}>
                          {factor.value}
                        </div>
                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                          <span>Impact Weight</span>
                          <span className="font-bold text-slate-400">{factor.impact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Educational Disclaimer */}
                <div className="flex items-start gap-2 text-[11px] text-slate-400 border-t border-[#1E2638] pt-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Educational Policy:</strong> TradeCore explains observed historical order flow metrics. We do not predict future prices or provide financial buy/sell recommendations.
                  </span>
                </div>
              </div>

              {/* Order Pressure Metrics & Volume Distribution */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="trade-card p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white">Order Pressure Ratio</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-emerald-400">Buy Pressure: {report.metrics.buyPressurePercent}%</span>
                      <span className="text-red-400">Sell Pressure: {report.metrics.sellPressurePercent}%</span>
                    </div>
                    <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-800">
                      <div className="bg-emerald-500 h-full" style={{ width: `${report.metrics.buyPressurePercent}%` }} />
                      <div className="bg-red-500 h-full" style={{ width: `${report.metrics.sellPressurePercent}%` }} />
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 pt-2 border-t border-[#1E2638] space-y-1.5">
                    <div className="flex justify-between">
                      <span>Order Imbalance Shift</span>
                      <span className="font-bold text-white">{report.metrics.orderImbalancePercent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Bid Depth</span>
                      <span className="font-bold text-emerald-400">{report.metrics.bidDepthTotal.toLocaleString()} shares</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Ask Depth</span>
                      <span className="font-bold text-red-400">{report.metrics.askDepthTotal.toLocaleString()} shares</span>
                    </div>
                  </div>
                </div>

                <div className="trade-card p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white">Trade Distribution</h3>
                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex justify-between py-1 border-b border-[#1E2638]">
                      <span>Total Executed Volume</span>
                      <span className="font-bold text-white">{report.metrics.tradeVolume.toLocaleString()} shares</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1E2638]">
                      <span>Average Trade Size</span>
                      <span className="font-bold text-white">{report.metrics.avgTradeSize.toLocaleString()} shares</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1E2638]">
                      <span>Institutional Block Order Ratio</span>
                      <span className="font-bold text-blue-400">{report.metrics.largeTradeRatio}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rolling Statistics Table */}
              <div className="trade-card p-5 overflow-hidden space-y-4">
                <h3 className="text-sm font-bold text-white">Rolling Statistics</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1E2638] text-slate-400 font-semibold">
                        <th className="pb-3">Period</th>
                        <th className="pb-3 text-right">Price Change</th>
                        <th className="pb-3 text-right">Volume</th>
                        <th className="pb-3 text-right">Buy Volume</th>
                        <th className="pb-3 text-right">Sell Volume</th>
                        <th className="pb-3 text-right">Imbalance</th>
                        <th className="pb-3 text-right">Avg Trade Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2638]/50">
                      {rollingStats.map((stat, idx) => {
                        const isGreen = stat.priceChange >= 0;
                        return (
                          <tr key={idx} className="hover:bg-[#1E2638]/40 transition">
                            <td className="py-3 font-bold text-white uppercase">{stat.period}</td>
                            <td className={`py-3 text-right font-bold ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isGreen ? '+' : ''}{stat.priceChange.toFixed(2)} ({isGreen ? '+' : ''}{stat.priceChangePercent.toFixed(2)}%)
                            </td>
                            <td className="py-3 text-right font-semibold text-slate-200">{stat.volume.toLocaleString()}</td>
                            <td className="py-3 text-right text-emerald-400">{stat.buyVolume.toLocaleString()}</td>
                            <td className="py-3 text-right text-red-400">{stat.sellVolume.toLocaleString()}</td>
                            <td className="py-3 text-right text-slate-300">
                              {stat.orderImbalance > 0 ? '+' : ''}{stat.orderImbalance.toFixed(2)}%
                            </td>
                            <td className="py-3 text-right text-slate-300">{stat.avgTradeSize.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
