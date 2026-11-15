import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { FileText, Download, DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Produtos Digitais em Moçambique - Vender e Criar Conteúdo Digital | WEHOSTHERE',
  description: 'Aprenda sobre produtos digitais em Moçambique. Crie e venda ebooks, cursos, software e produtos digitais. Modelo de negócio escalável.',
  keywords: ['produtos digitais', 'vender produtos digitais', 'criar produto digital', 'ebook', 'curso online', 'software', 'negócio digital'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Produtos Digitais em Moçambique - Vender e Criar Conteúdo Digital | WEHOSTHERE',
    description: 'Aprenda sobre produtos digitais em Moçambique. Crie e venda ebooks, cursos e software.',
    url: 'https://www.wehosthere.com/produtos-digitais',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Produtos Digitais - Criar e Vender Online',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Produtos Digitais em Moçambique | WEHOSTHERE',
    description: 'Crie e venda ebooks, cursos online e software. Modelo de negócio escalável.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/produtos-digitais',
  },
};

export default function ProdutosDigitaisPage() {
  return (
    <SeoPageLayout
      title="Produtos Digitais - Criar e Vender Online"
      description="Guia completo sobre produtos digitais. Aprenda a criar e vender ebooks, cursos, software e outros produtos digitais com baixo custo e alta margem."
      breadcrumbs={[{ label: 'Produtos Digitais', href: '/produtos-digitais' }]}
    >
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            O Que São Produtos Digitais?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Produtos digitais são bens intangíveis que podem ser vendidos e entregues online, como ebooks, cursos online, software, templates, música, vídeos e muito mais. Diferente de produtos físicos, não requerem estoque, envio ou logística.
          </p>
          <p className="text-gray-600 text-lg">
            Produtos digitais oferecem margens de lucro altíssimas, pois podem ser criados uma vez e vendidos infinitamente sem custos adicionais de produção.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Tipos de Produtos Digitais
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ebooks</h3>
              <p className="text-gray-600">Livros digitais sobre qualquer tema que você domina.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cursos Online</h3>
              <p className="text-gray-600">Vídeo-aulas e treinamentos sobre habilidades específicas.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Software</h3>
              <p className="text-gray-600">Aplicativos, plugins, scripts e ferramentas digitais.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Templates</h3>
              <p className="text-gray-600">Modelos de sites, apresentações, documentos e designs.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Música e Áudio</h3>
              <p className="text-gray-600">Beats, efeitos sonoros, podcasts e conteúdo de áudio.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fotos e Vídeos</h3>
              <p className="text-gray-600">Stock footage, fotos, gráficos e recursos visuais.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Vantagens dos Produtos Digitais
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <DollarSign className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Alta Margem de Lucro</h3>
              <p className="text-gray-600">Crie uma vez, venda infinitamente sem custos adicionais.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Download className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Entrega Automática</h3>
              <p className="text-gray-600">Clientes recebem o produto imediatamente após o pagamento.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sem Estoque</h3>
              <p className="text-gray-600">Não precisa armazenar, gerir ou enviar produtos físicos.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <DollarSign className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Escalável</h3>
              <p className="text-gray-600">Venda para milhares de clientes sem limitação de capacidade.</p>
            </div>
          </div>
        </section>

        <section className="bg-primary-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Como Criar Produtos Digitais
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Identifique uma Necessidade:</strong> Descubra o que as pessoas procuram</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Crie Conteúdo de Qualidade:</strong> Desenvolva um produto útil e valioso</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Empacote e Formate:</strong> Organize o produto de forma profissional</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Crie Loja Online:</strong> Configure plataforma para vender o produto</span>
            </li>
          </ul>
        </section>

        {/* Related Pages */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Páginas Relacionadas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/plr" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">PLR</h3>
              <p className="text-sm text-gray-600">Produtos com direitos de revenda</p>
            </Link>
            <Link href="/loja-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Loja Online</h3>
              <p className="text-sm text-gray-600">Venda produtos digitais</p>
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
            Pronto para Criar Produtos Digitais?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Comece a criar e vender produtos digitais com baixo investimento e alto potencial de lucro.
          </p>
          <Link
            href="/loja-online"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Criar Loja de Produtos Digitais
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
