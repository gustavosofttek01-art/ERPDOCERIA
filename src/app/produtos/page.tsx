'use client';

import React, { useState, useEffect } from 'react';
import { 
  CakeSlice, Plus, Search, Filter, CheckCircle2, 
  AlertTriangle, Edit3, Power, RefreshCw, DollarSign,
  Tag, Clock, Boxes
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

export default function ProdutosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    unit: 'un',
    salePrice: 0,
    costPrice: 0,
    minStock: 5,
    initialStock: 10,
    shelfLifeDays: 5,
    description: '',
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (activeOnly) params.append('activeOnly', 'true');

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, activeOnly]);

  const handleToggleStatus = async (productId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchProducts();
      } else {
        alert(json.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salePrice: Number(formData.salePrice),
          costPrice: Number(formData.costPrice),
          minStock: Number(formData.minStock),
          initialStock: Number(formData.initialStock),
          shelfLifeDays: Number(formData.shelfLifeDays),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setFormData({
          name: '',
          sku: '',
          barcode: '',
          unit: 'un',
          salePrice: 0,
          costPrice: 0,
          minStock: 5,
          initialStock: 10,
          shelfLifeDays: 5,
          description: '',
        });
        await fetchProducts();
      } else {
        alert(`Erro: ${json.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Catálogo Mestre de Produtos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro único de doces, bolos e sobremesas com sincronização em marketplaces
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-brand-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome, SKU ou código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span>Apenas produtos ativos</span>
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Produto & SKU</th>
                <th className="py-3 px-4">Preço de Venda</th>
                <th className="py-3 px-4">Custo & Margem</th>
                <th className="py-3 px-4">Estoque Físico / Disp.</th>
                <th className="py-3 px-4">Status & Canais</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const margin = p.sale_price > 0 ? ((p.sale_price - p.cost_price) / p.sale_price) * 100 : 0;
                const isLowStock = p.current_stock <= p.min_stock;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{p.sku}</span>
                        {p.category_name && <span>&bull; {p.category_name}</span>}
                        <span>&bull; Validade: {p.shelf_life_days}d</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-sm text-slate-900">
                        R$ {Number(p.sale_price).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">por {p.unit}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-600">Custo: R$ {Number(p.cost_price).toFixed(2)}</div>
                      <div className={`text-[11px] font-bold ${margin >= 40 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        Margem: {margin.toFixed(1)}%
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-extrabold text-sm ${isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
                          {p.current_stock} {p.unit}
                        </span>
                        {isLowStock && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            Baixo
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {p.reserved_stock > 0 && <span className="text-amber-600 font-semibold">{p.reserved_stock} reservado &bull; </span>}
                        <span>Disp: {p.available_stock} {p.unit}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          p.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {p.active ? 'Ativo' : 'Pausado'}
                        </span>
                      </div>

                      {/* Overrides channels status */}
                      <div className="flex flex-wrap gap-1">
                        {p.overrides?.map((ov: any) => (
                          <span 
                            key={ov.channel_id} 
                            className="inline-flex items-center gap-1 text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600"
                            title={`${ov.channel_name}: ${ov.sync_status}`}
                          >
                            <span>{ov.channel_id}</span>
                            <StatusBadge status={ov.sync_status} type="sync" size="sm" />
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleStatus(p.id, p.active)}
                        className={`p-1.5 rounded-xl border transition ${
                          p.active 
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title={p.active ? 'Pausar venda em todos os canais' : 'Ativar venda em todos os canais'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Novo Produto / Doce</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Torta de Nozes com Baba de Moça"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU Único *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    placeholder="TORTA-NOZ-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidade</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500 font-semibold"
                  >
                    <option value="un">un (unidade)</option>
                    <option value="fatia">fatia</option>
                    <option value="cento">cento</option>
                    <option value="kg">kg</option>
                    <option value="caixa">caixa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.salePrice || ''}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                    placeholder="25.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custo Estimado (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.costPrice || ''}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="8.50"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({ ...formData, initialStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Validade (dias)</label>
                  <input
                    type="number"
                    value={formData.shelfLifeDays}
                    onChange={(e) => setFormData({ ...formData, shelfLifeDays: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredientes especiais, alérgenos ou recomendações de consumo..."
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
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20"
                >
                  Cadastrar e Sincronizar Canais
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
