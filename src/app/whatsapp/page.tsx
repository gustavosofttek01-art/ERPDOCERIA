'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, Bot, ShieldCheck, Sparkles, 
  HelpCircle, RefreshCw, Smartphone, Key, AlertCircle, CheckCircle2
} from 'lucide-react';

export default function WhatsAppPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputCommand, setInputCommand] = useState('/estoque');
  const [senderPhone, setSenderPhone] = useState('+55 (62) 98111-2233');
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/whatsapp/messages');
      const json = await res.json();
      if (json.success) setMessages(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendCommand = async (cmdText?: string) => {
    const textToSend = cmdText || inputCommand;
    if (!textToSend.trim()) return;

    try {
      setIsSending(true);
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: senderPhone,
          text: textToSend,
          isCommandTest: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setInputCommand('');
        await fetchMessages();
      } else {
        alert(json.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">WhatsApp Business & Bot Administrativo</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Módulo oficial Meta Cloud API com comandos em tempo real e notificações automáticas
          </p>
        </div>

        <button
          onClick={fetchMessages}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Connection Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meta Cloud API */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900">WhatsApp Cloud API (Meta Oficial)</h2>
                <p className="text-[11px] text-slate-500">Homologado & Webhook Ativo</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Conectado
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-400">Webhook Token:</span>
              <span className="font-mono text-slate-800 font-semibold">docecontrol_secure_verify_token_2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Número Comercial:</span>
              <span className="font-bold text-slate-800">+55 (62) 3942-8800</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Templates Aprovados:</span>
              <span className="font-semibold text-emerald-700">novo_pedido, alerta_estoque, resumo_diario</span>
            </div>
          </div>
        </div>

        {/* Evolution API Adapter */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900">Adaptador Evolution API</h2>
                <p className="text-[11px] text-slate-500">Alternativa opcional auto-hospedada</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Standby / Configurado
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
            O DoceControl possui arquitetura agnóstica de mensageria: caso sua operação prefira Evolution API (Baileys), as rotas de webhook e comandos funcionam de maneira idêntica.
          </p>
        </div>
      </div>

      {/* Interactive Bot Simulator */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Commands Guide & Sender Info */}
        <div className="w-full md:w-80 p-6 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
              <Bot className="w-4 h-4 text-brand-600" />
              Simulador Interativo do Bot
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Teste comandos administrativos reais. As consultas atingem o banco de dados e as alterações afetam o catálogo.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Telefone do Remetente (Mariana - Admin)</label>
              <input
                type="text"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold bg-white"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Comandos Rápidos</span>
              <button
                type="button"
                onClick={() => handleSendCommand('/estoque')}
                className="w-full text-left p-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-700 transition"
              >
                📦 <code>/estoque</code> (Ver baixos)
              </button>
              <button
                type="button"
                onClick={() => handleSendCommand('/estoque pistache')}
                className="w-full text-left p-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-700 transition"
              >
                🔍 <code>/estoque pistache</code>
              </button>
              <button
                type="button"
                onClick={() => handleSendCommand('/vendas')}
                className="w-full text-left p-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-700 transition"
              >
                📊 <code>/vendas</code> (Resumo hoje)
              </button>
              <button
                type="button"
                onClick={() => handleSendCommand('/pedidos')}
                className="w-full text-left p-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-700 transition"
              >
                📋 <code>/pedidos</code> (Atrasados & Preparo)
              </button>
              <button
                type="button"
                onClick={() => handleSendCommand('/desativar BRIG-PIST-01')}
                className="w-full text-left p-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-rose-700 hover:border-rose-500 transition"
              >
                🛑 <code>/desativar BRIG-PIST-01</code>
              </button>
              <button
                type="button"
                onClick={() => handleSendCommand('/ativar BRIG-PIST-01')}
                className="w-full text-left p-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-emerald-700 hover:border-emerald-500 transition"
              >
                🟢 <code>/ativar BRIG-PIST-01</code>
              </button>
            </div>
          </div>
        </div>

        {/* Live Chat Stream */}
        <div className="flex-1 flex flex-col justify-between p-6 bg-slate-100/40">
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
            {messages.map((m) => {
              const isInbound = m.direction === 'inbound';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isInbound ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm whitespace-pre-line ${
                      isInbound
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    {m.content}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {isInbound ? 'Você (WhatsApp)' : 'DoceControl Bot'} &bull; {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendCommand();
            }}
            className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputCommand}
              onChange={(e) => setInputCommand(e.target.value)}
              placeholder="Digite um comando (ex: /estoque, /vendas, /desativar SKU)..."
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs outline-none focus:border-brand-500 font-medium bg-white shadow-sm"
            />
            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-brand-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Enviando...' : 'Enviar'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
