import { describe, it, expect, beforeAll } from 'vitest';
import { getDb, query } from '../lib/db';
import { OrderService } from '../lib/services/order-service';

describe('OrderService - Ciclo de Vida e Regras de Pedidos', () => {
  beforeAll(async () => {
    await getDb();
  });

  it('deve criar um pedido com cálculo correto de taxas e reserva atômica de estoque', async () => {
    const prodRes = await query('SELECT id, sale_price, current_stock, reserved_stock FROM products WHERE sku = $1', ['BRIG-PIST-01']);
    const prod = prodRes.rows[0];
    const initialReserved = Number(prod.reserved_stock);

    const order = await OrderService.createOrder({
      channelId: 'ifood',
      customerName: 'Cliente Teste Vitest',
      customerPhone: '(62) 99999-0000',
      deliveryType: 'delivery',
      items: [
        {
          productId: prod.id,
          quantity: 2,
          unitPrice: Number(prod.sale_price),
        },
      ],
      deliveryFee: 10,
      paymentMethod: 'marketplace',
      paymentStatus: 'aprovado',
    });

    expect(order).toBeDefined();
    expect(order.status).toBe('recebido');
    expect(order.total_amount).toBe(Number(prod.sale_price) * 2 + 10);
    expect(order.marketplace_fee).toBeGreaterThan(0); // Taxa do iFood calculada

    // Verifica que o estoque foi reservado
    const updatedProd = await query('SELECT reserved_stock FROM products WHERE id = $1', [prod.id]);
    expect(Number(updatedProd.rows[0].reserved_stock)).toBe(initialReserved + 2);
  });

  it('deve realizar a transição correta e dar baixa permanente no estoque ao concluir', async () => {
    const prodRes = await query('SELECT id, current_stock FROM products WHERE sku = $1', ['BRIG-BELG-01']);
    const prod = prodRes.rows[0];
    const initialStock = Number(prod.current_stock);

    const order = await OrderService.createOrder({
      channelId: 'pdv',
      customerName: 'Balcão Conclusão',
      deliveryType: 'balcao',
      items: [
        {
          productId: prod.id,
          quantity: 3,
        },
      ],
      paymentMethod: 'pix',
      paymentStatus: 'aprovado',
    });

    // Fluxo: recebido -> confirmado -> em_preparo -> pronto -> concluido
    await OrderService.updateStatus(order.id, 'confirmado');
    await OrderService.updateStatus(order.id, 'em_preparo');
    await OrderService.updateStatus(order.id, 'pronto');
    const completed = await OrderService.updateStatus(order.id, 'concluido');

    expect(completed.status).toBe('concluido');

    // Confirma que estoque físico baixou 3 unidades
    const finalProd = await query('SELECT current_stock FROM products WHERE id = $1', [prod.id]);
    expect(Number(finalProd.rows[0].current_stock)).toBe(initialStock - 3);

    // Confirma que foi gerada uma transação financeira de receita
    const finRes = await query('SELECT * FROM financial_transactions WHERE order_id = $1', [order.id]);
    expect(finRes.rows.length).toBeGreaterThan(0);
    expect(finRes.rows[0].type).toBe('receita');
  });

  it('deve rejeitar transições de status ilegais no ciclo de vida', async () => {
    const prodRes = await query('SELECT id FROM products LIMIT 1');
    const order = await OrderService.createOrder({
      channelId: 'loja_virtual',
      customerName: 'Teste Ilegal',
      items: [{ productId: prodRes.rows[0].id, quantity: 1 }],
    });

    // Tentativa de pular de 'recebido' direto para 'concluido'
    await expect(
      OrderService.updateStatus(order.id, 'concluido')
    ).rejects.toThrow(/Transição de status inválida/);
  });
});
