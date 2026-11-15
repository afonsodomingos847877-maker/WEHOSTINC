import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { Code, Layout, Smartphone, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Criar Site Profissional em Moçambique - Rápido e Otimizado | WEHOSTHERE',
  description: 'Criar site profissional em Moçambique com a WEHOSTHERE. Desenvolvimento web moderno, responsivo, otimizado para Google (SEO) e integrado com M-Pesa.',
  keywords: ['criar site profissional em Moçambique', 'criar site Moçambique', 'criar site', 'desenvolvimento web Moçambique', 'criar website', 'criação de sites Maputo', 'criar site profissional', 'web design Moçambique'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Criar Site em Moçambique - Desenvolvimento Web Profissional | WEHOSTHERE',
    description: 'Crie seu site profissional em Moçambique com a WEHOSTHERE. Desenvolvimento web customizado e responsivo.',
    url: 'https://www.wehosthere.com/criar-site',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Criar Site Profissional em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Criar Site em Moçambique | WEHOSTHERE',
    description: 'Desenvolvimento web customizado, responsivo e otimizado para SEO. Orçamento personalizado.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/criar-site',
  },
};

export default function CriarSitePage() {
  return (
    <SeoPageLayout
      title="Criar Site Profissional em Moçambique"
      description="Solução completa de desenvolvimento web para criar seu site profissional. Sites responsivos, otimizados para SEO e com design moderno."
      breadcrumbs={[{ label: 'Criar Site', href: '/criar-site' }]}
    >
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Por Que Criar um Site Profissional?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Um site profissional é essencial para qualquer negócio nos dias de hoje. É a sua vitrine 24 horas, onde clientes podem conhecer seus produtos, serviços e entrar em contato a qualquer momento.
          </p>
          <p className="text-gray-600 text-lg">
            Com a WEHOSTHERE, você cria um site profissional, responsivo e otimizado para SEO, garantindo que sua empresa seja encontrada online e transmita profissionalismo.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Tipos de Sites que Criamos
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Layout className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Site Institucional</h3>
              <p className="text-gray-600">Apresente sua empresa, serviços e história de forma profissional.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Code className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loja Online</h3>
              <p className="text-gray-600">Venda produtos online com carrinho, pagamentos e gestão de pedidos.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Smartphone className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Landing Page</h3>
              <p className="text-gray-600">Páginas de alta conversão para campanhas e produtos específicos.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Zap className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Blog</h3>
              <p className="text-gray-600">Publique conteúdo e atraia tráfego orgânico através de artigos.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Layout className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Portal</h3>
              <p className="text-gray-600">Sites complexos com múltiplas funcionalidades e usuários.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Code className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">SaaS</h3>
              <p className="text-gray-600">Aplicações web como serviço com assinaturas e gestão de usuários.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Processo de Desenvolvimento
          </h2>
          <div className="space-y-6">
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Briefing e Planejamento</h3>
                <p className="text-gray-600">Entendemos suas necessidades e planejamos a estrutura do site.</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Design</h3>
                <p className="text-gray-600">Criamos o visual do site com design moderno e responsivo.</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Desenvolvimento</h3>
                <p className="text-gray-600">Programamos o site com as melhores tecnologias e práticas.</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Testes e Lançamento</h3>
                <p className="text-gray-600">Testamos e publicamos o site em servidores otimizados.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-primary-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Tecnologia que Usamos
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Next.js:</strong> Framework moderno para performance e SEO</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>React:</strong> Interface de usuário dinâmica e responsiva</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>TypeScript:</strong> Código mais seguro e maintainable</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Tailwind CSS:</strong> Design moderno e customizável</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>WordPress:</strong> CMS popular para fácil gestão de conteúdo</span>
            </li>
          </ul>
        </section>

        {/* Related Pages */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Páginas Relacionadas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dominios" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Domínios</h3>
              <p className="text-sm text-gray-600">Registre seu domínio</p>
            </Link>
            <Link href="/hospedagem" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Hospedagem</h3>
              <p className="text-sm text-gray-600">Serviços de hospedagem</p>
            </Link>
            <Link href="/hospedagem-wordpress" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">WordPress</h3>
              <p className="text-sm text-gray-600">Hospedagem otimizada</p>
            </Link>
            <Link href="/email-profissional" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Email Profissional</h3>
              <p className="text-sm text-gray-600">Email com domínio</p>
            </Link>
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para Criar Seu Site?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Solicite um orçamento personalizado e comece a criar seu site profissional com a WEHOSTHERE.
          </p>
          <Link
            href="/site-quote"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Solicitar Orçamento
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
