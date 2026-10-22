'use client';

import { useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function buildAssistantReply(message: string) {
  const text = message.trim();
  const lower = text.toLowerCase();

  if (!text) {
    return 'Tell me what you want to know about the market, your portfolio, or a stock.';
  }

  if (lower.includes('portfolio') || lower.includes('pnl') || lower.includes('profit')) {
    return 'Your portfolio is showing healthy momentum today, with strongest exposure in TCS and Reliance. I would watch risk concentration and consider rebalancing if a single position exceeds 35% of your portfolio.';
  }

  if (lower.includes('buy') || lower.includes('stock') || lower.includes('recommend')) {
    return 'A balanced approach would be to favor names with steady earnings and strong momentum, such as TCS, HDFCBANK, and Reliance. If you want, I can help compare two stocks or suggest a portfolio allocation.';
  }

  if (lower.includes('risk') || lower.includes('loss') || lower.includes('volatility')) {
    return 'To reduce risk, keep diversification high, avoid over-concentration in one stock, and maintain cash reserves for new opportunities. I also recommend reviewing your largest holdings before major market swings.';
  }

  if (lower.includes('alert') || lower.includes('watchlist')) {
    return 'Your watchlist looks active. Focus on names with positive price momentum and strong relative strength. If a stock breaks support on high volume, it may be worth trimming exposure.';
  }

  if (lower.includes('hello') || lower.includes('hi')) {
    return 'Hi! I can help with portfolio summaries, stock ideas, risk checks, and trading questions.';
  }

  return 'I can help summarize your portfolio, compare stocks, flag risk, and suggest action plans. Ask me about a stock, a sector, or your portfolio performance.';
}

export function ChatbotWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! I can help with portfolio summaries, stock ideas, and trading questions.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate response');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.reply || buildAssistantReply(trimmed),
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: buildAssistantReply(trimmed),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="trade-card p-5">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Bot className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-white">TradeCore Assistant</h3>
        </div>
        <Sparkles className="h-4 w-4 text-slate-400" />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {['Portfolio health', 'Best stocks', 'Risk check'].map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setInput(suggestion)}
            className="rounded-full border border-[#1E2638] bg-[#0B0E14] px-2.5 py-1 text-[10px] font-semibold text-slate-300 transition hover:border-blue-500 hover:text-white"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-[#1E2638] bg-[#0B0E14] p-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-5 ${
              message.role === 'user'
                ? 'ml-auto bg-blue-600 text-white'
                : 'bg-[#121722] text-slate-200'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void sendMessage();
            }
          }}
          placeholder="Ask about your portfolio..."
          className="flex-1 rounded-lg border border-[#1E2638] bg-[#0B0E14] px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={() => void sendMessage()}
          disabled={isSending}
          className="rounded-lg bg-blue-600 px-3 py-2 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default ChatbotWidget;
