import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { ShoppingCart, CreditCard, Package, Smartphone, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Criar Loja Online em Moçambique - E-commerce Profissional | WEHOSTHERE',
  description: 'Crie sua loja online em Moçambique com a WEHOSTHERE. E-commerce profissional com pagamentos M-Pesa, gestão de produtos e design responsivo.',
  keywords: ['loja online', 'criar loja online', 'ecommerce', 'e-commerce Moçambique', 'vender online', 'loja virtual', 'plataforma e-commerce'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Criar Loja Online em Moçambique - E-commerce Profissional | WEHOSTHERE',
    description: 'Crie sua loja online em Moçambique com a WEHOSTHERE. E-commerce profissional com pagamentos M-Pesa.',
    url: 'https://www.wehosthere.com/loja-online',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Criar Loja Online Profissional em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Criar Loja Online em Moçambique | WEHOSTHERE',
    description: 'E-commerce com pagamento M-Pesa, gestão de produtos e design responsivo.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/loja-online',
  },
};

export default function LojaOnlinePage() {
  return (
    <SeoPageLayout
      title="Criar Loja Online Profissional"
      description="Solução completa de e-commerce para criar sua loja online. Venda produtos com pagamentos locais, gestão de estoque e design moderno."
      breadcrumbs={[{ label: 'Loja Online', href: '/loja-online' }]}
    >
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Por Que Criar uma Loja Online?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Uma loja online permite que você venda produtos 24 horas por dia, 7 dias por semana, para clientes em todo o país e além. É a forma mais eficiente de expandir seu negócio e alcançar novos mercados.
          </p>
          <p className="text-gray-600 text-lg">
            Com a WEHOSTHERE, você cria uma loja online profissional com pagamentos locais como M-Pesa, gestão de produtos, pedidos e clientes, tudo em uma plataforma fácil de usar.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Recursos da Nossa Loja Online
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <ShoppingCart className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestão de Produtos</h3>
              <p className="text-gray-600">Adicione produtos, categorias, variações e estoque facilmente.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <CreditCard className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pagamentos Locais</h3>
              <p className="text-gray-600">Integração com M-Pesa, Kivora e outros gateways locais.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Package className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestão de Pedidos</h3>
              <p className="text-gray-600">Acompanhe pedidos, status e envios em tempo real.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Smartphone className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Design Responsivo</h3>
              <p className="text-gray-600">Loja otimizada para mobile, tablets e desktop.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <ShoppingCart className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Carrinho e Checkout</h3>
              <p className="text-gray-600">Processo de compra simples e otimizado para conversão.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Package className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Relatórios</h3>
              <p className="text-gray-600">Análise de vendas, produtos mais vendidos e métricas.</p>
            </div>
          </div>
        </section>

        <section className="bg-primary-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Integração com Pagamentos Locais
          </h2>
          <p className="text-gray-700 text-lg mb-6">
            Nossa loja online integra com os principais gateways de pagamento de Moçambique, permitindo que seus clientes paguem de forma fácil e segura.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>M-Pesa:</strong> Pagamentos móveis mais populares de Moçambique</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Kivora:</strong> Gateway de pagamento com cartões</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>ScalePay:</strong> Solução de pagamentos personalizada</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            O Que Vender Online?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Produtos Físicos</h3>
              <p className="text-gray-600">Roupas, eletrónicos, móveis, alimentos e qualquer produto tangível.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Produtos Digitais</h3>
              <p className="text-gray-600">Ebooks, cursos, software, templates e produtos digitais.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Serviços</h3>
              <p className="text-gray-600">Consultoria, design, desenvolvimento e outros serviços.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Assinaturas</h3>
              <p className="text-gray-600">SaaS, clubes, cursos recorrentes e modelos de assinatura.</p>
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Páginas Relacionadas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/vendas-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Vendas Online</h3>
              <p className="text-sm text-gray-600">Estratégias de e-commerce</p>
            </Link>
            <Link href="/dropshipping" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Dropshipping</h3>
              <p className="text-sm text-gray-600">Venda sem estoque</p>
            </Link>
            <Link href="/pagamentos-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Pagamentos Online</h3>
              <p className="text-sm text-gray-600">M-Pesa e gateways</p>
            </Link>
            <Link href="/criar-site" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Criar Site</h3>
              <p className="text-sm text-gray-600">Desenvolvimento web</p>
            </Link>
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para Criar Sua Loja Online?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Entre em contato conosco e comece a vender online com uma loja profissional.
          </p>
          <Link
            href="/#contacto"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Solicitar Loja Online
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
