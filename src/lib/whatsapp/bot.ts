import { query } from '../db';
import { ProductService } from '../services/product-service';

export class WhatsAppBot {
  /**
   * Processador de comandos administrativos via WhatsApp.
   */
  static async handleCommand(commandText: string, senderPhone: string): Promise<string> {
    const parts = commandText.trim().split(' ');
    const command = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim();

    // Validação de autorização: verifica se o remetente é um usuário cadastrado com permissão
    const cleanDigits = senderPhone.replace(/\D/g, '').slice(-8);
    const userRes = await query(
      "SELECT id, name, role FROM users WHERE regexp_replace(phone, '[^0-9]', '', 'g') LIKE $1 AND active = true",
      [`%${cleanDigits}%`]
    );

    const isAuthorized = userRes.rows.length > 0 && ['admin', 'gerente'].includes(userRes.rows[0].role);
    const userName = userRes.rows[0]?.name || 'Operador';

    switch (command) {
      case '/estoque': {
        return await this.handleStockQuery(arg);
      }

      case '/vendas': {
        return await this.handleSalesQuery();
      }

      case '/pedidos': {
        return await this.handleOrdersQuery();
      }

      case '/desativar': {
        if (!isAuthorized) {
          return `⛔ Acesso Negado: Apenas administradores e gerentes autorizados podem desativar produtos pelo WhatsApp. Seu número: ${senderPhone}`;
        }
        return await this.handleDeactivateProduct(arg, userRes.rows[0].id);
      }

      case '/ativar': {
        if (!isAuthorized) {
          return `⛔ Acesso Negado: Apenas administradores e gerentes autorizados podem ativar produtos pelo WhatsApp.`;
        }
        return await this.handleActivateProduct(arg, userRes.rows[0].id);
      }

      case '/ajuda':
      default: {
        return `🍰 *DoceControl ERP - Comandos Administrativos*\n\n` +
          `• */estoque [nome ou SKU]*: Consulta saldo disponível e reservas\n` +
          `• */vendas*: Resumo de vendas e faturamento de hoje\n` +
          `• */pedidos*: Pedidos em andamento e atrasados\n` +
          `• */desativar [SKU]*: Pausa venda do produto no iFood/loja\n` +
          `• */ativar [SKU]*: Reativa produto para venda\n` +
          `• */ajuda*: Exibe esta mensagem de apoio`;
      }
    }
  }

  private static async handleStockQuery(searchTerm: string): Promise<string> {
    if (!searchTerm) {
      const lowStock = await query(`
        SELECT name, sku, current_stock, min_stock, unit 
        FROM products 
        WHERE active = true AND current_stock <= min_stock
        LIMIT 5
      `);

      if (lowStock.rows.length === 0) {
        return `✅ *Estoque DoceControl*: Todos os produtos estão com níveis normais acima do estoque mínimo.`;
      }

      let msg = `⚠️ *Produtos com Estoque Baixo*:\n`;
      lowStock.rows.forEach((p: any) => {
        msg += `• *${p.name}* (${p.sku}): ${Number(p.current_stock)} ${p.unit} (Mín: ${Number(p.min_stock)})\n`;
      });
      return msg;
    }

    const prods = await query(`
      SELECT name, sku, current_stock, reserved_stock, unit, sale_price, active
      FROM products
      WHERE LOWER(name) LIKE $1 OR LOWER(sku) LIKE $1
      LIMIT 5
    `, [`%${searchTerm.toLowerCase()}%`]);

    if (prods.rows.length === 0) {
      return `🔍 Nenhum produto encontrado com o termo "${searchTerm}". Verifique o nome ou SKU digitado.`;
    }

    let msg = `📦 *Consulta de Estoque* ("${searchTerm}"):\n\n`;
    prods.rows.forEach((p: any) => {
      const current = Number(p.current_stock);
      const reserved = Number(p.reserved_stock);
      const available = Math.max(0, current - reserved);
      const statusIcon = p.active ? '🟢' : '🔴';

      msg += `${statusIcon} *${p.name}*\n`;
      msg += `   SKU: ${p.sku} | Preço: R$ ${Number(p.sale_price).toFixed(2)}\n`;
      msg += `   Estoque Físico: ${current} ${p.unit}\n`;
      msg += `   Reservado: ${reserved} ${p.unit} | *Disponível: ${available} ${p.unit}*\n\n`;
    });

    return msg.trim();
  }

  private static async handleSalesQuery(): Promise<string> {
    const res = await query(`
      SELECT 
        COUNT(id) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(marketplace_fee), 0) as total_fees,
        COALESCE(SUM(estimated_net_profit), 0) as estimated_profit
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE AND status != 'cancelado'
    `);

    const row = res.rows[0];
    const totalSales = Number(row?.total_sales || 0);
    const ordersCount = Number(row?.total_orders || 0);
    const totalFees = Number(row?.total_fees || 0);
    const profit = Number(row?.estimated_profit || 0);
    const avgTicket = ordersCount > 0 ? totalSales / ordersCount : 0;

    return `📊 *Resumo de Vendas de Hoje* (${new Date().toLocaleDateString('pt-BR')}):\n\n` +
      `• *Faturamento Bruto*: R$ ${totalSales.toFixed(2)}\n` +
      `• *Total de Pedidos*: ${ordersCount}\n` +
      `• *Ticket Médio*: R$ ${avgTicket.toFixed(2)}\n` +
      `• *Taxas de Canais*: -R$ ${totalFees.toFixed(2)}\n` +
      `• *Lucro Estimado*: R$ ${profit.toFixed(2)}\n\n` +
      `Acesse o painel web para detalhamento por canal e DRE completa.`;
  }

  private static async handleOrdersQuery(): Promise<string> {
    const ordersRes = await query(`
      SELECT 
        o.order_number, o.customer_name, o.status, o.total_amount,
        c.display_name as channel_name,
        ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o.deadline_at))/60) as delayed_minutes
      FROM orders o
      JOIN channels c ON o.channel_id = c.id
      WHERE o.status NOT IN ('concluido', 'cancelado')
      ORDER BY o.created_at DESC
      LIMIT 6
    `);

    if (ordersRes.rows.length === 0) {
      return `🎉 Nenhum pedido em preparo no momento! Todas as entregas estão em dia.`;
    }

    let msg = `📋 *Pedidos em Andamento* (${ordersRes.rows.length}):\n\n`;
    ordersRes.rows.forEach((o: any) => {
      const isDelayed = Number(o.delayed_minutes) > 0;
      const delayBadge = isDelayed ? `🚨 *ATRASADO ${o.delayed_minutes}m*` : '⏱️ No prazo';

      msg += `• *${o.order_number}* (${o.channel_name}) - ${delayBadge}\n`;
      msg += `   Cliente: ${o.customer_name} | R$ ${Number(o.total_amount).toFixed(2)}\n`;
      msg += `   Status: *${o.status.toUpperCase()}*\n\n`;
    });

    return msg.trim();
  }

  private static async handleDeactivateProduct(sku: string, userId: string): Promise<string> {
    if (!sku) {
      return `⚠️ Informe o SKU do produto a ser desativado. Exemplo: */desativar BRIG-PIST-01*`;
    }

    const prodRes = await query('SELECT id, name, sku, active FROM products WHERE LOWER(sku) = $1', [sku.toLowerCase()]);
    if (prodRes.rows.length === 0) {
      return `❌ Produto com SKU "${sku}" não foi localizado no cadastro.`;
    }

    const prod = prodRes.rows[0];
    if (!prod.active) {
      return `ℹ️ O produto "${prod.name}" (${prod.sku}) já está desativado no sistema.`;
    }

    await ProductService.toggleProductStatus(prod.id, false, userId);

    return `🛑 *Produto Desativado com Sucesso!*\n\n` +
      `• *Item*: ${prod.name}\n` +
      `• *SKU*: ${prod.sku}\n` +
      `• *Canais Notificados*: iFood, 99Food e Loja Virtual.\n` +
      `A alteração foi enfileirada e os canais estão sincronizando.`;
  }

  private static async handleActivateProduct(sku: string, userId: string): Promise<string> {
    if (!sku) {
      return `⚠️ Informe o SKU do produto a ser reativado. Exemplo: */ativar BRIG-PIST-01*`;
    }

    const prodRes = await query('SELECT id, name, sku, active FROM products WHERE LOWER(sku) = $1', [sku.toLowerCase()]);
    if (prodRes.rows.length === 0) {
      return `❌ Produto com SKU "${sku}" não foi localizado.`;
    }

    const prod = prodRes.rows[0];
    await ProductService.toggleProductStatus(prod.id, true, userId);

    return `🟢 *Produto Reativado com Sucesso!*\n\n` +
      `• *Item*: ${prod.name}\n` +
      `• *SKU*: ${prod.sku}\n` +
      `• *Disponibilidade*: Restaurada para venda em todos os canais conectados.`;
  }
}
