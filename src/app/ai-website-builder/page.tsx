import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, Zap, Globe, Shield, ArrowRight, CheckCircle2, 
  Smartphone, Code, Cpu, Layout, MessageSquare, Layers, Lock 
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AI Website Builder - Crie Sites Profissionais com Inteligência Artificial | WEHOSTHERE',
  description: 'Crie e publique sites modernos em segundos com o Construtor de Sites IA da WEHOSTHERE. Hospedagem ultra-rápida inclusa, design responsivo, domínio personalizado e SEO automático.',
  keywords: [
    'AI website builder',
    'construtor de sites IA',
    'criar site com inteligência artificial',
    'gerador de sites IA',
    'desenvolvimento web com IA',
    'criar site rápido',
    'website builder Africa',
    'hospedagem com IA',
    'WEHOSTHERE AI'
  ],
  alternates: {
    canonical: 'https://www.wehosthere.com/ai-website-builder',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: 'https://www.wehosthere.com/ai-website-builder',
    title: 'AI Website Builder - Crie Sites com Inteligência Artificial | WEHOSTHERE',
    description: 'Transforme as suas ideias num website profissional em minutos. Alimentado por IA de ponta com infraestrutura cloud de alta velocidade.',
    images: [
      {
        url: 'https://www.wehosthere.com/bulderai2.jpg',
        width: 1200,
        height: 630,
        alt: 'WEHOSTHERE AI Website Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Website Builder | WEHOSTHERE',
    description: 'Crie websites profissionais em minutos com Inteligência Artificial.',
    images: ['https://www.wehosthere.com/bulderai2.jpg'],
  },
};

export default function AiWebsiteBuilderPage() {
  const schemaApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'WEHOSTHERE AI Website Builder',
    operatingSystem: 'Web-based',
    applicationCategory: 'DesignApplication',
    description: 'Plataforma inteligente de criação e publicação instantânea de websites com inteligência artificial e alojamento cloud integrado.',
    url: 'https://www.wehosthere.com/ai-website-builder',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'MZN',
      availability: 'https://schema.org/InStock',
    },
    publisher: {
      '@type': 'Organization',
      name: 'WEHOSTHERE',
      url: 'https://www.wehosthere.com',
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-primary-600 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaApp) }}
      />

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/30 via-slate-950/80 to-slate-950" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-400 text-xs sm:text-sm font-semibold mb-8 animate-pulse">
            <Sparkles className="w-4 h-4" />
            Nova Geração de Criação Web com IA
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white max-w-4xl mx-auto">
            Crie Websites Profissionais em <span className="bg-gradient-to-r from-primary-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">Segundos</span> com IA
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Basta descrever o seu negócio ou ideia. O motor de inteligência artificial da WEHOSTHERE projeta a estrutura, escreve os textos, otimiza o SEO e publica o seu site num servidor cloud ultrarrápido.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              href="/dashboard/builder"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-primary-600 hover:bg-primary-500 active:scale-95 text-white font-bold text-base shadow-xl hover:shadow-primary-600/30 transition-all duration-200"
            >
              <span>Experimentar Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/#infraestrutura"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-slate-700 hover:border-slate-500 hover:bg-slate-900 text-slate-300 font-semibold text-base transition-colors"
            >
              Ver Exemplos
            </Link>
          </div>

          {/* Badge de Recursos */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-400 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sem necessidade de saber programar</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Domínio próprio ou subdomínio</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Certificado SSL Gratuito</span>
          </div>
        </div>
      </section>

      {/* Showcase Visual */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group h-80 sm:h-96">
            <Image
              src="/bulderai2.jpg"
              alt="Interface do Construtor de Sites IA WEHOSTHERE"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-6 flex flex-col justify-end">
              <span className="text-xs font-mono text-primary-400 font-bold uppercase tracking-wider mb-1">Assistente em Tempo Real</span>
              <h3 className="text-xl font-bold text-white">Refine e edite através de chat conversacional</h3>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group h-80 sm:h-96">
            <Image
              src="/bulderai03.jpg"
              alt="Design responsivo de sites gerados por IA"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-6 flex flex-col justify-end">
              <span className="text-xs font-mono text-sky-400 font-bold uppercase tracking-wider mb-1">Multi-Dispositivo</span>
              <h3 className="text-xl font-bold text-white">100% Responsivo para mobile, tablet e desktop</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona em 3 Passos */}
      <section className="py-20 px-4 bg-slate-900/50 border-y border-slate-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary-400 font-bold text-xs uppercase tracking-widest">Fluxo Simplificado</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">Como criar o seu site com IA em 3 passos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl relative">
              <div className="w-12 h-12 rounded-xl bg-primary-600/20 text-primary-400 border border-primary-500/30 flex items-center justify-center text-xl font-black mb-6">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Descreva o seu Projeto</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Escreva em poucas palavras o tipo de site que precisa: consultoria, portfólio, loja virtual, restaurante ou tecnologia.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl relative">
              <div className="w-12 h-12 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center text-xl font-black mb-6">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Geração Instantânea</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                A nossa IA gera o código completo, layout moderno, secções de serviços, formulários de contacto e botões diretos para WhatsApp.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xl font-black mb-6">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Publique na Cloud</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Com 1 clique, o seu site fica online na nossa infraestrutura cloud de alta velocidade com certificado SSL gratuito e domínio próprio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vantagens Técnicas */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary-400 font-bold text-xs uppercase tracking-widest">Tecnologia Profissional</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">Diferenciais da WEHOSTHERE AI</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <Zap className="w-8 h-8 text-amber-400 mb-4" />
            <h4 className="font-bold text-white mb-2">Velocidade Ultrarrápida</h4>
            <p className="text-slate-400 text-xs leading-relaxed">Hospedado em servidores NVMe de baixa latência para garantir carregamento instantâneo.</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <Globe className="w-8 h-8 text-blue-400 mb-4" />
            <h4 className="font-bold text-white mb-2">Domínios Personalizados</h4>
            <p className="text-slate-400 text-xs leading-relaxed">Conecte o seu domínio próprio (.com, .co.mz, .org) ou use o seu subdomínio gratuito.</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <Lock className="w-8 h-8 text-emerald-400 mb-4" />
            <h4 className="font-bold text-white mb-2">Segurança & SSL Grátis</h4>
            <p className="text-slate-400 text-xs leading-relaxed">Certificado de segurança SSL HTTPS ativo automaticamente em todos os sites gerados.</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <Layers className="w-8 h-8 text-purple-400 mb-4" />
            <h4 className="font-bold text-white mb-2">Histórico de Versões</h4>
            <p className="text-slate-400 text-xs leading-relaxed">Volte a qualquer versão anterior do seu site a qualquer momento com total segurança.</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <Smartphone className="w-8 h-8 text-pink-400 mb-4" />
            <h4 className="font-bold text-white mb-2">Design Responsivo</h4>
            <p className="text-slate-400 text-xs leading-relaxed">Layouts automaticamente adaptados e otimizados para todos os smartphones e ecrãs.</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <MessageSquare className="w-8 h-8 text-sky-400 mb-4" />
            <h4 className="font-bold text-white mb-2">WhatsApp Integrado</h4>
            <p className="text-slate-400 text-xs leading-relaxed">Botões de conversão com mensagens automáticas pré-configuradas para fechar negócios.</p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-gradient-to-t from-primary-950/60 to-slate-950 border-t border-slate-800 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">Pronto para colocar o seu novo site no ar?</h2>
          <p className="text-slate-300 text-base sm:text-lg mb-8">
            Experimente agora gratuitamente o AI Website Builder da WEHOSTHERE e surpreenda-se com o resultado.
          </p>
          <Link
            href="/dashboard/builder"
            className="inline-flex items-center gap-2.5 px-10 py-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-base shadow-2xl transition"
          >
            <span>Começar Agora</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
