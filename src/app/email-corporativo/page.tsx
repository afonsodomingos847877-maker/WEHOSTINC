import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { Mail, Users, Calendar, Shield, ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Email Corporativo para Empresas em Moçambique | WEHOSTHERE',
  description:
    'Email corporativo para empresas em Moçambique com domínio próprio (@suaempresa.co.mz), Webmail moderno, anti-spam avançado, calendário partilhado e pagamento via M-Pesa.',
  keywords: [
    'email corporativo para empresas em Moçambique',
    'email corporativo Moçambique',
    'email empresarial Moçambique',
    'email com domínio próprio',
    'email para empresas Maputo',
    'webmail corporativo Moçambique',
    'hosting de email corporativo',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Email Corporativo para Empresas em Moçambique | WEHOSTHERE',
    description:
      'Crie contas de email corporativo para empresas em Moçambique com domínio @suaempresa.co.mz, segurança avançada e suporte local 24/7.',
    url: 'https://www.wehosthere.com/email-corporativo',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Email Corporativo para Empresas em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Email Corporativo para Empresas em Moçambique | WEHOSTHERE',
    description: 'Solução de email corporativo para empresas em Moçambique com domínio próprio e suporte prioritário.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/email-corporativo',
  },
};

const faqs = [
  {
    q: 'Como funciona o email corporativo para empresas em Moçambique?',
    a: 'Cada colaborador recebe um endereço profissional com o domínio da sua empresa (ex: nome@suaempresa.co.mz), acessível via Webmail (inLook), telemóvel ou Outlook/Thunderbird, com proteção anti-spam e backups diários.',
  },
  {
    q: 'Posso usar o email corporativo sem ter um website?',
    a: 'Sim. Basta registar o seu domínio (.co.mz, .com, etc.) connosco e ativar as caixas de email corporativo em minutos, pagando via M-Pesa, e-Mola ou transferência bancária.',
  },
  {
    q: 'Quantas contas de email posso criar para a minha empresa?',
    a: 'Desde pequenas empresas com 5 contas até organizações com dezenas ou centenas de colaboradores, com gestão centralizada de aliases, listas de distribuição e permissões.',
  },
];

export default function EmailCorporativoPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
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
      title="Email Corporativo para Empresas em Moçambique"
      description="Solução completa de email corporativo para empresas em Moçambique com domínio próprio (@suaempresa.co.mz), segurança avançada, Webmail moderno e suporte local 24/7."
      breadcrumbs={[
        { label: 'Email Profissional', href: '/email-profissional' },
        { label: 'Email Corporativo para Empresas', href: '/email-corporativo' }
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Por que ter Email Corporativo para Empresas em Moçambique?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            O email corporativo para empresas em Moçambique substitui endereços genéricos (`@gmail.com`) por contas oficiais com o nome do seu negócio (`contacto@suaempresa.co.mz`), aumentando a credibilidade em propostas comerciais, faturas e atendimento ao cliente.
          </p>
          <p className="text-gray-600 text-lg">
            Com a WEHOSTHERE, a sua equipa acede ao Webmail corporativo em qualquer dispositivo, conta com filtros anti-spam SPF/DKIM/DMARC, calendário partilhado e suporte técnico local em Maputo.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Recursos Avançados para a Sua Equipa
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Calendar className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendário & Webmail Moderno</h3>
              <p className="text-gray-600">Agende reuniões, partilhe calendários e aceda ao seu email em qualquer navegador ou telemóvel.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Users className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Listas de Distribuição & Aliases</h3>
              <p className="text-gray-600">Crie endereços por departamento como `vendas@`, `suporte@` e `financeiro@` sem custos extras.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Shield className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Segurança SPF, DKIM e DMARC</h3>
              <p className="text-gray-600">Proteção anti-spam e autenticação de domínio para garantir que os seus emails chegam à caixa de entrada.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Mail className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Integração IMAP/SMTP & CRM</h3>
              <p className="text-gray-600">Compatível com Outlook, Apple Mail, telemóveis Android/iOS e sistemas de faturação ou CRM.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Vantagens para Empresas Moçambicanas
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Credibilidade Imediata:</strong> Transmita confiança a clientes, bancos e parceiros em Moçambique.</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Gestão Centralizada:</strong> Controle todas as contas de email da empresa num único painel.</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Pagamento Local em MT:</strong> Contrate e renove facilmente com M-Pesa, e-Mola ou transferência bancária.</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Suporte Prioritário 24/7:</strong> Apoio técnico local na configuração de DNS, Outlook e migração de emails.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <HelpCircle className="h-7 w-7 text-primary-600" />
            Perguntas Frequentes sobre Email Corporativo
          </h2>
          <div className="space-y-4">
            {faqs.map((item) => (
              <div key={item.q} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Pages */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Soluções Relacionadas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/email-profissional" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Email Profissional</h3>
              <p className="text-sm text-gray-600">Planos com domínio próprio</p>
            </Link>
            <Link href="/dominio-co-mz" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Domínio .co.mz</h3>
              <p className="text-sm text-gray-600">Registo de domínio nacional</p>
            </Link>
            <Link href="/hospedagem" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Hospedagem de Sites</h3>
              <p className="text-sm text-gray-600">Alojamento rápido e seguro</p>
            </Link>
            <Link href="/criar-site" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Criar Site Profissional</h3>
              <p className="text-sm text-gray-600">Sites empresariais em Moçambique</p>
            </Link>
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ative o Email Corporativo da Sua Empresa Hoje
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Escolha o plano ideal ou fale com a nossa equipa para configurar contas de email profissionais em minutos.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/#planos"
              className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
            >
              Ver Planos de Email
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/webmail"
              className="inline-flex items-center bg-primary-800/60 text-white border border-white/30 font-semibold px-8 py-3 rounded-lg hover:bg-primary-800 transition"
            >
              Aceder ao Webmail
            </Link>
          </div>
        </section>
      </div>
    </SeoPageLayout>
  );
}
