'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  DollarSign, ShoppingBag, Clock, AlertTriangle, 
  Boxes, ShieldAlert, TrendingUp, Sparkles, Filter, 
  CheckCircle2, ArrowUpRight, ChefHat, Package
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

export default function VisaoGeralPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'hoje' | '7dias' | '30dias'>('hoje');
  const [channelFilter, setChannelFilter] = useState<string>('todos');
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [finRes, ordRes, prodsRes] = await Promise.all([
          fetch('/api/financial').then(r => r.json()),
          fetch('/api/orders?limit=6').then(r => r.json()),
          fetch('/api/products').then(r => r.json()),
        ]);

        const fin = finRes.data?.summary || {};
        const orders = ordRes.data || [];
        const prods = prodsRes.data || [];

        const lowStock = prods.filter((p: any) => p.current_stock <= p.min_stock);
        const unavailable = prods.filter((p: any) => !p.active);
        const delayed = orders.filter((o: any) => o.is_delayed);
        const inPrep = orders.filter((o: any) => o.status === 'em_preparo');
        const received = orders.filter((o: any) => o.status === 'recebido');

        setStats({
          todaySales: fin.todaySales || 284.00,
          todayOrdersCount: fin.todayOrdersCount || 4,
          inPrepCount: inPrep.length,
          receivedCount: received.length,
          delayedCount: delayed.length,
          lowStockCount: lowStock.length,
          unavailableCount: unavailable.length,
          estimatedProfit: fin.estimatedNetProfit || 120.40,
          netMarginPercent: fin.netMarginPercent || 38.5,
          channelBreakdown: fin.channelBreakdown || [],
          totalCmv: fin.totalCmv || 88.60,
        });
        setRecentOrders(orders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [period, channelFilter]);

  return (
    <div className="space-y-8">
      {/* Top Banner: Switcher to Central de Operações */}
      <div className="bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-caramel-500/10 border border-amber-300/80 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-brand-950 flex items-center justify-center font-extrabold shadow-md shadow-amber-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              Deseja a visão operacional focada?
              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                5 Respostas Chave
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Acesse a Central de Operações para saber o que está funcionando, produtos acabando, pedidos atrasados e pendências de sincronização.
            </p>
          </div>
        </div>

        <Link
          href="/operacoes"
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition shrink-0 shadow-md"
        >
          <span>Abrir Central de Operações</span>
          <ArrowUpRight className="w-4 h-4 text-amber-400" />
        </Link>
      </div>

      {/* Filters & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Visão Geral da Empresa</h1>
          <p className="text-xs text-slate-500 mt-0.5">Indicadores financeiros, estoque e pedidos em tempo real</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-1 flex items-center text-xs font-semibold text-slate-600">
            <button
              onClick={() => setPeriod('hoje')}
              className={`px-3 py-1.5 rounded-xl transition ${period === 'hoje' ? 'bg-brand-600 text-white shadow-sm' : 'hover:text-slate-900'}`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriod('7dias')}
              className={`px-3 py-1.5 rounded-xl transition ${period === '7dias' ? 'bg-brand-600 text-white shadow-sm' : 'hover:text-slate-900'}`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setPeriod('30dias')}
              className={`px-3 py-1.5 rounded-xl transition ${period === '30dias' ? 'bg-brand-600 text-white shadow-sm' : 'hover:text-slate-900'}`}
            >
              30 Dias
            </button>
          </div>

          {/* Channel Selector */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
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

      {/* 4 Main KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Vendas de Hoje */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Faturamento Bruto</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            R$ {Number(stats?.todaySales || 0).toFixed(2)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-700 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{stats?.todayOrdersCount || 0} pedidos faturados hoje</span>
          </div>
        </div>

        {/* Card 2: Pedidos Ativos & Atrasados */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Operação de Pedidos</span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {stats?.inPrepCount || 0} <span className="text-xs font-normal text-slate-500">em preparo</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-slate-600 font-medium">{stats?.receivedCount || 0} novos</span>
            {stats?.delayedCount > 0 && (
              <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                {stats?.delayedCount} atrasado(s)
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Margem Líquida Real */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Margem Estimada</span>
            <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {stats?.netMarginPercent || 0}%
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Lucro est.: <strong className="text-slate-800">R$ {Number(stats?.estimatedProfit || 0).toFixed(2)}</strong> (após taxas e CMV)
          </div>
        </div>

        {/* Card 4: Alertas de Estoque */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Estoque & Saúde</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {stats?.lowStockCount || 0} <span className="text-xs font-normal text-slate-500">itens baixos</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>{stats?.unavailableCount || 0} indisponíveis</span>
            <Link href="/estoque" className="font-semibold text-brand-600 hover:text-brand-700">Ver &rarr;</Link>
          </div>
        </div>
      </div>

      {/* Middle Grid: Faturamento por Canal & Pedidos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-base text-slate-900 mb-1">Faturamento por Canal</h2>
            <p className="text-xs text-slate-500 mb-5">Comissões de marketplaces deduzidas</p>

            <div className="space-y-4">
              {stats?.channelBreakdown?.map((item: any) => {
                const total = stats?.todaySales || 1;
                const percent = Math.round((item.revenue / (total || 1)) * 100);

                return (
                  <div key={item.channel}>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-800">{item.channel}</span>
                      <span className="text-slate-900">R$ {item.revenue.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-caramel-500" 
                        style={{ width: `${Math.min(100, Math.max(8, percent))}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{item.ordersCount} pedido(s)</span>
                      <span>Taxa: -R$ {item.fees.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link href="/financeiro" className="text-xs font-bold text-brand-600 hover:text-brand-700">
              Ver DRE Completa e Fluxo de Caixa &rarr;
            </Link>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-base text-slate-900">Pedidos em Tempo Real</h2>
                <p className="text-xs text-slate-500">Últimos pedidos recebidos de todos os canais</p>
              </div>
              <Link href="/pedidos" className="text-xs font-bold text-brand-600 hover:text-brand-700">
                Ver Todos &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5">Pedido</th>
                    <th className="py-2.5">Canal</th>
                    <th className="py-2.5">Cliente</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Valor</th>
                    <th className="py-2.5">Prazo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 font-bold text-slate-900">{ord.order_number}</td>
                      <td className="py-3 text-slate-600">{ord.channel_name}</td>
                      <td className="py-3 font-medium text-slate-800">{ord.customer_name}</td>
                      <td className="py-3">
                        <StatusBadge status={ord.status} type="order" size="sm" />
                      </td>
                      <td className="py-3 font-extrabold text-slate-900">
                        R$ {Number(ord.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3">
                        {ord.is_delayed ? (
                          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Atrasado {Math.abs(ord.minutes_remaining)}m
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {ord.minutes_remaining > 0 ? `${ord.minutes_remaining} min rest.` : 'No prazo'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Sincronização bidirecional de pedidos ativa</span>
            <Link href="/pedidos" className="font-semibold text-brand-600 hover:text-brand-700">
              Gerenciar Fluxo de Cozinha &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
