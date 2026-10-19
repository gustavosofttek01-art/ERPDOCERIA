import { query, transaction } from '../db';
import { IFoodAdapter } from './ifood';
import { NinetyNineFoodAdapter } from './nnfood';
import { IChannelAdapter, ChannelSyncResult } from './base';

export class IntegrationQueueWorker {
  private static adapters: Record<string, IChannelAdapter> = {
    ifood: new IFoodAdapter(),
    '99food': new NinetyNineFoodAdapter(),
  };

  /**
   * Reprocessa tarefas pendentes ou falhas na fila de integração.
   */
  static async processPendingTasks(channelIdFilter?: string): Promise<{
    processedCount: number;
    succeededCount: number;
    failedCount: number;
    details: any[];
  }> {
    let sql = `
      SELECT * FROM integration_queue 
      WHERE status IN ('pendente', 'falhou')
    `;
    const params: any[] = [];
    if (channelIdFilter) {
      params.push(channelIdFilter);
      sql += ` AND channel_id = $${params.length}`;
    }
    sql += ` ORDER BY created_at ASC LIMIT 20`;

    const tasksRes = await query(sql, params);
    const tasks = tasksRes.rows;

    let succeeded = 0;
    let failed = 0;
    const details: any[] = [];

    for (const task of tasks) {
      const adapter = this.adapters[task.channel_id];
      let result: ChannelSyncResult;

      try {
        const payload = typeof task.payload === 'string' ? JSON.parse(task.payload) : task.payload;

        if (adapter) {
          if (task.task_type === 'sync_product' || task.task_type === 'sync_price') {
            result = await adapter.syncProductPrice(payload.sku, Number(payload.price || 0));
          } else if (task.task_type === 'sync_status') {
            result = await adapter.syncProductAvailability(payload.sku, Boolean(payload.isAvailable));
          } else if (task.task_type === 'sync_stock') {
            result = await adapter.syncStock(payload.sku, Number(payload.stock || payload.quantity || 0));
          } else {
            result = {
              channelId: task.channel_id,
              success: true,
              status: 'sincronizado',
              message: 'Tarefa genérica executada com sucesso.',
            };
          }
        } else {
          // Para Loja Virtual e PDV locais
          result = {
            channelId: task.channel_id,
            success: true,
            status: 'sincronizado',
            message: `Sincronização com canal ${task.channel_id} concluída diretamente.`,
          };
        }

        if (result.success) {
          succeeded++;
          // Atualiza status na fila
          await query(
            `UPDATE integration_queue 
             SET status = 'concluido', updated_at = CURRENT_TIMESTAMP, last_error = NULL 
             WHERE id = $1`,
            [task.id]
          );

          // Atualiza o override do produto no canal
          const payload = typeof task.payload === 'string' ? JSON.parse(task.payload) : task.payload;
          if (payload.productId) {
            await query(
              `UPDATE channel_product_overrides 
               SET sync_status = 'sincronizado', last_sync_at = CURRENT_TIMESTAMP, last_error = NULL 
               WHERE product_id = $1 AND channel_id = $2`,
              [payload.productId, task.channel_id]
            );
          }

          // Registra log
          await query(
            `INSERT INTO integration_sync_logs (
              id, channel_id, event_type, entity_id, status, payload, response, retry_count
            ) VALUES ($1, $2, $3, $4, 'sincronizado', $5, $6, $7)`,
            [
              `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              task.channel_id,
              task.task_type,
              payload.sku || payload.productId,
              JSON.stringify(payload),
              JSON.stringify(result),
              task.attempts,
            ]
          );
        } else {
          failed++;
          const nextAttempts = task.attempts + 1;
          const backoffMinutes = Math.min(60, Math.pow(2, nextAttempts) * 2);

          await query(
            `UPDATE integration_queue 
             SET status = 'falhou', attempts = $1, last_error = $2, 
                 next_retry_at = CURRENT_TIMESTAMP + ($3 || ' minutes')::interval,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $4`,
            [nextAttempts, result.message, backoffMinutes, task.id]
          );
        }

        details.push({
          taskId: task.id,
          channel: task.channel_id,
          type: task.task_type,
          success: result.success,
          message: result.message,
        });
      } catch (err: any) {
        failed++;
        await query(
          `UPDATE integration_queue 
           SET status = 'falhou', attempts = attempts + 1, last_error = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2`,
          [err.message, task.id]
        );
        details.push({
          taskId: task.id,
          channel: task.channel_id,
          type: task.task_type,
          success: false,
          message: err.message,
        });
      }
    }

    return {
      processedCount: tasks.length,
      succeededCount: succeeded,
      failedCount: failed,
      details,
    };
  }

  /**
   * Força reprocessamento manual de todas as tarefas falhadas com 1 clique no painel.
   */
  static async forceRetryAll(): Promise<{ message: string; reprocessed: number }> {
    // Reseta tarefas falhadas para 'pendente'
    await query(`
      UPDATE integration_queue 
      SET status = 'pendente', next_retry_at = CURRENT_TIMESTAMP 
      WHERE status = 'falhou'
    `);

    // Atualiza status nos canais
    await query(`
      UPDATE channels 
      SET last_error = NULL, status = 'conectado'
      WHERE id = '99food'
    `);

    // Executa processamento imediato
    const res = await this.processPendingTasks();
    return {
      message: `Reprocessamento concluído: ${res.succeededCount} itens sincronizados com sucesso.`,
      reprocessed: res.processedCount,
    };
  }
}
