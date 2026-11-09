'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/auth';
import BrandLogo from '@/components/BrandLogo';
import { Wrench, ShieldAlert, Clock, PhoneCall, RefreshCw, MessageSquare } from 'lucide-react';

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [maintenance, setMaintenance] = useState<{ active: boolean; message: string; estimatedReturn: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkMaintenance = async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const user = auth.getCurrentUser();
      setIsAdmin(auth.isAdminUser(user));

      const res = await fetch('/api/system/maintenance', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.maintenance) {
          setMaintenance(data.maintenance);
        }
      }
    } catch (e) {
      console.error('Erro ao verificar modo de manutenção:', e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkMaintenance();
    // Verificar a cada 2 minutos em vez de 15 segundos (poupança massiva de requisições)
    const interval = setInterval(checkMaintenance, 120000);
    return () => clearInterval(interval);
  }, []);

  // Se o modo de manutenção estiver ATIVO e o utilizador NÃO for admin:
  if (!checking && maintenance?.active && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
        {/* Background glow graphics */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative z-10">
          {/* Header Logo */}
          <div className="flex justify-center mb-6">
            <BrandLogo href="" logoHeightClass="h-10 sm:h-12" />
          </div>

          {/* Animated Wrench Icon */}
          <div className="inline-flex items-center justify-center p-4 bg-primary-500/10 border border-primary-500/30 text-primary-400 rounded-2xl mb-6 shadow-inner animate-pulse">
            <Wrench className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-3">
            Manutenção Programada em Andamento
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            {maintenance.message || 'Estamos a realizar melhorias na nossa infraestrutura para lhe proporcionar uma experiência ainda mais rápida e segura.'}
          </p>

          {/* Estimated Return Box */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 mb-6 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Previsão de Conclusão</p>
                <p className="text-sm font-bold text-white">{maintenance.estimatedReturn || 'Em instantes'}</p>
              </div>
            </div>
            <button
              onClick={checkMaintenance}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition"
              title="Atualizar Estado"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Emergency Support Links */}
          <div className="border-t border-slate-800 pt-5">
            <p className="text-xs text-slate-400 mb-3 font-medium">Precisa de assistência urgente?</p>
            <div className="flex items-center justify-center gap-3">
              <a
                href="https://wa.me/258848335618?text=Olá,%20preciso%20de%20ajuda%20durante%20a%20manutenção%20do%20site."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition shadow-md"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp Directo</span>
              </a>
              <a
                href="mailto:suporte@wehosthere.com"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs transition"
              >
                <PhoneCall className="h-3.5 w-3.5 text-primary-400" />
                <span>E-mail Suporte</span>
              </a>
            </div>
          </div>
        </div>

        <p className="text-slate-500 text-xs mt-6 text-center">
          WEHOSTHERE Cloud & Infrastructure Services &copy; {new Date().getFullYear()}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Indicador discreto para o Administrador caso o modo de manutenção esteja ATIVO */}
      {maintenance?.active && isAdmin && (
        <div className="bg-amber-500 text-slate-950 font-bold text-xs text-center py-2 px-4 flex items-center justify-center gap-2 sticky top-0 z-[99999] shadow-md border-b border-amber-600">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>⚠️ <strong>MODO DE MANUTENÇÃO ATIVO:</strong> Os clientes normais estão a ver a página de manutenção. Como Administrador, você tem acesso total.</span>
        </div>
      )}
      {children}
    </>
  );
}
