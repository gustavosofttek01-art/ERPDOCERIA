'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, UserCheck, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ClientesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      const json = await res.json();
      if (json.success) setCustomers(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAnonymize = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja anonimizar os dados de "${name}" conforme a LGPD? Esta ação é irreversível.`)) {
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'anonymize' }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage(json.message);
        await fetchCustomers();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Clientes & Gestão LGPD</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro de clientes frequentes, histórico de consumo e proteção de dados
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 font-bold">&times;</button>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Contato (WhatsApp / E-mail)</th>
                <th className="py-3 px-4">Pedidos Realizados</th>
                <th className="py-3 px-4">Total Faturado</th>
                <th className="py-3 px-4">Consentimento LGPD</th>
                <th className="py-3 px-4 text-right">Ação LGPD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                    {c.anonymized && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        Anonimizado
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{c.phone || '-'}</div>
                    <div className="text-[11px] text-slate-400">{c.email || '-'}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {c.total_orders} pedido(s)
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-sm text-slate-900">
                    R$ {Number(c.total_spent).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Consentimento Ativo
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {!c.anonymized && (
                      <button
                        onClick={() => handleAnonymize(c.id, c.name)}
                        className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition border border-slate-200"
                        title="Anonimizar dados pessoais conforme Artigo 18 da LGPD"
                      >
                        Anonimizar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
