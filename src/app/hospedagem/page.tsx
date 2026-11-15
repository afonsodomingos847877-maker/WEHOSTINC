import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { Server, Shield, Zap, Globe, Clock, HeadphonesIcon, Database, Cpu } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hospedagem de Sites em Moçambique - Servidor Rápido e Seguro | WEHOSTHERE',
  description: 'Hospedagem de sites profissional em Moçambique com a WEHOSTHERE. Servidores rápidos, seguros e suporte local 24/7. Planos a partir de 550 MT/mês.',
  keywords: ['hospedagem de sites', 'hospedagem web', 'alojamento web', 'hospedagem Moçambique', 'hospedagem de sites Moçambique', 'servidor para site', 'VPS', 'hospedagem barata', 'hospedagem profissional'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Hospedagem de Sites em Moçambique - Servidor Rápido e Seguro | WEHOSTHERE',
    description: 'Hospedagem de sites profissional em Moçambique com a WEHOSTHERE. Servidores rápidos, seguros e suporte local 24/7.',
    url: 'https://www.wehosthere.com/hospedagem',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Hospedagem de Sites Profissional em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hospedagem de Sites em Moçambique | WEHOSTHERE',
    description: 'Hospedagem profissional com servidores rápidos, seguros e suporte local 24/7.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/hospedagem',
  },
};

export default function HospedagemPage() {
  return (
    <SeoPageLayout
      title="Hospedagem de Sites Profissional em Moçambique"
      description="Solução completa de hospedagem web com servidores rápidos, seguros e suporte local 24/7. Ideal para empresas, blogs e lojas online."
      breadcrumbs={[{ label: 'Hospedagem', href: '/hospedagem' }]}
    >
      <div className="space-y-16">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Por Que Escolher a Nossa Hospedagem?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            A WEHOSTHERE oferece serviços de hospedagem de sites de alta qualidade em Moçambique, com servidores otimizados para performance, segurança e confiabilidade. Nossa infraestrutura garante que o seu site esteja sempre online e rápido.
          </p>
          <p className="text-gray-600 text-lg">
            Com servidores localizados estrategicamente e suporte técnico local, garantimos a melhor experiência para os seus visitantes em Moçambique e na região da África Austral.
          </p>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Recursos da Nossa Hospedagem
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Zap className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Alta Performance</h3>
              <p className="text-gray-600">Servidores NVMe SSD com processadores de última geração para carregamento rápido.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Shield className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Segurança Avançada</h3>
              <p className="text-gray-600">SSL gratuito, firewall DDoS e backups diários automáticos.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Globe className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">99.9% Uptime</h3>
              <p className="text-gray-600">Garantia de disponibilidade com monitoramento 24/7.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Database className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Banco de Dados</h3>
              <p className="text-gray-600">Suporte para MySQL, PostgreSQL e MongoDB sem limites.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Cpu className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">PHP e Node.js</h3>
              <p className="text-gray-600">Suporte para as principais tecnologias web e frameworks.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <HeadphonesIcon className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Suporte Local</h3>
              <p className="text-gray-600">Equipa técnica em Moçambique disponível para ajudar.</p>
            </div>
          </div>
        </section>

        {/* Hosting Types */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Tipos de Hospedagem Disponíveis
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Server className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hospedagem Compartilhada</h3>
              <p className="text-gray-600 mb-4">Ideal para sites pessoais, blogs e pequenas empresas. Compartilha recursos com outros sites.</p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Espaço em disco SSD</li>
                <li>• Tráfego mensal</li>
                <li>• Contas de email</li>
                <li>• Painel de controle</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Server className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">VPS (Servidor Virtual)</h3>
              <p className="text-gray-600 mb-4">Servidor dedicado virtual com recursos exclusivos. Ideal para lojas online e sites de alto tráfego.</p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• CPU dedicada</li>
                <li>• RAM dedicada</li>
                <li>• IP dedicado</li>
                <li>• Acesso root</li>
              </ul>
            </div>
          </div>
        </section>

        {/* WordPress Hosting */}
        <section className="bg-primary-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Hospedagem WordPress Otimizada
          </h2>
          <p className="text-gray-700 text-lg mb-6">
            WordPress é a plataforma mais popular para criação de sites. Nossa hospedagem é especificamente otimizada para WordPress, com instalação em um clique, atualizações automáticas e configurações de performance pré-ajustadas.
          </p>
          <Link
            href="/hospedagem-wordpress"
            className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition"
          >
            Saiba mais sobre hospedagem WordPress
            <Server className="ml-2 h-5 w-5" />
          </Link>
        </section>

        {/* VPS Section */}
        <section className="bg-gray-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Servidores VPS de Alta Performance
          </h2>
          <p className="text-gray-700 text-lg mb-6">
            Para projetos que exigem mais recursos e controle, nossos servidores VPS oferecem performance dedicada com flexibilidade total. Ideal para lojas online, aplicações web e projetos de crescimento.
          </p>
          <Link
            href="/vps"
            className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition"
          >
            Saiba mais sobre VPS
            <Server className="ml-2 h-5 w-5" />
          </Link>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Planos de Hospedagem
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Oferecemos planos flexíveis para atender desde sites pessoais até grandes empresas. Nossos planos começam a partir de 550 MT/mês, com opções de escalabilidade conforme o seu negócio cresce.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Básico</h3>
              <p className="text-3xl font-bold text-primary-600 mb-4">550 MT<span className="text-sm text-gray-500">/mês</span></p>
              <ul className="space-y-2 text-gray-600 text-sm mb-4">
                <li>• 5 GB SSD</li>
                <li>• 1 site</li>
                <li>• 5 contas de email</li>
                <li>• SSL gratuito</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl border-2 border-primary-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profissional</h3>
              <p className="text-3xl font-bold text-primary-600 mb-4">1.200 MT<span className="text-sm text-gray-500">/mês</span></p>
              <ul className="space-y-2 text-gray-600 text-sm mb-4">
                <li>• 20 GB SSD</li>
                <li>• 5 sites</li>
                <li>• 20 contas de email</li>
                <li>• SSL + Backup</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Empresarial</h3>
              <p className="text-3xl font-bold text-primary-600 mb-4">2.500 MT<span className="text-sm text-gray-500">/mês</span></p>
              <ul className="space-y-2 text-gray-600 text-sm mb-4">
                <li>• 50 GB SSD</li>
                <li>• Sites ilimitados</li>
                <li>• Email ilimitado</li>
                <li>• Tudo incluso</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Perguntas Frequentes sobre Hospedagem
          </h2>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                O que é hospedagem de sites?
              </h3>
              <p className="text-gray-600">
                Hospedagem de sites é o serviço que armazena os arquivos do seu site em servidores conectados à internet, permitindo que pessoas de todo o mundo acessem o seu site 24 horas por dia.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Preciso de hospedagem para o meu site?
              </h3>
              <p className="text-gray-600">
                Sim, todo site precisa de hospedagem para estar online. Sem hospedagem, o site não seria acessível na internet.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Posso migrar meu site para a WEHOSTHERE?
              </h3>
              <p className="text-gray-600">
                Sim! Oferecemos serviço de migração gratuita para novos clientes. Nossa equipa cuida de todo o processo de transferência do seu site.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                O que está incluído na hospedagem?
              </h3>
              <p className="text-gray-600">
                Nossa hospedagem inclui espaço em disco SSD, largura de banda, contas de email, SSL gratuito, backups diários, painel de controle e suporte técnico.
              </p>
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Páginas Relacionadas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/hospedagem-wordpress" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Hospedagem WordPress</h3>
              <p className="text-sm text-gray-600">Otimizada para WordPress</p>
            </Link>
            <Link href="/vps" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">VPS</h3>
              <p className="text-sm text-gray-600">Servidores dedicados virtuais</p>
            </Link>
            <Link href="/dominios" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Domínios</h3>
              <p className="text-sm text-gray-600">Registre seu domínio</p>
            </Link>
            <Link href="/criar-site" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Criar Site</h3>
              <p className="text-sm text-gray-600">Desenvolvimento web</p>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para Hospedar o Seu Site?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Escolha o plano ideal para o seu projeto e comece a hospedar com a WEHOSTHERE hoje mesmo.
          </p>
          <Link
            href="/#planos"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Ver Planos de Hospedagem
            <Server className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
