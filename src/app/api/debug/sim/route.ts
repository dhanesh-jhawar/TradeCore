import { NextResponse } from 'next/server';
import { SimulatorEngine } from '@/engine/simulatorEngine';
import { ExchangeQueue } from '@/engine/exchangeQueue';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const sim = SimulatorEngine.getInstance();
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'start') {
    sim.updateConfig({ intensity: 10, maxOrdersPerSec: 500, volatilityMultiplier: 2.0 });
    await sim.start();
    return NextResponse.json({ status: 'STARTED' });
  }

  if (action === 'stop') {
    sim.stop();
    return NextResponse.json({ status: 'STOPPED' });
  }

  if (action === 'stats') {
    const active = sim.getStatus().activeBots;
    const depthTcs = ExchangeQueue.getDepth((await prisma.company.findUnique({where:{symbol:'TCS'}}))?.id || '');
    return NextResponse.json({ active, depthTcs });
  }

  return NextResponse.json({ error: 'invalid action' });
}
