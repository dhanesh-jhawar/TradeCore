'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserSidebar } from '@/components/common/UserSidebar';
import { useWebSocket } from '@/components/WebSocketProvider';
import { Header } from '@/components/common/Header';
import { Briefcase, TrendingUp, PieChart as PieIcon, ArrowUpRight } from 'lucide-react';

export default function PortfolioPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [portfolio, setPortfolio] = useState<any>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const fetchPortfolio = () => {
    fetch('/api/portfolio')
      .then((res) => res.json())
      .then((data) => {
        if (data.portfolio) {
          setPortfolio(data.portfolio);
          setUserId(data.portfolio.userId);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  useWebSocket(userId ? `USER_${userId}` : null, (event) => {
    if (['TRADE_EXECUTED', 'ORDER_CREATED', 'ORDER_FILLED', 'ORDER_PARTIALLY_FILLED', 'ORDER_CANCELLED'].includes(event.eventType)) {
      fetchPortfolio();
    }
  });

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <UserSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-blue-500" />
                <span>Portfolio & Asset Holdings</span>
              </h1>
              <p className="text-sm text-slate-400">Detailed asset allocation and gain/loss breakdown</p>
            </div>
          </div>

          {/* Metric Summary Cards */}
          {(() => {
            let totalInvested = 0;
            let totalCurrent = 0;
            const holdings = portfolio?.holdings || [];
            
            holdings.forEach((h: any) => {
              totalInvested += h.quantity * h.averagePrice;
              totalCurrent += h.quantity * h.company.currentPrice;
            });
            
            const pnl = totalCurrent - totalInvested;
            const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
            const isGreen = pnl >= 0;

            return (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="trade-card p-4">
                  <div className="text-xs font-semibold text-slate-400">Total Portfolio Value</div>
                  <div className="text-2xl font-extrabold text-white mt-1">₹{totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  <div className={`text-xs font-semibold mt-1 ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isGreen ? '+' : '-'}₹{Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2 })} ({isGreen ? '+' : ''}{pnlPct.toFixed(2)}%)
                  </div>
                </div>

                <div className="trade-card p-4">
                  <div className="text-xs font-semibold text-slate-400">Invested Capital</div>
                  <div className="text-2xl font-extrabold text-white mt-1">₹{totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  <div className="text-xs text-slate-500 mt-1">Initial margin allocated</div>
                </div>

                <div className="trade-card p-4">
                  <div className="text-xs font-semibold text-slate-400">Overall Profit & Loss</div>
                  <div className={`text-2xl font-extrabold mt-1 ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isGreen ? '+' : '-'}₹{Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className={`text-xs font-semibold mt-1 ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isGreen ? '+' : ''}{pnlPct.toFixed(2)}% Overall Return
                  </div>
                </div>

                <div className="trade-card p-4">
                  <div className="text-xs font-semibold text-slate-400">Active Positions</div>
                  <div className="text-2xl font-extrabold text-white mt-1">{holdings.length} Stocks</div>
                  <div className="text-xs text-slate-500 mt-1">Diversified</div>
                </div>
              </div>
            );
          })()}

          {/* Holdings Table */}
          <div className="trade-card p-5 overflow-hidden space-y-3">
            <h3 className="text-sm font-bold text-white border-b border-[#1E2638] pb-3">Holdings Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E2638] text-slate-400 font-semibold">
                    <th className="pb-3">Stock</th>
                    <th className="pb-3 text-right">Quantity</th>
                    <th className="pb-3 text-right">Avg. Price</th>
                    <th className="pb-3 text-right">LTP (Current)</th>
                    <th className="pb-3 text-right">Invested Value</th>
                    <th className="pb-3 text-right">Current Value</th>
                    <th className="pb-3 text-right">P&L</th>
                    <th className="pb-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2638]/50">
                  {portfolio?.holdings?.map((h: any) => {
                    const invested = h.quantity * h.averagePrice;
                    const currentVal = h.quantity * h.company.currentPrice;
                    const pnl = currentVal - invested;
                    const pnlPct = (pnl / invested) * 100;
                    const isGreen = pnl >= 0;

                    return (
                      <tr key={h.id} className="hover:bg-[#1E2638]/40 transition">
                        <td className="py-3">
                          <Link href={`/market/${h.company.symbol}`} className="flex items-center gap-2 font-bold text-white hover:text-blue-400">
                            <span>{h.company.symbol}</span>
                            <span className="text-[10px] text-slate-500 font-normal">{h.company.companyName}</span>
                          </Link>
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-200">{h.quantity}</td>
                        <td className="py-3 text-right text-slate-300">₹{h.averagePrice.toFixed(2)}</td>
                        <td className="py-3 text-right font-bold text-white">₹{h.company.currentPrice.toFixed(2)}</td>
                        <td className="py-3 text-right text-slate-300">₹{invested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 text-right font-bold text-white">₹{currentVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 text-right font-bold ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isGreen ? `+₹${pnl.toFixed(2)} (+${pnlPct.toFixed(2)}%)` : `-₹${Math.abs(pnl).toFixed(2)} (${pnlPct.toFixed(2)}%)`}
                        </td>
                        <td className="py-3 text-center">
                          <Link
                            href={`/market/${h.company.symbol}`}
                            className="inline-flex items-center gap-1 rounded bg-blue-600/20 px-2.5 py-1 text-[11px] font-bold text-blue-400 hover:bg-blue-600 hover:text-white transition"
                          >
                            Trade <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
