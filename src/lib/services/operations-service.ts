import { query } from '../db';
import { OperationsCenterData } from '../db/types';

export class OperationsService {
  /**
   * Responde visualmente às 5 perguntas operacionais críticas do negócio.
   */
  static async getOperationsCenter(): Promise<OperationsCenterData> {
    // 1. O que está funcionando? (Canais e status de conexão)
    const channelsRes = await query(`
      SELECT 
        c.id,
        c.display_name as name,
        c.status,
        c.last_sync_at,
        c.last_error,
        (SELECT COUNT(*) FROM integration_queue q WHERE q.channel_id = c.id AND q.status = 'falhou') as failed_count
      FROM channels c
      ORDER BY c.status = 'conectado' DESC, c.display_name ASC
    `);

    const channels = channelsRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      lastSync: r.last_sync_at ? new Date(r.last_sync_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Nunca',
      hasErrors: Number(r.failed_count) > 0 || Boolean(r.last_error),
    }));

    const activeChannels = channels.filter((c: any) => c.status === 'conectado');
    const allGood = channels.every((c: any) => c.status === 'conectado' && !c.hasErrors);

    // 2. Quais produtos estão acabando? (Estoque <= mínimo)
    const lowStockRes = await query(`
      SELECT 
        id,
        sku,
        name,
        current_stock,
        min_stock,
        unit,
        CASE 
          WHEN current_stock <= (min_stock * 0.3) THEN 'critico'
          ELSE 'atencao'
        END as severity
      FROM products
      WHERE active = true AND current_stock <= min_stock
      ORDER BY (current_stock / NULLIF(min_stock, 0)) ASC, current_stock ASC
      LIMIT 10
    `);

    // 3. Quais pedidos estão atrasados? (deadline_at expirado e status ativo)
    const delayedOrdersRes = await query(`
      SELECT 
        o.id,
        o.order_number,
        o.customer_name,
        c.display_name as channel_name,
        o.status,
        o.total_amount,
        o.deadline_at,
        ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o.deadline_at))/60) as delayed_minutes
      FROM orders o
      JOIN channels c ON o.channel_id = c.id
      WHERE o.status NOT IN ('concluido', 'cancelado') 
        AND o.deadline_at < CURRENT_TIMESTAMP
      ORDER BY o.deadline_at ASC
    `);

    // 4. Quais plataformas ainda não sincronizaram?
    const unsyncedRes = await query(`
      SELECT 
        c.id as channel_id,
        c.display_name as channel_name,
        COUNT(CASE WHEN q.status = 'falhou' THEN 1 END) as failed_tasks,
        COUNT(CASE WHEN q.status = 'pendente' THEN 1 END) as pending_tasks,
        MAX(q.last_error) as last_error
      FROM channels c
      LEFT JOIN integration_queue q ON c.id = q.channel_id AND q.status IN ('pendente', 'falhou')
      GROUP BY c.id, c.display_name
      HAVING COUNT(CASE WHEN q.status IN ('pendente', 'falhou') THEN 1 END) > 0
    `);

    // 5. O que precisa da minha atenção agora? (Feed unificado de prioridades)
    const attentionItems: OperationsCenterData['urgentAttentionItems'] = [];

    // Pedidos atrasados prioritários
    for (const d of delayedOrdersRes.rows) {
      attentionItems.push({
        id: `att_delayed_${d.id}`,
        type: 'pedido_atrasado',
        priority: 'critica',
        title: `Pedido ${d.order_number} Atrasado (${d.delayed_minutes} min)`,
        message: `${d.customer_name} via ${d.channel_name} - R$ ${Number(d.total_amount).toFixed(2)}. Status atual: ${d.status}.`,
        actionLabel: 'Agilizar / Concluir',
        actionUrl: '/pedidos',
        timeAgo: `Atrasado há ${d.delayed_minutes} min`,
      });
    }

    // Pedidos novos recebidos aguardando confirmação
    const pendingOrdersRes = await query(`
      SELECT id, order_number, customer_name, total_amount, created_at
      FROM orders 
      WHERE status = 'recebido'
      ORDER BY created_at ASC
    `);
    for (const p of pendingOrdersRes.rows) {
      attentionItems.push({
        id: `att_recv_${p.id}`,
        type: 'pedido_recebido',
        priority: 'alta',
        title: `Novo Pedido ${p.order_number} Aguardando`,
        message: `Cliente ${p.customer_name} - Total: R$ ${Number(p.total_amount).toFixed(2)}. Aceite para iniciar o preparo.`,
        actionLabel: 'Aceitar Pedido',
        actionUrl: '/pedidos',
        timeAgo: 'Aguardando confirmação',
      });
    }

    // Lotes com validade próxima (< 3 dias)
    const expiringLotsRes = await query(`
      SELECT 
        l.id,
        l.lot_number,
        l.current_quantity,
        l.expires_at,
        p.name as product_name,
        ROUND(EXTRACT(EPOCH FROM (l.expires_at - CURRENT_TIMESTAMP))/86400) as days_remaining
      FROM lots l
      JOIN products p ON l.product_id = p.id
      WHERE l.status != 'esgotado' 
        AND l.current_quantity > 0
        AND l.expires_at <= (CURRENT_TIMESTAMP + interval '3 days')
      ORDER BY l.expires_at ASC
      LIMIT 5
    `);
    for (const lot of expiringLotsRes.rows) {
      attentionItems.push({
        id: `att_lot_${lot.id}`,
        type: 'validade_proxima',
        priority: Number(lot.days_remaining) <= 1 ? 'critica' : 'alta',
        title: `Validade Próxima: ${lot.product_name}`,
        message: `Lote ${lot.lot_number} com ${lot.current_quantity} un vence em ${lot.days_remaining} dia(s).`,
        actionLabel: 'Ver Lotes',
        actionUrl: '/producao',
        timeAgo: `Vence em ${lot.days_remaining}d`,
      });
    }

    // Falhas de sincronização
    for (const unsync of unsyncedRes.rows) {
      if (Number(unsync.failed_tasks) > 0) {
        attentionItems.push({
          id: `att_sync_${unsync.channel_id}`,
          type: 'falha_sincronizacao',
          priority: 'alta',
          title: `Falha de Sincronização: ${unsync.channel_name}`,
          message: `${unsync.failed_tasks} item(ns) falharam na comunicação com a API. Erro: ${unsync.last_error?.slice(0, 80) || 'Falha de comunicação'}...`,
          actionLabel: 'Reprocessar Fila',
          actionUrl: '/integracoes',
          timeAgo: 'Fila bloqueada',
        });
      }
    }

    return {
      operationalHealth: {
        allGood,
        activeChannelsCount: activeChannels.length,
        totalChannelsCount: channels.length,
        channels,
      },
      lowStockItems: lowStockRes.rows.map((r: any) => ({
        id: r.id,
        sku: r.sku,
        name: r.name,
        currentStock: Number(r.current_stock),
        minStock: Number(r.min_stock),
        unit: r.unit,
        severity: r.severity,
      })),
      delayedOrders: delayedOrdersRes.rows.map((r: any) => ({
        id: r.id,
        orderNumber: r.order_number,
        customerName: r.customer_name,
        channelName: r.channel_name,
        status: r.status,
        totalAmount: Number(r.total_amount),
        delayedMinutes: Number(r.delayed_minutes),
        deadlineAt: r.deadline_at,
      })),
      unsyncedPlatforms: unsyncedRes.rows.map((r: any) => ({
        channelId: r.channel_id,
        channelName: r.channel_name,
        failedTasksCount: Number(r.failed_tasks),
        pendingTasksCount: Number(r.pending_tasks),
        lastError: r.last_error,
      })),
      urgentAttentionItems: attentionItems,
    };
  }
}
