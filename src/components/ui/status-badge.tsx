import React from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, XCircle, 
  Truck, ChefHat, Package, RotateCcw, ShieldCheck 
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'sync' | 'stock' | 'payment';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, type = 'order', size = 'md' }: StatusBadgeProps) {
  const s = status.toLowerCase();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  // Pedidos
  if (type === 'order') {
    switch (s) {
      case 'recebido':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>Recebido</span>
          </span>
        );
      case 'confirmado':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Confirmado</span>
          </span>
        );
      case 'em_preparo':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 animate-pulse ${sizeClasses}`}>
            <ChefHat className="w-3.5 h-3.5 text-amber-600" />
            <span>Em Preparo</span>
          </span>
        );
      case 'pronto':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pronto p/ Entrega</span>
          </span>
        );
      case 'enviado':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}>
            <Truck className="w-3.5 h-3.5 text-purple-600" />
            <span>Em Rota</span>
          </span>
        );
      case 'concluido':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 border border-green-200 ${sizeClasses}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            <span>Concluído</span>
          </span>
        );
      case 'cancelado':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Cancelado</span>
          </span>
        );
    }
  }

  // Sincronização de Integrações
  if (type === 'sync') {
    switch (s) {
      case 'sincronizado':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Sincronizado</span>
          </span>
        );
      case 'pendente':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pendente</span>
          </span>
        );
      case 'falhou':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Falhou</span>
          </span>
        );
      case 'nao_suportado':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 ${sizeClasses}`}>
            <span>Não suportado</span>
          </span>
        );
    }
  }

  // Estoque
  if (type === 'stock') {
    if (s === 'critico') {
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          <span>Crítico</span>
        </span>
      );
    }
    if (s === 'atencao') {
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Estoque Baixo</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Normal</span>
      </span>
    );
  }

  // Fallback
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
      <span>{status}</span>
    </span>
  );
}
