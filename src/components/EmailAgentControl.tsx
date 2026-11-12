'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Bot,
  Power,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Key,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
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
  const [showLogs, setShowLogs] = useState(false);

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
          ? `Modo Agente ativo para ${selectedEmail}.`
          : 'Configurações guardadas.'
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
        showToast('success', 'Histórico limpo.');
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
      <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-neutral-900 text-sm sm:text-base tracking-tight">
                Modo Agente
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-emerald-600' : 'bg-neutral-400'
                  }`}
                />
                {isActive
                  ? config?.evaluation?.mode === 'scheduled'
                    ? 'Ativo (Agendado)'
                    : 'Ativo'
                  : 'Inativo'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Resposta automática para <span className="font-mono text-neutral-700">{selectedEmail}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {availableEmails && availableEmails.length > 1 && (
            <select
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              className="text-xs font-mono border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-white text-neutral-800 outline-none"
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
            className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 cursor-pointer transition"
            title="Atualizar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {variant === 'modal' && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 cursor-pointer transition"
              title="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
            feedback.type === 'success'
              ? 'bg-neutral-50 text-neutral-800 border-neutral-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-neutral-700 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {loading && !config ? (
        <div className="flex items-center justify-center py-10 text-neutral-500 text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>A carregar...</span>
        </div>
      ) : (
        <>
          {/* Ativação Manual + IMAP */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 divide-y divide-neutral-200">
            <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-neutral-900">Ativação Manual</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Ativa ou desliga a resposta automática imediata.
                  {config?.totalRepliesSent ? ` (${config.totalRepliesSent} enviadas)` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={handleQuickTogglePower}
                disabled={saving}
                className={`px-3.5 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shrink-0 ${
                  enabled
                    ? 'bg-neutral-900 hover:bg-black text-white'
                    : 'bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300'
                }`}
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Power className="w-3.5 h-3.5" />
                )}
                <span>{enabled ? 'Desativar' : 'Ativar'}</span>
              </button>
            </div>

            <div className="px-3.5 py-2.5 bg-white rounded-b-xl space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-neutral-700">
                  <Key className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="font-medium">Acesso IMAP:</span>
                  <span className="text-neutral-500">
                    {config?.hasPassword ? 'Configurado (cifrado)' : 'Senha necessária'}
                  </span>
                </div>
                {config?.hasPassword && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordField(!showPasswordField)}
                    className="text-[11px] font-medium text-neutral-600 hover:text-neutral-900 underline cursor-pointer"
                  >
                    {showPasswordField ? 'Cancelar' : 'Alterar senha'}
                  </button>
                )}
              </div>

              {showPasswordField && (
                <input
                  type="password"
                  value={imapPassword}
                  onChange={(e) => setImapPassword(e.target.value)}
                  placeholder={`Senha IMAP de ${selectedEmail}`}
                  className="w-full text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              )}
            </div>
          </div>

          {/* Agendamento e Preferências */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-neutral-900 block">
                  Agendamento e Preferências
                </span>
                <span className="text-[11px] text-neutral-500">
                  Fuso horário: Maputo (UTC+2)
                </span>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                  className="w-3.5 h-3.5 accent-neutral-900 rounded"
                />
                <span className="text-xs font-medium text-neutral-700">
                  {scheduleEnabled ? 'Agendamento ativo' : 'Agendamento inativo'}
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                      activeDay
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
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
                className="ml-auto text-[11px] font-medium text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
              >
                Sex–Dom
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Início
                </label>
                <input
                  type="time"
                  value={scheduleStartHour}
                  onChange={(e) => setScheduleStartHour(e.target.value)}
                  className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Fim
                </label>
                <input
                  type="time"
                  value={scheduleEndHour}
                  onChange={(e) => setScheduleEndHour(e.target.value)}
                  className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Tom
                </label>
                <select
                  value={replyTone}
                  onChange={(e) => setReplyTone(e.target.value as any)}
                  className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                >
                  <option value="professional">Profissional</option>
                  <option value="friendly">Cordial</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Intervalo
                </label>
                <select
                  value={cooldownHours}
                  onChange={(e) => setCooldownHours(Number(e.target.value))}
                  className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                >
                  <option value={6}>6 horas</option>
                  <option value={12}>12 horas</option>
                  <option value={24}>24 horas</option>
                  <option value={48}>48 horas</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                Instruções adicionais (opcional)
              </label>
              <textarea
                rows={2}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Ex.: Atendimento reduzido hoje; assuntos urgentes via WhatsApp +258 84 833 5618."
                className="w-full text-xs border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100">
              <div className="text-[11px] text-neutral-500">
                {config?.lastRunAt
                  ? `Última execução: ${new Date(config.lastRunAt).toLocaleString('pt-MZ')}`
                  : 'Ainda não executado.'}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunNow}
                  disabled={runningNow || saving}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition"
                >
                  {runningNow ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>Executar Agora</span>
                </button>

                <button
                  type="button"
                  onClick={() => saveConfig()}
                  disabled={saving}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Histórico Recolhível */}
          <div className="rounded-xl border border-neutral-200 bg-white">
            <div className="px-4 py-2.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowLogs(!showLogs)}
                className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 hover:text-neutral-950 cursor-pointer"
              >
                <span>Histórico ({logs.length})</span>
                {showLogs ? (
                  <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                )}
              </button>
              {logs.length > 0 && showLogs && (
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              )}
            </div>

            {showLogs && (
              <div className="px-4 pb-3 border-t border-neutral-100">
                {logs.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-3 text-center">
                    Nenhuma interação registada.
                  </p>
                ) : (
                  <div className="divide-y divide-neutral-100 max-h-52 overflow-y-auto pr-1">
                    {logs.map((entry) => {
                      const isExpanded = expandedLogId === entry._id;
                      return (
                        <div key={entry._id} className="py-2 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                                    entry.status === 'replied'
                                      ? 'bg-neutral-900 text-white border-neutral-900'
                                      : entry.status === 'error'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                  }`}
                                >
                                  {entry.status === 'replied'
                                    ? 'Respondido'
                                    : entry.status === 'error'
                                    ? 'Erro'
                                    : 'Ignorado'}
                                </span>
                                <span className="text-xs font-medium text-neutral-900 truncate">
                                  {entry.fromName ? `${entry.fromName} <${entry.fromEmail}>` : entry.fromEmail}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-600 truncate mt-0.5">
                                {entry.subject}
                              </p>
                              <p className="text-[11px] text-neutral-400">
                                {new Date(entry.createdAt).toLocaleString('pt-MZ')}
                              </p>
                            </div>

                            {entry.replyBody && (
                              <button
                                type="button"
                                onClick={() => setExpandedLogId(isExpanded ? null : entry._id)}
                                className="text-[11px] font-medium text-neutral-600 hover:text-neutral-900 underline shrink-0 cursor-pointer"
                              >
                                {isExpanded ? 'Ocultar' : 'Ver'}
                              </button>
                            )}
                          </div>

                          {isExpanded && entry.replyBody && (
                            <div className="mt-1.5 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-700 whitespace-pre-wrap">
                              {entry.replyBody}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-sm">
      {content}
    </div>
  );
}
