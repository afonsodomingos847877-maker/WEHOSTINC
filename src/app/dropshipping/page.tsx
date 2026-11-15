import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { Package, Truck, DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dropshipping em Moçambique - Modelo de Negócio Sem Estoque | WEHOSTHERE',
  description: 'Aprenda sobre dropshipping em Moçambique. Modelo de negócio de vendas online sem estoque. Venda produtos sem precisar armazenar.',
  keywords: ['dropshipping', 'dropshipping Moçambique', 'vender sem estoque', 'modelo dropshipping', 'loja dropshipping', 'ecommerce dropshipping'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Dropshipping em Moçambique - Modelo de Negócio Sem Estoque | WEHOSTHERE',
    description: 'Aprenda sobre dropshipping em Moçambique. Modelo de negócio de vendas online sem estoque.',
    url: 'https://www.wehosthere.com/dropshipping',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Dropshipping em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dropshipping em Moçambique | WEHOSTHERE',
    description: 'Venda produtos online sem estoque com dropshipping. Modelo de negócio escalável.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/dropshipping',
  },
};

export default function DropshippingPage() {
  return (
    <SeoPageLayout
      title="Dropshipping - Venda Sem Estoque"
      description="Guia completo sobre dropshipping em Moçambique. Aprenda este modelo de negócio que permite vender produtos online sem precisar de estoque."
      breadcrumbs={[{ label: 'Dropshipping', href: '/dropshipping' }]}
    >
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            O Que é Dropshipping?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Dropshipping é um modelo de negócio de e-commerce onde você vende produtos sem precisar mantê-los em estoque. Quando um cliente faz um pedido, você compra o produto de um fornecedor que envia diretamente para o cliente.
          </p>
          <p className="text-gray-600 text-lg">
            Este modelo permite que você inicie um negócio online com baixo investimento inicial, pois não precisa comprar estoque antecipadamente nem gerir armazém.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Como Funciona o Dropshipping
          </h2>
          <div className="space-y-6">
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cliente Faz Pedido</h3>
                <p className="text-gray-600">Cliente compra o produto na sua loja online.</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Você Envia Pedido ao Fornecedor</h3>
                <p className="text-gray-600">Você repassa o pedido ao fornecedor com o endereço do cliente.</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fornecedor Envia Produto</h3>
                <p className="text-gray-600">Fornecedor envia o produto diretamente para o cliente.</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Você Fica com o Lucro</h3>
                <p className="text-gray-600">Você fica com a diferença entre o preço de venda e compra.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Vantagens do Dropshipping
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <DollarSign className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Baixo Investimento</h3>
              <p className="text-gray-600">Não precisa comprar estoque nem alugar armazém.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Package className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sem Gestão de Estoque</h3>
              <p className="text-gray-600">Fornecedor cuida do armazenamento e envio.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Truck className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Variedade de Produtos</h3>
              <p className="text-gray-600">Venda milhares de produtos sem limitação de estoque.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <DollarSign className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Flexibilidade</h3>
              <p className="text-gray-600">Trabalhe de qualquer lugar com apenas um computador.</p>
            </div>
          </div>
        </section>

        <section className="bg-primary-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Desafios do Dropshipping
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span><strong>Concorrência:</strong> Muitas pessoas vendem os mesmos produtos</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span><strong>Margens Baixas:</strong> Lucro por venda pode ser pequeno</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span><strong>Controle de Qualidade:</strong> Dependente do fornecedor</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span><strong>Prazos de Entrega:</strong> Pode demorar mais que lojas locais</span>
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
            <Link href="/vendas-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Vendas Online</h3>
              <p className="text-sm text-gray-600">Estratégias de venda</p>
            </Link>
            <Link href="/produtos-digitais" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Produtos Digitais</h3>
              <p className="text-sm text-gray-600">Venda produtos digitais</p>
            </Link>
            <Link href="/pagamentos-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Pagamentos Online</h3>
              <p className="text-sm text-gray-600">Gateways de pagamento</p>
            </Link>
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para Começar com Dropshipping?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Crie sua loja online e comece a vender produtos com o modelo dropshipping.
          </p>
          <Link
            href="/loja-online"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Criar Loja Dropshipping
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
