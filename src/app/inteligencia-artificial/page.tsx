import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { Brain, Zap, Cpu, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Inteligência Artificial para Negócios em Moçambique | WEHOSTHERE',
  description: 'Descubra como usar inteligência artificial em seu negócio. Ferramentas de IA, automação e soluções para empresas em Moçambique.',
  keywords: ['inteligência artificial', 'IA', 'ferramentas de IA', 'IA para negócios', 'IA para empresas', 'automação com IA', 'criar site com IA'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Inteligência Artificial para Negócios em Moçambique | WEHOSTHERE',
    description: 'Descubra como usar inteligência artificial em seu negócio. Ferramentas de IA e automação.',
    url: 'https://www.wehosthere.com/inteligencia-artificial',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Inteligência Artificial para Negócios em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inteligência Artificial para Negócios | WEHOSTHERE',
    description: 'Ferramentas de IA e automação para empresas em Moçambique.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/inteligencia-artificial',
  },
};

export default function InteligenciaArtificialPage() {
  return (
    <SeoPageLayout
      title="Inteligência Artificial para Negócios"
      description="Descubra como a inteligência artificial pode transformar seu negócio. Ferramentas de IA, automação e soluções para empresas em Moçambique."
      breadcrumbs={[{ label: 'Inteligência Artificial', href: '/inteligencia-artificial' }]}
    >
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            O Que é Inteligência Artificial?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Inteligência Artificial (IA) é a capacidade de máquinas realizarem tarefas que normalmente requerem inteligência humana, como aprender, raciocinar, entender linguagem e tomar decisões.
          </p>
          <p className="text-gray-600 text-lg">
            Nos negócios, a IA pode automatizar processos, analisar dados, criar conteúdo, melhorar o atendimento ao cliente e muito mais, aumentando a eficiência e reduzindo custos.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Aplicações de IA nos Negócios
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Brain className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Atendimento ao Cliente</h3>
              <p className="text-gray-600">Chatbots e assistentes virtuais 24/7 para suporte.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Zap className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Criação de Conteúdo</h3>
              <p className="text-gray-600">Geração automática de textos, imagens e vídeos.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Cpu className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Análise de Dados</h3>
              <p className="text-gray-600">Insights automáticos e previsões de negócio.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Brain className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Automação</h3>
              <p className="text-gray-600">Automatize tarefas repetitivas e processos.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Zap className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketing</h3>
              <p className="text-gray-600">Personalização de campanhas e segmentação.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Cpu className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Desenvolvimento</h3>
              <p className="text-gray-600">IA assistente para programação e debugging.</p>
            </div>
          </div>
        </section>

        <section className="bg-primary-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Ferramentas de IA Populares
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>ChatGPT:</strong> Assistente de IA para conversas e conteúdo</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Midjourney:</strong> Geração de imagens com IA</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Copy.ai:</strong> Criação de textos de marketing</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>GitHub Copilot:</strong> IA para programação</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Benefícios da IA para Empresas
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Zap className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Eficiência</h3>
              <p className="text-gray-600">Automatize tarefas e ganhe tempo.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Brain className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Redução de Custos</h3>
              <p className="text-gray-600">Menor necessidade de mão de obra manual.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Cpu className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tomada de Decisão</h3>
              <p className="text-gray-600">Dados e insights para decisões melhores.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Zap className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Escalabilidade</h3>
              <p className="text-gray-600">Cresça sem aumentar proporcionalmente a equipe.</p>
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Páginas Relacionadas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/criar-site" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Criar Site</h3>
              <p className="text-sm text-gray-600">Desenvolvimento web com IA</p>
            </Link>
            <Link href="/loja-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Loja Online</h3>
              <p className="text-sm text-gray-600">E-commerce com IA</p>
            </Link>
            <Link href="/produtos-digitais" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Produtos Digitais</h3>
              <p className="text-sm text-gray-600">Criar conteúdo com IA</p>
            </Link>
            <Link href="/vendas-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Vendas Online</h3>
              <p className="text-sm text-gray-600">Marketing com IA</p>
            </Link>
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para Usar IA no Seu Negócio?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Entre em contato conosco e descubra como implementar soluções de IA em sua empresa.
          </p>
          <Link
            href="/#contacto"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Consultar Sobre IA
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
