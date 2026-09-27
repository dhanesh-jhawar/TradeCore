import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { SimulatorEngine } from '@/engine/simulatorEngine';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const simulator = SimulatorEngine.getInstance();
    return NextResponse.json({ status: simulator.getStatus() });
  } catch (error: any) {
    console.error('Error fetching simulator status:', error);
    return NextResponse.json({ error: 'Failed to fetch simulator status' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, config } = body;

    const simulator = SimulatorEngine.getInstance();

    if (action === 'START') {
      await simulator.start();
    } else if (action === 'STOP') {
      await simulator.stop();
    } else if (action === 'UPDATE_CONFIG' && config) {
      simulator.updateConfig(config);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, status: simulator.getStatus() });
  } catch (error: any) {
    console.error('Error updating simulator:', error);
    return NextResponse.json({ error: 'Failed to update simulator' }, { status: 500 });
  }
}
