import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { FileText, Edit, DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'PLR - Produtos com Direitos de Revenda em Moçambique | WEHOSTHERE',
  description: 'Aprenda sobre produtos PLR (Private Label Rights) em Moçambique. Compre, edite e revenda produtos digitais com direitos de marca própria.',
  keywords: ['PLR', 'produtos PLR', 'private label rights', 'vender PLR', 'produtos com direitos de revenda', 'ebook PLR', 'conteúdo PLR'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'PLR - Produtos com Direitos de Revenda em Moçambique | WEHOSTHERE',
    description: 'Aprenda sobre produtos PLR em Moçambique. Compre, edite e revenda produtos digitais.',
    url: 'https://www.wehosthere.com/plr',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - PLR - Produtos com Direitos de Revenda',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PLR - Produtos com Direitos de Revenda | WEHOSTHERE',
    description: 'Compre, edite e revenda produtos digitais com direitos de marca própria.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/plr',
  },
};

export default function PlrPage() {
  return (
    <SeoPageLayout
      title="PLR - Produtos com Direitos de Revenda"
      description="Guia completo sobre produtos PLR (Private Label Rights). Aprenda a comprar, editar e revender produtos digitais com sua própria marca."
      breadcrumbs={[{ label: 'PLR', href: '/plr' }]}
    >
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            O Que é PLR?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            PLR (Private Label Rights) ou Direitos de Marca Própria é um tipo de licença que permite comprar produtos digitais e revendê-los como se fossem seus, com direito de editar, modificar e colocar sua marca.
          </p>
          <p className="text-gray-600 text-lg">
            Com produtos PLR, você pode lançar ebooks, cursos, software e outros produtos digitais rapidamente, sem precisar criar do zero. Basta comprar, personalizar e começar a vender.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Tipos de Produtos PLR
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ebooks PLR</h3>
              <p className="text-gray-600">Livros digitais prontos para personalizar e revender.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cursos PLR</h3>
              <p className="text-gray-600">Cursos em vídeo já gravados e prontos para vender.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Artigos PLR</h3>
              <p className="text-gray-600">Conteúdo de blog e artigos prontos para publicar.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Software PLR</h3>
              <p className="text-gray-600">Scripts, plugins e ferramentas com código fonte.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Templates PLR</h3>
              <p className="text-gray-600">Modelos de sites, apresentações e documentos.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gráficos PLR</h3>
              <p className="text-gray-600">Imagens, ícones e elementos gráficos editáveis.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Vantagens do PLR
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <DollarSign className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Economia de Tempo</h3>
              <p className="text-gray-600">Não precisa criar do zero, já tem conteúdo pronto.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Edit className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalizável</h3>
              <p className="text-gray-600">Edite e adapte o conteúdo conforme sua necessidade.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <DollarSign className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Baixo Custo</h3>
              <p className="text-gray-600">Custo muito menor que criar do zero.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lançamento Rápido</h3>
              <p className="text-gray-600">Comece a vender em dias, não meses.</p>
            </div>
          </div>
        </section>

        <section className="bg-primary-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Como Usar Produtos PLR
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Compre o Produto PLR:</strong> Adquira o produto com direitos de revenda</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Edite e Personalize:</strong> Adicione sua marca e adapte o conteúdo</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Crie Sua Loja:</strong> Configure plataforma para vender</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Divulgue e Venda:</strong> Use marketing para atrair clientes</span>
            </li>
          </ul>
        </section>

        {/* Related Pages */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Páginas Relacionadas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/produtos-digitais" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Produtos Digitais</h3>
              <p className="text-sm text-gray-600">Criar produtos digitais</p>
            </Link>
            <Link href="/loja-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Loja Online</h3>
              <p className="text-sm text-gray-600">Venda produtos</p>
            </Link>
            <Link href="/vendas-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Vendas Online</h3>
              <p className="text-sm text-gray-600">Estratégias de venda</p>
            </Link>
            <Link href="/inteligencia-artificial" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Inteligência Artificial</h3>
              <p className="text-sm text-gray-600">Criar conteúdo com IA</p>
            </Link>
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para Começar com PLR?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Comece a vender produtos digitais usando PLR e lance seu negócio rapidamente.
          </p>
          <Link
            href="/loja-online"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Criar Loja com PLR
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
