'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Plus, Play, Clock, AlertTriangle, 
  CheckCircle2, DollarSign, Calendar, RefreshCw
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

export default function ProducaoPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form de Produção
  const [batchCount, setBatchCount] = useState(1);
  const [lossQuantity, setLossQuantity] = useState(0);
  const [lossReason, setLossReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isProducing, setIsProducing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/recipes');
      const json = await res.json();
      if (json.success) {
        setRecipes(json.data);
        if (json.data.length > 0 && !selectedRecipe) {
          setSelectedRecipe(json.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipe) return;

    try {
      setIsProducing(true);
      setSuccessMessage(null);
      const res = await fetch(`/api/recipes/${selectedRecipe.id}/produce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchCount: Number(batchCount),
          lossQuantity: Number(lossQuantity),
          lossReason: lossReason || undefined,
          notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setBatchCount(1);
        setLossQuantity(0);
        setLossReason('');
        setSuccessMessage(`Lote #${json.data.lotNumber} produzido com sucesso! Insumos baixados e produto acabado adicionado ao estoque.`);
        await fetchRecipes();
      } else {
        alert(`Erro na produção: ${json.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProducing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Produção & Fichas Técnicas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Baixa atômica de insumos, cálculo de custo por lote e rastreabilidade de validade
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRecipes}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              if (recipes.length > 0) {
                setSelectedRecipe(recipes[0]);
                setIsModalOpen(true);
              }
            }}
            className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-brand-600/20"
          >
            <Play className="w-4 h-4" />
            <span>Produzir Lote</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 font-bold">&times;</button>
        </div>
      )}

      {/* Grid: Recipes & Technical Sheet Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipes Column */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Receitas Mestres Cadastradas
          </div>

          {recipes.map((rcp) => (
            <div
              key={rcp.id}
              onClick={() => setSelectedRecipe(rcp)}
              className={`p-4 rounded-2xl bg-white border cursor-pointer transition ${
                selectedRecipe?.id === rcp.id 
                  ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md' 
                  : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="font-bold text-sm text-slate-900">{rcp.name}</div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>Rendimento: <strong>{rcp.yield_quantity} {rcp.yield_unit}</strong></span>
                <span className="font-semibold text-brand-700">R$ {Number(rcp.unit_cost).toFixed(2)}/un</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {rcp.preparation_time_minutes} min
                </span>
                <span>{rcp.items?.length || 0} ingredientes</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Recipe Ficha Técnica */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm lg:col-span-2">
          {selectedRecipe ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ficha Técnica Oficial</div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedRecipe.name}</h2>
                  <p className="text-xs text-slate-500 mt-1">Produto Associado: <strong>{selectedRecipe.product_name || 'Geral'}</strong></p>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-brand-600/20"
                >
                  <Play className="w-4 h-4" />
                  <span>Produzir Esta Receita</span>
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400">Rendimento do Lote</span>
                  <div className="text-lg font-extrabold text-slate-900 mt-1">{selectedRecipe.yield_quantity} {selectedRecipe.yield_unit}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400">Custo Total Insumos</span>
                  <div className="text-lg font-extrabold text-slate-900 mt-1">R$ {Number(selectedRecipe.batch_cost).toFixed(2)}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400">Custo Unitário Final</span>
                  <div className="text-lg font-extrabold text-brand-700 mt-1">R$ {Number(selectedRecipe.unit_cost).toFixed(2)}</div>
                </div>
              </div>

              {/* Ingredients Table */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Composição de Ingredientes (Por Lote)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5">Ingrediente</th>
                        <th className="py-2.5">Quantidade</th>
                        <th className="py-2.5">Custo Unitário</th>
                        <th className="py-2.5">Custo no Lote</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedRecipe.items?.map((it: any) => (
                        <tr key={it.id}>
                          <td className="py-2.5 font-semibold text-slate-800">{it.ingredient_name}</td>
                          <td className="py-2.5 font-bold text-slate-900">{it.quantity} {it.unit}</td>
                          <td className="py-2.5 text-slate-500">R$ {Number(it.cost_per_unit).toFixed(2)}</td>
                          <td className="py-2.5 font-extrabold text-slate-900">R$ {Number(it.item_cost).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Instructions */}
              {selectedRecipe.instructions && (
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Modo de Preparo</h3>
                  <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
                    {selectedRecipe.instructions}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400">
              Selecione uma receita à esquerda para ver a ficha técnica.
            </div>
          )}
        </div>
      </div>

      {/* Modal Produzir Lote */}
      {isModalOpen && selectedRecipe && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Produzir Lote</h2>
                <p className="text-xs text-slate-500">{selectedRecipe.name}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleProduce} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade de Lotes a Produzir *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={batchCount}
                  onChange={(e) => setBatchCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-brand-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Rendimento previsto: <strong>{selectedRecipe.yield_quantity * batchCount} {selectedRecipe.yield_unit}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Perdas no Processo (Opcional)</label>
                <input
                  type="number"
                  min="0"
                  value={lossQuantity}
                  onChange={(e) => setLossQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500"
                />
              </div>

              {lossQuantity > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Motivo da Perda</label>
                  <input
                    type="text"
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value)}
                    placeholder="Ex: Queima de calda, quebra na montagem..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações da Confeiteira</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações sobre a consistência, ponto de forno..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500"
                ></textarea>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                ⚡ <strong>Transação Atômica:</strong> O sistema consumirá automaticamente os insumos necessários do estoque e gerará um lote com data de validade calculada.
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
                  disabled={isProducing}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20"
                >
                  {isProducing ? 'Produzindo e Baixando Insumos...' : 'Confirmar e Finalizar Produção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
