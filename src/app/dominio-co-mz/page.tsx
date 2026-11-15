import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { Globe, FileText, CheckCircle2, ArrowRight, MapPin, Clock, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Domínio .co.mz - Registrar Domínio Nacional de Moçambique | WEHOSTHERE',
  description: 'Registre o seu domínio .co.mz em Moçambique com a WEHOSTHERE. Facilitamos todo o processo de registro nacional. Documentação necessária e suporte local.',
  keywords: ['domínio .co.mz', 'comprar domínio .co.mz', 'registrar domínio .co.mz', 'domínio Moçambique', 'domínio nacional Moçambique', 'registro domínio co.mz'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Domínio .co.mz - Registrar Domínio Nacional de Moçambique | WEHOSTHERE',
    description: 'Registre o seu domínio .co.mz em Moçambique com a WEHOSTHERE. Facilitamos todo o processo de registro nacional.',
    url: 'https://www.wehosthere.com/dominio-co-mz',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Registo de Domínio .co.mz Nacional de Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Domínio .co.mz em Moçambique | WEHOSTHERE',
    description: 'Registre o seu domínio .co.mz com suporte local. Processo rápido e simples.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/dominio-co-mz',
  },
};

export default function DominioCoMzPage() {
  return (
    <SeoPageLayout
      title="Domínio .co.mz - Identidade Digital de Moçambique"
      description="Solução completa para registro de domínios .co.mz, a extensão nacional oficial de Moçambique para empresas e projetos comerciais."
      breadcrumbs={[
        { label: 'Domínios', href: '/dominios' },
        { label: 'Domínio .co.mz', href: '/dominio-co-mz' }
      ]}
    >
      <div className="space-y-16">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            O Que é o Domínio .co.mz?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            O domínio <strong>.co.mz</strong> é a extensão nacional oficial de Moçambique para entidades comerciais e empresariais. É gerido pelo <strong>Centro de Informática da Universidade Eduardo Mondlane (CIUEM)</strong>, que é o registrador oficial de domínios de Moçambique.
          </p>
          <p className="text-gray-600 text-lg">
            Ter um domínio .co.mz demonstra a sua presença e compromisso com o mercado moçambicano, transmitindo confiança aos clientes locais e estabelecendo a sua marca como parte do ecossistema digital de Moçambique.
          </p>
        </section>

        {/* Why Choose */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Por Que Escolher um Domínio .co.mz?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <MapPin className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Identidade Local</h3>
              <p className="text-gray-600">Demonstre que a sua empresa está estabelecida em Moçambique e comprometida com o mercado local.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <CheckCircle2 className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Credibilidade</h3>
              <p className="text-gray-600">Clientes moçambicanos confiam mais em empresas com domínios nacionais .co.mz.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Globe className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">SEO Local</h3>
              <p className="text-gray-600">Melhor posicionamento em pesquisas relacionadas a Moçambique nos motores de busca.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <FileText className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Registro Oficial</h3>
              <p className="text-gray-600">Domínio reconhecido oficialmente pelo governo de Moçambique através do CIUEM.</p>
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-8 md:p-12">
          <div className="flex items-start space-x-4 mb-6">
            <AlertCircle className="h-8 w-8 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Documentação Necessária
              </h2>
              <p className="text-gray-700 mb-6">
                Para registrar um domínio .co.mz, é necessário apresentar documentação oficial. A WEHOSTHERE facilita todo o processo para você.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>NIF (Número de Identificação Fiscal)</strong> da empresa ou pessoa singular</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Alvará</strong> ou documento de registo comercial</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Bilhete de Identidade</strong> do representante legal</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Comprovativo de endereço</strong> da empresa</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700"><strong>Carta de autorização</strong> assinada pelo representante legal</p>
            </div>
          </div>
        </section>

        {/* Process */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Processo de Registro .co.mz
          </h2>
          <div className="space-y-6">
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Consultar Disponibilidade</h3>
                <p className="text-gray-600">Verificamos se o domínio desejado está disponível para registro.</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Recolher Documentação</h3>
                <p className="text-gray-600">Recolhemos toda a documentação necessária para o registro.</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Submeter ao CIUEM</h3>
                <p className="text-gray-600">Submetemos o pedido ao Centro de Informática da Universidade Eduardo Mondlane.</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aprovação e Ativação</h3>
                <p className="text-gray-600">Após aprovação, o domínio é ativado e configurado com DNS.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Prazo de Registro
          </h2>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-4 mb-4">
              <Clock className="h-8 w-8 text-primary-600" />
              <div>
                <p className="text-lg font-semibold text-gray-900">24 a 48 horas</p>
                <p className="text-gray-600">Tempo estimado para ativação do domínio .co.mz</p>
              </div>
            </div>
            <p className="text-gray-600">
              O prazo pode variar dependendo da carga de trabalho do CIUEM e da rapidez na apresentação da documentação completa. Nossa equipa acompanha o processo de perto para garantir a ativação mais rápida possível.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Preço do Domínio .co.mz
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            O preço do domínio .co.mz é definido pelo CIUEM e pode variar. Entre em contato conosco para obter um orçamento atualizado que inclui:
          </p>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Taxa de registro inicial</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Taxa anual de manutenção</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Configuração DNS gratuita</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Suporte durante todo o processo</span>
            </li>
          </ul>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Perguntas Frequentes sobre Domínio .co.mz
          </h2>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Qualquer pessoa pode registrar um domínio .co.mz?
              </h3>
              <p className="text-gray-600">
                Sim, tanto pessoas singulares como empresas podem registrar domínios .co.mz, desde que apresentem a documentação necessária.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                O domínio .co.mz pode ser usado fora de Moçambique?
              </h3>
              <p className="text-gray-600">
                Sim, o domínio funciona globalmente como qualquer outro domínio, mas é idealmente usado por entidades com presença em Moçambique.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Posso transferir um domínio .co.mz existente?
              </h3>
              <p className="text-gray-600">
                Sim, é possível transferir domínios .co.mz entre registradores. O processo requer autorização do titular atual.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                O que acontece se o domínio não for renovado?
              </h3>
              <p className="text-gray-600">
                O domínio expira e fica disponível para registro por outros. É importante renovar anualmente para manter a identidade digital.
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
            <Link href="/dominios" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Domínios</h3>
              <p className="text-sm text-gray-600">Todos os tipos de domínios</p>
            </Link>
            <Link href="/hospedagem" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Hospedagem</h3>
              <p className="text-sm text-gray-600">Serviços de hospedagem</p>
            </Link>
            <Link href="/criar-site" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Criar Site</h3>
              <p className="text-sm text-gray-600">Desenvolvimento web</p>
            </Link>
            <Link href="/email-profissional" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Email Profissional</h3>
              <p className="text-sm text-gray-600">Email com domínio</p>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para Registrar o Seu Domínio .co.mz?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Entre em contato conosco e deixe que cuidemos de toda a burocracia do registro do seu domínio nacional.
          </p>
          <Link
            href="/#contacto"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Solicitar Registro .co.mz
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
