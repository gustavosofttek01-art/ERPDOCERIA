import { query, transaction } from '../db';
import { InventoryMovement } from '../db/types';

export interface MoveStockParams {
  organizationId?: string;
  productId?: string;
  ingredientId?: string;
  movementType: 'entrada' | 'saida' | 'reserva' | 'venda' | 'perda' | 'ajuste' | 'devolucao' | 'inventario';
  quantity: number;
  reason: string;
  referenceId?: string;
  userId?: string;
  idempotencyKey?: string;
  allowNegativeOverride?: boolean;
}

export class StockService {
  /**
   * Executa movimentação atômica de estoque de produto ou ingrediente.
   * Garante idempotência e bloqueia saldo negativo (salvo exceção explícita).
   */
  static async moveStock(params: MoveStockParams): Promise<{ success: boolean; movementId: string; newStock: number }> {
    const {
      organizationId = 'org_default',
      productId,
      ingredientId,
      movementType,
      quantity,
      reason,
      referenceId,
      userId = 'usr_admin',
      idempotencyKey,
      allowNegativeOverride = false,
    } = params;

    if (!productId && !ingredientId) {
      throw new Error('É necessário informar productId ou ingredientId para movimentar estoque.');
    }
    if (quantity <= 0) {
      throw new Error('A quantidade da movimentação deve ser maior que zero.');
    }

    // Se houver idempotencyKey, verifica se já foi executada
    if (idempotencyKey) {
      const existing = await query(
        'SELECT id, new_stock FROM inventory_movements WHERE idempotency_key = $1',
        [idempotencyKey]
      );
      if (existing.rows.length > 0) {
        return {
          success: true,
          movementId: existing.rows[0].id,
          newStock: Number(existing.rows[0].new_stock),
        };
      }
    }

    return await transaction(async (tx) => {
      let currentStock = 0;
      let minStock = 0;
      let allowNegative = allowNegativeOverride;
      let targetName = '';

      if (productId) {
        const prodRes = await tx.query(
          'SELECT name, current_stock, min_stock, allow_negative_stock FROM products WHERE id = $1 FOR UPDATE',
          [productId]
        );
        if (prodRes.rows.length === 0) {
          throw new Error(`Produto não encontrado: ${productId}`);
        }
        currentStock = Number(prodRes.rows[0].current_stock);
        minStock = Number(prodRes.rows[0].min_stock);
        allowNegative = allowNegative || Boolean(prodRes.rows[0].allow_negative_stock);
        targetName = prodRes.rows[0].name;
      } else if (ingredientId) {
        const ingRes = await tx.query(
          'SELECT name, current_stock, min_stock FROM ingredients WHERE id = $1 FOR UPDATE',
          [ingredientId]
        );
        if (ingRes.rows.length === 0) {
          throw new Error(`Ingrediente não encontrado: ${ingredientId}`);
        }
        currentStock = Number(ingRes.rows[0].current_stock);
        minStock = Number(ingRes.rows[0].min_stock);
        targetName = ingRes.rows[0].name;
      }

      // Calcula novo estoque de acordo com o tipo
      let newStock = currentStock;
      const isPositive = ['entrada', 'devolucao'].includes(movementType);
      const isNegative = ['saida', 'venda', 'perda'].includes(movementType);

      if (movementType === 'inventario' || movementType === 'ajuste') {
        newStock = quantity; // Valor absoluto
      } else if (isPositive) {
        newStock = currentStock + quantity;
      } else if (isNegative) {
        if (!allowNegative && currentStock < quantity) {
          throw new Error(
            `Estoque insuficiente para "${targetName}". Saldo atual: ${currentStock}, solicitado: ${quantity}.`
          );
        }
        newStock = currentStock - quantity;
      }

      // Atualiza tabela de origem
      if (productId) {
        await tx.query(
          'UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newStock, productId]
        );
      } else if (ingredientId) {
        await tx.query(
          'UPDATE ingredients SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newStock, ingredientId]
        );
      }

      // Registra movimentação no histórico
      const movementId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await tx.query(
        `INSERT INTO inventory_movements (
          id, organization_id, product_id, ingredient_id, movement_type, quantity,
          previous_stock, new_stock, reason, reference_id, user_id, idempotency_key
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          movementId,
          organizationId,
          productId || null,
          ingredientId || null,
          movementType,
          quantity,
          currentStock,
          newStock,
          reason,
          referenceId || null,
          userId,
          idempotencyKey || null,
        ]
      );

      // Alerta de estoque baixo gerado automaticamente
      if (newStock <= minStock) {
        const notifId = `notif_low_${Date.now()}`;
        await tx.query(
          `INSERT INTO notifications (id, organization_id, type, priority, title, message, link)
           VALUES ($1, $2, 'alerta_estoque', 'alta', $3, $4, '/estoque')`,
          [
            notifId,
            organizationId,
            `Estoque Baixo: ${targetName}`,
            `O item "${targetName}" atingiu ${newStock} unidades (mínimo de segurança: ${minStock}).`,
          ]
        );
      }

      return {
        success: true,
        movementId,
        newStock,
      };
    });
  }

  /**
   * Reserva estoque para pedidos em preparo sem subtrair do saldo físico imediatamente.
   */
  static async reserveProduct(productId: string, quantity: number): Promise<void> {
    await transaction(async (tx) => {
      const prodRes = await tx.query(
        'SELECT current_stock, reserved_stock, name FROM products WHERE id = $1 FOR UPDATE',
        [productId]
      );
      if (prodRes.rows.length === 0) throw new Error('Produto não encontrado');

      const current = Number(prodRes.rows[0].current_stock);
      const reserved = Number(prodRes.rows[0].reserved_stock);
      const available = current - reserved;

      if (available < quantity) {
        throw new Error(
          `Estoque disponível insuficiente para reservar "${prodRes.rows[0].name}". Disponível: ${available}, solicitado: ${quantity}`
        );
      }

      await tx.query(
        'UPDATE products SET reserved_stock = reserved_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [quantity, productId]
      );
    });
  }

  /**
   * Libera reserva de estoque (ex: cancelamento de pedido em preparo).
   */
  static async releaseReservation(productId: string, quantity: number): Promise<void> {
    await query(
      `UPDATE products 
       SET reserved_stock = GREATEST(0, reserved_stock - $1), updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [quantity, productId]
    );
  }

  /**
   * Conclui a reserva: remove da reserva E desconta do estoque físico permanentemente.
   */
  static async commitReservation(
    productId: string,
    quantity: number,
    orderId: string,
    userId: string = 'usr_admin'
  ): Promise<void> {
    await transaction(async (tx) => {
      const prodRes = await tx.query(
        'SELECT current_stock, reserved_stock FROM products WHERE id = $1 FOR UPDATE',
        [productId]
      );
      if (prodRes.rows.length === 0) throw new Error('Produto não encontrado');

      const prevStock = Number(prodRes.rows[0].current_stock);
      const newStock = Math.max(0, prevStock - quantity);

      await tx.query(
        `UPDATE products 
         SET current_stock = $1, 
             reserved_stock = GREATEST(0, reserved_stock - $2), 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [newStock, quantity, productId]
      );

      const movId = `mov_sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await tx.query(
        `INSERT INTO inventory_movements (
          id, organization_id, product_id, movement_type, quantity,
          previous_stock, new_stock, reason, reference_id, user_id, idempotency_key
        ) VALUES ($1, 'org_default', $2, 'venda', $3, $4, $5, $6, $7, $8, $9)`,
        [
          movId,
          productId,
          quantity,
          prevStock,
          newStock,
          `Conclusão do pedido #${orderId}`,
          orderId,
          userId,
          `idemp_commit_${orderId}_${productId}`,
        ]
      );
    });
  }

  /**
   * Obtém extrato de movimentações de estoque.
   */
  static async getMovements(limit: number = 50): Promise<InventoryMovement[]> {
    const res = await query(
      `SELECT 
        m.*,
        p.name as product_name,
        i.name as ingredient_name,
        u.name as user_name
       FROM inventory_movements m
       LEFT JOIN products p ON m.product_id = p.id
       LEFT JOIN ingredients i ON m.ingredient_id = i.id
       LEFT JOIN users u ON m.user_id = u.id
       ORDER BY m.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows.map((row: any) => ({
      ...row,
      quantity: Number(row.quantity),
      previous_stock: Number(row.previous_stock),
      new_stock: Number(row.new_stock),
    }));
  }
}
