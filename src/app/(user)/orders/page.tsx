'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserSidebar } from '@/components/common/UserSidebar';
import { useWebSocket } from '@/components/WebSocketProvider';
import { Header } from '@/components/common/Header';
import { ClipboardList, Search, Filter } from 'lucide-react';

export default function OrdersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [userId, setUserId] = useState<string | null>(null);

  const fetchOrders = () => {
    fetch(`/api/orders?status=${statusFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchOrders();
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      if (data.user) setUserId(data.user.id);
    }).catch(() => {});
  }, [statusFilter]);

  useWebSocket(userId ? `USER_${userId}` : null, (event) => {
    if (['ORDER_CREATED', 'ORDER_VALIDATED', 'ORDER_OPENED', 'ORDER_PARTIALLY_FILLED', 'ORDER_FILLED', 'ORDER_CANCELLED', 'ORDER_REJECTED'].includes(event.eventType)) {
      fetchOrders();
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
                <ClipboardList className="h-6 w-6 text-blue-500" />
                <span>Orders History</span>
              </h1>
              <p className="text-sm text-slate-400">View and track all active and historical exchange orders</p>
            </div>

            <div className="flex gap-1.5 rounded-lg border border-[#1E2638] bg-[#121722] p-1 text-xs font-semibold">
              {['ALL', 'PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded px-3 py-1.5 ${statusFilter === st ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="trade-card p-5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E2638] text-slate-400 font-semibold">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Date / Time</th>
                    <th className="pb-3">Stock</th>
                    <th className="pb-3">Side</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3 text-right">Price</th>
                    <th className="pb-3 text-right">Quantity</th>
                    <th className="pb-3 text-right">Remaining</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2638]/50">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#1E2638]/40 transition">
                      <td className="py-3 font-mono text-slate-400">{o.id.slice(0, 8)}...</td>
                      <td className="py-3 text-slate-400">
                        {new Date(o.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 font-bold text-white">
                        <Link href={`/market/${o.company?.symbol}`} className="hover:text-blue-400">
                          {o.company?.symbol || 'TCS'}
                        </Link>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {o.side}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 font-semibold">{o.orderType}</td>
                      <td className="py-3 text-right font-bold text-white">₹{o.price.toFixed(2)}</td>
                      <td className="py-3 text-right text-slate-300">{o.quantity}</td>
                      <td className="py-3 text-right text-slate-300">{o.remainingQuantity}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                          o.status === 'FILLED' ? 'bg-emerald-500/20 text-emerald-400' :
                          o.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                          o.status === 'PARTIALLY_FILLED' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {o.status}
                        </span>
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
