import { describe, it, expect, beforeAll } from 'vitest';
import { getDb, query } from '../lib/db';
import { RecipeService } from '../lib/services/recipe-service';

describe('RecipeService - Produção e Baixa de Insumos', () => {
  beforeAll(async () => {
    await getDb();
  });

  it('deve listar receitas e calcular custo de lote', async () => {
    const recipes = await RecipeService.getRecipes();
    expect(recipes.length).toBeGreaterThan(0);
    expect(recipes[0].items).toBeDefined();
    expect(recipes[0].batch_cost).toBeGreaterThan(0);
  });

  it('deve produzir receita, baixando insumos e criando lote com validade', async () => {
    const recipes = await RecipeService.getRecipes();
    const recipe = recipes.find(r => r.name.includes('Brigadeiro')) || recipes[0];

    // Checa estoque de leite condensado antes
    const ingBefore = await query('SELECT current_stock FROM ingredients WHERE id = $1', ['ing_leite_cond']);
    const ingStockBefore = Number(ingBefore.rows[0].current_stock);

    const res = await RecipeService.produceRecipe({
      recipeId: recipe.id,
      batchCount: 1,
      lossQuantity: 0,
      notes: 'Lote teste unitário',
    });

    expect(res.lotNumber).toMatch(/^LOT-\d{4}-\d+/);
    expect(res.productionOrder).toBeDefined();

    // Insumo deve ter sido reduzido
    const ingAfter = await query('SELECT current_stock FROM ingredients WHERE id = $1', ['ing_leite_cond']);
    expect(Number(ingAfter.rows[0].current_stock)).toBeLessThan(ingStockBefore);
  });
});
