'use client';

import React, { useState, useEffect } from 'react';
import { 
  Boxes, Plus, ArrowUpRight, ArrowDownLeft, AlertTriangle, 
  RotateCcw, History, RefreshCw, CheckCircle2, Search
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

export default function EstoquePage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Movimentação
  const [selectedProductId, setSelectedProductId] = useState('');
  const [movementType, setMovementType] = useState('entrada');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [movRes, prodRes] = await Promise.all([
        fetch('/api/stock/movements?limit=50').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
      ]);

      if (movRes.success) setMovements(movRes.data);
      if (prodRes.success) {
        setProducts(prodRes.data);
        if (prodRes.data.length > 0 && !selectedProductId) {
          setSelectedProductId(prodRes.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMoveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/stock/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          movementType,
          quantity: Number(quantity),
          reason,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setReason('');
        setQuantity(1);
        await fetchData();
      } else {
        alert(`Erro na movimentação: ${json.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Controle de Estoque & Movimentações</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rastreamento atômico de entradas, saídas, reservas e inventário
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
            <span>Lançar Movimentação</span>
          </button>
        </div>
      </div>

      {/* Grid: Saldos Físicos & Histórico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Stock Balances Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-base text-slate-900">Saldos Atuais</h2>
              <p className="text-xs text-slate-500">Produtos e níveis de alerta</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">{products.length} itens</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {products.map((p) => {
              const isLow = p.current_stock <= p.min_stock;
              return (
                <div key={p.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.sku}</div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Mínimo: {p.min_stock} {p.unit} &bull; Reservado: {p.reserved_stock} {p.unit}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-sm font-extrabold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                      {p.current_stock} {p.unit}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isLow ? 'Alerta Baixo' : 'Normal'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Movements History Table */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-base text-slate-900">Histórico de Movimentações</h2>
                <p className="text-xs text-slate-500">Extrato detalhado com data, motivo, usuário e saldo resultante</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">Últimos 50 registros</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5">Data / Hora</th>
                    <th className="py-2.5">Item</th>
                    <th className="py-2.5">Tipo</th>
                    <th className="py-2.5">Qtd</th>
                    <th className="py-2.5">Anterior &rarr; Novo</th>
                    <th className="py-2.5">Motivo</th>
                    <th className="py-2.5">Usuário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((mov) => {
                    const isPositive = ['entrada', 'devolucao'].includes(mov.movement_type);
                    const isNegative = ['saida', 'venda', 'perda'].includes(mov.movement_type);

                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 text-slate-500 text-[11px]">
                          {new Date(mov.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3 font-semibold text-slate-800">
                          {mov.product_name || mov.ingredient_name || 'Item'}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isPositive ? 'bg-emerald-100 text-emerald-800' :
                            isNegative ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {mov.movement_type}
                          </span>
                        </td>
                        <td className="py-3 font-extrabold text-slate-900">
                          {isPositive ? `+${mov.quantity}` : isNegative ? `-${mov.quantity}` : mov.quantity}
                        </td>
                        <td className="py-3 text-slate-500 font-mono text-[11px]">
                          {mov.previous_stock} &rarr; <strong className="text-slate-800">{mov.new_stock}</strong>
                        </td>
                        <td className="py-3 text-slate-600 max-w-xs truncate" title={mov.reason}>
                          {mov.reason}
                        </td>
                        <td className="py-3 text-slate-500 text-[11px]">
                          {mov.user_name || 'Admin'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Lançar Movimentação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Lançar Movimentação de Estoque</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleMoveStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Produto *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500 font-semibold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Saldo: {p.current_stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Movimentação *</label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500 font-bold"
                  >
                    <option value="entrada">Entrada (+)</option>
                    <option value="saida">Saída (-)</option>
                    <option value="perda">Perda / Descarte (-)</option>
                    <option value="ajuste">Ajuste de Saldo</option>
                    <option value="inventario">Inventário Físico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Justificativa *</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Quebra de embalagem durante o manuseio na vitrine..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500"
                ></textarea>
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
                  {isSubmitting ? 'Gravando...' : 'Confirmar Movimentação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
