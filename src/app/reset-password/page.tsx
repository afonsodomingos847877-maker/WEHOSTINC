'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, Mail } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import ReauthenticationModal from '@/components/ReauthenticationModal';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token');

  const [token, setToken] = useState<string | null>(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Fallback de verificação com código de 6 dígitos
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token inválido ou ausente');
      setTokenValid(false);
    } else {
      // Validar token stateless assinado
      fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', token }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setTokenValid(true);
            setError('');
          } else {
            setError(data.error || 'Token inválido ou expirado');
            setTokenValid(false);
          }
        })
        .catch(() => {
          setError('Erro ao validar token');
          setTokenValid(false);
        });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      return setError('A senha deve ter pelo menos 6 caracteres');
    }

    if (password !== confirmPassword) {
      return setError('As senhas não coincidem');
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOtpFlow = () => {
    if (!otpEmail.trim()) {
      setShowEmailPrompt(true);
      return;
    }
    setShowOtpModal(true);
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10 relative bg-slate-950">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/servidores-banner.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-primary-950/80" />
        <div className="relative z-10 text-white font-medium flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>A validar chave de segurança...</span>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10 relative bg-slate-950">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/servidores-banner.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-primary-950/80" />
        <div className="relative z-10 w-full max-w-sm">
          <div className="text-center mb-5 sm:mb-7">
            <BrandLogo logoHeightClass="h-7 sm:h-8" />
            <h1 className="text-lg sm:text-xl font-bold text-white mt-3 sm:mt-4">Token Inválido</h1>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-red-300 text-sm mb-4">{error}</p>

            {showEmailPrompt ? (
              <div className="space-y-3 mb-4 text-left">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                  Email da sua conta:
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (otpEmail.trim()) setShowOtpModal(true);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  Enviar Código de 6 Dígitos
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 mb-4">
                <button
                  type="button"
                  onClick={handleStartOtpFlow}
                  className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Validar com Código de 6 Dígitos</span>
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 space-y-2">
              <Link
                href="/forgot-password"
                className="inline-block text-primary-400 hover:text-primary-300 text-xs font-semibold"
              >
                Solicitar novo link por e-mail
              </Link>
              <div>
                <Link
                  href="/login"
                  className="text-slate-400 hover:text-slate-300 text-[11px]"
                >
                  Voltar para Login
                </Link>
              </div>
            </div>
          </div>
        </div>

        <ReauthenticationModal
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          userEmail={otpEmail}
          title="Recuperação de Senha"
          actionDescription="Para redefinir a sua senha agora mesmo, desbloqueie com o código de segurança enviado para"
          lang="pt"
          onSuccess={(data) => {
            if (data?.resetToken) {
              setToken(data.resetToken);
              setTokenValid(true);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10 relative bg-slate-950">
      {/* Fundo */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/servidores-banner.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-primary-950/80" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-5 sm:mb-7">
          <BrandLogo logoHeightClass="h-7 sm:h-8" />
          <h1 className="text-lg sm:text-xl font-bold text-white mt-3 sm:mt-4">Nova Senha</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {success ? 'Senha redefinida!' : 'Digite sua nova senha'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl">

          {error && (
            <div className="bg-red-500/15 border border-red-500/40 text-red-300 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl mb-4 sm:mb-5 text-[10px] sm:text-sm font-medium">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-6 sm:py-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-white font-semibold text-base sm:text-lg mb-2">Senha Redefinida!</h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Redirecionando para o login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Nova Senha */}
              <div>
                <label htmlFor="password" className="block text-[10px] sm:text-xs font-semibold text-slate-300 mb-1 sm:mb-1.5 uppercase tracking-wider">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 sm:pl-9 pr-9 sm:pr-10 py-2 sm:py-2.5 bg-slate-800 border border-slate-600 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 outline-none text-xs sm:text-sm transition"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div>
                <label htmlFor="confirmPassword" className="block text-[10px] sm:text-xs font-semibold text-slate-300 mb-1 sm:mb-1.5 uppercase tracking-wider">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-8 sm:pl-9 pr-9 sm:pr-10 py-2 sm:py-2.5 bg-slate-800 border rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 outline-none text-xs sm:text-sm transition ${
                      confirmPassword && confirmPassword !== password ? 'border-red-500/60' : 'border-slate-600 focus:border-primary-500/60'
                    }`}
                    placeholder="Repita a senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirm ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  </button>
                </div>
                {confirmPassword && password === confirmPassword && (
                  <p className="text-emerald-400 text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 flex items-center space-x-0.5 sm:space-x-1">
                    <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" /><span>Senhas coincidem</span>
                  </p>
                )}
              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-lg sm:rounded-xl transition shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm mt-1.5 sm:mt-2"
              >
                {loading ? (
                  <span className="flex items-center space-x-1.5 sm:space-x-2">
                    <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Redefinindo...</span>
                  </span>
                ) : (
                  <span>Redefinir Senha</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/10 text-center">
            <Link href="/login" className="text-[10px] sm:text-xs text-slate-400 hover:text-slate-300 transition">
              Voltar para Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
