'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { 
  CheckCircle2, Lock, ArrowRight, BookOpen, AlertCircle, 
  GraduationCap, Sparkles, KeyRound, Loader2, UserCheck
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

function ClaimContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { data: session, status: authStatus } = useSession();

  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [hasExistingAccount, setHasExistingAccount] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form states for password creation
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError('Token de resgate de curso em falta ou inválido.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/academy/claim?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setEnrollment(data.enrollment);
          setHasExistingAccount(data.hasExistingAccount);

          // If user is already logged in, automatically claim it!
          if (authStatus === 'authenticated' && session?.user) {
            claimForCurrentUser((session.user as any)?.id || session.user.email);
          }
        } else {
          setError(data.error || 'Não foi possível encontrar a matrícula associada a este link.');
        }
      } catch (err: any) {
        setError('Erro ao validar o seu acesso. Por favor tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    if (authStatus !== 'loading') {
      verifyToken();
    }
  }, [token, authStatus, session]);

  const claimForCurrentUser = async (userId: string) => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/academy/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard/academy/course/${data.courseId || enrollment?.courseId}`);
        }, 1500);
      } else {
        setError(data.error || 'Erro ao associar matrícula à sua conta.');
      }
    } catch (err: any) {
      setError('Falha na comunicação com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAccountAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      return setError('A senha deve conter pelo menos 6 caracteres.');
    }
    if (password !== confirmPassword) {
      return setError('As senhas digitadas não coincidem.');
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/academy/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        // Automatically attempt sign in via Credentials
        await signIn('credentials', {
          redirect: false,
          email: enrollment.studentEmail,
          password: password
        });

        setTimeout(() => {
          router.push(`/dashboard/academy/course/${data.courseId || enrollment.courseId}`);
        }, 1200);
      } else {
        setError(data.error || 'Erro ao finalizar criação da conta.');
      }
    } catch (err: any) {
      setError('Erro ao processar pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-gray-100 shadow-xl space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
          <h2 className="text-base font-bold text-gray-900">A verificar a sua compra...</h2>
          <p className="text-xs text-gray-500">Estamos a preparar o teu acesso oficial ao curso.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-red-100 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Acesso Não Encontrado</h2>
          <p className="text-xs text-gray-600 leading-relaxed">{error}</p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/academy"
              className="w-full py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-700 transition"
            >
              Voltar à Academia
            </Link>
            <Link
              href="/login"
              className="w-full py-2.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition"
            >
              Iniciar Sessão
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-emerald-100 shadow-2xl space-y-4 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Acesso Ativado com Sucesso!</h2>
          <p className="text-xs text-gray-600">
            A tua matrícula no curso <strong>{enrollment?.courseTitle}</strong> foi vinculada com segurança. A redirecionar para a tua primeira aula...
          </p>
          <div className="pt-2">
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-primary-950 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-2 bg-emerald-50 rounded-2xl mb-1">
            <GraduationCap className="w-8 h-8 text-emerald-600" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 block w-fit mx-auto">
            Compra Confirmada
          </span>
          <h1 className="text-2xl font-black text-slate-950">Ativar Acesso ao Curso</h1>
          <p className="text-xs text-slate-600">
            Identificámos o teu pagamento para o curso <strong className="text-slate-900 font-semibold">{enrollment?.courseTitle}</strong>.
          </p>
        </div>

        {/* Purchase Summary Pill */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs space-y-1.5 text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">Aluno:</span>
            <span className="font-bold text-slate-900">{enrollment?.studentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">E-mail:</span>
            <span className="font-mono font-bold text-slate-900">{enrollment?.studentEmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Estado:</span>
            <span className="font-bold text-emerald-600">Pagamento Verificado</span>
          </div>
        </div>

        {/* Dynamic Branch: Existing Account vs New Account */}
        {hasExistingAccount ? (
          <div className="space-y-4 bg-primary-50/70 border border-primary-200/80 rounded-2xl p-5">
            <div className="flex items-start gap-2.5">
              <UserCheck className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-primary-950 uppercase tracking-wide">
                  Já tens uma conta com este e-mail!
                </h3>
                <p className="text-xs text-primary-800 mt-1">
                  Inicia sessão com a tua senha habitual para sincronizar este curso imediatamente com o teu painel.
                </p>
              </div>
            </div>

            <Link
              href={`/login?email=${encodeURIComponent(enrollment?.studentEmail)}&claimToken=${encodeURIComponent(token || '')}`}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Entrar com a Minha Conta</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleCreateAccountAndClaim} className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>Cria a tua Senha de Acesso</span>
              </h3>
              <p className="text-xs text-slate-500">
                Define uma senha para entrares na tua Área de Aluno e assistires às aulas quando quiseres.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nova Senha (mínimo 6 caracteres)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A Ativar Acesso...</span>
                </>
              ) : (
                <>
                  <span>Criar Senha & Começar o Curso</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-[11px] text-slate-400">
          WEHOSTHERE ACADEMY • Transação Segura e Idempotente
        </div>

      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        A carregar...
      </div>
    }>
      <ClaimContent />
    </Suspense>
  );
}

