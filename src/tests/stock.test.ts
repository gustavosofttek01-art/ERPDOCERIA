import { describe, it, expect, beforeAll } from 'vitest';
import { getDb, query } from '../lib/db';
import { StockService } from '../lib/services/stock-service';

describe('StockService - Controle de Estoque e Movimentações', () => {
  beforeAll(async () => {
    await getDb();
  });

  it('deve executar entrada de estoque com sucesso e atualizar saldo', async () => {
    // Busca um produto de teste
    const prods = await query('SELECT id, current_stock FROM products WHERE sku = $1', ['BRIG-BELG-01']);
    const prodId = prods.rows[0].id;
    const initialStock = Number(prods.rows[0].current_stock);

    const res = await StockService.moveStock({
      productId: prodId,
      movementType: 'entrada',
      quantity: 10,
      reason: 'Produção adicional para teste',
    });

    expect(res.success).toBe(true);
    expect(res.newStock).toBe(initialStock + 10);

    const updated = await query('SELECT current_stock FROM products WHERE id = $1', [prodId]);
    expect(Number(updated.rows[0].current_stock)).toBe(initialStock + 10);
  });

  it('deve impedir saldo negativo por padrão quando a quantidade solicitada for maior que o saldo', async () => {
    const prods = await query('SELECT id, current_stock FROM products WHERE sku = $1', ['BOLO-CEN-01']);
    const prodId = prods.rows[0].id;
    const currentStock = Number(prods.rows[0].current_stock);

    await expect(
      StockService.moveStock({
        productId: prodId,
        movementType: 'saida',
        quantity: currentStock + 50,
        reason: 'Tentativa de retirada acima do saldo',
        allowNegativeOverride: false,
      })
    ).rejects.toThrow(/Estoque insuficiente/);
  });

  it('deve garantir idempotência em movimentações com a mesma chave', async () => {
    const prods = await query('SELECT id, current_stock FROM products WHERE sku = $1', ['TRUFA-MAR-01']);
    const prodId = prods.rows[0].id;
    const key = `test_idemp_key_${Date.now()}`;

    // Primeira execução
    const firstRes = await StockService.moveStock({
      productId: prodId,
      movementType: 'entrada',
      quantity: 5,
      reason: 'Entrada idempotente 1',
      idempotencyKey: key,
    });

    // Segunda execução com a mesma chave não deve alterar o estoque novamente
    const secondRes = await StockService.moveStock({
      productId: prodId,
      movementType: 'entrada',
      quantity: 5,
      reason: 'Entrada idempotente 2 duplicada',
      idempotencyKey: key,
    });

    expect(secondRes.movementId).toBe(firstRes.movementId);
    expect(secondRes.newStock).toBe(firstRes.newStock);
  });
});
