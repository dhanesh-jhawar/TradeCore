import { NextResponse } from 'next/server';
import { AnalyticsEngine } from '@/engine/analyticsEngine';

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params;
    const stats = await AnalyticsEngine.getCompanyRollingStats(symbol.toUpperCase());
    if (!stats) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Error generating company rolling stats:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch rolling stats' }, { status: 500 });
  }
}
