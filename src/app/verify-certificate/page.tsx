'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Search, Award, CheckCircle2, AlertTriangle, ArrowLeft, Calendar, User, BookOpen, ExternalLink } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { Certificate } from '@/lib/data';

function VerifyCertificateContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || searchParams.get('certificateNumber') || '';
  
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (searchCode: string) => {
    const cleanCode = searchCode.trim();
    if (!cleanCode) return;

    setLoading(true);
    setSearched(true);
    setError(null);
    setCertificate(null);

    try {
      const res = await fetch(`/api/certificates?certificateNumber=${encodeURIComponent(cleanCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.certificates && data.certificates.length > 0) {
          setCertificate(data.certificates[0]);
        } else {
          // Fallback para verificar no localStorage
          if (typeof window !== 'undefined') {
            const localCerts = JSON.parse(localStorage.getItem('wehosthere_certificates') || '[]');
            const match = localCerts.find((c: any) => c.certificateNumber === cleanCode);
            if (match) {
              setCertificate(match);
            } else {
              setError('Nenhum certificado registado com este código de autenticidade.');
            }
          } else {
            setError('Nenhum certificado registado com este código de autenticidade.');
          }
        }
      } else {
        setError('Erro ao consultar a base de dados de certificados.');
      }
    } catch (err) {
      setError('Falha na ligação com o servidor de validação.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      handleVerify(initialCode);
    }
  }, [initialCode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-indigo-500/20 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <BrandLogo />
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-300 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar à WEHOSTHERE</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full flex flex-col items-center justify-center">
        {/* Title */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="h-4 w-4" />
            <span>Portal Oficial de Autenticidade</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Validação de Certificados
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Consulte a autenticidade e validade oficial de certificados emitidos pela Academia Web WEHOSTHERE.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-xl mb-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(code);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Insira o código (ex: WH-1740-XXXX)"
                className="w-full bg-slate-900/90 border border-indigo-500/40 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-6 py-3.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-indigo-600/30 cursor-pointer whitespace-nowrap flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>A verificar...</span>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Validar Certificado</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Verification Result Card */}
        {searched && (
          <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300">
            {certificate ? (
              <div className="bg-white text-gray-900 rounded-3xl p-6 sm:p-10 shadow-2xl border-4 border-emerald-500/40 relative overflow-hidden">
                {/* Ribbon Top */}
                <div className="bg-emerald-600 text-white text-center py-2 px-4 -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 mb-6 flex items-center justify-center space-x-2 shadow">
                  <CheckCircle2 className="h-5 w-5 text-emerald-200 shrink-0" />
                  <span className="font-extrabold text-xs sm:text-sm tracking-wide uppercase">
                    Certificado Autêntico e Válido no Registo Oficial
                  </span>
                </div>

                <div className="text-center mb-6">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Certificado N.º</span>
                  <span className="font-mono text-lg sm:text-xl font-black text-primary-700">{certificate.certificateNumber}</span>
                </div>

                {/* Details Grid */}
                <div className="space-y-4 bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold block">Aluno Titular:</span>
                      <strong className="text-base sm:text-lg text-gray-950 block">{certificate.userName || certificate.userEmail}</strong>
                      <span className="text-xs text-gray-500 font-mono">{certificate.userEmail}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3 flex items-start space-x-3">
                    <BookOpen className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold block">Curso Concluído:</span>
                      <strong className="text-base sm:text-lg text-gray-950">{certificate.courseTitle}</strong>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3 flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold block">Data de Conclusão e Emissão:</span>
                      <strong className="text-sm sm:text-base text-gray-900">
                        {new Date(certificate.completionDate || certificate.createdAt).toLocaleDateString('pt-MZ', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </strong>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3 flex items-start space-x-3">
                    <Award className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold block">Entidade Emissora:</span>
                      <strong className="text-sm text-gray-900">WEHOSTHERE - Tecnologia & Hospedagem Profissional</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center text-xs text-gray-500">
                  Este certificado foi emitido eletronicamente e encontra-se permanentemente registado na base de dados oficial da WEHOSTHERE.
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 sm:p-8 text-center">
                <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-red-300 mb-1">Certificado Não Encontrado</h3>
                <p className="text-gray-300 text-sm">{error}</p>
                <p className="text-gray-400 text-xs mt-3">
                  Verifique se o código foi digitado corretamente (incluindo as letras maiúsculas e hífens).
                </p>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-indigo-500/20 bg-slate-950/80 py-6 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} WEHOSTHERE. Todos os direitos reservados. Portal de Verificação de Credenciais.</p>
      </footer>
    </div>
  );
}

export default function VerifyCertificatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">A carregar portal de verificação...</div>}>
      <VerifyCertificateContent />
    </Suspense>
  );
}
