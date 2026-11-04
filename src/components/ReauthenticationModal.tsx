'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Mail, ArrowLeft } from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';

export interface ReauthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onSuccess: () => Promise<boolean | void> | void;
  title?: string;
  actionDescription?: string;
  initialStep?: 'request_code' | 'enter_code';
  lang?: 'pt' | 'en';
  autoDispatchApi?: boolean;
}

export default function ReauthenticationModal({
  isOpen,
  onClose,
  userEmail,
  onSuccess,
  title,
  actionDescription,
  initialStep = 'request_code',
  lang = 'pt',
  autoDispatchApi = true
}: ReauthenticationModalProps) {
  const [step, setStep] = useState<'request_code' | 'enter_code'>(initialStep);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Dicionário de textos em Português e Inglês
  const isPt = lang === 'pt';
  const modalTitle = title || (isPt ? 'Reautenticação' : 'Reauthenticate');
  const defaultDescStep1 = isPt
    ? `Para continuar, desbloqueie esta ação com um código enviado para `
    : `To continue, unlock this action with a code sent to `;
  const defaultDescStep2 = isPt
    ? `Insira o código que enviámos para `
    : `Enter the code we sent to `;

  const btnSendCode = isPt ? 'Enviar Código para o E-mail' : 'Send Code to Email';
  const btnVerify = isPt ? 'Verificar' : 'Verify';
  const btnCancel = isPt ? 'Cancelar' : 'Cancel';
  const btnSending = isPt ? 'A enviar código...' : 'Sending code...';
  const btnVerifying = isPt ? 'A verificar...' : 'Verifying...';
  const btnVerified = isPt ? 'Verificado' : 'Verified';
  const notReceivedText = isPt ? 'Não recebeu o código?' : 'Did not receive the code?';
  const resendText = isPt ? 'Reenviar código' : 'Resend code';
  const resendWaitText = isPt ? 'Reenviar em' : 'Resend in';
  const backText = isPt ? 'Voltar' : 'Back';

  // Resetar estados ao abrir
  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setDigits(['', '', '', '', '', '']);
      setError('');
      setSuccess(false);
      setLoading(false);
      if (initialStep === 'enter_code') {
        setTimeout(() => inputRefs.current[0]?.focus(), 150);
      }
    }
  }, [isOpen, initialStep]);

  // Contagem decrescente do reenvio de código
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Tecla ESC para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  // Ação: Solicitar Envio do Código
  const handleSendCode = async () => {
    try {
      soundEffects.playClickSound();
      setLoading(true);
      setError('');

      if (autoDispatchApi) {
        const res = await fetch('/api/auth/reauthenticate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send', email: userEmail })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || (isPt ? 'Falha ao enviar código para o e-mail.' : 'Failed to send code to email.'));
        }
      }

      setStep('enter_code');
      setResendCooldown(60);
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      soundEffects.playErrorSound();
      setError(err.message || (isPt ? 'Erro ao comunicar com o servidor.' : 'Server communication error.'));
    } finally {
      setLoading(false);
    }
  };

  // Efeito de vibração (shake) ao errar
  const triggerErrorShake = (message: string) => {
    soundEffects.playErrorSound();
    setError(message);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Ação: Validar Código de 6 Dígitos
  const handleVerify = useCallback(async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length !== 6) {
      triggerErrorShake(isPt ? 'Por favor, insira o código completo de 6 dígitos.' : 'Please enter the complete 6-digit code.');
      return;
    }

    try {
      soundEffects.playClickSound();
      setLoading(true);
      setError('');

      if (autoDispatchApi) {
        const res = await fetch('/api/auth/reauthenticate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify',
            email: userEmail,
            code
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || (isPt ? 'Código incorreto ou expirado.' : 'Incorrect or expired code.'));
        }
      }

      soundEffects.playLoginSuccessSound();
      setSuccess(true);

      setTimeout(async () => {
        try {
          await onSuccess();
        } finally {
          onClose();
        }
      }, 700);
    } catch (err: any) {
      triggerErrorShake(err.message || (isPt ? 'Erro ao validar o código.' : 'Error validating code.'));
    } finally {
      setLoading(false);
    }
  }, [digits, autoDispatchApi, userEmail, isPt, onSuccess, onClose]);

  // Manipulação de Dígitos Individuais
  const handleDigitChange = (index: number, value: string) => {
    if (loading || success) return;

    const cleanVal = value.replace(/\D/g, '');
    const newDigits = [...digits];

    if (!cleanVal) {
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    newDigits[index] = cleanVal[cleanVal.length - 1];
    setDigits(newDigits);
    setError('');

    // Avança automaticamente para o campo seguinte
    if (index < 5 && newDigits[index]) {
      inputRefs.current[index + 1]?.focus();
    }

    // Se todos os 6 dígitos foram preenchidos, aciona a verificação imediatamente
    const allFilled = newDigits.every((d) => d.length === 1);
    if (allFilled && index === 5) {
      handleVerify(newDigits.join(''));
    }
  };

  // Backspace e Teclas de Navegação
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  };

  // Suporte a Colar Código Completo (Paste)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);
    setError('');

    const nextEmptyIndex = newDigits.findIndex((d) => !d);
    if (nextEmptyIndex !== -1 && nextEmptyIndex < 6) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
      if (newDigits.every((d) => d.length === 1)) {
        handleVerify(newDigits.join(''));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-[420px] bg-[#0a0a0a] text-white rounded-2xl border border-[#262626] shadow-2xl p-6 sm:p-7 relative transition-all duration-200 ${
          isShaking ? 'animate-shake' : 'animate-in zoom-in-95 duration-150'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reauth-modal-title"
      >
        {/* Top Header */}
        <div className="mb-6 space-y-1.5">
          <div className="flex items-center justify-between">
            <h2
              id="reauth-modal-title"
              className="text-xl font-bold tracking-tight text-white flex items-center space-x-2"
            >
              <span>{modalTitle}</span>
            </h2>
            {step === 'enter_code' && (
              <button
                type="button"
                onClick={() => {
                  setStep('request_code');
                  setError('');
                }}
                className="text-neutral-400 hover:text-white text-xs flex items-center space-x-1 cursor-pointer transition"
                title={backText}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{backText}</span>
              </button>
            )}
          </div>

          <p className="text-xs sm:text-[13px] text-neutral-400 leading-relaxed font-normal">
            {step === 'request_code' ? (
              actionDescription || (
                <>
                  {defaultDescStep1}
                  <strong className="text-white font-mono">{userEmail}</strong>.
                </>
              )
            ) : (
              <>
                {defaultDescStep2}
                <strong className="text-white font-mono">{userEmail}</strong>.
              </>
            )}
          </p>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-medium flex items-start space-x-2.5 animate-in fade-in duration-150">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1 leading-snug">{error}</span>
          </div>
        )}

        {/* Mensagem de Sucesso */}
        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{isPt ? 'Código validado com sucesso! A desbloquear...' : 'Code verified successfully! Unlocking...'}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* ETAPA 1: SOLICITAR CÓDIGO (SEND CODE TO EMAIL)          */}
        {/* ======================================================== */}
        {step === 'request_code' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading}
              className="w-full py-3 px-4 bg-white hover:bg-neutral-200 active:scale-[0.99] disabled:opacity-50 text-black font-semibold text-sm rounded-xl transition-all duration-150 cursor-pointer shadow-sm flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  <span>{btnSending}</span>
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 text-black" />
                  <span>{btnSendCode}</span>
                </>
              )}
            </button>

            <div className="pt-2 flex items-center justify-start border-t border-[#1a1a1a]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-[#121212] hover:bg-[#1c1c1c] text-neutral-300 hover:text-white border border-[#2a2a2a] rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95"
              >
                {btnCancel}
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ETAPA 2: DIGITAR 6 DÍGITOS (ENTER CODE & VERIFY)         */}
        {/* ======================================================== */}
        {step === 'enter_code' && (
          <div className="space-y-5">
            {/* 6 Campos de Entrada de Código (Vercel Style) */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              {digits.map((digit, idx) => {
                const isFieldFilled = digit.length > 0;
                return (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    disabled={loading || success}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className={`w-11 sm:w-12 h-13 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl transition-all duration-150 outline-none select-none ${
                      error
                        ? 'bg-[#141414] border-2 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                        : success
                        ? 'bg-[#141414] border-2 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                        : isFieldFilled
                        ? 'bg-[#171717] border border-neutral-600 text-white shadow-2xs'
                        : 'bg-[#121212] border border-[#2c2c2c] text-white hover:border-neutral-600'
                    } focus:border-[#0070f3] focus:ring-2 focus:ring-[#0070f3]/40 focus:bg-[#1a1a1a]`}
                  />
                );
              })}
            </div>

            {/* Reenvio de Código com Timer */}
            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
              <span>{notReceivedText}</span>
              {resendCooldown > 0 ? (
                <span className="text-neutral-500 font-mono">
                  {resendWaitText} {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading || success}
                  className="text-neutral-300 hover:text-white underline cursor-pointer inline-flex items-center space-x-1 font-medium transition"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>{resendText}</span>
                </button>
              )}
            </div>

            {/* Botão Verify (Primary White Button) */}
            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={loading || success || digits.join('').length !== 6}
              className="w-full py-3 px-4 bg-white hover:bg-neutral-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm rounded-xl transition-all duration-150 cursor-pointer shadow-sm flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  <span>{btnVerifying}</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  <span>{btnVerified}</span>
                </>
              ) : (
                <span>{btnVerify}</span>
              )}
            </button>

            {/* Botão Cancel (Secondary Dark Button) */}
            <div className="pt-2 flex items-center justify-start border-t border-[#1a1a1a]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-[#121212] hover:bg-[#1c1c1c] text-neutral-300 hover:text-white border border-[#2a2a2a] rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95"
              >
                {btnCancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
