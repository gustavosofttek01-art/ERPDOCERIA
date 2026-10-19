import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const res = await query(`
      SELECT * FROM customers 
      ORDER BY total_spent DESC, total_orders DESC
    `);
    return NextResponse.json({ success: true, count: res.rows.length, data: res.rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, action } = await req.json();
    if (action === 'anonymize') {
      // LGPD: Anonimização de dados pessoais mediante solicitação
      await query(`
        UPDATE customers 
        SET name = 'Cliente Anonimizado (LGPD)',
            phone = '***',
            email = 'anonimizado@lgpd.local',
            address = null,
            anonymized = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);
      return NextResponse.json({ success: true, message: 'Dados anonimizados conforme exigência da LGPD.' });
    }
    return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
