import './globals.css';
import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export const metadata: Metadata = {
  title: 'DoceControl ERP - Gestão Operacional para Confeitarias',
  description: 'Sistema completo de gestão, operações e integrações em tempo real para confeitarias e docerias.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex bg-slate-50/60 text-slate-800 antialiased selection:bg-brand-500 selection:text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
