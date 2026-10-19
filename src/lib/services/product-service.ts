import { query, transaction } from '../db';
import { Product, ChannelProductOverride } from '../db/types';

export interface CreateProductInput {
  name: string;
  sku: string;
  barcode?: string;
  categoryId?: string;
  description?: string;
  unit?: 'un' | 'kg' | 'g' | 'cento' | 'fatia' | 'caixa';
  salePrice: number;
  costPrice: number;
  minStock?: number;
  initialStock?: number;
  allowNegativeStock?: boolean;
  isProduced?: boolean;
  shelfLifeDays?: number;
  imageUrl?: string;
  channelPrices?: Record<string, number>;
}

export class ProductService {
  /**
   * Lista todos os produtos com categoria, estoque e overrides por canal.
   */
  static async getProducts(filter?: { categoryId?: string; search?: string; activeOnly?: boolean }): Promise<Product[]> {
    let sql = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.categoryId) {
      params.push(filter.categoryId);
      sql += ` AND p.category_id = $${params.length}`;
    }

    if (filter?.activeOnly) {
      sql += ` AND p.active = true`;
    }

    if (filter?.search) {
      params.push(`%${filter.search.toLowerCase()}%`);
      sql += ` AND (LOWER(p.name) LIKE $${params.length} OR LOWER(p.sku) LIKE $${params.length} OR LOWER(p.barcode) LIKE $${params.length})`;
    }

    sql += ` ORDER BY p.active DESC, p.name ASC`;

    const res = await query(sql, params);

    // Carrega os overrides de canais
    const overridesRes = await query(`
      SELECT 
        cpo.*,
        ch.display_name as channel_name
      FROM channel_product_overrides cpo
      JOIN channels ch ON cpo.channel_id = ch.id
    `);

    const overridesByProduct: Record<string, ChannelProductOverride[]> = {};
    overridesRes.rows.forEach((row: any) => {
      if (!overridesByProduct[row.product_id]) overridesByProduct[row.product_id] = [];
      overridesByProduct[row.product_id].push({
        ...row,
        price_override: row.price_override ? Number(row.price_override) : undefined,
      });
    });

    return res.rows.map((row: any) => {
      const current = Number(row.current_stock);
      const reserved = Number(row.reserved_stock);
      return {
        ...row,
        sale_price: Number(row.sale_price),
        cost_price: Number(row.cost_price),
        min_stock: Number(row.min_stock),
        current_stock: current,
        reserved_stock: reserved,
        available_stock: Math.max(0, current - reserved),
        allow_negative_stock: Boolean(row.allow_negative_stock),
        active: Boolean(row.active),
        is_produced: Boolean(row.is_produced),
        overrides: overridesByProduct[row.id] || [],
      };
    });
  }

  /**
   * Obtém detalhes de um produto específico.
   */
  static async getProductById(id: string): Promise<Product | null> {
    const res = await query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    const overridesRes = await query(
      `SELECT cpo.*, ch.display_name as channel_name
       FROM channel_product_overrides cpo
       JOIN channels ch ON cpo.channel_id = ch.id
       WHERE cpo.product_id = $1`,
      [id]
    );

    const current = Number(row.current_stock);
    const reserved = Number(row.reserved_stock);

    return {
      ...row,
      sale_price: Number(row.sale_price),
      cost_price: Number(row.cost_price),
      min_stock: Number(row.min_stock),
      current_stock: current,
      reserved_stock: reserved,
      available_stock: Math.max(0, current - reserved),
      allow_negative_stock: Boolean(row.allow_negative_stock),
      active: Boolean(row.active),
      is_produced: Boolean(row.is_produced),
      overrides: overridesRes.rows.map((o: any) => ({
        ...o,
        price_override: o.price_override ? Number(o.price_override) : undefined,
      })),
    };
  }

  /**
   * Criação de novo produto com validações de unicidade de SKU.
   */
  static async createProduct(data: CreateProductInput, userId: string = 'usr_admin'): Promise<Product> {
    const sku = data.sku.trim().toUpperCase();
    const existing = await query('SELECT id FROM products WHERE sku = $1', [sku]);
    if (existing.rows.length > 0) {
      throw new Error(`O SKU "${sku}" já está cadastrado em outro produto.`);
    }

    const productId = `prd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await transaction(async (tx) => {
      await tx.query(
        `INSERT INTO products (
          id, organization_id, category_id, sku, barcode, name, description, unit,
          sale_price, cost_price, min_stock, current_stock, reserved_stock,
          allow_negative_stock, is_produced, active, shelf_life_days, image_url
        ) VALUES ($1, 'org_default', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, $12, $13, true, $14, $15)`,
        [
          productId,
          data.categoryId || null,
          sku,
          data.barcode || null,
          data.name.trim(),
          data.description || null,
          data.unit || 'un',
          data.salePrice,
          data.costPrice,
          data.minStock || 5,
          data.initialStock || 0,
          Boolean(data.allowNegativeStock),
          data.isProduced !== undefined ? Boolean(data.isProduced) : true,
          data.shelfLifeDays || 5,
          data.imageUrl || null,
        ]
      );

      if (data.initialStock && data.initialStock > 0) {
        const movId = `mov_init_${Date.now()}`;
        await tx.query(
          `INSERT INTO inventory_movements (
            id, organization_id, product_id, movement_type, quantity,
            previous_stock, new_stock, reason, user_id, idempotency_key
          ) VALUES ($1, 'org_default', $2, 'inventario', $3, 0, $3, 'Estoque inicial de cadastro', $4, $5)`,
          [movId, productId, data.initialStock, userId, `idemp_init_${productId}`]
        );
      }

      const channelsRes = await tx.query('SELECT id FROM channels');
      for (const ch of channelsRes.rows) {
        const channelPrice = data.channelPrices?.[ch.id] || data.salePrice;
        await tx.query(
          `INSERT INTO channel_product_overrides (
            id, product_id, channel_id, price_override, is_available, sync_status
          ) VALUES ($1, $2, $3, $4, true, 'pendente')`,
          [`cpo_${productId}_${ch.id}`, productId, ch.id, channelPrice]
        );

        await tx.query(
          `INSERT INTO integration_queue (
            id, channel_id, task_type, payload, idempotency_key, status
          ) VALUES ($1, $2, 'sync_product', $3, $4, 'pendente')`,
          [
            `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            ch.id,
            JSON.stringify({
              productId,
              sku,
              name: data.name,
              price: channelPrice,
              available: true,
            }),
            `idemp_sync_new_${productId}_${ch.id}`,
          ]
        );
      }

      await tx.query(
        `INSERT INTO audit_logs (id, organization_id, user_id, action, entity, entity_id, new_values)
         VALUES ($1, 'org_default', $2, 'create_product', 'products', $3, $4)`,
        [`aud_${Date.now()}`, userId, productId, JSON.stringify({ name: data.name, sku, price: data.salePrice })]
      );
    });

    const created = await ProductService.getProductById(productId);
    return created!;
  }

  /**
   * Altera status ativo/inativo do produto.
   */
  static async toggleProductStatus(productId: string, active: boolean, userId: string = 'usr_admin'): Promise<{ success: boolean; syncStatuses: Record<string, string> }> {
    const syncStatuses: Record<string, string> = {};

    await transaction(async (tx) => {
      const prodRes = await tx.query('SELECT sku, name, active FROM products WHERE id = $1 FOR UPDATE', [productId]);
      if (prodRes.rows.length === 0) throw new Error('Produto não encontrado');

      const oldStatus = prodRes.rows[0].active;
      const sku = prodRes.rows[0].sku;

      await tx.query(
        'UPDATE products SET active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [active, productId]
      );

      await tx.query(
        `INSERT INTO product_history (id, product_id, user_id, field_changed, old_value, new_value, reason)
         VALUES ($1, $2, $3, 'active', $4, $5, $6)`,
        [
          `ph_${Date.now()}`,
          productId,
          userId,
          String(oldStatus),
          String(active),
          active ? 'Produto reativado pelo operador' : 'Produto desativado temporariamente pelo operador',
        ]
      );

      const channelsRes = await tx.query('SELECT id, display_name FROM channels WHERE status = $1', ['conectado']);

      for (const ch of channelsRes.rows) {
        await tx.query(
          `UPDATE channel_product_overrides 
           SET is_available = $1, sync_status = 'pendente', last_error = NULL, updated_at = CURRENT_TIMESTAMP 
           WHERE product_id = $2 AND channel_id = $3`,
          [active, productId, ch.id]
        );

        const queueId = `que_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await tx.query(
          `INSERT INTO integration_queue (
            id, channel_id, task_type, payload, idempotency_key, status
          ) VALUES ($1, $2, 'sync_status', $3, $4, 'pendente')`,
          [
            queueId,
            ch.id,
            JSON.stringify({
              productId,
              sku,
              isAvailable: active,
              reason: active ? 'Ativado pelo usuário' : 'Desativado pelo usuário',
            }),
            `idemp_status_${productId}_${ch.id}_${Date.now()}`,
          ]
        );

        syncStatuses[ch.id] = 'pendente';
      }
    });

    return {
      success: true,
      syncStatuses,
    };
  }

  /**
   * Atualização de preço ou dados do produto
   */
  static async updateProduct(
    id: string,
    data: Partial<CreateProductInput>,
    userId: string = 'usr_admin'
  ): Promise<Product> {
    await transaction(async (tx) => {
      const existing = await tx.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [id]);
      if (existing.rows.length === 0) throw new Error('Produto não encontrado');

      const old = existing.rows[0];

      await tx.query(
        `UPDATE products SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          category_id = COALESCE($3, category_id),
          sale_price = COALESCE($4, sale_price),
          cost_price = COALESCE($5, cost_price),
          min_stock = COALESCE($6, min_stock),
          shelf_life_days = COALESCE($7, shelf_life_days),
          image_url = COALESCE($8, image_url),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9`,
        [
          data.name?.trim(),
          data.description,
          data.categoryId,
          data.salePrice,
          data.costPrice,
          data.minStock,
          data.shelfLifeDays,
          data.imageUrl,
          id,
        ]
      );

      if (data.salePrice && Number(data.salePrice) !== Number(old.sale_price)) {
        await tx.query(
          `INSERT INTO product_history (id, product_id, user_id, field_changed, old_value, new_value, reason)
           VALUES ($1, $2, $3, 'sale_price', $4, $5, 'Alteração de preço de venda no painel')`,
          [`ph_${Date.now()}`, id, userId, String(old.sale_price), String(data.salePrice)]
        );
      }
    });

    const updated = await ProductService.getProductById(id);
    return updated!;
  }
}
