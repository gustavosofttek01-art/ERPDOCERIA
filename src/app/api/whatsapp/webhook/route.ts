import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppCloudApi } from '@/lib/whatsapp/cloud-api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const wa = new WhatsAppCloudApi();
  const verifiedChallenge = wa.verifyWebhook(mode, token, challenge);

  if (verifiedChallenge) {
    return new NextResponse(verifiedChallenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Falha na verificação do Webhook' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wa = new WhatsAppCloudApi();
    const result = await wa.handleWebhookPayload(body);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
