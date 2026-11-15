import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { CreditCard, Smartphone, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pagamentos Online em Moçambique - Gateway de Pagamento | WEHOSTHERE',
  description: 'Soluções de pagamentos online em Moçambique. Integre M-Pesa, cartões e gateways de pagamento em sua loja online.',
  keywords: ['pagamentos online', 'gateway de pagamento', 'pagamentos digitais', 'receber pagamentos online', 'pagamentos para lojas online', 'checkout online'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Pagamentos Online em Moçambique - Gateway de Pagamento | WEHOSTHERE',
    description: 'Soluções de pagamentos online em Moçambique. Integre M-Pesa e gateways de pagamento.',
    url: 'https://www.wehosthere.com/pagamentos-online',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Pagamentos Online e Gateway em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pagamentos Online em Moçambique | WEHOSTHERE',
    description: 'Integre M-Pesa, E-Mola e cartões na sua loja online. Solução completa.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/pagamentos-online',
  },
};

export default function PagamentosOnlinePage() {
  return (
    <SeoPageLayout
      title="Pagamentos Online - Receba Dinheiro na Internet"
      description="Solução completa de pagamentos online para empresas em Moçambique. Integre múltiplos gateways, aceite cartões e pagamentos móveis."
      breadcrumbs={[{ label: 'Pagamentos Online', href: '/pagamentos-online' }]}
    >
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            O Que São Pagamentos Online?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Pagamentos online são transações financeiras realizadas através da internet, permitindo que empresas recebam dinheiro de clientes de forma eletrônica, sem necessidade de pagamento em dinheiro físico.
          </p>
          <p className="text-gray-600 text-lg">
            Com gateways de pagamento, você pode aceitar cartões de crédito, pagamentos móveis como M-Pesa, transferências bancárias e outras formas de pagamento digital em sua loja online.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Métodos de Pagamento em Moçambique
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Smartphone className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">M-Pesa</h3>
              <p className="text-gray-600">Pagamentos móveis mais populares de Moçambique.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <CreditCard className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cartões de Crédito</h3>
              <p className="text-gray-600">Visa, Mastercard e outros cartões internacionais.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Smartphone className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Kivora</h3>
              <p className="text-gray-600">Gateway de pagamento local com cartões.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <CreditCard className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Transferência</h3>
              <p className="text-gray-600">Transferências bancárias e ordens de pagamento.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Vantagens dos Pagamentos Online
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Shield className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Segurança</h3>
              <p className="text-gray-600">Transações criptografadas e proteção contra fraude.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Smartphone className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Conveniência</h3>
              <p className="text-gray-600">Clientes pagam de qualquer lugar, a qualquer hora.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <CreditCard className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Múltiplas Opções</h3>
              <p className="text-gray-600">Aceite diversas formas de pagamento.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Shield className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Automação</h3>
              <p className="text-gray-600">Processamento automático de pedidos.</p>
            </div>
          </div>
        </section>

        <section className="bg-primary-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Como Integrar Pagamentos Online
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Escolha o Gateway:</strong> Selecione M-Pesa, Kivora ou outro provedor</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Crie Conta:</strong> Registre-se no gateway de pagamento</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Integre na Loja:</strong> Configure API na sua plataforma de e-commerce</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Teste e Lance:</strong> Teste pagamentos e comece a vender</span>
            </li>
          </ul>
        </section>

        {/* Related Pages */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Páginas Relacionadas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/scalepay" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">ScalePay</h3>
              <p className="text-sm text-gray-600">Gateway da WEHOSTHERE</p>
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
            Pronto para Aceitar Pagamentos Online?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Entre em contato conosco e integre pagamentos online em sua loja.
          </p>
          <Link
            href="/#contacto"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Integrar Pagamentos
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
