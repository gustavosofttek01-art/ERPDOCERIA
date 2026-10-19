'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, Users, Shield, Database, Lock, 
  Building2, CheckCircle2, History, RefreshCw
} from 'lucide-react';

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<'empresa' | 'usuarios' | 'auditoria' | 'banco'>('empresa');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Configurações & Governança</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Parâmetros da doceria, controle de acesso por função, segurança e auditoria
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('empresa')}
          className={`px-4 py-2 rounded-xl transition ${activeTab === 'empresa' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Dados da Confeitaria
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`px-4 py-2 rounded-xl transition ${activeTab === 'usuarios' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Usuários & Funções (RBAC)
        </button>
        <button
          onClick={() => setActiveTab('banco')}
          className={`px-4 py-2 rounded-xl transition ${activeTab === 'banco' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Banco de Dados & RLS
        </button>
      </div>

      {/* Tab: Empresa */}
      {activeTab === 'empresa' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm max-w-2xl space-y-4">
          <h2 className="text-base font-bold text-slate-900">Perfil da Organização</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Razão Social</label>
              <input
                type="text"
                readOnly
                value="Doce Arte Confeitaria Artesanal Ltda"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome Fantasia</label>
              <input
                type="text"
                readOnly
                value="Doce Arte Confeitaria & Café"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ</label>
              <input
                type="text"
                readOnly
                value="12.345.678/0001-90"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-mono text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Telefone WhatsApp</label>
              <input
                type="text"
                readOnly
                value="(62) 3942-8800"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-mono text-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Endereço Principal</label>
            <input
              type="text"
              readOnly
              value="Rua 9, Setor Marista, 412 - Goiânia - GO"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700"
            />
          </div>
        </div>
      )}

      {/* Tab: Usuários */}
      {activeTab === 'usuarios' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Usuários & Permissões</h2>
              <p className="text-xs text-slate-500">Controle de acesso baseado em papéis (RBAC)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-slate-900">Mariana Silva</div>
                <div className="text-xs text-slate-500">mariana@docecontrol.com.br &bull; (62) 98111-2233</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-800">
                Administrador
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-slate-900">Carlos Eduardo</div>
                <div className="text-xs text-slate-500">carlos@docecontrol.com.br</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                Gerente
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-slate-900">Beatriz Lima</div>
                <div className="text-xs text-slate-500">beatriz@docecontrol.com.br</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                Confeiteira Chefe
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-slate-900">Lucas Fernandes</div>
                <div className="text-xs text-slate-500">lucas@docecontrol.com.br</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Atendente Balcão
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Banco de Dados */}
      {activeTab === 'banco' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Arquitetura de Dados PostgreSQL & Supabase</h2>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs leading-relaxed text-slate-700">
            <p>
              O <strong>DoceControl ERP</strong> utiliza PostgreSQL com schemas versionados em <code>supabase/migrations/</code>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>001_initial_schema.sql</strong>: 22 tabelas relacionais com chaves estrangeiras, restrições e índices.</li>
              <li><strong>002_rls_and_policies.sql</strong>: Políticas de Row Level Security (RLS) para isolamento multi-inquilino.</li>
              <li><strong>003_seed_demo.sql</strong>: Conjunto completo de dados demonstrativos reais da confeitaria.</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
            ✅ <strong>Pronto para Deploy na Vercel & Supabase:</strong> Basta preencher as variáveis <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>SUPABASE_SERVICE_ROLE_KEY</code> no painel de deploy. Em ambiente local/offline, o motor integrado PGlite WASM garante persistência imediata com zero dependências externas.
          </div>
        </div>
      )}
    </div>
  );
}
