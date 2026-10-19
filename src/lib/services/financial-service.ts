import { query } from '../db';
import { FinancialTransaction } from '../db/types';

export class FinancialService {
  /**
   * Resumo de indicadores financeiros calculados a partir das transações reais e pedidos.
   */
  static async getSummary(): Promise<{
    todaySales: number;
    todayOrdersCount: number;
    totalRevenue: number;
    totalMarketplaceFees: number;
    totalCmv: number;
    totalExpenses: number;
    estimatedNetProfit: number;
    netMarginPercent: number;
    channelBreakdown: { channel: string; revenue: number; fees: number; ordersCount: number }[];
  }> {
    // Vendas de hoje (pedidos concluídos ou pagos)
    const todayRes = await query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as today_sales,
        COUNT(id) as today_orders
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE AND status != 'cancelado'
    `);

    // Totais de receitas e taxas de pedidos
    const totalsRes = await query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(marketplace_fee), 0) as total_fees,
        COALESCE(SUM(estimated_cmv), 0) as total_cmv
      FROM orders
      WHERE status != 'cancelado'
    `);

    // Total de despesas lançadas no financeiro
    const expRes = await query(`
      SELECT COALESCE(SUM(gross_amount), 0) as total_expenses
      FROM financial_transactions
      WHERE type = 'despesa' AND status = 'pago'
    `);

    // Faturamento por canal
    const chRes = await query(`
      SELECT 
        c.display_name as channel,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COALESCE(SUM(o.marketplace_fee), 0) as fees,
        COUNT(o.id) as orders_count
      FROM channels c
      LEFT JOIN orders o ON c.id = o.channel_id AND o.status != 'cancelado'
      GROUP BY c.id, c.display_name
      ORDER BY revenue DESC
    `);

    const totalRevenue = Number(totalsRes.rows[0]?.total_revenue || 0);
    const totalFees = Number(totalsRes.rows[0]?.total_fees || 0);
    const totalCmv = Number(totalsRes.rows[0]?.total_cmv || 0);
    const totalExpenses = Number(expRes.rows[0]?.total_expenses || 0);
    const estimatedNetProfit = totalRevenue - totalFees - totalCmv - totalExpenses;
    const netMarginPercent = totalRevenue > 0 ? (estimatedNetProfit / totalRevenue) * 100 : 0;

    return {
      todaySales: Number(todayRes.rows[0]?.today_sales || 0),
      todayOrdersCount: Number(todayRes.rows[0]?.today_orders || 0),
      totalRevenue,
      totalMarketplaceFees: totalFees,
      totalCmv,
      totalExpenses,
      estimatedNetProfit,
      netMarginPercent: Math.round(netMarginPercent * 10) / 10,
      channelBreakdown: chRes.rows.map((r: any) => ({
        channel: r.channel,
        revenue: Number(r.revenue),
        fees: Number(r.fees),
        ordersCount: Number(r.orders_count),
      })),
    };
  }

  /**
   * Obtém histórico de transações financeiras.
   */
  static async getTransactions(limit: number = 50): Promise<FinancialTransaction[]> {
    const res = await query(
      `SELECT 
        ft.*,
        c.display_name as channel_name
       FROM financial_transactions ft
       LEFT JOIN channels c ON ft.channel_id = c.id
       ORDER BY ft.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return res.rows.map((row: any) => ({
      ...row,
      gross_amount: Number(row.gross_amount),
      fee_amount: Number(row.fee_amount),
      net_amount: Number(row.net_amount),
    }));
  }

  /**
   * Registra uma nova despesa ou receita manual.
   */
  static async createTransaction(data: {
    type: 'receita' | 'despesa';
    category: string;
    description: string;
    grossAmount: number;
    feeAmount?: number;
    paymentMethod: string;
    dueDate?: string;
  }): Promise<FinancialTransaction> {
    const gross = Number(data.grossAmount);
    const fee = Number(data.feeAmount || 0);
    const net = gross - fee;
    const id = `fin_man_${Date.now()}`;

    await query(
      `INSERT INTO financial_transactions (
        id, organization_id, type, category, description,
        gross_amount, fee_amount, net_amount, payment_method, status, due_date
      ) VALUES ($1, 'org_default', $2, $3, $4, $5, $6, $7, $8, 'pago', COALESCE($9::date, CURRENT_DATE))`,
      [id, data.type, data.category, data.description, gross, fee, net, data.paymentMethod, data.dueDate || null]
    );

    const created = await query('SELECT * FROM financial_transactions WHERE id = $1', [id]);
    return {
      ...created.rows[0],
      gross_amount: Number(created.rows[0].gross_amount),
      fee_amount: Number(created.rows[0].fee_amount),
      net_amount: Number(created.rows[0].net_amount),
    };
  }
}
