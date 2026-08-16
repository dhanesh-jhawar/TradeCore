import { NextResponse } from 'next/server';
import { AnalyticsEngine } from '@/engine/analyticsEngine';

export async function GET() {
  try {
    const marketStats = await AnalyticsEngine.getMarketAnalytics();
    return NextResponse.json({ marketStats });
  } catch (error: any) {
    console.error('Error generating market stats:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch market stats' }, { status: 500 });
  }
}
