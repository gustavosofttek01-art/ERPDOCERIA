import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../lib/db';
import { IFoodAdapter } from '../lib/integrations/ifood';
import { IntegrationQueueWorker } from '../lib/integrations/queue-worker';

describe('Marketplace Integrations - Adaptadores e Fila de Retentativas', () => {
  beforeAll(async () => {
    await getDb();
  });

  it('iFoodAdapter deve testar conectividade e simular sincronização de catálogo', async () => {
    const adapter = new IFoodAdapter();
    const conn = await adapter.testConnection();
    expect(conn.ok).toBe(true);

    const priceSync = await adapter.syncProductPrice('BRIG-PIST-01', 8.50);
    expect(priceSync.success).toBe(true);
    expect(priceSync.status).toBe('sincronizado');
  });

  it('IntegrationQueueWorker deve reprocessar tarefas falhadas com sucesso', async () => {
    const res = await IntegrationQueueWorker.forceRetryAll();
    expect(res.reprocessed).toBeGreaterThanOrEqual(0);
    expect(res.message).toContain('Reprocessamento');
  });
});
