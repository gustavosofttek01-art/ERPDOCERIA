'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Plus, Filter, Search, Clock, 
  ChefHat, CheckCircle2, Truck, XCircle, DollarSign,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

export default function PedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [channelFilter, setChannelFilter] = useState<string>('todos');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Modal Novo Pedido
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderPhone, setNewOrderPhone] = useState('');
  const [newOrderChannel, setNewOrderChannel] = useState('pdv');
  const [newOrderItems, setNewOrderItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'todos') params.append('status', statusFilter);
      if (channelFilter !== 'todos') params.append('channelId', channelFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?activeOnly=true');
      const json = await res.json();
      if (json.success) {
        setProductsList(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [statusFilter, channelFilter]);

  const handleStatusChange = async (orderId: string, newStatus: string, reason?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(json.data);
        }
      } else {
        alert(`Erro: ${json.error}`);
      }
    } catch (err: any) {
      alert(`Falha: ${err.message}`);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrderItems.length === 0) {
      alert('Selecione pelo menos um produto para o pedido.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: newOrderChannel,
          customerName: newOrderCustomer,
          customerPhone: newOrderPhone,
          items: newOrderItems,
          paymentMethod: newOrderChannel === 'pdv' ? 'pix' : 'cartao_credito',
          paymentStatus: newOrderChannel === 'pdv' ? 'aprovado' : 'pendente',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setNewOrderCustomer('');
        setNewOrderPhone('');
        setNewOrderItems([]);
        await fetchOrders();
      } else {
        alert(`Erro ao criar pedido: ${json.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOrderItemRow = () => {
    if (productsList.length > 0) {
      setNewOrderItems([...newOrderItems, { productId: productsList[0].id, quantity: 1 }]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Gestão Central de Pedidos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fluxo operacional unificado: balcão, WhatsApp, iFood, 99Food e e-commerce
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              addOrderItemRow();
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-brand-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pedido Balcão/Direto</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1 text-xs font-semibold">
          {['todos', 'recebido', 'confirmado', 'em_preparo', 'pronto', 'concluido', 'cancelado'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl capitalize transition ${
                statusFilter === st
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'todos' ? 'Todos os Status' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="todos">Todos os Canais</option>
            <option value="ifood">iFood</option>
            <option value="99food">99Food</option>
            <option value="loja_virtual">Loja Virtual</option>
            <option value="pdv">PDV Balcão</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>

      {/* Orders List & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Column */}
        <div className="lg:col-span-2 space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">Nenhum pedido encontrado</p>
              <p className="text-xs text-slate-400 mt-1">Nenhum pedido corresponde aos filtros selecionados.</p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${
                  selectedOrder?.id === ord.id 
                    ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md' 
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{ord.order_number}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {ord.channel_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {ord.is_delayed && (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                        Atrasado {Math.abs(ord.minutes_remaining)}m
                      </span>
                    )}
                    <StatusBadge status={ord.status} type="order" size="sm" />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-800">{ord.customer_name}</span>
                    <span className="text-slate-400 ml-2">({ord.items?.length || 0} itens)</span>
                  </div>
                  <div className="font-extrabold text-sm text-slate-900">
                    R$ {Number(ord.total_amount).toFixed(2)}
                  </div>
                </div>

                {/* Items preview snippet */}
                <div className="mt-2 text-[11px] text-slate-500 truncate border-t border-slate-100 pt-2">
                  {ord.items?.map((it: any) => `${it.quantity}x ${it.product_name}`).join(', ')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Order Detail Panel */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm h-fit sticky top-24">
          {selectedOrder ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalhes do Pedido</div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedOrder.order_number}</h2>
                </div>
                <StatusBadge status={selectedOrder.status} type="order" />
              </div>

              {/* Customer & Channel Info */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Canal de Origem:</span>
                  <span className="font-bold text-slate-800">{selectedOrder.channel_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-bold text-slate-800">{selectedOrder.customer_name}</span>
                </div>
                {selectedOrder.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Telefone:</span>
                    <span className="font-mono text-slate-700">{selectedOrder.customer_phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipo de Entrega:</span>
                  <span className="capitalize font-semibold text-slate-800">{selectedOrder.delivery_type}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-bold text-slate-800 mb-2">Itens Solicitados</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.items?.map((it: any) => (
                    <div key={it.id} className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{it.product_name}</div>
                        <div className="text-[11px] text-slate-500">{it.quantity} un &times; R$ {Number(it.unit_price).toFixed(2)}</div>
                      </div>
                      <div className="font-bold text-slate-900">
                        R$ {Number(it.total_price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="border-t border-slate-100 pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal Itens:</span>
                  <span>R$ {Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Taxa de Entrega:</span>
                  <span>+R$ {Number(selectedOrder.delivery_fee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Comissão Canal ({selectedOrder.channel_name}):</span>
                  <span>-R$ {Number(selectedOrder.marketplace_fee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Cobrado:</span>
                  <span>R$ {Number(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Controls (Life-Cycle State Machine) */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="text-xs font-bold text-slate-700 mb-2">Avançar Fluxo de Preparo:</div>

                {selectedOrder.status === 'recebido' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, 'confirmado')}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Pedido</span>
                  </button>
                )}

                {selectedOrder.status === 'confirmado' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, 'em_preparo')}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>Iniciar Preparo na Confeitaria</span>
                  </button>
                )}

                {selectedOrder.status === 'em_preparo' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, 'pronto')}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Marcar como Pronto p/ Entrega</span>
                  </button>
                )}

                {selectedOrder.status === 'pronto' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'enviado')}
                      className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Despachar</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'concluido')}
                      className="py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Concluir Venda</span>
                    </button>
                  </div>
                )}

                {selectedOrder.status === 'enviado' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, 'concluido')}
                    className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Entrega e Concluir Venda</span>
                  </button>
                )}

                {!['concluido', 'cancelado'].includes(selectedOrder.status) && (
                  <button
                    onClick={() => {
                      const reason = prompt('Informe o motivo do cancelamento:') || 'Cancelado a pedido do cliente';
                      handleStatusChange(selectedOrder.id, 'cancelado', reason);
                    }}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition border border-slate-200"
                  >
                    Cancelar Pedido (Estornar Reserva)
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Selecione um pedido à esquerda para visualizar detalhes e avançar status.
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar Pedido */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Novo Pedido Manual</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  value={newOrderCustomer}
                  onChange={(e) => setNewOrderCustomer(e.target.value)}
                  placeholder="Ex: Ana Clara Rodrigues"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone WhatsApp</label>
                  <input
                    type="text"
                    value={newOrderPhone}
                    onChange={(e) => setNewOrderPhone(e.target.value)}
                    placeholder="(62) 99999-8888"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Canal</label>
                  <select
                    value={newOrderChannel}
                    onChange={(e) => setNewOrderChannel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500 font-semibold"
                  >
                    <option value="pdv">PDV Balcão</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="loja_virtual">Loja Virtual</option>
                  </select>
                </div>
              </div>

              {/* Items Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">Doces & Produtos *</label>
                  <button
                    type="button"
                    onClick={addOrderItemRow}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    + Adicionar Item
                  </button>
                </div>

                <div className="space-y-2">
                  {newOrderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const updated = [...newOrderItems];
                          updated[idx].productId = e.target.value;
                          setNewOrderItems(updated);
                        }}
                        className="flex-1 bg-transparent text-xs outline-none font-medium"
                      >
                        {productsList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (R$ {Number(p.sale_price).toFixed(2)}) - Disp: {p.available_stock}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...newOrderItems];
                          updated[idx].quantity = Math.max(1, Number(e.target.value));
                          setNewOrderItems(updated);
                        }}
                        className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = newOrderItems.filter((_, i) => i !== idx);
                          setNewOrderItems(updated);
                        }}
                        className="text-rose-500 hover:text-rose-700 font-bold px-1"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
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
                  {isSubmitting ? 'Gravando Pedido...' : 'Salvar e Reservar Estoque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
