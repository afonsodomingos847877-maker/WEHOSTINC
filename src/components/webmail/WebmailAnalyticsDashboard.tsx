'use client';

import React, { useState, useMemo } from 'react';
import {
  Send,
  MailOpen,
  MousePointerClick,
  ShieldCheck,
  TrendingUp,
  Calendar,
  Clock,
  Download,
  Printer,
  ArrowLeft,
  Sparkles,
  Users,
  Paperclip,
  Flame,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { WebmailMessage } from '@/lib/webmailClient';

interface WebmailAnalyticsDashboardProps {
  accountEmail: string;
  messages: WebmailMessage[];
  folderStats: {
    inboxUnread: number;
    starred: number;
    drafts: number;
    scheduled: number;
    sent: number;
    trash: number;
  };
  onClose: () => void;
  onOpenCompose: () => void;
  onNavigateFolder: (folder: 'inbox' | 'sent' | 'starred' | 'trash' | 'drafts' | 'scheduled') => void;
}

type TimeRange = '7d' | 'months' | 'years';

export default function WebmailAnalyticsDashboard({
  accountEmail,
  messages,
  folderStats,
  onClose,
  onOpenCompose,
  onNavigateFolder,
}: WebmailAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('months');
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number>(7);
  const [activeMetricBar, setActiveMetricBar] = useState<{ card: number; bar: number } | null>(null);

  const domain = (accountEmail.split('@')[1] || 'wehosthere.com').toLowerCase();

  // Agregação real de todas as mensagens (estado atual + cache de pastas da sessão + caches locais)
  const analyticsData = useMemo(() => {
    let sentCache: WebmailMessage[] = [];
    let inboxCache: WebmailMessage[] = [];
    let scheduledCache: WebmailMessage[] = [];
    let draftsCache: WebmailMessage[] = [];
    const emailLower = (accountEmail || '').toLowerCase();

    if (typeof window !== 'undefined' && emailLower) {
      try {
        const rawInboxSession = sessionStorage.getItem(`wehost_cache_${emailLower}:inbox`);
        if (rawInboxSession) inboxCache = JSON.parse(rawInboxSession);
      } catch {}
      try {
        const rawSentSession = sessionStorage.getItem(`wehost_cache_${emailLower}:sent`);
        if (rawSentSession) sentCache = JSON.parse(rawSentSession);
      } catch {}
      try {
        const rawSent = localStorage.getItem(`wehosthere_webmail_sent_cache_${emailLower}`);
        if (rawSent) {
          const localSent: WebmailMessage[] = JSON.parse(rawSent);
          sentCache = [...sentCache, ...localSent];
        }
      } catch {}
      try {
        const rawSched = localStorage.getItem('wehosthere_webmail_scheduled');
        if (rawSched) {
          const allSched: WebmailMessage[] = JSON.parse(rawSched);
          scheduledCache = allSched.filter(
            (m) => (m.accountEmail || '').toLowerCase() === emailLower
          );
        }
      } catch {}
      try {
        const rawDrafts = localStorage.getItem('wehosthere_webmail_drafts');
        if (rawDrafts) {
          const allDrafts: WebmailMessage[] = JSON.parse(rawDrafts);
          draftsCache = allDrafts.filter(
            (m) => (m.accountEmail || '').toLowerCase() === emailLower
          );
        }
      } catch {}
    }

    // Deduplicação por ID dando prioridade às mensagens atualmente em memória
    const dedupById = (list: WebmailMessage[]) => {
      const map = new Map<string, WebmailMessage>();
      for (const item of list) {
        if (!item?.id) continue;
        if (!map.has(item.id)) map.set(item.id, item);
      }
      return Array.from(map.values());
    };

    const inboxMsgs = dedupById([
      ...messages.filter((m) => m.folder === 'inbox'),
      ...inboxCache.filter((m) => !m.folder || m.folder === 'inbox'),
    ]);
    const sentMsgs = dedupById([
      ...messages.filter((m) => m.folder === 'sent'),
      ...sentCache,
    ]);

    const totalInbox = Math.max(inboxMsgs.length, folderStats.inboxUnread);
    const readInboxCount = inboxMsgs.filter((m) => m.isRead).length;
    const totalSent = Math.max(folderStats.sent, sentMsgs.length);
    const totalScheduled = Math.max(folderStats.scheduled, scheduledCache.length);
    const totalDrafts = Math.max(folderStats.drafts, draftsCache.length);

    // Taxa de Leitura real (sem pisos nem valores inventados)
    const openRate =
      inboxMsgs.length > 0 ? Math.min(100, (readInboxCount / inboxMsgs.length) * 100) : 0;

    // Proporção real de enviados sobre o volume total
    const totalVolume = totalInbox + totalSent;
    const responseRate =
      totalVolume > 0 ? Math.min(100, (totalSent / totalVolume) * 100) : 0;

    // Mensagens reais com anexos
    const withAttachments = dedupById([...inboxMsgs, ...sentMsgs]).filter(
      (m) => m.attachments && m.attachments.length > 0
    ).length;

    // Top Remetentes / Contactos reais
    const contactCounts = new Map<string, { name: string; email: string; count: number }>();
    for (const m of inboxMsgs) {
      const addr = (m.fromEmail || '').toLowerCase();
      if (!addr) continue;
      const cur = contactCounts.get(addr);
      if (cur) {
        cur.count++;
      } else {
        contactCounts.set(addr, {
          name: m.fromName || addr.split('@')[0],
          email: addr,
          count: 1,
        });
      }
    }
    for (const s of sentMsgs) {
      const addr = (s.toEmail || '').toLowerCase();
      if (!addr) continue;
      const cur = contactCounts.get(addr);
      if (cur) {
        cur.count++;
      } else {
        contactCounts.set(addr, {
          name: addr.split('@')[0],
          email: addr,
          count: 1,
        });
      }
    }

    const topContacts = Array.from(contactCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Mini gráficos reais dos últimos 9 dias
    const now = new Date();
    const dailyBuckets = Array.from({ length: 9 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (8 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
      return { key, label, inbox: 0, read: 0, sent: 0 };
    });
    const dailyMap = new Map(dailyBuckets.map((b) => [b.key, b]));

    const toDayKey = (rawDate?: string) => {
      if (!rawDate) return '';
      const dt = new Date(rawDate);
      if (isNaN(dt.getTime())) return '';
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    };

    for (const m of inboxMsgs) {
      const b = dailyMap.get(toDayKey(m.date));
      if (b) {
        b.inbox++;
        if (m.isRead) b.read++;
      }
    }
    for (const s of sentMsgs) {
      const b = dailyMap.get(toDayKey(s.date));
      if (b) b.sent++;
    }

    const maxDayVol = Math.max(1, ...dailyBuckets.map((b) => b.inbox + b.sent));
    const dailyMiniBars = dailyBuckets.map((b) => {
      const dayTotal = b.inbox + b.sent;
      return {
        label: b.label,
        volumeCount: dayTotal,
        volumePct: dayTotal > 0 ? Math.max(8, Math.round((dayTotal / maxDayVol) * 100)) : 4,
        sentPct: dayTotal > 0 ? Math.round((b.sent / dayTotal) * 100) : 0,
        openPct: b.inbox > 0 ? Math.round((b.read / b.inbox) * 100) : 0,
      };
    });

    // Eventos reais recentes ordenados por data
    const allRecent = [...scheduledCache, ...sentMsgs, ...inboxMsgs]
      .filter((m) => !isNaN(new Date(m.scheduledFor || m.date).getTime()))
      .sort(
        (a, b) =>
          new Date(b.scheduledFor || b.date).getTime() -
          new Date(a.scheduledFor || a.date).getTime()
      )
      .slice(0, 8);

    return {
      inboxMsgs,
      sentMsgs,
      totalInbox,
      readInboxCount,
      totalSent,
      totalScheduled,
      totalDrafts,
      totalVolume,
      openRate,
      responseRate,
      withAttachments,
      topContacts,
      dailyMiniBars,
      allRecent,
      scheduledCache,
    };
  }, [accountEmail, messages, folderStats]);

  // Dados reais para o Gráfico Principal de Linhas Suaves (Email Data) agrupados por data
  const chartSeries = useMemo(() => {
    const now = new Date();
    const { inboxMsgs, sentMsgs } = analyticsData;

    if (timeRange === '7d') {
      const daysPt = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const buckets = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const label = i === 6 ? 'Hoje' : daysPt[d.getDay()];
        return { key, label, inbox: 0, read: 0, sent: 0 };
      });
      const map = new Map(buckets.map((b) => [b.key, b]));
      for (const m of inboxMsgs) {
        const dt = new Date(m.date);
        if (isNaN(dt.getTime())) continue;
        const b = map.get(`${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`);
        if (b) { b.inbox++; if (m.isRead) b.read++; }
      }
      for (const s of sentMsgs) {
        const dt = new Date(s.date);
        if (isNaN(dt.getTime())) continue;
        const b = map.get(`${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`);
        if (b) b.sent++;
      }
      return {
        labels: buckets.map((b) => b.label),
        openRateValues: buckets.map((b) => (b.inbox > 0 ? Math.round((b.read / b.inbox) * 100) : 0)),
        clickRateValues: buckets.map((b) =>
          b.inbox + b.sent > 0 ? Math.round((b.sent / (b.inbox + b.sent)) * 100) : 0
        ),
      };
    }

    if (timeRange === 'years') {
      const curYear = now.getFullYear();
      const buckets = Array.from({ length: 6 }, (_, i) => {
        const y = curYear - (5 - i);
        return { key: y, label: String(y), inbox: 0, read: 0, sent: 0 };
      });
      const map = new Map(buckets.map((b) => [b.key, b]));
      for (const m of inboxMsgs) {
        const dt = new Date(m.date);
        if (isNaN(dt.getTime())) continue;
        const b = map.get(dt.getFullYear());
        if (b) { b.inbox++; if (m.isRead) b.read++; }
      }
      for (const s of sentMsgs) {
        const dt = new Date(s.date);
        if (isNaN(dt.getTime())) continue;
        const b = map.get(dt.getFullYear());
        if (b) b.sent++;
      }
      return {
        labels: buckets.map((b) => b.label),
        openRateValues: buckets.map((b) => (b.inbox > 0 ? Math.round((b.read / b.inbox) * 100) : 0)),
        clickRateValues: buckets.map((b) =>
          b.inbox + b.sent > 0 ? Math.round((b.sent / (b.inbox + b.sent)) * 100) : 0
        ),
      };
    }

    // Últimos 8 meses reais
    const monthsPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const buckets = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      return { key, label: monthsPt[d.getMonth()], inbox: 0, read: 0, sent: 0 };
    });
    const map = new Map(buckets.map((b) => [b.key, b]));
    for (const m of inboxMsgs) {
      const dt = new Date(m.date);
      if (isNaN(dt.getTime())) continue;
      const b = map.get(`${dt.getFullYear()}-${dt.getMonth()}`);
      if (b) { b.inbox++; if (m.isRead) b.read++; }
    }
    for (const s of sentMsgs) {
      const dt = new Date(s.date);
      if (isNaN(dt.getTime())) continue;
      const b = map.get(`${dt.getFullYear()}-${dt.getMonth()}`);
      if (b) b.sent++;
    }
    return {
      labels: buckets.map((b) => b.label),
      openRateValues: buckets.map((b) => (b.inbox > 0 ? Math.round((b.read / b.inbox) * 100) : 0)),
      clickRateValues: buckets.map((b) =>
        b.inbox + b.sent > 0 ? Math.round((b.sent / (b.inbox + b.sent)) * 100) : 0
      ),
    };
  }, [timeRange, analyticsData]);

  // Gerador de Curva SVG Cubic Bezier Suave (estilo onda fluida da imagem de referência)
  const buildSmoothSvgPath = (values: number[], width: number, height: number, padX = 28, padY = 20) => {
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;
    const pts = values.map((val, idx) => {
      const x = padX + (idx / Math.max(values.length - 1, 1)) * usableW;
      const clamped = Math.max(0, Math.min(100, val));
      const y = padY + usableH - (clamped / 100) * usableH;
      return { x, y, val: clamped };
    });

    if (pts.length === 0) return { path: '', pts: [] };
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpx1 = p0.x + (p1.x - p0.x) * 0.48;
      const cpy1 = p0.y;
      const cpx2 = p0.x + (p1.x - p0.x) * 0.52;
      const cpy2 = p1.y;
      d += ` C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return { path: d, pts };
  };

  const svgWidth = 640;
  const svgHeight = 230;
  const openCurve = buildSmoothSvgPath(chartSeries.openRateValues, svgWidth, svgHeight);
  const clickCurve = buildSmoothSvgPath(chartSeries.clickRateValues, svgWidth, svgHeight);
  const safeHoverIdx = Math.min(hoveredPointIdx, Math.max(0, openCurve.pts.length - 1));
  const activePt = openCurve.pts[safeHoverIdx] || openCurve.pts[0];

  // Exportar relatório em CSV
  const handleExportCsv = () => {
    const rows = [
      ['Métrica', 'Valor', 'Conta', 'Data do Relatório'],
      ['Conta de E-mail', accountEmail, domain, new Date().toLocaleString('pt-MZ')],
      ['Total de E-mails na Entrada', String(analyticsData.totalInbox), domain, ''],
      ['E-mails Lidos', String(analyticsData.readInboxCount), domain, ''],
      ['E-mails Enviados', String(analyticsData.totalSent), domain, ''],
      ['E-mails Agendados', String(analyticsData.totalScheduled), domain, ''],
      ['Taxa de Abertura / Leitura (%)', `${analyticsData.openRate.toFixed(2)}%`, domain, ''],
      ['Taxa de Resposta / Interação (%)', `${analyticsData.responseRate.toFixed(2)}%`, domain, ''],
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `relatorio-webmail-${accountEmail.replace(/[^a-z0-9]/gi, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dados reais para a linha do tempo de atividade semanal (sem eventos fictícios)
  const timelineEvents = useMemo(() => {
    const items: Array<{
      day: string;
      timeLabel: string;
      offsetPct: number;
      title: string;
      dotColor: string;
      bgClass: string;
      textClass: string;
    }> = [];

    const daysPt = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const usedDays = new Set<string>();

    const toOffsetPct = (dt: Date) => {
      const minutesFrom08 = dt.getHours() * 60 + dt.getMinutes() - 8 * 60;
      const ratio = Math.max(0, Math.min(1, minutesFrom08 / (12 * 60)));
      return Math.round(4 + ratio * 54);
    };

    for (const s of analyticsData.scheduledCache) {
      const dt = new Date(s.scheduledFor || s.date);
      if (isNaN(dt.getTime())) continue;
      const dayName = daysPt[dt.getDay()];
      if (usedDays.has(dayName)) continue;
      usedDays.add(dayName);
      items.push({
        day: dayName,
        timeLabel: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        offsetPct: toOffsetPct(dt),
        title: `Agendado: ${(s.subject || 'Sem assunto').slice(0, 26)}`,
        dotColor: '#b45309',
        bgClass: 'bg-amber-100/90 border-amber-200',
        textClass: 'text-amber-950',
      });
    }

    for (const m of analyticsData.allRecent) {
      if (items.length >= 5) break;
      const dt = new Date(m.scheduledFor || m.date);
      if (isNaN(dt.getTime())) continue;
      const dayName = daysPt[dt.getDay()];
      if (usedDays.has(dayName)) continue;
      usedDays.add(dayName);
      const isSent = m.folder === 'sent';
      items.push({
        day: dayName,
        timeLabel: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        offsetPct: toOffsetPct(dt),
        title: (m.subject || '(Sem assunto)').slice(0, 28),
        dotColor: isSent ? '#4338ca' : '#0f766e',
        bgClass: isSent
          ? 'bg-indigo-100/90 border-indigo-200/80'
          : 'bg-teal-100/90 border-teal-200/80',
        textClass: isSent ? 'text-indigo-950' : 'text-teal-950',
      });
    }

    return items;
  }, [analyticsData.scheduledCache, analyticsData.allRecent]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#f8f9fc] p-4 sm:p-7 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Barra de Topo Estilo SaaS Mailbox Analytics (Inspirado na Imagem) */}
        <div className="bg-neutral-950 text-white rounded-2xl px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md border border-neutral-800">
          <div className="flex items-center space-x-6">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center space-x-2 text-white hover:text-emerald-400 transition cursor-pointer font-extrabold text-sm"
              title="Voltar para a Caixa de E-mail"
            >
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span>Mailbox</span>
            </button>

            <nav className="hidden md:flex items-center space-x-5 text-xs font-semibold">
              <button
                type="button"
                onClick={onClose}
                className="text-neutral-400 hover:text-white transition cursor-pointer flex items-center space-x-1.5"
              >
                <span>Caixa de Entrada</span>
              </button>
              <span className="text-white font-extrabold flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Analytics</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onNavigateFolder('scheduled');
                  onClose();
                }}
                className="text-neutral-400 hover:text-white transition cursor-pointer flex items-center space-x-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Agendados ({analyticsData.totalScheduled})</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
              title="Exportar métricas em CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
              title="Imprimir Relatório"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-300" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* Título Principal */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
              Email Analytics
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Relatório interativo em tempo real da conta{' '}
              <span className="font-mono font-bold text-neutral-800">{accountEmail}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCompose}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Novo E-mail</span>
          </button>
        </div>

        {/* Linha Superior de KPIs com Mini Gráficos de Barras Interativos (Exatamente como na imagem) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-100 gap-6 md:gap-0">
          {/* Card 1: Sent / Volume */}
          <div className="md:pr-6 flex flex-col justify-between space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-neutral-700">
              <span>Enviados &amp; Recebidos</span>
              <Send className="w-3.5 h-3.5 text-neutral-500" />
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                  {analyticsData.totalVolume.toLocaleString('pt-MZ')}
                </div>
                <div className="text-xs text-neutral-400 font-medium mt-1">
                  {analyticsData.totalSent} Enviados · {analyticsData.totalInbox} Recebidos
                </div>
              </div>

              {/* Mini Bar Chart real dos últimos 9 dias */}
              <div className="flex items-end space-x-1.5 h-12">
                {analyticsData.dailyMiniBars.map((bar, idx) => {
                  const isHighlighted =
                    activeMetricBar?.card === 0
                      ? activeMetricBar.bar === idx
                      : idx === analyticsData.dailyMiniBars.length - 1;
                  return (
                    <button
                      key={bar.label}
                      type="button"
                      onMouseEnter={() => setActiveMetricBar({ card: 0, bar: idx })}
                      onMouseLeave={() => setActiveMetricBar(null)}
                      style={{ height: `${bar.volumePct}%` }}
                      className={`w-2.5 rounded-t-sm transition-all duration-200 cursor-pointer ${
                        isHighlighted
                          ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.45)] scale-y-105'
                          : 'bg-neutral-200/80 hover:bg-neutral-300'
                      }`}
                      title={`${bar.label}: ${bar.volumeCount} e-mail(s)`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: Proporção de Envios / Resposta */}
          <div className=" pt-4 md:pt-0 md:px-6 flex flex-col justify-between space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-neutral-700">
              <span>Taxa de Envio / Resposta</span>
              <MousePointerClick className="w-3.5 h-3.5 text-neutral-500" />
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                  {analyticsData.responseRate.toFixed(2)}%
                </div>
                <div className="text-xs text-neutral-400 font-medium mt-1">
                  {analyticsData.withAttachments} com anexos · {analyticsData.totalScheduled} agendados
                </div>
              </div>

              {/* Mini Bar Chart real dos últimos 9 dias */}
              <div className="flex items-end space-x-1.5 h-12">
                {analyticsData.dailyMiniBars.map((bar, idx) => {
                  const isHighlighted =
                    activeMetricBar?.card === 1
                      ? activeMetricBar.bar === idx
                      : idx === analyticsData.dailyMiniBars.length - 1;
                  return (
                    <button
                      key={bar.label}
                      type="button"
                      onMouseEnter={() => setActiveMetricBar({ card: 1, bar: idx })}
                      onMouseLeave={() => setActiveMetricBar(null)}
                      style={{ height: `${Math.max(4, bar.sentPct)}%` }}
                      className={`w-2.5 rounded-t-sm transition-all duration-200 cursor-pointer ${
                        isHighlighted
                          ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.45)] scale-y-105'
                          : 'bg-neutral-200/80 hover:bg-neutral-300'
                      }`}
                      title={`${bar.label}: ${bar.sentPct}% enviados`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 3: Open / Read Rate */}
          <div className="pt-4 md:pt-0 md:pl-6 flex flex-col justify-between space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-neutral-700">
              <span>Taxa de Leitura (Open Rate)</span>
              <MailOpen className="w-3.5 h-3.5 text-neutral-500" />
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                  {analyticsData.openRate.toFixed(2)}%
                </div>
                <div className="text-xs text-neutral-400 font-medium mt-1">
                  {analyticsData.readInboxCount} E-mails Abertos
                </div>
              </div>

              {/* Mini Bar Chart real dos últimos 9 dias */}
              <div className="flex items-end space-x-1.5 h-12">
                {analyticsData.dailyMiniBars.map((bar, idx) => {
                  const isHighlighted =
                    activeMetricBar?.card === 2
                      ? activeMetricBar.bar === idx
                      : idx === analyticsData.dailyMiniBars.length - 1;
                  return (
                    <button
                      key={bar.label}
                      type="button"
                      onMouseEnter={() => setActiveMetricBar({ card: 2, bar: idx })}
                      onMouseLeave={() => setActiveMetricBar(null)}
                      style={{ height: `${Math.max(4, bar.openPct)}%` }}
                      className={`w-2.5 rounded-t-sm transition-all duration-200 cursor-pointer ${
                        isHighlighted
                          ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.45)] scale-y-105'
                          : 'bg-neutral-200/80 hover:bg-neutral-300'
                      }`}
                      title={`${bar.label}: ${bar.openPct}% lidos`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Secção Central: Gráfico de Ondas Duplas Interativo ("Email Data") + Cronograma ("Campaign / Schedule Activity") */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gráfico Principal: Email Data (7 colunas) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-neutral-900">
                  Email Data
                </h2>
                <div className="flex items-center space-x-4 mt-1.5 text-xs font-medium text-neutral-500">
                  <span className="inline-flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" />
                    <span>Taxa de Resposta (CTR)</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                    <span>Taxa de Leitura (Open rate)</span>
                  </span>
                </div>
              </div>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 outline-none cursor-pointer shadow-2xs hover:border-neutral-300"
              >
                <option value="7d">Últimos 7 Dias</option>
                <option value="months">Meses</option>
                <option value="years">Anos</option>
              </select>
            </div>

            {/* Área SVG Interativa com Curvas Suaves */}
            <div className="relative w-full overflow-x-auto pt-2">
              <div className="min-w-[460px] flex items-center">
                {/* Eixo Y */}
                <div className="flex flex-col justify-between h-[210px] pr-3 text-[11px] font-semibold text-neutral-400 select-none">
                  <span>100%</span>
                  <span>80%</span>
                  <span>60%</span>
                  <span>40%</span>
                  <span>20%</span>
                  <span>0%</span>
                </div>

                <div className="flex-1 relative">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-[220px] overflow-visible"
                  >
                    {/* Linhas Horizontais Tracejadas de Grelha */}
                    {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, idx) => {
                      const y = 20 + ratio * (svgHeight - 40);
                      return (
                        <line
                          key={idx}
                          x1={16}
                          y1={y}
                          x2={svgWidth - 16}
                          y2={y}
                          stroke="#e5e7eb"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Curva 1: Taxa de Resposta / Click-through (Teal/Cyan) */}
                    <path
                      d={clickCurve.path}
                      fill="none"
                      stroke="#4fd1c5"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                    />

                    {/* Curva 2: Taxa de Abertura / Open Rate (Indigo) */}
                    <path
                      d={openCurve.path}
                      fill="none"
                      stroke="#4338ca"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                    />

                    {/* Pontos Interativos ao passar o rato */}
                    {openCurve.pts.map((pt, idx) => {
                      const isCurrent = idx === safeHoverIdx;
                      return (
                        <g
                          key={idx}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredPointIdx(idx)}
                          onClick={() => setHoveredPointIdx(idx)}
                        >
                          {/* Zona invisível maior para facilitar hover */}
                          <circle cx={pt.x} cy={pt.y} r={18} fill="transparent" />

                          {isCurrent && (
                            <>
                              {/* Tooltip Escuro Flutuante (63% como na imagem) */}
                              <g transform={`translate(${pt.x}, ${pt.y - 28})`}>
                                <rect
                                  x={-22}
                                  y={-14}
                                  width={44}
                                  height={22}
                                  rx={6}
                                  fill="#0a0a0a"
                                />
                                <polygon
                                  points="-4,8 4,8 0,13"
                                  fill="#0a0a0a"
                                />
                                <text
                                  x={0}
                                  y={1}
                                  textAnchor="middle"
                                  fill="#ffffff"
                                  fontSize="11"
                                  fontWeight="800"
                                >
                                  {Math.round(pt.val)}%
                                </text>
                              </g>
                              {/* Círculo Branco com Borda Preta */}
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={5.5}
                                fill="#ffffff"
                                stroke="#0a0a0a"
                                strokeWidth="3"
                              />
                            </>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* Eixo X (Meses / Dias) */}
                  <div className="flex items-center justify-between px-4 pt-1 text-[11px] font-semibold text-neutral-400">
                    {chartSeries.labels.map((lbl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setHoveredPointIdx(idx)}
                        className={`cursor-pointer transition ${
                          safeHoverIdx === idx
                            ? 'text-neutral-900 font-extrabold'
                            : 'hover:text-neutral-700'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Direito: Atividade & Agenda de Envios (5 colunas - Inspirado em "Campaign activity") */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-neutral-900">
                Atividade &amp; Agenda
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Cronograma de envios programados e picos de comunicação
              </p>
            </div>

            {/* Grelha Semanal com Pílulas Flutuantes de Eventos */}
            <div className="relative my-4 flex-1 flex flex-col justify-between min-h-[210px]">
              {/* Linhas verticais tracejadas de horário */}
              <div className="pointer-events-none absolute inset-y-0 left-12 right-4 flex justify-between">
                <div className="border-l border-dashed border-neutral-200 h-full" />
                <div className="border-l border-dashed border-neutral-200 h-full" />
                <div className="border-l border-dashed border-neutral-200 h-full" />
              </div>

              {timelineEvents.length === 0 ? (
                <div className="my-auto text-center text-xs text-neutral-400 py-8">
                  Sem atividade recente registada nesta sessão.
                </div>
              ) : (
                <div className="space-y-4 relative z-10 my-auto">
                  {['Sex', 'Qui', 'Qua', 'Ter', 'Seg'].map((dayLabel) => {
                    const matchingEvent = timelineEvents.find((e) => e.day === dayLabel);

                    return (
                      <div key={dayLabel} className="flex items-center min-h-[30px]">
                        <span className="w-10 text-xs font-semibold text-neutral-400 shrink-0">
                          {dayLabel}
                        </span>
                        <div className="flex-1 relative h-8 flex items-center">
                          {matchingEvent && (
                            <div
                              style={{ marginLeft: `${matchingEvent.offsetPct}%` }}
                              className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-bold shadow-2xs transition-transform hover:scale-105 cursor-pointer truncate max-w-[85%] ${matchingEvent.bgClass} ${matchingEvent.textClass}`}
                              title={`${matchingEvent.title} (${matchingEvent.timeLabel})`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: matchingEvent.dotColor }}
                              />
                              <span className="truncate">{matchingEvent.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Eixo X de Horários */}
              <div className="flex items-center justify-between pl-12 pr-4 pt-3 text-[11px] font-semibold text-neutral-400">
                <span>08:00</span>
                <span>14:00</span>
                <span>20:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Linha Inferior: Principais Contactos Interagidos & Resumo de Pastas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Principais Remetentes & Destinatários */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-neutral-900">
                  Principais Contactos &amp; Correspondentes
                </h3>
                <p className="text-xs text-neutral-400">
                  Endereços com maior volume de trocas na sua conta
                </p>
              </div>
              <Users className="w-4 h-4 text-neutral-400" />
            </div>

            {analyticsData.topContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400">
                Ainda sem dados suficientes de correspondentes nesta sessão.
              </div>
            ) : (
              <div className="space-y-2.5">
                {analyticsData.topContacts.map((c, i) => {
                  const maxCount = analyticsData.topContacts[0]?.count || 1;
                  const pct = Math.max(18, Math.round((c.count / maxCount) * 100));
                  return (
                    <div
                      key={c.email}
                      className="p-2.5 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-neutral-900 block truncate">
                            {c.name}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400 block truncate">
                            {c.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="w-24 bg-neutral-200 h-2 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-extrabold text-neutral-800 bg-white px-2.5 py-1 rounded-xl border border-neutral-200">
                          {c.count} {c.count === 1 ? 'e-mail' : 'e-mails'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Distribuição por Pasta & Ações Rápidas */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-neutral-900">
                  Estado das Pastas &amp; Produtividade
                </h3>
                <p className="text-xs text-neutral-400">
                  Clique em qualquer indicador para abrir a respetiva pasta
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  onNavigateFolder('inbox');
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 text-left transition cursor-pointer"
              >
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Não Lidos
                </span>
                <span className="text-xl font-black text-neutral-900 mt-1 block">
                  {folderStats.inboxUnread}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">
                  Caixa de Entrada →
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateFolder('sent');
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 text-left transition cursor-pointer"
              >
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Enviados
                </span>
                <span className="text-xl font-black text-neutral-900 mt-1 block">
                  {analyticsData.totalSent}
                </span>
                <span className="text-[10px] text-indigo-600 font-bold">
                  Ver Enviados →
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateFolder('scheduled');
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 text-left transition cursor-pointer"
              >
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                  Agendados
                </span>
                <span className="text-xl font-black text-emerald-950 mt-1 block">
                  {analyticsData.totalScheduled}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">
                  Fila Programada →
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateFolder('drafts');
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 text-left transition cursor-pointer"
              >
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Rascunhos
                </span>
                <span className="text-xl font-black text-neutral-900 mt-1 block">
                  {analyticsData.totalDrafts}
                </span>
                <span className="text-[10px] text-neutral-600 font-bold">
                  Continuar Edição →
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateFolder('starred');
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 text-left transition cursor-pointer"
              >
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Com Estrela
                </span>
                <span className="text-xl font-black text-neutral-900 mt-1 block">
                  {folderStats.starred}
                </span>
                <span className="text-[10px] text-amber-600 font-bold">
                  Importantes →
                </span>
              </button>

              <div className="p-3.5 rounded-2xl bg-neutral-900 text-white flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                  Proteção IA
                </span>
                <span className="text-xl font-black text-white mt-1 block">
                  100% Ativa
                </span>
                <span className="text-[10px] text-neutral-300">
                  Anti-Phishing &amp; SSL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

