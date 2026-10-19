'use client';

import React, { useState } from 'react';
import { 
  BarChart3, Download, Calendar, DollarSign, 
  TrendingUp, CakeSlice, AlertTriangle, FileSpreadsheet
} from 'lucide-react';

export default function RelatoriosPage() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleDownloadCsv = (type: 'vendas' | 'estoque') => {
    setExporting(type);
    window.location.href = `/api/reports/export?type=${type}`;
    setTimeout(() => setExporting(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Relatórios Gerenciais & Exportação</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de desempenho, lucratividade e exportação de dados auditáveis em CSV
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadCsv('vendas')}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-brand-600" />
            <span>{exporting === 'vendas' ? 'Baixando...' : 'Exportar Vendas (CSV)'}</span>
          </button>

          <button
            onClick={() => handleDownloadCsv('estoque')}
            className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-brand-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exporting === 'estoque' ? 'Baixando...' : 'Exportar Estoque (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* Relatórios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Relatório 1: Lucratividade por Produto */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-slate-900 text-base">Lucratividade & Margem por Doce</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Demonstrativo de margem de contribuição individual. Compara custo de insumos da ficha técnica com o preço praticado em cada marketplace.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-700">Margem média: 42%</span>
            <button onClick={() => handleDownloadCsv('vendas')} className="font-semibold text-brand-600 hover:text-brand-700">
              Exportar Detalhes &rarr;
            </button>
          </div>
        </div>

        {/* Relatório 2: Perdas e Validades */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-slate-900 text-base">Perdas Técnicas & Vencimentos</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Registro de avarias na produção, quebra de embalagem e lotes próximos do prazo de validade na vitrine refrigerada.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-amber-700">Perda operacional: 1.2%</span>
            <button onClick={() => handleDownloadCsv('estoque')} className="font-semibold text-brand-600 hover:text-brand-700">
              Exportar Lotes &rarr;
            </button>
          </div>
        </div>

        {/* Relatório 3: Desempenho dos Marketplaces */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-slate-900 text-base">Comissões & Conciliação</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Auditoria de taxas descontadas por canal (iFood 18%, 99Food 15%, gateways de cartão) para garantir conciliação financeira exata.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-700">Conciliado</span>
            <button onClick={() => handleDownloadCsv('vendas')} className="font-semibold text-brand-600 hover:text-brand-700">
              Baixar Extrato &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
