import { NextResponse } from 'next/server';
import { ReplayEngine } from '@/engine/replayEngine';

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params;
    const session = await ReplayEngine.buildReplaySession(symbol.toUpperCase());
    return NextResponse.json({ session });
  } catch (error: any) {
    console.error('Error constructing replay session:', error);
    return NextResponse.json({ error: error.message || 'Failed to construct replay timeline' }, { status: 500 });
  }
}
