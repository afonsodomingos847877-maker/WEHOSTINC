import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { CreditCard, Smartphone, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ScalePay - Gateway de Pagamento em Moçambique | WEHOSTHERE',
  description: 'ScalePay é a solução de pagamentos digitais da WEHOSTHERE. Aceite pagamentos online, cartões e pagamentos móveis em Moçambique.',
  keywords: ['ScalePay', 'Scale Pay', 'ScalePay Moçambique', 'gateway de pagamento', 'pagamentos digitais', 'solução de pagamentos'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'ScalePay - Gateway de Pagamento em Moçambique | WEHOSTHERE',
    description: 'ScalePay é a solução de pagamentos digitais da WEHOSTHERE. Aceite pagamentos online em Moçambique.',
    url: 'https://www.wehosthere.com/scalepay',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - ScalePay Gateway de Pagamento Digital em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScalePay - Pagamentos Digitais | WEHOSTHERE',
    description: 'Aceite pagamentos online, cartões e pagamentos móveis em Moçambique.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/scalepay',
  },
};

export default function ScalepayPage() {
  return (
    <SeoPageLayout
      title="ScalePay - Solução de Pagamentos Digitais"
      description="ScalePay é a plataforma de pagamentos digitais da WEHOSTHERE, desenvolvida especificamente para o mercado de Moçambique. Aceite pagamentos online com facilidade."
      breadcrumbs={[{ label: 'ScalePay', href: '/scalepay' }]}
    >
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            O Que é ScalePay?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            ScalePay é a solução de pagamentos digitais desenvolvida pela WEHOSTHERE, especificamente para o mercado de Moçambique. Permite que empresas aceitem pagamentos online de forma segura, rápida e conveniente.
          </p>
          <p className="text-gray-600 text-lg">
            Com ScalePay, você pode integrar múltiplos métodos de pagamento em sua loja online, incluindo pagamentos móveis como M-Pesa, cartões de crédito e transferências bancárias, tudo em uma única plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Recursos do ScalePay
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Smartphone className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">M-Pesa Integrado</h3>
              <p className="text-gray-600">Aceite pagamentos M-Pesa diretamente em sua loja.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <CreditCard className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cartões de Crédito</h3>
              <p className="text-gray-600">Aceite Visa, Mastercard e outros cartões.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Shield className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Segurança Avançada</h3>
              <p className="text-gray-600">Transações criptografadas e proteção contra fraude.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Smartphone className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">API Fácil</h3>
              <p className="text-gray-600">Integração simples com documentação completa.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <CreditCard className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-gray-600">Acompanhe transações e métricas em tempo real.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Shield className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Suporte Local</h3>
              <p className="text-gray-600">Equipa técnica em Moçambique disponível para ajudar.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Por Que Escolher ScalePay?
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Desenvolvido para Moçambique:</strong> Entendemos o mercado local e suas necessidades específicas.</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Múltiplos Métodos:</strong> Um único gateway para todos os métodos de pagamento.</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Taxas Competitivas:</strong> Preços acessíveis para empresas de todos os tamanhos.</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Integração Rápida:</strong> Comece a aceitar pagamentos em dias, não semanas.</p>
            </div>
          </div>
        </section>

        <section className="bg-primary-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Como Funciona a Integração
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Crie Conta ScalePay:</strong> Registre-se e obtenha suas credenciais de API</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Integre a API:</strong> Use nossa documentação para integrar em sua loja</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Configure Métodos:</strong> Ative M-Pesa, cartões e outros métodos</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Comece a Vender:</strong> Aceite pagamentos e cresça seu negócio</span>
            </li>
          </ul>
        </section>

        {/* Related Pages */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Páginas Relacionadas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/pagamentos-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Pagamentos Online</h3>
              <p className="text-sm text-gray-600">Gateways de pagamento</p>
            </Link>
            <Link href="/loja-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Loja Online</h3>
              <p className="text-sm text-gray-600">E-commerce</p>
            </Link>
            <Link href="/vendas-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Vendas Online</h3>
              <p className="text-sm text-gray-600">Estratégias de venda</p>
            </Link>
            <Link href="/criar-site" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Criar Site</h3>
              <p className="text-sm text-gray-600">Desenvolvimento web</p>
            </Link>
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para Usar ScalePay?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Entre em contato conosco e comece a aceitar pagamentos com ScalePay hoje mesmo.
          </p>
          <Link
            href="/#contacto"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Solicitar ScalePay
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
