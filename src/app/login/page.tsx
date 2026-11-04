'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Server, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { auth } from '@/lib/auth';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import FacebookPixel from '@/lib/facebookPixel';
import { soundEffects } from '@/lib/soundEffects';
import ReauthenticationModal from '@/components/ReauthenticationModal';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(true);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get('email');
        if (emailParam) setEmail(emailParam);

        const errorParam = params.get('error');
        if (errorParam) {
          // Tratamento específico de erros do Google OAuth
          switch (errorParam) {
            case 'OAuthSignin':
            case 'OAuthCallback':
            case 'OAuthCreateAccount':
              setError('Erro ao conectar com Google. Tente novamente.');
              break;
            case 'OAuthAccountNotLinked':
              setError('Esta conta Google já está vinculada a outro usuário.');
              break;
            case 'OAuthSessionRequired':
              setError('Sessão do Google expirada. Faça login novamente.');
              break;
            case 'OAuthError':
            case 'OAuthAuthorizationError':
              setError('Autorização negada. Verifique as permissões do Google.');
              break;
            case 'OAuthError':
              setError('Erro na autenticação do Google. Entre em contato com o suporte.');
              break;
            case 'Configuration':
              setError('Erro de configuração do sistema. Contacte o administrador.');
              break;
            case 'AccessDenied':
              setError('Acesso negado. Verifique as permissões da sua conta Google.');
              break;
            default:
              setError('Não foi possível entrar com o Google. Verifique as suas permissões e tente novamente.');
          }
        }
      }
      auth.fetchUsersAsync().catch(() => {});
      
      // Verificar se Google OAuth está configurado
      fetch('/api/debug/check-env')
        .then(res => res.json())
        .then(data => {
          const isConfigured = data.success && (data.allConfigured ?? data.allSet ?? data.googleOAuth?.configured ?? true);
          if (!isConfigured) {
            console.warn('[Login] Google OAuth não está configurado');
            setGoogleConfigured(false);
          } else {
            setGoogleConfigured(true);
          }
        })
        .catch(() => {
          console.warn('[Login] Não foi possível verificar configuração do Google OAuth, mantendo ativado');
        });
    } catch (err) {
      console.error('Erro no useEffect:', err);
    }
  }, [router]);

  const handleReauthSuccess = () => {
    if (pendingUser && auth.isAdminUser(pendingUser)) {
      window.location.href = '/admin';
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClickSound();
    setError('');
    setLoading(true);
    try {
      console.log('[Login Normal] Iniciando login com email:', email);
      const user = await auth.loginAsync(email, password);
      console.log('[Login Normal] Usuário autenticado:', { email: user.email, status: user.status, role: user.role });
      
      soundEffects.playLoginSuccessSound();

      // Rastrear CompleteRegistration no Facebook Pixel
      FacebookPixel.trackCustom('CompleteRegistration', {
        content_name: 'Login Realizado',
        status: 'success'
      });
      
      if (auth.isAdminUser(user)) {
        console.log('[Login Normal] Administrador requer Reautenticação');
        setPendingUser(user);
        setShowReauthModal(true);
        return;
      }
      console.log('[Login Normal] Redirecionando para dashboard');
      window.location.href = '/dashboard';
    } catch (err) {
      soundEffects.playErrorSound();
      console.error('[Login Normal] Erro de login:', err);
      setError(err instanceof Error ? err.message : 'Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    soundEffects.playClickSound();
    setError('');
    setGoogleLoading(true);
    try {
      console.log('[Google Login] Iniciando login Google...');
      
      // Rastrear CompleteRegistration no Facebook Pixel
      FacebookPixel.trackCustom('CompleteRegistration', {
        content_name: 'Login com Google',
        status: 'initiated'
      });
      
      // Redireciona o navegador diretamente para a página de autorização do Google
      const result = await signIn('google', { callbackUrl: '/api/auth/redirect-role' });
      console.log('[Google Login] Result do signIn:', result);
    } catch (err) {
      console.error('[Google Login] Erro ao conectar com Google:', err);
      setError('Erro ao conectar com Google. Verifique a sua ligação à internet.');
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10 relative bg-slate-950"
    >
      {loading && <PageLoader text="A autenticar a sua conta com segurança..." />}
      {/* Fundo Datacenter */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/datacenter-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-primary-950/80" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-5 sm:mb-7">
          <BrandLogo logoHeightClass="h-7 sm:h-8" />
          <h1 className="text-lg sm:text-xl font-bold text-white mt-3 sm:mt-4">Bem-vindo de volta</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Acesse o seu painel de controlo</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl">

          {error && (
            <div className="bg-red-500/15 border border-red-500/40 text-red-300 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl mb-4 sm:mb-5 text-[10px] sm:text-xs font-medium space-y-2.5">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{error}</span>
              </div>
              <a
                href={`https://wa.me/258848335618?text=${encodeURIComponent(
                  `Olá Suporte WEHOSTHERE! Estou com dificuldade para entrar na minha conta${email ? ` (${email.trim()})` : ''}. Erro apresentado: "${error}". Podem ajudar-me?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-2 transition shadow-sm"
              >
                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.126.556 4.124 1.535 5.86l-1.535 5.605 5.736-1.505c1.693.922 3.633 1.44 5.702 1.44 6.627 0 12-5.373 12-12s-5.373-12-11.438-11.4z" />
                </svg>
                <span>Falar com o Suporte no WhatsApp</span>
              </a>
            </div>
          )}

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || !googleConfigured}
            className={`w-full py-2 sm:py-2.5 font-semibold rounded-lg sm:rounded-xl transition border flex items-center justify-center space-x-2 sm:space-x-2.5 mb-3 sm:mb-4 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              !googleConfigured 
                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' 
                : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300'
            }`}
            title={!googleConfigured ? 'Google OAuth não está configurado' : 'Entrar com Google'}
          >
            {googleLoading ? (
              <span className="flex items-center space-x-1.5 sm:space-x-2">
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>A conectar com Google...</span>
              </span>
            ) : !googleConfigured ? (
              <>
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" viewBox="0 0 24 24">
                  <path fill="#9CA3AF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#9CA3AF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#9CA3AF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#9CA3AF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google não configurado</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Entrar com Google</span>
              </>
            )}
          </button>

          <div className="flex items-center mb-3 sm:mb-4">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-2 sm:px-3 text-[10px] sm:text-xs text-slate-500">ou</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[10px] sm:text-xs font-semibold text-slate-300 mb-1 sm:mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-600 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 outline-none text-xs sm:text-sm transition autofill-dark"
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <label htmlFor="password" className="block text-[10px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Senha
                </label>
                <Link href="/forgot-password" className="text-[10px] sm:text-xs text-primary-400 hover:text-primary-300 transition">
                  Esqueceu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 sm:pl-9 pr-9 sm:pr-10 py-2 sm:py-2.5 bg-slate-800 border border-slate-600 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 outline-none text-xs sm:text-sm transition autofill-dark"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </button>
              </div>
            </div>

            {/* Lembrar-me */}
            <label className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer">
              <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-primary-600 border-slate-600 bg-slate-800 focus:ring-primary-500" />
              <span className="text-xs sm:text-sm text-slate-400">Manter sessão iniciada</span>
            </label>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold rounded-lg sm:rounded-xl transition shadow-lg hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm mt-1.5 sm:mt-2"
            >
              {loading ? (
                <span className="flex items-center space-x-1.5 sm:space-x-2">
                  <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>A entrar...</span>
                </span>
              ) : (
                <>
                  <span>Entrar na conta</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </>
              )}
            </button>

            {/* Opção Rápida de Reautenticação por Código */}
            <button
              type="button"
              onClick={() => {
                if (!email) {
                  setError('Por favor, insira o seu e-mail no campo acima para receber o código.');
                  return;
                }
                setPendingUser({ email });
                setShowReauthModal(true);
              }}
              className="w-full py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-lg sm:rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm active:scale-98"
            >
              <ShieldCheck className="h-4 w-4 text-primary-400" />
              <span>Entrar com Código Seguro (Reautenticação)</span>
            </button>
          </form>

          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/10 text-center">
            <p className="text-xs sm:text-sm text-slate-400">
              Não tem conta?{' '}
              <Link href="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition">
                Criar conta gratuita
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-5 text-center">
          <Link href="/" className="text-[10px] sm:text-xs text-slate-500 hover:text-slate-300 transition">
            ← Voltar para a página inicial
          </Link>
        </div>
        {/* Modal de Reautenticação Estilo Vercel */}
        <ReauthenticationModal
          isOpen={showReauthModal}
          onClose={() => setShowReauthModal(false)}
          userEmail={email || pendingUser?.email || ''}
          onSuccess={handleReauthSuccess}
          title="Reauthenticate"
          lang="pt"
        />
      </div>
    </div>
  );
}
