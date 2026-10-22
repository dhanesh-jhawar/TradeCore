import { NextResponse } from 'next/server';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message : '';

    if (!message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    return NextResponse.json({ reply: buildAssistantReply(message) }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
