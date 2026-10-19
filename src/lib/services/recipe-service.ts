import { query, transaction } from '../db';
import { Recipe, RecipeItem, ProductionOrder } from '../db/types';

export class RecipeService {
  /**
   * Lista todas as receitas cadastradas com ingredientes.
   */
  static async getRecipes(): Promise<Recipe[]> {
    const res = await query(`
      SELECT 
        r.*,
        p.name as product_name
      FROM recipes r
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.name ASC
    `);

    const recipeIds = res.rows.map((r: any) => r.id);
    let itemsByRecipe: Record<string, RecipeItem[]> = {};

    if (recipeIds.length > 0) {
      const itemsRes = await query(
        `SELECT 
          ri.*,
          i.name as ingredient_name,
          i.unit as ingredient_unit,
          i.cost_per_unit
         FROM recipe_items ri
         JOIN ingredients i ON ri.ingredient_id = i.id
         WHERE ri.recipe_id = ANY($1::text[])`,
        [recipeIds]
      );

      itemsRes.rows.forEach((it: any) => {
        if (!itemsByRecipe[it.recipe_id]) itemsByRecipe[it.recipe_id] = [];
        const qty = Number(it.quantity);
        const costPerUnit = Number(it.cost_per_unit);
        itemsByRecipe[it.recipe_id].push({
          ...it,
          quantity: qty,
          cost_per_unit: costPerUnit,
          item_cost: qty * costPerUnit,
        });
      });
    }

    return res.rows.map((row: any) => ({
      ...row,
      yield_quantity: Number(row.yield_quantity),
      batch_cost: Number(row.batch_cost),
      unit_cost: Number(row.unit_cost),
      packaging_cost: Number(row.packaging_cost),
      active: Boolean(row.active),
      items: itemsByRecipe[row.id] || [],
    }));
  }

  /**
   * Executa a produção de um ou mais lotes da receita.
   * Transação Atômica:
   * 1. Baixa todos os insumos proporcionalmente ao número de lotes
   * 2. Dá entrada no produto acabado no estoque
   * 3. Cria lote com data de fabricação e validade
   * 4. Registra perdas se houver
   */
  static async produceRecipe(params: {
    recipeId: string;
    batchCount: number;
    producedQuantity?: number;
    lossQuantity?: number;
    lossReason?: string;
    notes?: string;
    userId?: string;
  }): Promise<{ productionOrder: ProductionOrder; lotNumber: string }> {
    const {
      recipeId,
      batchCount,
      lossQuantity = 0,
      lossReason,
      notes,
      userId = 'usr_confeiteira',
    } = params;

    if (batchCount <= 0) {
      throw new Error('A quantidade de lotes produzidos deve ser maior que zero.');
    }

    return await transaction(async (tx) => {
      // 1. Busca dados da receita e produto
      const rRes = await tx.query(
        `SELECT r.*, p.name as product_name, p.shelf_life_days
         FROM recipes r
         JOIN products p ON r.product_id = p.id
         WHERE r.id = $1 FOR UPDATE`,
        [recipeId]
      );
      if (rRes.rows.length === 0) throw new Error('Receita não encontrada.');

      const recipe = rRes.rows[0];
      const productId = recipe.product_id;
      const plannedQuantity = Number(recipe.yield_quantity) * batchCount;
      const producedQuantity = params.producedQuantity !== undefined 
        ? params.producedQuantity 
        : plannedQuantity - lossQuantity;

      // 2. Busca ingredientes da receita
      const itemsRes = await tx.query(
        `SELECT ri.*, i.name as ingredient_name, i.current_stock, i.cost_per_unit
         FROM recipe_items ri
         JOIN ingredients i ON ri.ingredient_id = i.id
         WHERE ri.recipe_id = $1 FOR UPDATE`,
        [recipeId]
      );

      if (itemsRes.rows.length === 0) {
        throw new Error('A receita não possui ingredientes cadastrados na ficha técnica.');
      }

      let calculatedBatchCost = 0;

      // 3. Valida e baixa cada ingrediente
      for (const item of itemsRes.rows) {
        const requiredQty = Number(item.quantity) * batchCount;
        const currentStock = Number(item.current_stock);
        const costPerUnit = Number(item.cost_per_unit);

        calculatedBatchCost += requiredQty * costPerUnit;

        if (currentStock < requiredQty) {
          throw new Error(
            `Estoque insuficiente do insumo "${item.ingredient_name}". Necessário: ${requiredQty.toFixed(2)}, disponível: ${currentStock.toFixed(2)}.`
          );
        }

        const newIngStock = currentStock - requiredQty;
        await tx.query(
          'UPDATE ingredients SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newIngStock, item.ingredient_id]
        );

        // Movimentação de saída do insumo
        const movIngId = `mov_ing_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await tx.query(
          `INSERT INTO inventory_movements (
            id, organization_id, ingredient_id, movement_type, quantity,
            previous_stock, new_stock, reason, reference_id, user_id, idempotency_key
          ) VALUES ($1, 'org_default', $2, 'saida', $3, $4, $5, $6, $7, $8, $9)`,
          [
            movIngId,
            item.ingredient_id,
            requiredQty,
            currentStock,
            newIngStock,
            `Consumo na produção da receita "${recipe.name}" (Lote x${batchCount})`,
            recipeId,
            userId,
            `idemp_prod_${recipeId}_${item.ingredient_id}_${Date.now()}`,
          ]
        );
      }

      // Adiciona custo de embalagens proporcional
      const totalPackagingCost = Number(recipe.packaging_cost || 0) * batchCount;
      const totalCost = calculatedBatchCost + totalPackagingCost;
      const unitCost = producedQuantity > 0 ? totalCost / producedQuantity : 0;

      // 4. Cria Lote com validade
      const shelfLifeDays = Number(recipe.shelf_life_days || 5);
      const lotNumber = `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const lotId = `lot_${Date.now()}`;

      await tx.query(
        `INSERT INTO lots (
          id, organization_id, product_id, lot_number, manufactured_at, expires_at,
          initial_quantity, current_quantity, status
        ) VALUES (
          $1, 'org_default', $2, $3, CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP + ($4 || ' days')::interval,
          $5, $5, 'valido'
        )`,
        [lotId, productId, lotNumber, shelfLifeDays, producedQuantity]
      );

      // 5. Dá entrada no produto acabado no estoque
      const prodRes = await tx.query(
        'SELECT current_stock FROM products WHERE id = $1 FOR UPDATE',
        [productId]
      );
      const prevProdStock = Number(prodRes.rows[0].current_stock);
      const newProdStock = prevProdStock + producedQuantity;

      await tx.query(
        `UPDATE products 
         SET current_stock = $1, cost_price = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [newProdStock, unitCost, productId]
      );

      // Movimentação de entrada de produto acabado
      const movProdId = `mov_prd_${Date.now()}`;
      await tx.query(
        `INSERT INTO inventory_movements (
          id, organization_id, product_id, movement_type, quantity,
          previous_stock, new_stock, reason, reference_id, user_id, idempotency_key
        ) VALUES ($1, 'org_default', $2, 'entrada', $3, $4, $5, $6, $7, $8, $9)`,
        [
          movProdId,
          productId,
          producedQuantity,
          prevProdStock,
          newProdStock,
          `Entrada de produção finalizada Lote #${lotNumber}`,
          lotId,
          userId,
          `idemp_prod_in_${lotId}`,
        ]
      );

      // 6. Registra perda se houver
      if (lossQuantity > 0) {
        await tx.query(
          `INSERT INTO inventory_movements (
            id, organization_id, product_id, movement_type, quantity,
            previous_stock, new_stock, reason, reference_id, user_id
          ) VALUES ($1, 'org_default', $2, 'perda', $3, $4, $4, $5, $6, $7)`,
          [
            `mov_loss_${Date.now()}`,
            productId,
            lossQuantity,
            newProdStock,
            `Perda no processo de produção: ${lossReason || 'Descarte técnico/quebra'}`,
            lotId,
            userId,
          ]
        );
      }

      // 7. Registra ordem de produção
      const orderId = `pord_${Date.now()}`;
      await tx.query(
        `INSERT INTO production_orders (
          id, organization_id, recipe_id, product_id, lot_id, batch_count,
          planned_quantity, produced_quantity, loss_quantity, loss_reason,
          total_cost, unit_cost, status, notes, created_by
        ) VALUES ($1, 'org_default', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'concluido', $12, $13)`,
        [
          orderId,
          recipeId,
          productId,
          lotId,
          batchCount,
          plannedQuantity,
          producedQuantity,
          lossQuantity,
          lossReason || null,
          totalCost,
          unitCost,
          notes || null,
          userId,
        ]
      );

      const pOrd = await tx.query(
        `SELECT po.*, r.name as recipe_name, p.name as product_name
         FROM production_orders po
         JOIN recipes r ON po.recipe_id = r.id
         JOIN products p ON po.product_id = p.id
         WHERE po.id = $1`,
        [orderId]
      );

      return {
        productionOrder: pOrd.rows[0],
        lotNumber,
      };
    });
  }
}
