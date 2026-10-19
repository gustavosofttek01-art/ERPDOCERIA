'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, 
  RefreshCw, CheckCircle2, ArrowDownRight, ArrowUpRight,
  Receipt, CreditCard
} from 'lucide-react';

export default function FinanceiroPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [transType, setTransType] = useState<'receita' | 'despesa'>('despesa');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [grossAmount, setGrossAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/financial');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: transType,
          category,
          description,
          grossAmount: Number(grossAmount),
          paymentMethod,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setDescription('');
        setCategory('');
        setGrossAmount(0);
        await fetchData();
      } else {
        alert(json.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { summary, transactions } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Gestão Financeira & DRE Operacional</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrativo de resultado, taxas de marketplace e fluxo de caixa real
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-brand-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Despesa / Receita</span>
          </button>
        </div>
      </div>

      {/* DRE Operacional Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Demonstrativo de Resultado</span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">DRE Operacional (Período Atual)</h2>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Margem Líquida Real: {summary?.netMarginPercent || 0}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500">(+) Faturamento Bruto</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              R$ {Number(summary?.totalRevenue || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400">Total de pedidos faturados</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-rose-600">(-) Taxas Marketplaces</span>
            <div className="text-xl font-extrabold text-rose-700 mt-1">
              -R$ {Number(summary?.totalMarketplaceFees || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400">Comissões iFood, 99Food e gateways</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-amber-700">(-) CMV (Custo Insumos)</span>
            <div className="text-xl font-extrabold text-amber-800 mt-1">
              -R$ {Number(summary?.totalCmv || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400">Custo real dos doces vendidos</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-xs font-bold text-emerald-800">(=) Lucro Operacional</span>
            <div className="text-xl font-extrabold text-emerald-900 mt-1">
              R$ {Number(summary?.estimatedNetProfit || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">Resultado limpo da confeitaria</span>
          </div>
        </div>
      </div>

      {/* Transactions Statement */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-base text-slate-900">Extrato Financeiro</h2>
            <p className="text-xs text-slate-500">Histórico de entradas e saídas de caixa</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">{transactions?.length || 0} lançamentos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5">Data</th>
                <th className="py-2.5">Tipo</th>
                <th className="py-2.5">Categoria</th>
                <th className="py-2.5">Descrição</th>
                <th className="py-2.5">Forma</th>
                <th className="py-2.5">Valor Bruto</th>
                <th className="py-2.5">Taxa Canal</th>
                <th className="py-2.5 text-right">Valor Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions?.map((t: any) => {
                const isRevenue = t.type === 'receita';
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 text-slate-500 text-[11px]">
                      {new Date(t.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isRevenue ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-slate-800">{t.category}</td>
                    <td className="py-3 text-slate-600 max-w-xs truncate">{t.description}</td>
                    <td className="py-3 text-slate-500 capitalize">{t.payment_method}</td>
                    <td className="py-3 font-extrabold text-slate-900">
                      R$ {Number(t.gross_amount).toFixed(2)}
                    </td>
                    <td className="py-3 text-rose-600">
                      {t.fee_amount > 0 ? `-R$ ${Number(t.fee_amount).toFixed(2)}` : '-'}
                    </td>
                    <td className={`py-3 text-right font-extrabold text-sm ${isRevenue ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {isRevenue ? `+R$ ${Number(t.net_amount).toFixed(2)}` : `-R$ ${Number(t.net_amount).toFixed(2)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançar Transação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Novo Lançamento Financeiro</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTransType('despesa')}
                  className={`py-2 rounded-xl transition ${transType === 'despesa' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600'}`}
                >
                  Despesa (-)
                </button>
                <button
                  type="button"
                  onClick={() => setTransType('receita')}
                  className={`py-2 rounded-xl transition ${transType === 'receita' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'}`}
                >
                  Receita (+)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria *</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Fornecedor Insumos, Embalagens, Energia, Aluguel"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição Detalhada *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Compra de 10kg chocolate Belga Callebaut"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor Total (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={grossAmount || ''}
                    onChange={(e) => setGrossAmount(parseFloat(e.target.value) || 0)}
                    placeholder="150.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500 font-semibold"
                  >
                    <option value="pix">Pix</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="boleto">Boleto Bancário</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20"
                >
                  {isSubmitting ? 'Salvando...' : 'Confirmar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
