import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { Mail, Shield, Globe, Smartphone, CheckCircle2, ArrowRight, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Email Profissional em Moçambique - Criar Email com Domínio Próprio | WEHOSTHERE',
  description: 'Crie seu email profissional em Moçambique com a WEHOSTHERE. Email com domínio próprio, suporte local e interface moderna. A partir de 350 MT/mês.',
  keywords: ['email profissional', 'email corporativo', 'email empresarial', 'email profissional Moçambique', 'email com domínio próprio', 'criar email profissional', 'hospedagem de email'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Email Profissional em Moçambique - Criar Email com Domínio Próprio | WEHOSTHERE',
    description: 'Crie seu email profissional em Moçambique com a WEHOSTHERE. Email com domínio próprio e suporte local.',
    url: 'https://www.wehosthere.com/email-profissional',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Email Profissional com Domínio Próprio em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Email Profissional em Moçambique | WEHOSTHERE',
    description: 'Crie email com domínio próprio em Moçambique. Suporte local e interface moderna.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/email-profissional',
  },
};

export default function EmailProfissionalPage() {
  return (
    <SeoPageLayout
      title="Email Profissional com Domínio Próprio"
      description="Solução completa de email profissional com domínio próprio. Transmita profissionalismo e confiança com endereços de email personalizados para sua empresa."
      breadcrumbs={[{ label: 'Email Profissional', href: '/email-profissional' }]}
    >
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            O Que é Email Profissional?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Email profissional é um endereço de email que usa o domínio da sua empresa, como <strong>info@suaempresa.com</strong> ou <strong>contato@suaempresa.co.mz</strong>. Diferente de emails gratuitos como Gmail ou Yahoo, o email profissional transmite credibilidade e profissionalismo.
          </p>
          <p className="text-gray-600 text-lg">
            Com email profissional, você fortalece a marca da sua empresa, aumenta a confiança dos clientes e tem controle total sobre suas comunicações corporativas.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Benefícios do Email Profissional
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Globe className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fortalece a Marca</h3>
              <p className="text-gray-600">Seu domínio em cada email que envia aumenta a visibilidade da sua marca.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Shield className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mais Credibilidade</h3>
              <p className="text-gray-600">Clientes confiam mais em empresas com email profissional do que emails gratuitos.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Users className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Equipe Unificada</h3>
              <p className="text-gray-600">Crie emails para toda a equipe com um único domínio.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Smartphone className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Móvel</h3>
              <p className="text-gray-600">Acesse seu email em qualquer dispositivo com webmail e sincronização.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Mail className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Spam Protection</h3>
              <p className="text-gray-600">Filtros avançados de spam e proteção contra phishing.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <CheckCircle2 className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Backup Automático</h3>
              <p className="text-gray-600">Backups automáticos para nunca perder seus emails importantes.</p>
            </div>
          </div>
        </section>

        <section className="bg-primary-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Email Corporativo para Empresas
          </h2>
          <p className="text-gray-700 text-lg mb-6">
            Para empresas que necessitam de recursos avançados, oferecemos soluções de email corporativo com recursos como assinaturas de email, listas de distribuição, calendário compartilhado e integração com CRM.
          </p>
          <Link
            href="/email-corporativo"
            className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition"
          >
            Saiba mais sobre email corporativo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Como Criar Email Profissional?
          </h2>
          <div className="space-y-6">
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Registrar Domínio</h3>
                <p className="text-gray-600">Primeiro, registre o domínio da sua empresa (.com, .co.mz, etc.).</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Configurar DNS</h3>
                <p className="text-gray-600">Configure os registros DNS MX para apontar para nosso servidor de email.</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Criar Contas</h3>
                <p className="text-gray-600">Crie as contas de email que você precisa para sua equipe.</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Começar a Usar</h3>
                <p className="text-gray-600">Acesse via webmail ou configure em seu cliente de email favorito.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Planos de Email Profissional
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Básico</h3>
              <p className="text-3xl font-bold text-primary-600 mb-4">350 MT<span className="text-sm text-gray-500">/mês</span></p>
              <ul className="space-y-2 text-gray-600 text-sm mb-4">
                <li>• 1 conta de email</li>
                <li>• 10 GB armazenamento</li>
                <li>• Webmail</li>
                <li>• Antivírus</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl border-2 border-primary-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profissional</h3>
              <p className="text-3xl font-bold text-primary-600 mb-4">800 MT<span className="text-sm text-gray-500">/mês</span></p>
              <ul className="space-y-2 text-gray-600 text-sm mb-4">
                <li>• 5 contas de email</li>
                <li>• 50 GB armazenamento</li>
                <li>• Calendário</li>
                <li>• Tudo do básico</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Empresarial</h3>
              <p className="text-3xl font-bold text-primary-600 mb-4">1.500 MT<span className="text-sm text-gray-500">/mês</span></p>
              <ul className="space-y-2 text-gray-600 text-sm mb-4">
                <li>• Contas ilimitadas</li>
                <li>• 100 GB por conta</li>
                <li>• Recursos avançados</li>
                <li>• Suporte prioritário</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Páginas Relacionadas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/email-corporativo" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Email Corporativo</h3>
              <p className="text-sm text-gray-600">Soluções avançadas para empresas</p>
            </Link>
            <Link href="/dominios" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Domínios</h3>
              <p className="text-sm text-gray-600">Registre seu domínio</p>
            </Link>
            <Link href="/hospedagem" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Hospedagem</h3>
              <p className="text-sm text-gray-600">Serviços de hospedagem web</p>
            </Link>
            <Link href="/criar-site" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Criar Site</h3>
              <p className="text-sm text-gray-600">Desenvolvimento web</p>
            </Link>
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para Criar Seu Email Profissional?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Entre em contato conosco e configure seu email profissional com domínio próprio hoje mesmo.
          </p>
          <Link
            href="/#contacto"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Solicitar Email Profissional
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
