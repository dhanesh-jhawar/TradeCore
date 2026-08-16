'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserSidebar } from '@/components/common/UserSidebar';
import { useWebSocket } from '@/components/WebSocketProvider';
import { Header } from '@/components/common/Header';
import { History } from 'lucide-react';

export default function TradesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trades, setTrades] = useState<any[]>([]);

  const [userId, setUserId] = useState<string | null>(null);

  const fetchTrades = () => {
    fetch('/api/trades')
      .then((res) => res.json())
      .then((data) => {
        if (data.trades) setTrades(data.trades);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchTrades();
    fetch('/api/auth/me').then(r => r.json()).then(d => { if(d.user) setUserId(d.user.id) }).catch(() => {});
  }, []);

  useWebSocket(userId ? `USER_${userId}` : null, (event) => {
    if (event.eventType === 'TRADE_EXECUTED') {
      fetchTrades();
    }
  });

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <UserSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <History className="h-6 w-6 text-blue-500" />
              <span>Executed Trades Feed</span>
            </h1>
            <p className="text-sm text-slate-400">Recorded matching engine trade executions</p>
          </div>

          <div className="trade-card p-5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E2638] text-slate-400 font-semibold">
                    <th className="pb-3">Trade ID</th>
                    <th className="pb-3">Execution Time</th>
                    <th className="pb-3">Stock</th>
                    <th className="pb-3 text-right">Price</th>
                    <th className="pb-3 text-right">Quantity</th>
                    <th className="pb-3 text-right">Total Trade Value</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2638]/50">
                  {trades.length > 0 ? (
                    trades.map((t) => (
                      <tr key={t.id} className="hover:bg-[#1E2638]/40 transition">
                        <td className="py-3 font-mono text-slate-400">{t.id.slice(0, 8)}...</td>
                        <td className="py-3 text-slate-400">{new Date(t.executedAt).toLocaleString('en-IN')}</td>
                        <td className="py-3 font-bold text-white">{t.company?.symbol || 'N/A'}</td>
                        <td className="py-3 text-right font-bold text-emerald-400">₹{t.price.toFixed(2)}</td>
                        <td className="py-3 text-right text-slate-200 font-semibold">{t.quantity}</td>
                        <td className="py-3 text-right font-bold text-white">₹{(t.price * t.quantity).toLocaleString('en-IN')}</td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            EXECUTED
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    [
                      { id: 'tr_84920481', time: '10:32:45 AM', sym: 'TCS', price: 3524.20, qty: 100 },
                      { id: 'tr_84920480', time: '10:30:12 AM', sym: 'RELIANCE', price: 2914.35, qty: 30 },
                      { id: 'tr_84920479', time: '10:15:00 AM', sym: 'HDFCBANK', price: 1675.00, qty: 20 },
                    ].map((t) => (
                      <tr key={t.id} className="hover:bg-[#1E2638]/40 transition">
                        <td className="py-3 font-mono text-slate-400">{t.id}</td>
                        <td className="py-3 text-slate-400">{t.time}</td>
                        <td className="py-3 font-bold text-white">{t.sym}</td>
                        <td className="py-3 text-right font-bold text-emerald-400">₹{t.price.toFixed(2)}</td>
                        <td className="py-3 text-right text-slate-200 font-semibold">{t.qty}</td>
                        <td className="py-3 text-right font-bold text-white">₹{(t.price * t.qty).toLocaleString('en-IN')}</td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            EXECUTED
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
