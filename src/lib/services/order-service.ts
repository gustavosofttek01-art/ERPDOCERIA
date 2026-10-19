import { query, transaction } from '../db';
import { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus } from '../db/types';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

export interface CreateOrderInput {
  channelId: string;
  externalId?: string;
  orderNumber?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  deliveryType?: 'retirada' | 'delivery' | 'balcao';
  deliveryAddress?: any;
  items: CreateOrderItemInput[];
  deliveryFee?: number;
  discount?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  preparationTimeMinutes?: number;
  idempotencyKey?: string;
  userId?: string;
}

export class OrderService {
  /**
   * Obtém lista de pedidos com itens, canais e cálculo de atraso em tempo real.
   */
  static async getOrders(filter?: {
    orderId?: string;
    channelId?: string;
    status?: OrderStatus;
    search?: string;
    delayedOnly?: boolean;
    limit?: number;
  }): Promise<Order[]> {
    let sql = `
      SELECT 
        o.*,
        c.display_name as channel_name,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o.deadline_at))/60 as minutes_past_deadline
      FROM orders o
      JOIN channels c ON o.channel_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.orderId) {
      params.push(filter.orderId);
      sql += ` AND o.id = $${params.length}`;
    }

    if (filter?.channelId) {
      params.push(filter.channelId);
      sql += ` AND o.channel_id = $${params.length}`;
    }

    if (filter?.status) {
      params.push(filter.status);
      sql += ` AND o.status = $${params.length}`;
    }

    if (filter?.search) {
      params.push(`%${filter.search.toLowerCase()}%`);
      sql += ` AND (LOWER(o.order_number) LIKE $${params.length} OR LOWER(o.customer_name) LIKE $${params.length} OR LOWER(o.id) LIKE $${params.length})`;
    }

    if (filter?.delayedOnly) {
      sql += ` AND o.status NOT IN ('concluido', 'cancelado') AND o.deadline_at < CURRENT_TIMESTAMP`;
    }

    sql += ` ORDER BY o.created_at DESC`;

    if (filter?.limit) {
      params.push(filter.limit);
      sql += ` LIMIT $${params.length}`;
    }

    const res = await query(sql, params);

    // Carrega itens dos pedidos
    const orderIds = res.rows.map((r: any) => r.id);
    let itemsByOrder: Record<string, OrderItem[]> = {};

    if (orderIds.length > 0) {
      const itemsRes = await query(
        `SELECT * FROM order_items WHERE order_id = ANY($1::text[])`,
        [orderIds]
      );
      itemsRes.rows.forEach((it: any) => {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
        itemsByOrder[it.order_id].push({
          ...it,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          cost_price: Number(it.cost_price),
          total_price: Number(it.total_price),
        });
      });
    }

    return res.rows.map((row: any) => {
      const pastDeadline = Number(row.minutes_past_deadline || 0);
      const isFinished = ['concluido', 'cancelado'].includes(row.status);
      const isDelayed = !isFinished && pastDeadline > 0;

      return {
        ...row,
        subtotal: Number(row.subtotal),
        delivery_fee: Number(row.delivery_fee),
        discount: Number(row.discount),
        marketplace_fee: Number(row.marketplace_fee),
        total_amount: Number(row.total_amount),
        estimated_cmv: Number(row.estimated_cmv),
        estimated_net_profit: Number(row.estimated_net_profit),
        preparation_time_minutes: Number(row.preparation_time_minutes),
        items: itemsByOrder[row.id] || [],
        is_delayed: isDelayed,
        minutes_remaining: isDelayed ? -Math.round(pastDeadline) : Math.max(0, Math.round(-pastDeadline)),
      };
    });
  }

  /**
   * Cria novo pedido com cálculo de taxas, reserva atômica de estoque e prevenção de duplicidade.
   */
  static async createOrder(data: CreateOrderInput): Promise<Order> {
    if (!data.items || data.items.length === 0) {
      throw new Error('O pedido deve conter pelo menos um item.');
    }

    // Prevenção de duplicidade por external_id se vier de canal integrado
    if (data.externalId) {
      const checkExt = await query(
        'SELECT id FROM orders WHERE channel_id = $1 AND external_id = $2',
        [data.channelId, data.externalId]
      );
      if (checkExt.rows.length > 0) {
        throw new Error(
          `Pedido com identificador externo "${data.externalId}" já foi processado no canal "${data.channelId}".`
        );
      }
    }

    // Prevenção de duplicidade por chave de idempotência
    if (data.idempotencyKey) {
      const checkIdemp = await query(
        'SELECT id FROM orders WHERE idempotency_key = $1',
        [data.idempotencyKey]
      );
      if (checkIdemp.rows.length > 0) {
        const existing = await OrderService.getOrders({ orderId: checkIdemp.rows[0].id });
        return existing[0];
      }
    }

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const orderNumber = data.orderNumber || `#${Math.floor(1000 + Math.random() * 9000)}`;

    await transaction(async (tx) => {
      // 1. Busca produtos e valida estoque
      let subtotal = 0;
      let totalCmv = 0;
      const orderItemsToInsert: any[] = [];

      for (const item of data.items) {
        const pRes = await tx.query(
          'SELECT id, name, sale_price, cost_price, current_stock, reserved_stock FROM products WHERE id = $1 FOR UPDATE',
          [item.productId]
        );
        if (pRes.rows.length === 0) {
          throw new Error(`Produto não encontrado para pedido: ${item.productId}`);
        }
        const prod = pRes.rows[0];
        const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : Number(prod.sale_price);
        const costPrice = Number(prod.cost_price);
        const itemTotal = unitPrice * item.quantity;

        subtotal += itemTotal;
        totalCmv += costPrice * item.quantity;

        orderItemsToInsert.push({
          productId: prod.id,
          productName: prod.name,
          quantity: item.quantity,
          unitPrice,
          costPrice,
          totalPrice: itemTotal,
          notes: item.notes,
        });

        // Reserva o estoque atomicamente para evitar vender o mesmo doce duas vezes
        const current = Number(prod.current_stock);
        const reserved = Number(prod.reserved_stock);
        if (current - reserved < item.quantity) {
          throw new Error(
            `Estoque insuficiente para reservar "${prod.name}". Saldo disponível: ${current - reserved}, solicitado: ${item.quantity}.`
          );
        }

        await tx.query(
          'UPDATE products SET reserved_stock = reserved_stock + $1 WHERE id = $2',
          [item.quantity, prod.id]
        );
      }

      const deliveryFee = Number(data.deliveryFee || 0);
      const discount = Number(data.discount || 0);
      const totalAmount = subtotal + deliveryFee - discount;

      // 2. Cálculo de taxas conforme canal
      let marketplaceFee = 0;
      if (data.channelId === 'ifood') {
        marketplaceFee = Math.round(totalAmount * 0.18 * 100) / 100;
      } else if (data.channelId === '99food') {
        marketplaceFee = Math.round(totalAmount * 0.15 * 100) / 100;
      } else if (data.channelId === 'loja_virtual') {
        marketplaceFee = Math.round(totalAmount * 0.03 * 100) / 100;
      } else if (data.channelId === 'pdv') {
        marketplaceFee = Math.round(totalAmount * 0.012 * 100) / 100;
      }

      const netProfit = totalAmount - totalCmv - marketplaceFee;
      const prepMinutes = data.preparationTimeMinutes || 25;
      const deadlineDate = new Date(Date.now() + prepMinutes * 60 * 1000).toISOString();

      // 3. Insere o pedido
      await tx.query(
        `INSERT INTO orders (
          id, organization_id, channel_id, external_id, order_number, customer_id, customer_name, customer_phone,
          delivery_type, delivery_address, subtotal, delivery_fee, discount, marketplace_fee, total_amount,
          estimated_cmv, estimated_net_profit, status, payment_method, payment_status, preparation_time_minutes,
          deadline_at, idempotency_key, created_at
        ) VALUES (
          $1, 'org_default', $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14,
          $15, $16, 'recebido', $17, $18, $19,
          $20, $21, CURRENT_TIMESTAMP
        )`,
        [
          orderId,
          data.channelId,
          data.externalId || null,
          orderNumber,
          data.customerId || null,
          data.customerName,
          data.customerPhone || null,
          data.deliveryType || 'balcao',
          data.deliveryAddress ? JSON.stringify(data.deliveryAddress) : null,
          subtotal,
          deliveryFee,
          discount,
          marketplaceFee,
          totalAmount,
          totalCmv,
          netProfit,
          data.paymentMethod || 'dinheiro',
          data.paymentStatus || 'pendente',
          prepMinutes,
          deadlineDate,
          data.idempotencyKey || null,
        ]
      );

      // 4. Insere itens
      for (const it of orderItemsToInsert) {
        await tx.query(
          `INSERT INTO order_items (
            id, order_id, product_id, product_name, quantity, unit_price, cost_price, total_price, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            `oit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            orderId,
            it.productId,
            it.productName,
            it.quantity,
            it.unitPrice,
            it.costPrice,
            it.totalPrice,
            it.notes || null,
          ]
        );
      }

      // 5. Gera notificação de novo pedido
      await tx.query(
        `INSERT INTO notifications (id, organization_id, type, priority, title, message, link)
         VALUES ($1, 'org_default', 'novo_pedido', 'media', $2, $3, '/pedidos')`,
        [
          `notif_ord_${orderId}`,
          `Novo Pedido ${orderNumber}`,
          `Recebido de ${data.customerName} via ${data.channelId} no valor de R$ ${totalAmount.toFixed(2)}.`,
        ]
      );
    });

    const created = await OrderService.getOrders({ orderId });
    return created[0];
  }

  /**
   * Altera status do pedido respeitando o ciclo de vida e realizando movimentações financeiras e de estoque.
   */
  static async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    reason?: string,
    userId: string = 'usr_admin'
  ): Promise<Order> {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      recebido: ['confirmado', 'cancelado'],
      confirmado: ['em_preparo', 'cancelado'],
      em_preparo: ['pronto', 'cancelado'],
      pronto: ['enviado', 'concluido', 'cancelado'],
      enviado: ['concluido', 'cancelado'],
      concluido: [],
      cancelado: [],
    };

    await transaction(async (tx) => {
      const oRes = await tx.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
      if (oRes.rows.length === 0) throw new Error('Pedido não encontrado');

      const order = oRes.rows[0];
      const currentStatus = order.status as OrderStatus;

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        throw new Error(
          `Transição de status inválida: não é permitido mudar de "${currentStatus}" para "${newStatus}".`
        );
      }

      const itemsRes = await tx.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
      const items = itemsRes.rows;

      // SE CONCLUÍDO: Confirma reserva -> Baixa definitiva do estoque físico + Gera Receita Financeira
      if (newStatus === 'concluido') {
        for (const it of items) {
          const qty = Number(it.quantity);
          const pId = it.product_id;

          await tx.query(
            `UPDATE products 
             SET current_stock = GREATEST(0, current_stock - $1),
                 reserved_stock = GREATEST(0, reserved_stock - $1),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [qty, pId]
          );

          await tx.query(
            `INSERT INTO inventory_movements (
              id, organization_id, product_id, movement_type, quantity,
              previous_stock, new_stock, reason, reference_id, user_id, idempotency_key
            ) VALUES (
              $1, 'org_default', $2, 'venda', $3,
              (SELECT current_stock + $3 FROM products WHERE id = $2),
              (SELECT current_stock FROM products WHERE id = $2),
              $4, $5, $6, $7
            )`,
            [
              `mov_sale_${orderId}_${pId}`,
              pId,
              qty,
              `Conclusão do pedido ${order.order_number}`,
              orderId,
              userId,
              `idemp_sale_${orderId}_${pId}`,
            ]
          );
        }

        await tx.query(
          `INSERT INTO financial_transactions (
            id, organization_id, order_id, channel_id, type, category, description,
            gross_amount, fee_amount, net_amount, payment_method, status, due_date, paid_at
          ) VALUES ($1, 'org_default', $2, $3, 'receita', 'Venda Concluída', $4, $5, $6, $7, $8, 'pago', CURRENT_DATE, CURRENT_TIMESTAMP)`,
          [
            `fin_ord_${orderId}`,
            orderId,
            order.channel_id,
            `Pedido ${order.order_number} - ${order.customer_name}`,
            Number(order.total_amount),
            Number(order.marketplace_fee),
            Number(order.total_amount) - Number(order.marketplace_fee),
            order.payment_method,
          ]
        );

        await tx.query(
          `UPDATE orders SET payment_status = 'aprovado' WHERE id = $1`,
          [orderId]
        );
      }

      // SE CANCELADO: Libera as reservas de estoque
      if (newStatus === 'cancelado') {
        for (const it of items) {
          const qty = Number(it.quantity);
          const pId = it.product_id;

          await tx.query(
            `UPDATE products 
             SET reserved_stock = GREATEST(0, reserved_stock - $1),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [qty, pId]
          );

          await tx.query(
            `INSERT INTO inventory_movements (
              id, organization_id, product_id, movement_type, quantity,
              previous_stock, new_stock, reason, reference_id, user_id, idempotency_key
            ) VALUES (
              $1, 'org_default', $2, 'ajuste', $3,
              (SELECT current_stock FROM products WHERE id = $2),
              (SELECT current_stock FROM products WHERE id = $2),
              $4, $5, $6, $7
            )`,
            [
              `mov_cancel_${orderId}_${pId}`,
              pId,
              qty,
              `Liberação de reserva por cancelamento do pedido ${order.order_number}`,
              orderId,
              userId,
              `idemp_cancel_${orderId}_${pId}`,
            ]
          );
        }

        await tx.query(
          `UPDATE financial_transactions SET status = 'cancelado' WHERE order_id = $1`,
          [orderId]
        );

        await tx.query(
          `UPDATE orders SET payment_status = 'estornado', cancelled_reason = $1 WHERE id = $2`,
          [reason || 'Cancelado pelo operador', orderId]
        );
      }

      await tx.query(
        `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newStatus, orderId]
      );

      await tx.query(
        `INSERT INTO audit_logs (id, organization_id, user_id, action, entity, entity_id, old_values, new_values)
         VALUES ($1, 'org_default', $2, 'update_order_status', 'orders', $3, $4, $5)`,
        [
          `aud_${Date.now()}`,
          userId,
          orderId,
          JSON.stringify({ status: currentStatus }),
          JSON.stringify({ status: newStatus, reason }),
        ]
      );
    });

    const updated = await OrderService.getOrders({ orderId });
    return updated[0];
  }
}
