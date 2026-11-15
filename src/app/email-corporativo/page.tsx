import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { Mail, Users, Calendar, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Email Corporativo em Moçambique - Soluções Avançadas para Empresas | WEHOSTHERE',
  description: 'Email corporativo avançado em Moçambique com a WEHOSTHERE. Calendário compartilhado, listas de distribuição, integração CRM e suporte prioritário.',
  keywords: ['email corporativo', 'email empresarial', 'email corporativo Moçambique', 'sistema de email empresarial', 'email para empresas', 'hosting de email corporativo'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Email Corporativo em Moçambique - Soluções Avançadas para Empresas | WEHOSTHERE',
    description: 'Email corporativo avançado em Moçambique com a WEHOSTHERE. Calendário compartilhado e integração CRM.',
    url: 'https://www.wehosthere.com/email-corporativo',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Email Corporativo Avançado em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Email Corporativo em Moçambique | WEHOSTHERE',
    description: 'Solução de email corporativo com calendário compartilhado e suporte prioritário.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/email-corporativo',
  },
};

export default function EmailCorporativoPage() {
  return (
    <SeoPageLayout
      title="Email Corporativo Avançado"
      description="Solução completa de email corporativo com recursos avançados para empresas. Calendário compartilhado, listas de distribuição e integração com sistemas de gestão."
      breadcrumbs={[
        { label: 'Email Profissional', href: '/email-profissional' },
        { label: 'Email Corporativo', href: '/email-corporativo' }
      ]}
    >
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            O Que é Email Corporativo?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Email corporativo é uma solução avançada de email profissional projetada para empresas com múltiplos usuários e necessidades complexas de comunicação. Além do email básico, oferece recursos como calendário compartilhado, listas de distribuição, assinaturas de email e integração com sistemas de gestão.
          </p>
          <p className="text-gray-600 text-lg">
            Ideal para empresas que precisam de colaboração em tempo real, gestão de contatos e integração com CRM e outras ferramentas de negócio.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Recursos Avançados
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Calendar className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendário Compartilhado</h3>
              <p className="text-gray-600">Agende reuniões e compartilhe calendários com toda a equipe.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Users className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Listas de Distribuição</h3>
              <p className="text-gray-600">Crie listas de email para departamentos e grupos específicos.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Shield className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Segurança Avançada</h3>
              <p className="text-gray-600">Autenticação de dois fatores, criptografia e políticas de segurança.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Mail className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Integração CRM</h3>
              <p className="text-gray-600">Integre com sistemas de gestão de relacionamento com clientes.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Vantagens para Empresas
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Colaboração em Tempo Real:</strong> Trabalhe junto com sua equipe em documentos e calendários.</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Gestão Centralizada:</strong> Controle todas as contas de email da empresa em um único lugar.</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Backup e Recuperação:</strong> Proteção contra perda de dados com backups automáticos.</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Suporte Prioritário:</strong> Atendimento dedicado para empresas com SLA garantido.</p>
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Páginas Relacionadas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/email-profissional" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Email Profissional</h3>
              <p className="text-sm text-gray-600">Email com domínio próprio</p>
            </Link>
            <Link href="/dominios" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Domínios</h3>
              <p className="text-sm text-gray-600">Registre seu domínio</p>
            </Link>
            <Link href="/hospedagem" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Hospedagem</h3>
              <p className="text-sm text-gray-600">Serviços de hospedagem</p>
            </Link>
            <Link href="/criar-site" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Criar Site</h3>
              <p className="text-sm text-gray-600">Desenvolvimento web</p>
            </Link>
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para Email Corporativo?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Entre em contato conosco e configure a solução de email corporativo ideal para sua empresa.
          </p>
          <Link
            href="/#contacto"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Solicitar Email Corporativo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
