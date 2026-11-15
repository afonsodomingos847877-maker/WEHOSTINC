import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { Server, Cpu, HardDrive, Globe, Shield, Zap, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Servidor VPS em Moçambique - Dedicado Virtual de Alta Performance | WEHOSTHERE',
  description: 'Servidores VPS de alta performance em Moçambique com a WEHOSTHERE. CPU dedicada, RAM dedicada, IP dedicado e acesso root. Ideal para lojas online e aplicações.',
  keywords: ['VPS', 'servidor VPS', 'servidor virtual', 'VPS Moçambique', 'servidor dedicado', 'hosting VPS', 'cloud VPS'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Servidor VPS em Moçambique - Dedicado Virtual de Alta Performance | WEHOSTHERE',
    description: 'Servidores VPS de alta performance em Moçambique com a WEHOSTHERE. CPU dedicada e acesso root.',
    url: 'https://www.wehosthere.com/vps',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Servidores VPS de Alta Performance em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Servidor VPS em Moçambique | WEHOSTHERE',
    description: 'VPS com CPU e RAM dedicados, IP dedicado e acesso root. Ideal para lojas online.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/vps',
  },
};

export default function VpsPage() {
  return (
    <SeoPageLayout
      title="Servidores VPS de Alta Performance"
      description="Servidores virtuais privados com recursos dedicados, controle total e performance garantida. Ideal para aplicações, lojas online e projetos de crescimento."
      breadcrumbs={[
        { label: 'Hospedagem', href: '/hospedagem' },
        { label: 'VPS', href: '/vps' }
      ]}
    >
      <div className="space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            O Que é um Servidor VPS?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            VPS (Virtual Private Server) é um servidor virtual privado que oferece recursos dedicados em um ambiente compartilhado. Diferente da hospedagem compartilhada, você tem CPU, RAM e armazenamento dedicados, garantindo performance consistente.
          </p>
          <p className="text-gray-600 text-lg">
            Com acesso root e controle total, você pode instalar qualquer software, configurar o servidor conforme suas necessidades e escalar recursos conforme seu projeto cresce.
          </p>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Recursos do Nosso VPS
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Cpu className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">CPU Dedicada</h3>
              <p className="text-gray-600">Processadores dedicados para performance consistente sem compartilhamento.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <HardDrive className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">RAM Dedicada</h3>
              <p className="text-gray-600">Memória dedicada para garantir que suas aplicações tenham recursos sempre disponíveis.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Globe className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">IP Dedicado</h3>
              <p className="text-gray-600">Endereço IP exclusivo para maior segurança e controle sobre sua reputação.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Shield className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Root</h3>
              <p className="text-gray-600">Controle total do servidor com acesso SSH root para instalação e configuração.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Zap className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">NVMe SSD</h3>
              <p className="text-gray-600">Armazenamento NVMe de alta velocidade para I/O ultra-rápido.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Server className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Escalável</h3>
              <p className="text-gray-600">Aumente CPU, RAM e armazenamento conforme necessário sem migração.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Quando Usar VPS?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lojas Online</h3>
              <p className="text-gray-600">E-commerce com alto tráfego que precisa de performance garantida.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aplicações Web</h3>
              <p className="text-gray-600">SaaS, APIs e aplicações customizadas que requerem configuração específica.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Desenvolvimento</h3>
              <p className="text-gray-600">Ambientes de staging e desenvolvimento com controle total.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Jogos</h3>
              <p className="text-gray-600">Servidores de jogos que precisam de baixa latência e alta performance.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Planos VPS
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">VPS Basic</h3>
              <p className="text-3xl font-bold text-primary-600 mb-4">2.500 MT<span className="text-sm text-gray-500">/mês</span></p>
              <ul className="space-y-2 text-gray-600 text-sm mb-4">
                <li>• 1 vCPU</li>
                <li>• 2 GB RAM</li>
                <li>• 40 GB NVMe</li>
                <li>• 1 TB Tráfego</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl border-2 border-primary-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">VPS Pro</h3>
              <p className="text-3xl font-bold text-primary-600 mb-4">5.000 MT<span className="text-sm text-gray-500">/mês</span></p>
              <ul className="space-y-2 text-gray-600 text-sm mb-4">
                <li>• 2 vCPU</li>
                <li>• 4 GB RAM</li>
                <li>• 80 GB NVMe</li>
                <li>• 2 TB Tráfego</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">VPS Enterprise</h3>
              <p className="text-3xl font-bold text-primary-600 mb-4">10.000 MT<span className="text-sm text-gray-500">/mês</span></p>
              <ul className="space-y-2 text-gray-600 text-sm mb-4">
                <li>• 4 vCPU</li>
                <li>• 8 GB RAM</li>
                <li>• 160 GB NVMe</li>
                <li>• 4 TB Tráfego</li>
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
            <Link href="/hospedagem" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Hospedagem</h3>
              <p className="text-sm text-gray-600">Serviços de hospedagem</p>
            </Link>
            <Link href="/hospedagem-wordpress" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">WordPress</h3>
              <p className="text-sm text-gray-600">Hospedagem otimizada</p>
            </Link>
            <Link href="/criar-site" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Criar Site</h3>
              <p className="text-sm text-gray-600">Desenvolvimento web</p>
            </Link>
            <Link href="/loja-online" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Loja Online</h3>
              <p className="text-sm text-gray-600">E-commerce</p>
            </Link>
          </div>
        </section>

        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para o Seu VPS?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Entre em contato conosco e configure o servidor VPS ideal para o seu projeto.
          </p>
          <Link
            href="/#contacto"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Solicitar VPS
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
