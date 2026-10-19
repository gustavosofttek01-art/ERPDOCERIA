import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'vendas'; // vendas | estoque | financeiro

    if (type === 'vendas') {
      const res = await query(`
        SELECT 
          o.order_number,
          c.display_name as canal,
          o.customer_name as cliente,
          o.status,
          o.payment_method as forma_pagamento,
          o.subtotal,
          o.delivery_fee as taxa_entrega,
          o.marketplace_fee as taxa_canal,
          o.total_amount as valor_total,
          o.estimated_cmv as custo_cmv,
          o.estimated_net_profit as lucro_estimado,
          to_char(o.created_at, 'DD/MM/YYYY HH24:MI') as data_hora
        FROM orders o
        JOIN channels c ON o.channel_id = c.id
        ORDER BY o.created_at DESC
      `);

      const headers = ['Número Pedido', 'Canal', 'Cliente', 'Status', 'Pagamento', 'Subtotal', 'Taxa Entrega', 'Comissão Canal', 'Total', 'CMV', 'Lucro Estimado', 'Data/Hora'];
      const rows = res.rows.map((r: any) => [
        r.order_number,
        r.canal,
        `"${r.cliente}"`,
        r.status,
        r.forma_pagamento,
        Number(r.subtotal).toFixed(2),
        Number(r.taxa_entrega).toFixed(2),
        Number(r.taxa_canal).toFixed(2),
        Number(r.valor_total).toFixed(2),
        Number(r.custo_cmv).toFixed(2),
        Number(r.lucro_estimado).toFixed(2),
        r.data_hora,
      ]);

      const csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="docecontrol_relatorio_vendas_${Date.now()}.csv"`,
        },
      });
    }

    if (type === 'estoque') {
      const res = await query(`
        SELECT 
          p.sku,
          p.name as produto,
          c.name as categoria,
          p.unit as unidade,
          p.current_stock as estoque_atual,
          p.min_stock as estoque_minimo,
          p.reserved_stock as reservado,
          p.sale_price as preco_venda,
          p.cost_price as custo,
          (p.current_stock * p.cost_price) as valor_total_custo
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.name ASC
      `);

      const headers = ['SKU', 'Produto', 'Categoria', 'Unidade', 'Estoque Atual', 'Estoque Mínimo', 'Reservado', 'Preço Venda', 'Custo Unitário', 'Valor Total em Estoque'];
      const rows = res.rows.map((r: any) => [
        r.sku,
        `"${r.produto}"`,
        `"${r.categoria || 'Geral'}"`,
        r.unidade,
        Number(r.estoque_atual).toFixed(2),
        Number(r.estoque_minimo).toFixed(2),
        Number(r.reservado).toFixed(2),
        Number(r.preco_venda).toFixed(2),
        Number(r.custo).toFixed(2),
        Number(r.valor_total_custo).toFixed(2),
      ]);

      const csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="docecontrol_relatorio_estoque_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Tipo de relatório não suportado' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
