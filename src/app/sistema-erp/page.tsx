import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { BarChart3, Package, Receipt, Users, ShieldCheck, ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sistema ERP para Pequenas Empresas em Moçambique | WEHOSTHERE',
  description:
    'Sistema ERP para pequenas empresas em Moçambique: faturação, controlo de stock, vendas POS, clientes e relatórios financeiros na nuvem com pagamento em MT.',
  keywords: [
    'sistema ERP para pequenas empresas Moçambique',
    'sistema ERP Moçambique',
    'software de faturação Moçambique',
    'sistema de gestão empresarial Moçambique',
    'controlo de stock PME Moçambique',
    'ERP online Moçambique',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Sistema ERP para Pequenas Empresas em Moçambique | WEHOSTHERE',
    description:
      'Simplifique faturação, stock, vendas e gestão financeira com o sistema ERP para pequenas empresas em Moçambique da WEHOSTHERE.',
    url: 'https://www.wehosthere.com/sistema-erp',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Sistema ERP para Pequenas Empresas em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sistema ERP para Pequenas Empresas em Moçambique | WEHOSTHERE',
    description: 'Gestão completa de vendas, stock e faturação na nuvem para PMEs em Moçambique.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/sistema-erp',
  },
};

const erpFaqs = [
  {
    q: 'O que inclui o sistema ERP para pequenas empresas em Moçambique?',
    a: 'Inclui faturação e recibos, controlo de stock em tempo real, gestão de clientes e fornecedores, fluxo de caixa e relatórios mensais acessíveis via navegador ou telemóvel.',
  },
  {
    q: 'Preciso instalar servidores na minha empresa?',
    a: 'Não. O sistema funciona 100% na nuvem com backups automáticos, SSL e suporte técnico local em Moçambique.',
  },
  {
    q: 'Posso adaptar o ERP às necessidades específicas do meu negócio?',
    a: 'Sim. Além dos sistemas prontos em /systems, a nossa equipa desenvolve módulos personalizados para lojas, farmácias, restaurantes, prestadores de serviços e distribuidoras.',
  },
];

export default function SistemaErpPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: erpFaqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <SeoPageLayout
      title="Sistema ERP para Pequenas Empresas em Moçambique"
      description="Controle vendas, faturação, stock e finanças num único sistema ERP na nuvem pensado para pequenas e médias empresas moçambicanas."
      breadcrumbs={[
        { label: 'Sistemas', href: '/systems' },
        { label: 'Sistema ERP', href: '/sistema-erp' }
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Por que usar um Sistema ERP na Sua Pequena Empresa?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Gerir uma pequena empresa em Moçambique com folhas de cálculo soltas ou registos em papel gera erros de stock, atrasos na faturação e falta de visibilidade sobre o lucro real. Um <strong>sistema ERP para pequenas empresas em Moçambique</strong> centraliza todas as operações diárias num só painel seguro.
          </p>
          <p className="text-gray-600 text-lg">
            Com a WEHOSTHERE, pode começar com sistemas prontos ou encomendar uma solução sob medida para a realidade do seu negócio, com suporte local e pagamento em Meticais via M-Pesa, e-Mola ou transferência.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Módulos Essenciais para PMEs em Moçambique
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Receipt className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Faturação & Recibos</h3>
              <p className="text-gray-600">Emissão rápida de faturas, cotações e recibos em PDF com numeração automática.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Package className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Controlo de Stock</h3>
              <p className="text-gray-600">Alertas de stock mínimo, entradas, saídas e inventário multi-armazém em tempo real.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <BarChart3 className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Relatórios Financeiros</h3>
              <p className="text-gray-600">Fluxo de caixa, despesas, receitas diárias e margens de lucro num clique.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Users className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clientes & Equipa</h3>
              <p className="text-gray-600">Histórico de compras por cliente e controlo de permissões por utilizador.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <ShieldCheck className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Segurança & Backups</h3>
              <p className="text-gray-600">Dados encriptados na nuvem com backups automáticos diários.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Benefícios Imediatos
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Acesso em Qualquer Lugar:</strong> Acompanhe as vendas da sua loja ou escritório a partir do telemóvel.</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Redução de Perdas:</strong> Saiba exatamente o que entra e sai do stock todos os dias.</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Implementação Rápida:</strong> Comece a operar em dias, com formação e suporte em português.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <HelpCircle className="h-7 w-7 text-primary-600" />
            Perguntas Frequentes sobre Sistema ERP
          </h2>
          <div className="space-y-4">
            {erpFaqs.map((item) => (
              <div key={item.q} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Modernize a Gestão da Sua Empresa Hoje
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Explore os nossos sistemas prontos ou peça um orçamento para um ERP personalizado para a sua empresa.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/systems"
              className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
            >
              Ver Sistemas Disponíveis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/site-quote"
              className="inline-flex items-center bg-primary-800/60 text-white border border-white/30 font-semibold px-8 py-3 rounded-lg hover:bg-primary-800 transition"
            >
              Pedir Orçamento ERP
            </Link>
          </div>
        </section>
      </div>
    </SeoPageLayout>
  );
}
