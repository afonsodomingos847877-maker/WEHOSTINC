'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing, Smartphone, X, TrendingUp, AlertTriangle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSession } from 'next-auth/react';

export default function AffiliatePushBanner() {
  const { data: session } = useSession();
  const { permission, subscription, requestPermission, loading } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem('affiliate_push_banner_dismissed') === 'true';
      setDismissed(isDismissed);

      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(userAgent));

      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('affiliate_push_banner_dismissed', 'true');
    }
  };

  const resolveUserMeta = () => {
    let userId: string | undefined = (session?.user as any)?.id;
    let userEmail: string | undefined = session?.user?.email ?? undefined;
    let userName: string | undefined = session?.user?.name ?? undefined;

    // Fallback para localStorage (auth interna WeHostHere)
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('wehost_user');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (!userId) userId = parsed.id || parsed._id;
          if (!userEmail) userEmail = parsed.email;
          if (!userName) userName = parsed.name;
        }
      } catch (_) {}
    }
    return { userId, userEmail, userName };
  };

  const handleActivate = async () => {
    setTestResult(null);
    const { userId, userEmail, userName } = resolveUserMeta();
    const granted = await requestPermission({ userId, userEmail, userName, isAdmin: false });
    if (granted) {
      setTestResult('✅ Alertas de vendas ativados com sucesso!');
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { userId, userEmail } = resolveUserMeta();
      const res = await fetch('/api/affiliates/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult('📲 Notificação de teste enviada! Verifique o seu telemóvel.');
      } else {
        setTestResult(`⚠️ ${data.error || 'Erro ao enviar teste'}`);
      }
    } catch {
      setTestResult('⚠️ Falha de comunicação com o servidor.');
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 6000);
    }
  };

  // Já ativo - barra compacta com botão de teste
  if (permission === 'granted' || subscription) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-4 py-2.5 mb-6 text-emerald-200 text-xs flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <p className="font-medium">
            <strong className="text-white">Alertas de Vendas Ativos:</strong>{' '}
            Receberá notificações instantâneas de comissões e novos leads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {testResult && (
            <span className="text-[11px] font-semibold text-emerald-300 animate-in fade-in">
              {testResult}
            </span>
          )}
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-3 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{testing ? 'A enviar...' : 'Testar Alerta'}</span>
          </button>
        </div>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-purple-900/95 via-violet-900/95 to-slate-900/95 border border-purple-500/40 rounded-2xl p-4 sm:p-5 text-white shadow-xl backdrop-blur-xl mb-6 relative overflow-hidden transition-all animate-in fade-in duration-300">
      {/* Glow de fundo */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center flex-shrink-0 relative">
            <BellRing className="w-5 h-5 sm:w-6 sm:h-6 text-purple-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-white">
                Receba alertas de vendas no telemóvel
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Recomendado
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Seja avisado instantaneamente quando alguém{' '}
              <strong>criar conta pelo seu link</strong> ou quando uma{' '}
              <strong>venda gerar comissão</strong> para si, mesmo com o ecrã bloqueado.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-[11px] text-purple-300">
                <TrendingUp className="w-3.5 h-3.5" />
                Notificação de Comissão
              </span>
              <span className="flex items-center gap-1 text-[11px] text-purple-300">
                <Bell className="w-3.5 h-3.5" />
                Notificação de Lead
              </span>
            </div>

            {isIOS && !isStandalone && (
              <p className="text-[11px] text-amber-300/90 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                No iPhone: toque em Partilhar ➔{' '}
                <strong>&quot;Adicionar ao Ecrã Principal&quot;</strong> para ativar.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-center">
          {testResult && (
            <span className="text-[11px] font-semibold text-emerald-300 animate-in fade-in">
              {testResult}
            </span>
          )}
          <button
            onClick={handleActivate}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-[11px] shadow-md shadow-purple-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{loading ? 'A autorizar...' : 'Ativar Alertas de Vendas'}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Lembrar mais tarde"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
