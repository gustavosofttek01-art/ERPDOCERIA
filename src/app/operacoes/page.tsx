'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, CheckCircle2, AlertTriangle, Clock, 
  RefreshCw, CakeSlice, ShoppingBag, ArrowRight,
  TrendingUp, ChefHat, Sparkles, ExternalLink, Play
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

export default function OperacoesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/operations-center');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
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

  const handleReprocessAll = async () => {
    try {
      setReprocessing(true);
      setActionMessage(null);
      const res = await fetch('/api/integrations/reprocess', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setActionMessage(json.message);
        await fetchData();
      }
    } catch (err: any) {
      setActionMessage(`Erro ao reprocessar: ${err.message}`);
    } finally {
      setReprocessing(false);
    }
  };

  const handleAdvanceOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, reason: 'Avançado via Central de Operações' }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage(`Pedido atualizado para ${nextStatus}!`);
        await fetchData();
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-white rounded-3xl animate-pulse border border-slate-200"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white rounded-3xl animate-pulse border border-slate-200"></div>
          <div className="h-64 bg-white rounded-3xl animate-pulse border border-slate-200"></div>
        </div>
      </div>
    );
  }

  const { operationalHealth, lowStockItems, delayedOrders, unsyncedPlatforms, urgentAttentionItems } = data || {};

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-caramel-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-xs font-semibold mb-3 backdrop-blur-sm border border-white/10">
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            <span>Painel de Comando Operacional</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Central de Operações</h1>
          <p className="text-white/80 text-sm mt-1 max-w-2xl leading-relaxed">
            Visão unificada das 5 perguntas fundamentais da doceria em tempo real. Sem precisar navegar por 5 menus diferentes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-2 transition backdrop-blur-sm border border-white/15"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Indicadores
          </button>
          <button
            onClick={handleReprocessAll}
            disabled={reprocessing}
            className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-brand-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-400/20"
          >
            <Play className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />
            {reprocessing ? 'Reprocessando...' : 'Reprocessar Sincronizações'}
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">&times;</button>
        </div>
      )}

      {/* Grid of the 5 Core Operational Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PERGUNTA 1: O que está funcionando? */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">O que está funcionando?</h2>
                  <p className="text-xs text-slate-500">Status dos canais conectados e fluxos ativos</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                operationalHealth?.allGood 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${operationalHealth?.allGood ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
                {operationalHealth?.activeChannelsCount} de {operationalHealth?.totalChannelsCount} Canais Ativos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {operationalHealth?.channels?.map((ch: any) => (
                <div 
                  key={ch.id} 
                  className={`p-3 rounded-2xl border transition ${
                    ch.hasErrors 
                      ? 'bg-rose-50/60 border-rose-200' 
                      : 'bg-slate-50/80 border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800">{ch.name}</span>
                    <span className={`w-2 h-2 rounded-full ${ch.status === 'conectado' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                    <span>Sincronizado: {ch.lastSync}</span>
                    {ch.hasErrors ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Falhas
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium">100% OK</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Impressora térmica & Webhooks online</span>
            <Link href="/integracoes" className="font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Ver saúde detalhada &rarr;
            </Link>
          </div>
        </div>

        {/* PERGUNTA 2: Quais produtos estão acabando? */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Quais produtos estão acabando?</h2>
                  <p className="text-xs text-slate-500">Saldo atual abaixo da margem de segurança</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                {lowStockItems?.length || 0} Alertas
              </span>
            </div>

            {lowStockItems?.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Nenhum produto abaixo do estoque mínimo no momento.
              </div>
            ) : (
              <div className="space-y-2.5 mb-4">
                {lowStockItems?.slice(0, 4).map((item: any) => (
                  <div key={item.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-800 flex items-center gap-2">
                        <span>{item.name}</span>
                        <StatusBadge status={item.severity} type="stock" size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        SKU: {item.sku} &bull; Mínimo configurado: {item.minStock} {item.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-slate-900">
                        {item.currentStock} {item.unit}
                      </div>
                      <Link 
                        href="/producao" 
                        className="text-[11px] font-bold text-brand-600 hover:text-brand-700 underline"
                      >
                        Produzir lote
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Evita vender produtos sem estoque nos canais</span>
            <Link href="/estoque" className="font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Ver todo o estoque &rarr;
            </Link>
          </div>
        </div>

        {/* PERGUNTA 3: Quais pedidos estão atrasados? */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Quais pedidos estão atrasados?</h2>
                  <p className="text-xs text-slate-500">Excederam o tempo limite de preparação ou entrega</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                delayedOrders?.length > 0 
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {delayedOrders?.length || 0} Atrasado(s)
              </span>
            </div>

            {delayedOrders?.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Excelente! Nenhum pedido atrasado no momento.
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {delayedOrders?.map((ord: any) => (
                  <div key={ord.id} className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-rose-950">{ord.orderNumber}</span>
                        <span className="text-xs text-slate-600">({ord.channelName})</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[11px]">
                        <Clock className="w-3 h-3" /> +{ord.delayedMinutes} min
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-slate-700 font-medium">{ord.customerName} &bull; R$ {ord.totalAmount.toFixed(2)}</span>
                      <StatusBadge status={ord.status} type="order" size="sm" />
                    </div>

                    <div className="mt-3 pt-2 border-t border-rose-200/60 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleAdvanceOrderStatus(ord.id, 'pronto')}
                        className="px-3 py-1 rounded-xl bg-white border border-rose-300 text-rose-800 text-xs font-bold hover:bg-rose-100 transition"
                      >
                        Marcar Pronto
                      </button>
                      <button
                        onClick={() => handleAdvanceOrderStatus(ord.id, 'concluido')}
                        className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
                      >
                        Concluir Agora
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>SLA de entrega monitorado automaticamente</span>
            <Link href="/pedidos" className="font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Ver todos os pedidos &rarr;
            </Link>
          </div>
        </div>

        {/* PERGUNTA 4: Quais plataformas ainda não sincronizaram? */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Quais plataformas não sincronizaram?</h2>
                  <p className="text-xs text-slate-500">Fila de pendências e erros de integração</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                unsyncedPlatforms?.length > 0 
                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {unsyncedPlatforms?.length || 0} Pendência(s)
              </span>
            </div>

            {unsyncedPlatforms?.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Todas as plataformas e marketplaces estão 100% sincronizados.
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {unsyncedPlatforms?.map((p: any) => (
                  <div key={p.channelId} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{p.channelName}</span>
                      <div className="flex items-center gap-1.5 text-xs">
                        {p.failedTasksCount > 0 && (
                          <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                            {p.failedTasksCount} erro(s)
                          </span>
                        )}
                        {p.pendingTasksCount > 0 && (
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                            {p.pendingTasksCount} na fila
                          </span>
                        )}
                      </div>
                    </div>
                    {p.lastError && (
                      <p className="text-[11px] text-rose-700 mt-2 bg-rose-50 p-2 rounded-xl border border-rose-200 leading-relaxed font-mono">
                        {p.lastError}
                      </p>
                    )}
                  </div>
                ))}

                <button
                  onClick={handleReprocessAll}
                  disabled={reprocessing}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-brand-600/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />
                  {reprocessing ? 'Reprocessando fila...' : 'Reprocessar pendências agora (1 clique)'}
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Retentativa automática com backoff exponencial</span>
            <Link href="/integracoes" className="font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Ver logs de sincronização &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* PERGUNTA 5: O que precisa da minha atenção agora? (Feed Prioritário) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-caramel-500 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-brand-500/20">
              5
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">O que precisa da minha atenção agora?</h2>
              <p className="text-xs text-slate-500">Ações críticas ordenadas por gravidade e impacto no cliente</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Atualizado em tempo real
          </span>
        </div>

        {urgentAttentionItems?.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-bold text-slate-700">Tudo limpo e sob controle!</p>
            <p className="text-xs mt-1">Nenhuma ação crítica pendente de intervenção no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {urgentAttentionItems?.map((att: any) => (
              <div 
                key={att.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  att.priority === 'critica'
                    ? 'bg-rose-50/70 border-rose-300 shadow-sm shadow-rose-200/40'
                    : 'bg-amber-50/70 border-amber-300 shadow-sm shadow-amber-200/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className={`font-bold px-2 py-0.5 rounded-full ${
                      att.priority === 'critica' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {att.priority.toUpperCase()}
                    </span>
                    <span className="text-slate-500">{att.timeAgo}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{att.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{att.message}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                  <Link
                    href={att.actionUrl}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900"
                  >
                    <span>{att.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
