'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, Search, ShieldAlert, Store, UserCircle, Check } from 'lucide-react';

export function Header() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'Pedido #1041 Atrasado', text: 'iFood - Excedeu prazo de preparo', time: '10 min atrás', critical: true },
    { id: 2, title: 'Estoque Baixo: Bolo de Pote', text: 'Restam apenas 2 unidades', time: '25 min atrás', critical: false },
    { id: 3, title: 'Lote vence em 48h', text: 'Mini Pudim Fava Baunilha (5 un)', time: '1h atrás', critical: false },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Quick Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Store className="w-4 h-4 text-brand-600" />
          <span className="text-slate-800 font-semibold">Doce Arte Confeitaria & Café</span>
          <span className="text-slate-300">/</span>
          <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
            Loja Aberta
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Central de Operações Quick CTA */}
        <Link
          href="/operacoes"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-900 border border-amber-300/80 hover:bg-amber-500/20 text-xs font-semibold transition"
        >
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Central de Operações</span>
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 relative transition"
            aria-label="Notificações"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
              3
            </span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Alertas Operacionais</span>
                <span className="text-[11px] text-slate-400">3 não lidos</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl text-xs transition ${
                      n.critical ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <div className="font-semibold text-slate-800 flex items-center justify-between">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{n.text}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2 mt-2 border-t border-slate-100 text-center">
                <Link
                  href="/operacoes"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Abrir Central de Operações &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
            MS
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-slate-800 leading-tight">Mariana Silva</div>
            <div className="text-[10px] text-slate-400">Administradora</div>
          </div>
        </div>
      </div>
    </header>
  );
}
