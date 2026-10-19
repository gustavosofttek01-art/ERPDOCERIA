'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, CakeSlice, Boxes, 
  ChefHat, Users, DollarSign, MessageSquare, 
  RefreshCw, BarChart3, Settings, ShieldAlert, Sparkles 
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/operacoes', label: 'Central de Operações', icon: ShieldAlert, highlight: true },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/produtos', label: 'Produtos', icon: CakeSlice },
  { href: '/estoque', label: 'Estoque', icon: Boxes },
  { href: '/producao', label: 'Produção & Receitas', icon: ChefHat },
  { href: '/clientes', label: 'Clientes (CRM)', icon: Users },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/whatsapp', label: 'WhatsApp Bot', icon: MessageSquare },
  { href: '/integracoes', label: 'Integrações', icon: RefreshCw },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-caramel-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <CakeSlice className="w-6 h-6" />
        </div>
        <div>
          <div className="font-bold text-slate-800 text-lg leading-tight flex items-center gap-1.5">
            DoceControl
            <span className="text-[10px] font-semibold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded">ERP</span>
          </div>
          <p className="text-xs text-slate-500">Gestão Confeitaria Real</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Módulos Operacionais
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isHighlight = item.highlight;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? isHighlight
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                  : isHighlight
                  ? 'bg-amber-50 text-amber-900 hover:bg-amber-100/80 border border-amber-200/80'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${
                isActive ? 'text-white' : isHighlight ? 'text-amber-600' : 'text-slate-400'
              }`} />
              <span className="flex-1 truncate">{item.label}</span>
              {isHighlight && !isActive && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-800">
                  5 Foco
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Operational Summary Mini-Card */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/70 m-3 rounded-2xl">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
          <span>Status Operação</span>
          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          iFood, 99Food & PDV sincronizando estoque atômico.
        </p>
      </div>
    </aside>
  );
}
