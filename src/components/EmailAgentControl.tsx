'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Bot,
  Power,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Key,
  Sparkles,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  X,
} from 'lucide-react';

export interface EmailAgentConfigView {
  email: string;
  enabled: boolean;
  hasPassword: boolean;
  scheduleEnabled: boolean;
  scheduleDays: number[];
  scheduleStartHour: string;
  scheduleEndHour: string;
  replyTone: 'professional' | 'friendly' | 'formal';
  customInstructions: string;
  cooldownHours: number;
  maxAgeHours: number;
  saveCopyToSent: boolean;
  lastRunAt: string | null;
  lastRunStatus: 'idle' | 'ok' | 'error';
  lastRunSummary: string;
  totalRepliesSent: number;
  updatedBy?: string;
  evaluation: {
    active: boolean;
    mode: 'manual' | 'scheduled' | 'off';
    reason: string;
  };
}

export interface EmailAgentLogEntry {
  _id: string;
  agentEmail: string;
  fromEmail: string;
  fromName?: string;
  subject: string;
  replySubject?: string;
  replyBody?: string;
  status: 'replied' | 'skipped' | 'error';
  reason: string;
  provider?: string;
  createdAt: string;
}

export interface EmailAgentControlProps {
  targetEmail?: string;
  availableEmails?: string[];
  initialImapPassword?: string;
  variant?: 'card' | 'modal';
  onClose?: () => void;
  onStatusChange?: (active: boolean, config: EmailAgentConfigView) => void;
}

const WEEK_DAYS = [
  { value: 0, short: 'Dom', label: 'Domingo' },
  { value: 1, short: 'Seg', label: 'Segunda' },
  { value: 2, short: 'Ter', label: 'Terça' },
  { value: 3, short: 'Qua', label: 'Quarta' },
  { value: 4, short: 'Qui', label: 'Quinta' },
  { value: 5, short: 'Sex', label: 'Sexta' },
  { value: 6, short: 'Sáb', label: 'Sábado' },
];

export default function EmailAgentControl({
  targetEmail = 'info@wehosthere.com',
  availableEmails,
  initialImapPassword = '',
  variant = 'card',
  onClose,
  onStatusChange,
}: EmailAgentControlProps) {
  const [selectedEmail, setSelectedEmail] = useState(targetEmail.toLowerCase());
  const [config, setConfig] = useState<EmailAgentConfigView | null>(null);
  const [logs, setLogs] = useState<EmailAgentLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningNow, setRunningNow] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [enabled, setEnabled] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDays, setScheduleDays] = useState<number[]>([5, 6, 0]);
  const [scheduleStartHour, setScheduleStartHour] = useState('00:00');
  const [scheduleEndHour, setScheduleEndHour] = useState('23:59');
  const [replyTone, setReplyTone] = useState<'professional' | 'friendly' | 'formal'>('professional');
  const [customInstructions, setCustomInstructions] = useState('');
  const [cooldownHours, setCooldownHours] = useState(12);
  const [imapPassword, setImapPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedEmail(targetEmail.toLowerCase());
  }, [targetEmail]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };

  const applyConfigToForm = useCallback(
    (cfg: EmailAgentConfigView) => {
      setConfig(cfg);
      setEnabled(cfg.enabled);
      setScheduleEnabled(cfg.scheduleEnabled);
      setScheduleDays(cfg.scheduleDays || [5, 6, 0]);
      setScheduleStartHour(cfg.scheduleStartHour || '00:00');
      setScheduleEndHour(cfg.scheduleEndHour || '23:59');
      setReplyTone(cfg.replyTone || 'professional');
      setCustomInstructions(cfg.customInstructions || '');
      setCooldownHours(cfg.cooldownHours || 12);
      setShowPasswordField(!cfg.hasPassword);
      onStatusChange?.(!!cfg.evaluation?.active, cfg);
    },
    [onStatusChange]
  );

  const loadAgentState = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/webmail/agent?email=${encodeURIComponent(selectedEmail)}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível carregar o estado do agente.');
      }
      if (data.config) {
        applyConfigToForm(data.config);
      }
      if (Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Erro ao carregar agente.');
    } finally {
      setLoading(false);
    }
  }, [selectedEmail, applyConfigToForm]);

  useEffect(() => {
    loadAgentState();
  }, [loadAgentState]);

  const saveConfig = async (overrides?: Partial<{ enabled: boolean; scheduleEnabled: boolean }>) => {
    setSaving(true);
    try {
      const nextEnabled = overrides?.enabled !== undefined ? overrides.enabled : enabled;
      const nextSchedule = overrides?.scheduleEnabled !== undefined ? overrides.scheduleEnabled : scheduleEnabled;
      const passwordToSend = imapPassword.trim() || (!config?.hasPassword && initialImapPassword ? initialImapPassword : '');

      const res = await fetch('/api/webmail/agent', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedEmail,
          enabled: nextEnabled,
          scheduleEnabled: nextSchedule,
          scheduleDays,
          scheduleStartHour,
          scheduleEndHour,
          replyTone,
          customInstructions,
          cooldownHours,
          ...(passwordToSend ? { imapPassword: passwordToSend } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresPassword) {
          setShowPasswordField(true);
        }
        throw new Error(data.error || 'Erro ao guardar configuração.');
      }

      setImapPassword('');
      applyConfigToForm(data.config);
      showToast(
        'success',
        data.config.evaluation?.active
          ? `Agente IA ATIVO para ${selectedEmail}!`
          : 'Configurações do Agente IA guardadas.'
      );
    } catch (err: any) {
      showToast('error', err?.message || 'Falha ao guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickTogglePower = async () => {
    const targetEnabled = !enabled;
    setEnabled(targetEnabled);
    await saveConfig({ enabled: targetEnabled });
  };

  const handleRunNow = async () => {
    setRunningNow(true);
    try {
      const passwordToSend = imapPassword.trim() || initialImapPassword || '';
      const res = await fetch('/api/webmail/agent', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_now',
          email: selectedEmail,
          ...(passwordToSend ? { imapPassword: passwordToSend } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao executar verificação.');
      }
      if (data.config) applyConfigToForm(data.config);
      if (Array.isArray(data.logs)) setLogs(data.logs);
      showToast('success', data.runResult?.summary || 'Verificação concluída.');
    } catch (err: any) {
      showToast('error', err?.message || 'Falha ao verificar e-mails.');
    } finally {
      setRunningNow(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/webmail/agent', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_logs', email: selectedEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setLogs([]);
        showToast('success', 'Histórico do agente limpo.');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Erro ao limpar histórico.');
    }
  };

  const toggleDay = (dayVal: number) => {
    setScheduleDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal].sort((a, b) => a - b)
    );
  };

  const isActive = !!config?.evaluation?.active;

  const content = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isActive
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-neutral-900 text-white'
            }`}
          >
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                Modo Agente IA (Auto-Resposta)
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                {isActive
                  ? config?.evaluation?.mode === 'scheduled'
                    ? 'ATIVO (Agendado)'
                    : 'ATIVO AGORA'
                  : 'DESLIGADO'}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Responde automaticamente a e-mails reais recebidos em{' '}
              <span className="font-mono font-semibold text-gray-800">{selectedEmail}</span>{' '}
              (ignora notificações, robôs e no-reply).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {availableEmails && availableEmails.length > 1 && (
            <select
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              className="text-xs font-mono border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-800"
            >
              {availableEmails.map((em) => (
                <option key={em} value={em.toLowerCase()}>
                  {em.toLowerCase()}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={loadAgentState}
            disabled={loading}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 cursor-pointer"
            title="Atualizar estado"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {variant === 'modal' && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {loading && !config ? (
        <div className="flex items-center justify-center py-10 text-gray-500 text-sm gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>A carregar configuração do Agente IA...</span>
        </div>
      ) : (
        <>
          {/* Interruptor Principal ON / OFF */}
          <div
            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              enabled
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Power className={`w-4 h-4 ${enabled ? 'text-emerald-600' : 'text-gray-500'}`} />
                <span className="font-bold text-sm text-gray-900">
                  Interruptor Manual (Ligar / Desligar Agora)
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Liga quando estiveres ocupado ou fora; desliga quando voltares ao atendimento normal.
                {config?.totalRepliesSent ? (
                  <span className="ml-1 font-semibold text-emerald-700">
                    • {config.totalRepliesSent} resposta(s) enviada(s) no total
                  </span>
                ) : null}
              </p>
            </div>

            <button
              type="button"
              onClick={handleQuickTogglePower}
              disabled={saving}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0 shadow-xs ${
                enabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-neutral-900 hover:bg-black text-white'
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Power className="w-4 h-4" />
              )}
              <span>{enabled ? 'Ligado (Clique para Desligar)' : 'Desligado (Clique para Ligar)'}</span>
            </button>
          </div>

          {/* Senha IMAP para acesso autónomo em segundo plano */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-800">
                  Acesso IMAP da Caixa ({selectedEmail})
                </span>
                {config?.hasPassword ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Senha guardada e cifrada
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Necessária para rodar em 2º plano
                  </span>
                )}
              </div>
              {config?.hasPassword && (
                <button
                  type="button"
                  onClick={() => setShowPasswordField(!showPasswordField)}
                  className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  {showPasswordField ? 'Cancelar alteração' : 'Atualizar senha'}
                </button>
              )}
            </div>

            {showPasswordField && (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={imapPassword}
                  onChange={(e) => setImapPassword(e.target.value)}
                  placeholder={`Senha da caixa ${selectedEmail}`}
                  className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-gray-500 self-center">
                  Cifrada com AES-256-GCM ao guardar.
                </span>
              </div>
            )}
          </div>

          {/* Agendamento Automático (Sex / Sáb / Dom) */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Ativação Automática por Dias / Horário (Maputo UTC+2)
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Ex.: ativar sempre à Sexta, Sábado e Domingo mesmo sem clicares manualmente.
                  </span>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span className="text-xs font-bold text-gray-700">
                  {scheduleEnabled ? 'Ativo' : 'Inativo'}
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {WEEK_DAYS.map((day) => {
                const activeDay = scheduleDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    title={day.label}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      activeDay
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {day.short}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setScheduleDays([5, 6, 0]);
                  setScheduleStartHour('00:00');
                  setScheduleEndHour('23:59');
                }}
                className="ml-auto text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                Predefinir Sex–Dom
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Início
                </label>
                <input
                  type="time"
                  value={scheduleStartHour}
                  onChange={(e) => setScheduleStartHour(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Fim
                </label>
                <input
                  type="time"
                  value={scheduleEndHour}
                  onChange={(e) => setScheduleEndHour(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Tom da Resposta
                </label>
                <select
                  value={replyTone}
                  onChange={(e) => setReplyTone(e.target.value as any)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white"
                >
                  <option value="professional">Profissional</option>
                  <option value="friendly">Amigável</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Cooldown / remetente
                </label>
                <select
                  value={cooldownHours}
                  onChange={(e) => setCooldownHours(Number(e.target.value))}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white"
                >
                  <option value={6}>6 horas</option>
                  <option value={12}>12 horas</option>
                  <option value={24}>24 horas</option>
                  <option value={48}>48 horas</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Instrução adicional para o Agente (opcional)
              </label>
              <textarea
                rows={2}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Ex.: Estamos em atendimento reduzido hoje; ativações urgentes podem ser contactadas no WhatsApp +258 84 833 5618."
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="text-[11px] text-gray-500">
                {config?.lastRunAt ? (
                  <>
                    Última verificação:{' '}
                    <span className="font-semibold text-gray-700">
                      {new Date(config.lastRunAt).toLocaleString('pt-MZ')}
                    </span>{' '}
                    {config.lastRunSummary ? `— ${config.lastRunSummary}` : ''}
                  </>
                ) : (
                  'Ainda não executado automaticamente.'
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunNow}
                  disabled={runningNow || saving}
                  className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {runningNow ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>Verificar e Responder Agora</span>
                </button>

                <button
                  type="button"
                  onClick={() => saveConfig()}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Guardar Configurações</span>
                </button>
              </div>
            </div>
          </div>

          {/* Histórico de Ações do Agente */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900">
                Histórico Recente do Agente ({logs.length})
              </span>
              {logs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="text-[11px] text-gray-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              )}
            </div>

            {logs.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">
                Nenhuma interação registada ainda para {selectedEmail}.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
                {logs.map((entry) => {
                  const isExpanded = expandedLogId === entry._id;
                  return (
                    <div key={entry._id} className="py-2 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                entry.status === 'replied'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : entry.status === 'error'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {entry.status === 'replied'
                                ? 'Respondido'
                                : entry.status === 'error'
                                ? 'Erro'
                                : 'Ignorado'}
                            </span>
                            <span className="text-xs font-semibold text-gray-900 truncate">
                              {entry.fromName ? `${entry.fromName} <${entry.fromEmail}>` : entry.fromEmail}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 truncate mt-0.5">
                            Assunto: {entry.subject}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {entry.reason} • {new Date(entry.createdAt).toLocaleString('pt-MZ')}
                          </p>
                        </div>

                        {entry.replyBody && (
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : entry._id)}
                            className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Ocultar' : 'Ver resposta'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      {isExpanded && entry.replyBody && (
                        <div className="mt-1.5 p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-700 whitespace-pre-wrap">
                          {entry.replyBody}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
      {content}
    </div>
  );
}

