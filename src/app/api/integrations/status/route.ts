import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const channelsRes = await query(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM integration_queue q WHERE q.channel_id = c.id AND q.status = 'pendente') as pending_count,
        (SELECT COUNT(*) FROM integration_queue q WHERE q.channel_id = c.id AND q.status = 'falhou') as failed_count
      FROM channels c
      ORDER BY c.status = 'conectado' DESC
    `);

    const logsRes = await query(`
      SELECT 
        l.*,
        c.display_name as channel_name
      FROM integration_sync_logs l
      JOIN channels c ON l.channel_id = c.id
      ORDER BY l.created_at DESC
      LIMIT 25
    `);

    const queueRes = await query(`
      SELECT 
        q.*,
        c.display_name as channel_name
      FROM integration_queue q
      JOIN channels c ON q.channel_id = c.id
      ORDER BY q.created_at DESC
      LIMIT 25
    `);

    return NextResponse.json({
      success: true,
      channels: channelsRes.rows.map((c: any) => ({
        ...c,
        pending_count: Number(c.pending_count),
        failed_count: Number(c.failed_count),
      })),
      queue: queueRes.rows.map((q: any) => ({
        ...q,
        attempts: Number(q.attempts),
        max_attempts: Number(q.max_attempts),
      })),
      logs: logsRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
