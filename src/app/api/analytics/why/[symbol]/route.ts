import { NextResponse } from 'next/server';
import { AnalyticsEngine } from '@/engine/analyticsEngine';

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params;
    const report = await AnalyticsEngine.analyzeMovement(symbol.toUpperCase());
    return NextResponse.json({ report });
  } catch (error: any) {
    console.error('Error generating movement report:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze price movement' }, { status: 500 });
  }
}
