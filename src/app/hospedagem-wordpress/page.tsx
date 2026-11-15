import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { Server, Zap, Shield, Plug, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hospedagem WordPress em Moçambique - Otimizada e Rápida | WEHOSTHERE',
  description: 'Hospedagem WordPress otimizada em Moçambique com a WEHOSTHERE. Instalação em um clique, atualizações automáticas e performance máxima. Planos a partir de 550 MT/mês.',
  keywords: ['hospedagem WordPress', 'WordPress hosting', 'hospedagem WordPress Moçambique', 'instalar WordPress', 'WordPress barato', 'hosting WordPress'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Hospedagem WordPress em Moçambique - Otimizada e Rápida | WEHOSTHERE',
    description: 'Hospedagem WordPress otimizada em Moçambique com a WEHOSTHERE. Instalação em um clique e performance máxima.',
    url: 'https://www.wehosthere.com/hospedagem-wordpress',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Hospedagem WordPress Otimizada em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hospedagem WordPress em Moçambique | WEHOSTHERE',
    description: 'WordPress rápido com instalação em 1 clique, atualizações automáticas e SSL gratuito.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/hospedagem-wordpress',
  },
};

export default function HospedagemWordPressPage() {
  return (
    <SeoPageLayout
      title="Hospedagem WordPress Otimizada"
      description="Solução completa de hospedagem WordPress com instalação em um clique, atualizações automáticas e performance otimizada para o melhor CMS do mundo."
      breadcrumbs={[
        { label: 'Hospedagem', href: '/hospedagem' },
        { label: 'WordPress', href: '/hospedagem-wordpress' }
      ]}
    >
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Por Que Escolher Nossa Hospedagem WordPress?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            WordPress é a plataforma mais popular para criação de sites, alimentando mais de 40% de todos os sites na internet. Nossa hospedagem é especificamente otimizada para WordPress, garantindo o melhor desempenho e segurança para o seu site.
          </p>
          <p className="text-gray-600 text-lg">
            Com configurações pré-ajustadas, cache integrado e servidores otimizados, seu site WordPress carrega mais rápido e está mais seguro.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Recursos Otimizados para WordPress
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Zap className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Instalação em 1 Clique</h3>
              <p className="text-gray-600">Instale WordPress automaticamente através do painel de controle em menos de 5 minutos.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Shield className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Atualizações Automáticas</h3>
              <p className="text-gray-600">Core, temas e plugins atualizados automaticamente para manter seu site seguro.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Server className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cache Integrado</h3>
              <p className="text-gray-600">Sistema de cache avançado para carregamento ultrarrápido das páginas.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Plug className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Plugins Populares</h3>
              <p className="text-gray-600">Suporte para WooCommerce, Yoast SEO, Elementor e outros plugins populares.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <CheckCircle2 className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">SSL Grátis</h3>
              <p className="text-gray-600">Certificado SSL Let&apos;s Encrypt instalado automaticamente em todos os sites.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Zap className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">CDN Integrado</h3>
              <p className="text-gray-600">Rede de distribuição de conteúdo para entrega rápida em todo o mundo.</p>
            </div>
          </div>
        </section>

        <section className="bg-primary-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            WooCommerce Otimizado
          </h2>
          <p className="text-gray-700 text-lg mb-6">
            Para lojas online em WordPress, nossa hospedagem é otimizada especificamente para WooCommerce, com recursos dedicados para gerenciar produtos, pedidos e pagamentos de forma eficiente.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Suporte para gateways de pagamento locais (M-Pesa, Kivora)</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Configuração otimizada para carrinho e checkout</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Performance garantida mesmo com muitos produtos</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Benefícios da Hospedagem WordPress
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fácil de Usar</h3>
              <p className="text-gray-600">Painel intuitivo WordPress, sem necessidade de conhecimentos técnicos avançados.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Flexível</h3>
              <p className="text-gray-600">Milhares de temas e plugins para personalizar seu site conforme necessário.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">SEO Friendly</h3>
              <p className="text-gray-600">Estrutura otimizada para SEO, com plugins como Yoast SEO facilmente instaláveis.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Comunidade Ativa</h3>
              <p className="text-gray-600">Grande comunidade de desenvolvedores e recursos disponíveis online.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Perguntas Frequentes sobre WordPress
          </h2>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                O que é WordPress?
              </h3>
              <p className="text-gray-600">
                WordPress é um sistema de gerenciamento de conteúdo (CMS) gratuito e open-source que permite criar sites e blogs de forma fácil, sem necessidade de programação.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                WordPress é gratuito?
              </h3>
              <p className="text-gray-600">
                Sim, o software WordPress é gratuito. Você só paga pela hospedagem e domínio. Temas e plugins também podem ser gratuitos ou pagos.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Posso usar WordPress para loja online?
              </h3>
              <p className="text-gray-600">
                Sim! Com o plugin WooCommerce, você pode transformar seu site WordPress em uma loja online completa com funcionalidades de e-commerce.
              </p>
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Páginas Relacionadas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/hospedagem" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Hospedagem</h3>
              <p className="text-sm text-gray-600">Serviços de hospedagem</p>
            </Link>
            <Link href="/vps" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">VPS</h3>
              <p className="text-sm text-gray-600">Servidores dedicados</p>
            </Link>
            <Link href="/criar-site" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Criar Site</h3>
              <p className="text-sm text-gray-600">Desenvolvimento web</p>
            </Link>
            <Link href="/loja-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Loja Online</h3>
              <p className="text-sm text-gray-600">E-commerce</p>
            </Link>
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para Começar com WordPress?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Instale WordPress em minutos e comece a criar seu site profissional com a WEHOSTHERE.
          </p>
          <Link
            href="/#planos"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Ver Planos WordPress
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
