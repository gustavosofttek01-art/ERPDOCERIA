import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { WhatsAppCloudApi } from '@/lib/whatsapp/cloud-api';
import { WhatsAppBot } from '@/lib/whatsapp/bot';

export async function GET(req: NextRequest) {
  try {
    const res = await query(`
      SELECT * FROM whatsapp_messages 
      ORDER BY created_at ASC 
      LIMIT 100
    `);
    return NextResponse.json({ success: true, data: res.rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, text, isCommandTest } = body;

    if (!to || !text) {
      return NextResponse.json({ success: false, error: 'Campos "to" e "text" são obrigatórios' }, { status: 400 });
    }

    if (isCommandTest || text.startsWith('/')) {
      // Executa comando no bot e retorna resposta
      const reply = await WhatsAppBot.handleCommand(text, to);
      const wa = new WhatsAppCloudApi();
      await wa.sendMessage(to, reply, 'command_response', text.split(' ')[0]);
      return NextResponse.json({ success: true, reply });
    }

    const wa = new WhatsAppCloudApi();
    const result = await wa.sendMessage(to, text, 'text');
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
