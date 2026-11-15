import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { TrendingUp, Users, DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Vendas Online em Moçambique - Como Vender na Internet | WEHOSTHERE',
  description: 'Aprenda a fazer vendas online em Moçambique. Estratégias de e-commerce, marketing digital e transformação digital para empresas.',
  keywords: ['vendas online', 'vender online', 'vendas pela internet', 'comércio eletrônico', 'vender produtos online', 'estratégias de vendas online'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Vendas Online em Moçambique - Como Vender na Internet | WEHOSTHERE',
    description: 'Aprenda a fazer vendas online em Moçambique. Estratégias de e-commerce e marketing digital.',
    url: 'https://www.wehosthere.com/vendas-online',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Vendas Online e E-commerce em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vendas Online em Moçambique | WEHOSTHERE',
    description: 'Estratégias de e-commerce e marketing digital para vender na internet em Moçambique.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/vendas-online',
  },
};

export default function VendasOnlinePage() {
  return (
    <SeoPageLayout
      title="Vendas Online - Como Vender na Internet"
      description="Guia completo sobre vendas online em Moçambique. Aprenda estratégias de e-commerce, marketing digital e transformação digital para seu negócio."
      breadcrumbs={[{ label: 'Vendas Online', href: '/vendas-online' }]}
    >
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            O Que São Vendas Online?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Vendas online, também conhecidas como e-commerce, são transações comerciais realizadas através da internet. Permitem que empresas vendam produtos e serviços para clientes em qualquer lugar, a qualquer hora.
          </p>
          <p className="text-gray-600 text-lg">
            Com o crescimento do acesso à internet em Moçambique, as vendas online representam uma oportunidade enorme para empresas de todos os tamanhos expandirem seus negócios e alcançarem novos mercados.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Vantagens das Vendas Online
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <TrendingUp className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Alcance Global</h3>
              <p className="text-gray-600">Venda para clientes em todo o país e além das fronteiras.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Users className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Disponibilidade 24/7</h3>
              <p className="text-gray-600">Sua loja nunca fecha, vendendo a qualquer hora do dia.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <DollarSign className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Custos Reduzidos</h3>
              <p className="text-gray-600">Menor custo operacional comparado a lojas físicas.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <TrendingUp className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dados e Analytics</h3>
              <p className="text-gray-600">Acompanhe métricas e tome decisões baseadas em dados.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Como Começar a Vender Online
          </h2>
          <div className="space-y-6">
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Escolha o que Vender</h3>
                <p className="text-gray-600">Defina produtos ou serviços que deseja vender online.</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Crie a Loja Online</h3>
                <p className="text-gray-600">Desenvolva ou contrate uma plataforma de e-commerce.</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Configure Pagamentos</h3>
                <p className="text-gray-600">Integre gateways como M-Pesa e cartões de crédito.</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Divulgue e Venda</h3>
                <p className="text-gray-600">Use marketing digital para atrair clientes e fazer vendas.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-primary-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Estratégias de Vendas Online
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Marketing Digital:</strong> Use redes sociais, Google Ads e email marketing</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>SEO:</strong> Otimize sua loja para aparecer nos motores de busca</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Remarketing:</strong> Retarget visitantes que não compraram</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Programa de Fidelidade:</strong> Recompense clientes recorrentes</span>
            </li>
          </ul>
        </section>

        {/* Related Pages */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Páginas Relacionadas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/loja-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Loja Online</h3>
              <p className="text-sm text-gray-600">Crie sua loja</p>
            </Link>
            <Link href="/dropshipping" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Dropshipping</h3>
              <p className="text-sm text-gray-600">Venda sem estoque</p>
            </Link>
            <Link href="/pagamentos-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Pagamentos Online</h3>
              <p className="text-sm text-gray-600">Gateways de pagamento</p>
            </Link>
            <Link href="/inteligencia-artificial" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Inteligência Artificial</h3>
              <p className="text-sm text-gray-600">Marketing com IA</p>
            </Link>
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para Começar a Vender Online?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Entre em contato conosco e crie sua loja online para começar a vender na internet.
          </p>
          <Link
            href="/loja-online"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Criar Loja Online
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
