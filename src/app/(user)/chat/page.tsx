'use client';

import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { UserSidebar } from '@/components/common/UserSidebar';
import { ChatbotWidget } from '@/components/chat/ChatbotWidget';

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <UserSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen((current) => !current)} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">AI trading copilot</p>
                <h1 className="mt-2 text-2xl font-bold text-white">TradeCore Assistant</h1>
              </div>
              <div className="rounded-full border border-[#1E2638] bg-[#121722] px-3 py-1.5 text-xs font-medium text-slate-300">
                Real-time market guidance
              </div>
            </div>

            <ChatbotWidget />
          </div>
        </main>
      </div>
    </div>
  );
}
