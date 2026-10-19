'use client';

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Play, CheckCircle2, AlertTriangle, 
  Clock, ShieldCheck, ArrowUpRight, Zap
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

export default function IntegracoesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/integrations/status');
      const json = await res.json();
      if (json.success) setData(json);
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

  const { channels, queue, logs } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Saúde & Monitoramento de Integrações</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Arquitetura de adaptadores independentes: iFood, 99Food, Loja Virtual e PDV
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
            onClick={handleReprocessAll}
            disabled={reprocessing}
            className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-brand-600/20"
          >
            <Play className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />
            <span>{reprocessing ? 'Reprocessando...' : 'Reprocessar Fila com Falhas'}</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 font-bold">&times;</button>
        </div>
      )}

      {/* Channels Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels?.map((ch: any) => (
          <div key={ch.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-extrabold text-slate-900 text-sm">{ch.display_name}</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  ch.status === 'conectado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ch.status === 'conectado' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  {ch.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Plataforma:</span>
                  <span className="font-semibold text-slate-800 uppercase">{ch.platform_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sinc. Estoque:</span>
                  <span className="font-semibold text-emerald-700">{ch.auto_sync_stock ? 'Automático' : 'Manual'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Última Sinc.:</span>
                  <span className="text-slate-700">{ch.last_sync_at ? new Date(ch.last_sync_at).toLocaleTimeString('pt-BR') : 'Nunca'}</span>
                </div>
              </div>

              {ch.last_error && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-mono leading-relaxed">
                  {ch.last_error}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
              <span className={ch.failed_count > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                {ch.failed_count > 0 ? `${ch.failed_count} falha(s) na fila` : 'Fila limpa'}
              </span>
              <span className="text-slate-500">
                {ch.pending_count > 0 ? `${ch.pending_count} pendente(s)` : 'Em dia'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Integration Queue & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending / Failed Queue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-base text-slate-900">Fila de Tarefas Assíncronas</h2>
                <p className="text-xs text-slate-500">Backoff exponencial e prevenção de loops</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">{queue?.length || 0} na fila</span>
            </div>

            {queue?.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Nenhuma tarefa pendente na fila.
              </div>
            ) : (
              <div className="space-y-3">
                {queue?.map((q: any) => (
                  <div key={q.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{q.channel_name} &bull; {q.task_type}</span>
                      <StatusBadge status={q.status} type="sync" size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Tentativas: <strong>{q.attempts}/{q.max_attempts}</strong> &bull; Chave: <span className="font-mono">{q.idempotency_key}</span>
                    </div>
                    {q.last_error && (
                      <p className="mt-2 text-[11px] text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200 font-mono">
                        {q.last_error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sync Logs */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-base text-slate-900">Logs de Sincronização</h2>
                <p className="text-xs text-slate-500">Auditoria das chamadas de API</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">Últimos eventos</span>
            </div>

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {logs?.map((l: any) => (
                <div key={l.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{l.channel_name} ({l.event_type})</span>
                    <StatusBadge status={l.status} type="sync" size="sm" />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {new Date(l.created_at).toLocaleTimeString('pt-BR')} &bull; Retentativas: {l.retry_count}
                  </div>
                  {l.error_message && (
                    <div className="mt-1.5 text-[11px] text-rose-700 font-mono">{l.error_message}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
