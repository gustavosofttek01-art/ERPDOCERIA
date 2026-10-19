import { NextRequest, NextResponse } from 'next/server';
import { IntegrationQueueWorker } from '@/lib/integrations/queue-worker';

export async function POST(req: NextRequest) {
  try {
    const result = await IntegrationQueueWorker.forceRetryAll();
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
