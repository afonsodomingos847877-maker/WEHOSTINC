'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Laptop,
  Smartphone,
  Server,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Globe,
  Key,
  Inbox,
  Send,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export default function ConfigurarEmailAjudaPage() {
  const [activeTab, setActiveTab] = useState<'outlook' | 'apple' | 'android' | 'thunderbird' | 'server'>('outlook');
  const [customEmail, setCustomEmail] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const displayEmail = customEmail.trim() || 'contacto@suaempresa.co.mz';
  const displayDomain = displayEmail.includes('@') ? displayEmail.split('@')[1] : 'suaempresa.co.mz';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-800">
      
      {/* ───── TOP NAVIGATION BAR ───── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-slate-900 font-bold hover:text-blue-600 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Mail className="h-4 w-4" />
              </div>
              <span className="text-base font-extrabold tracking-tight">WEHOSTHERE</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Centro de Ajuda
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard/email"
              className="text-xs font-medium text-slate-600 hover:text-blue-600 transition hidden sm:inline"
            >
              Painel de E-mails
            </Link>
            <Link
              href="/webmail"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Abrir Webmail</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ───── BREADCRUMBS ───── */}
      <div className="border-b border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <nav className="flex items-center space-x-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-blue-600">Início</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <Link href="/dashboard/email" className="hover:text-blue-600">E-mail Corporativo</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-900 font-semibold">Guia de Configuração (Outlook & Telemóvel)</span>
          </nav>
        </div>
      </div>

      {/* ───── HERO SECTION ───── */}
      <section className="bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            <span>Tutorial Oficial Passo a Passo</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Como Configurar o seu E-mail Corporativo
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Siga as instruções abaixo para sincronizar seus e-mails profissionais no <strong className="text-white">Microsoft Outlook</strong>, <strong className="text-white">iPhone</strong>, <strong className="text-white">Android</strong> ou qualquer outro aplicativo de e-mail.
          </p>

          {/* Interactive Personalization Box */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/20 text-left shadow-lg">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-200 mb-1.5">
                💡 Dica: Digite o seu endereço de e-mail para personalizar este guia:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="ex: comercial@suaempresa.co.mz"
                  className="flex-1 px-3 py-2 rounded-xl bg-white text-slate-900 text-xs sm:text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {customEmail && (
                  <button
                    onClick={() => setCustomEmail('')}
                    className="px-3 py-2 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <p className="text-[11px] text-blue-200/80 mt-1.5">
                Todas as caixas de exemplo e instruções abaixo serão adaptadas para <strong className="text-white font-mono">{displayEmail}</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── MAIN CONTENT ───── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">

        {/* ───── SUMMARY NOTICE ───── */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start space-x-3.5 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="text-xs sm:text-sm text-amber-900 leading-relaxed space-y-1">
            <strong className="font-bold block text-amber-950">
              Regra Mais Importante: Nome de Utilizador / Username
            </strong>
            <p>
              Ao configurar em qualquer aplicativo, o campo <strong>Nome de Utilizador (Username)</strong> deve ser <u className="font-semibold underline decoration-amber-500">SEMPRE o endereço de e-mail completo</u> (ex: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950">{displayEmail}</code>), e <strong>NUNCA</strong> apenas o seu primeiro nome ou apenas o que vem antes do @.
            </p>
          </div>
        </div>

        {/* ───── NAVIGATION TABS ───── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50/75 p-2 overflow-x-auto gap-1">
            
            <button
              onClick={() => setActiveTab('outlook')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'outlook'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Laptop className="h-4 w-4" />
              <span>Microsoft Outlook</span>
            </button>

            <button
              onClick={() => setActiveTab('apple')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'apple'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>iPhone &amp; iPad</span>
            </button>

            <button
              onClick={() => setActiveTab('android')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'android'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>Android (Gmail)</span>
            </button>

            <button
              onClick={() => setActiveTab('thunderbird')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'thunderbird'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Mail className="h-4 w-4" />
              <span>Thunderbird / Mac</span>
            </button>

            <button
              onClick={() => setActiveTab('server')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'server'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Server className="h-4 w-4" />
              <span>Parâmetros Técnicos</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">

            {/* ══════════ TAB 1: OUTLOOK ══════════ */}
            {activeTab === 'outlook' && (
              <div className="space-y-6">
                <div className="border-l-4 border-blue-600 pl-4 py-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Como Configurar no Microsoft Outlook (Windows ou Mac)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Compatível com Outlook 2016, 2019, 2021, Microsoft 365 e Outlook para Mac.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Abrir o Assistente de Nova Conta</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-9">
                      No seu Microsoft Outlook, clique no menu superior <strong>Ficheiro (File)</strong> &gt; <strong>Adicionar Conta (Add Account)</strong>.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Inserir E-mail e Configuração Manual</h3>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 pl-9 space-y-2">
                      <p>
                        No campo de endereço de e-mail, digite o seu endereço completo:
                      </p>
                      <div className="inline-flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-blue-700 font-bold text-xs">
                        <span>{displayEmail}</span>
                        <button
                          onClick={() => copyToClipboard(displayEmail, 'outlook_email')}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500"
                        >
                          {copiedKey === 'outlook_email' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <p>
                        Em seguida, clique em <strong>&quot;Opções avançadas&quot;</strong>, marque <strong>&quot;Configurar minha conta manualmente&quot;</strong> e clique em <strong>Conectar</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Selecionar o Tipo de Conta: IMAP</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-9">
                      Na lista de provedores exibida, clique sobre o ícone <strong>IMAP</strong>. (O IMAP garante sincronização em tempo real entre o Outlook, celular e webmail).
                    </p>
                  </div>

                  {/* Step 4: Hostnames */}
                  <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/60 space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">4</span>
                      <h3 className="font-bold text-blue-950 text-sm sm:text-base">Preencher os Servidores de Entrada e Saída</h3>
                    </div>
                    
                    <div className="pl-9 space-y-3 text-xs sm:text-sm">
                      <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                            <Inbox className="h-4 w-4 text-blue-600" />
                            <span>Correio a receber (IMAP):</span>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Entrada</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Servidor:</span>
                            <span className="font-mono font-bold text-slate-900">imap.migadu.com</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Porta:</span>
                            <span className="font-mono font-bold text-slate-900">993</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Criptografia:</span>
                            <span className="font-bold text-emerald-700">SSL / TLS</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                            <Send className="h-4 w-4 text-emerald-600" />
                            <span>Correio a enviar (SMTP):</span>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Saída</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Servidor:</span>
                            <span className="font-mono font-bold text-slate-900">smtp.migadu.com</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Porta:</span>
                            <span className="font-mono font-bold text-slate-900">465 <span className="font-normal text-slate-400">(ou 587)</span></span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Criptografia:</span>
                            <span className="font-bold text-emerald-700">SSL / TLS</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">5</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Inserir a Senha e Concluir</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-9">
                      Introduza a senha da sua caixa de e-mail e clique em <strong>Conectar</strong>. O Outlook fará o teste automático e a sua conta estará pronta a usar!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ TAB 2: IPHONE / APPLE MAIL ══════════ */}
            {activeTab === 'apple' && (
              <div className="space-y-6">
                <div className="border-l-4 border-slate-900 pl-4 py-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Como Configurar no iPhone e iPad (Apple Mail)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Passo a passo no aplicativo oficial Mail do iOS (iPhone 11, 12, 13, 14, 15, 16 ou iPadOS).
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Aceder aos Ajustes do iPhone</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-9">
                      Abra o aplicativo <strong>Ajustes (Definições)</strong> no seu iPhone &gt; role até <strong>Mail</strong> &gt; clique em <strong>Contas</strong> &gt; <strong>Adicionar Conta</strong>.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Selecionar &quot;Outra&quot;</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-9">
                      Na lista de provedores, desça até o final e toque em <strong>Outra</strong> &gt; <strong>Adicionar Conta de E-mail</strong>.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Identificação da Conta</h3>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 pl-9 space-y-1.5">
                      <p>• <strong>Nome:</strong> O seu nome ou da sua empresa (ex: <em>Comercial - {displayDomain}</em>)</p>
                      <p>• <strong>E-mail:</strong> <code className="bg-slate-100 font-mono px-1 rounded font-bold text-slate-900">{displayEmail}</code></p>
                      <p>• <strong>Senha:</strong> A sua senha de e-mail</p>
                      <p>• <strong>Descrição:</strong> E-mail Corporativo</p>
                      <p className="pt-1">Toque em <strong>Seguinte</strong> no canto superior direito.</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border-2 border-slate-300 bg-slate-50 space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">4</span>
                      <h3 className="font-bold text-slate-950 text-sm sm:text-base">Servidores de Entrada e Saída (IMAP)</h3>
                    </div>
                    
                    <div className="pl-9 space-y-3 text-xs sm:text-sm text-slate-700">
                      <p>Certifique-se de que a aba <strong>IMAP</strong> está selecionada no topo e preencha:</p>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="font-bold text-slate-900 block">Servidor de Correio a Receber:</span>
                        <div className="space-y-1 text-xs">
                          <div>• Nome do Host: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">imap.migadu.com</code></div>
                          <div>• Nome de Usuário: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">{displayEmail}</code> (E-mail completo!)</div>
                          <div>• Senha: A sua senha</div>
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="font-bold text-slate-900 block">Servidor de Correio a Enviar:</span>
                        <div className="space-y-1 text-xs">
                          <div>• Nome do Host: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">smtp.migadu.com</code></div>
                          <div>• Nome de Usuário: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">{displayEmail}</code> (Obrigatório, não deixe em branco!)</div>
                          <div>• Senha: A sua senha</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">5</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Salvar</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-9">
                      Toque em <strong>Seguinte</strong>. O iPhone verificará os dados e mostrará os seletores de <em>Mail</em> e <em>Notas</em>. Deixe <strong>Mail</strong> ativado e toque em <strong>Salvar</strong>. Pronto!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ TAB 3: ANDROID / GMAIL ══════════ */}
            {activeTab === 'android' && (
              <div className="space-y-6">
                <div className="border-l-4 border-emerald-600 pl-4 py-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Como Configurar no Android (App Gmail ou Samsung Email)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Passo a passo utilizando o aplicativo oficial do Gmail pré-instalado em todos os celulares Android.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Abrir o Gmail e Adicionar Conta</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-9">
                      Abra o aplicativo <strong>Gmail</strong> &gt; toque na sua foto de perfil no canto superior direito &gt; selecione <strong>Adicionar outra conta</strong>.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Escolher &quot;Outra&quot;</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-9">
                      Na tela &quot;Configurar e-mail&quot;, toque na última opção: <strong>Outra</strong>.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Digitar o E-mail e Configuração Manual</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-9">
                      Digite <code className="bg-slate-100 font-mono px-1 rounded font-bold text-slate-900">{displayEmail}</code>. Não clique em Próximo direto: toque no botão <strong>Configuração manual</strong> (no canto inferior esquerdo) e escolha <strong>Pessoal (IMAP)</strong>.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">4</span>
                      <h3 className="font-bold text-emerald-950 text-sm sm:text-base">Servidores no Android</h3>
                    </div>
                    
                    <div className="pl-9 space-y-3 text-xs sm:text-sm">
                      <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-1">
                        <span className="font-bold text-slate-900 block">Tela 1: Servidor de Entrada</span>
                        <div className="space-y-1 text-slate-700">
                          <div>• Nome de usuário: <code className="bg-emerald-50 px-1 font-mono font-bold text-emerald-900">{displayEmail}</code></div>
                          <div>• Servidor: <code className="bg-emerald-50 px-1 font-mono font-bold text-emerald-900">imap.migadu.com</code></div>
                          <div>• Porta: <code className="font-mono font-bold">993</code> | Segurança: <span className="font-bold text-emerald-700">SSL/TLS</span></div>
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-1">
                        <span className="font-bold text-slate-900 block">Tela 2: Servidor de Saída</span>
                        <div className="space-y-1 text-slate-700">
                          <div>• Exigir login: <strong>Ativado / Marcado</strong></div>
                          <div>• Nome de usuário: <code className="bg-emerald-50 px-1 font-mono font-bold text-emerald-900">{displayEmail}</code></div>
                          <div>• Servidor SMTP: <code className="bg-emerald-50 px-1 font-mono font-bold text-emerald-900">smtp.migadu.com</code></div>
                          <div>• Porta: <code className="font-mono font-bold">465</code> | Segurança: <span className="font-bold text-emerald-700">SSL/TLS</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">5</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Frequência e Conclusão</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-9">
                      Defina a frequência de sincronização como <em>Automática (Push)</em> e clique em Próxima. Digite o seu nome que aparecerá para os destinatários. A conta estará ativa!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ TAB 4: THUNDERBIRD ══════════ */}
            {activeTab === 'thunderbird' && (
              <div className="space-y-6">
                <div className="border-l-4 border-indigo-600 pl-4 py-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Como Configurar no Mozilla Thunderbird ou Mac Mail
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    O Thunderbird possui detecção rápida. Caso necessário, o preenchimento manual leva menos de 1 minuto.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Criar Nova Conta no Thunderbird</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-9">
                      Abra o Thunderbird &gt; clique no menu sanduíche <strong>≡</strong> &gt; <strong>Novo</strong> &gt; <strong>Conta de E-mail Existente</strong>.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Preenchimento Inicial</h3>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 pl-9 space-y-1">
                      <p>• <strong>Seu Nome:</strong> O nome que deseja exibir</p>
                      <p>• <strong>Endereço de E-mail:</strong> <code className="bg-slate-100 font-mono px-1 rounded font-bold text-slate-900">{displayEmail}</code></p>
                      <p>• <strong>Senha:</strong> A sua senha de e-mail</p>
                      <p className="pt-1">Clique em <strong>Configurar manualmente</strong>.</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                      <h3 className="font-bold text-indigo-950 text-sm sm:text-base">Dados Técnicos no Thunderbird</h3>
                    </div>
                    
                    <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-700">
                      <div className="bg-white p-3 rounded-xl border border-indigo-200">
                        <strong>Recebimento (IMAP):</strong> Hostname: <code className="font-mono font-bold">imap.migadu.com</code> | Porta: <code className="font-mono font-bold">993</code> | SSL: <strong>SSL/TLS</strong> | Autenticação: <strong>Senha normal</strong>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-indigo-200">
                        <strong>Envio (SMTP):</strong> Hostname: <code className="font-mono font-bold">smtp.migadu.com</code> | Porta: <code className="font-mono font-bold">465</code> | SSL: <strong>SSL/TLS</strong> | Autenticação: <strong>Senha normal</strong>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-indigo-200">
                        <strong>Nome de Usuário (Entrada e Saída):</strong> <code className="font-mono font-bold text-indigo-700">{displayEmail}</code>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">4</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Testar e Concluir</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-9">
                      Clique em <strong>Retestar</strong>. Os indicadores ficarão verdes e o botão <strong>Pronto</strong> será liberado. Clique nele para começar a usar!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ TAB 5: PARÂMETROS TÉCNICOS (TABELA) ══════════ */}
            {activeTab === 'server' && (
              <div className="space-y-6">
                <div className="border-l-4 border-blue-600 pl-4 py-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Tabela Geral de Parâmetros de Servidor
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Parâmetros oficiais para qualquer software ou equipamento de correio eletrônico.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* IMAP CARD */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-blue-700 font-bold text-base">
                        <Inbox className="h-5 w-5" />
                        <span>Entrada de E-mail (IMAP)</span>
                      </div>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">Recomendado</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 font-medium">Servidor Host:</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-slate-900">imap.migadu.com</span>
                          <button
                            onClick={() => copyToClipboard('imap.migadu.com', 'tbl_imap')}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500"
                            title="Copiar servidor"
                          >
                            {copiedKey === 'tbl_imap' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 font-medium">Porta:</span>
                        <span className="font-mono font-bold text-slate-900">993</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 font-medium">Criptografia / SSL:</span>
                        <span className="font-bold text-emerald-600">SSL / TLS</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 font-medium">Nome de Usuário:</span>
                        <span className="font-mono font-bold text-slate-900 text-[11px] truncate max-w-[150px]">{displayEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* SMTP CARD */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-emerald-700 font-bold text-base">
                        <Send className="h-5 w-5" />
                        <span>Envio de E-mail (SMTP)</span>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Autenticado</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 font-medium">Servidor Host:</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-slate-900">smtp.migadu.com</span>
                          <button
                            onClick={() => copyToClipboard('smtp.migadu.com', 'tbl_smtp')}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500"
                            title="Copiar servidor"
                          >
                            {copiedKey === 'tbl_smtp' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 font-medium">Porta:</span>
                        <span className="font-mono font-bold text-slate-900">465 <span className="font-normal text-slate-400">(ou 587 STARTTLS)</span></span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 font-medium">Criptografia / SSL:</span>
                        <span className="font-bold text-emerald-600">SSL / TLS</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 font-medium">Autenticação:</span>
                        <span className="font-bold text-slate-900">Sim (Mesma senha do e-mail)</span>
                      </div>
                    </div>
                  </div>

                  {/* POP3 CARD (OPTIONAL) */}
                  <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Servidor Alternativo POP3 (Apenas download local, sem sincronizar pastas):</span>
                      <span className="font-mono font-bold text-slate-900">pop.migadu.com</span>
                    </div>
                    <p className="text-slate-500">
                      Porta 995 com SSL/TLS ativado. Recomendamos sempre usar <strong>IMAP</strong> para que todas as suas mensagens e pastas fiquem salvas na nuvem com backup seguro.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ───── FREQUENTLY ASKED QUESTIONS (FAQ) ───── */}
        <section className="space-y-6">
          <div className="flex items-center space-x-2.5">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Dúvidas Frequentes &amp; Resolução de Erros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
              <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                <span className="text-rose-500 font-black">✕</span>
                <span>O Outlook diz &quot;Erro de autenticação ou senha incorreta&quot;</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                95% das vezes isto acontece porque foi inserido apenas o primeiro nome (ex: <em>comercial</em>) no campo de usuário. Certifique-se de preencher o endereço inteiro: <strong className="font-mono text-slate-800">{displayEmail}</strong>.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
              <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                <span className="text-rose-500 font-black">✕</span>
                <span>Consigo receber mensagens mas dá erro ao enviar</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Verifique se marcou a opção <strong>&quot;Meu servidor de saída (SMTP) requer autenticação&quot;</strong>. Se a porta <strong>465 (SSL)</strong> estiver bloqueada pela sua operadora de internet local, altere para a porta <strong>587 com STARTTLS</strong>.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
              <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                <span className="text-blue-500 font-black">?</span>
                <span>Posso usar no computador e no telemóvel ao mesmo tempo?</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Sim! Ao configurar como <strong>IMAP</strong>, todos os seus dispositivos (computador de trabalho, laptop pessoal, iPhone, Android e Webmail) sincronizam instantaneamente. Se ler ou apagar um e-mail no telemóvel, ele atualiza no computador.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
              <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                <span className="text-emerald-500 font-black">✓</span>
                <span>Como posso mudar a senha da minha conta?</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Pode alterar a sua senha a qualquer momento diretamente dentro do <Link href="/webmail" className="text-blue-600 underline font-semibold">Webmail da WEHOSTHERE</Link> clicando no botão <strong>&quot;Mudar Senha&quot;</strong> no topo da página. A alteração reflete imediatamente na Migadu.
              </p>
            </div>

          </div>
        </section>

        {/* ───── CALL TO ACTION FOOTER ───── */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-bold">Precisa de aceder aos seus e-mails agora mesmo?</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Não precisa esperar pela configuração do Outlook. Pode usar o nosso Webmail moderno direto no navegador.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link
              href="/webmail"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs sm:text-sm transition shadow-sm active:scale-95"
            >
              <Globe className="h-4 w-4" />
              <span>Entrar no Webmail</span>
            </Link>

            <Link
              href="/dashboard/email"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs sm:text-sm transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Painel</span>
            </Link>
          </div>
        </div>

      </main>

      {/* ───── FOOTER ───── */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} WEHOSTHERE. Todos os direitos reservados. E-mail Corporativo de Alta Confiabilidade.</p>
      </footer>

    </div>
  );
}

