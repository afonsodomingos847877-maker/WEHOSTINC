import type { Metadata } from 'next';
import SeoPageLayout from '@/components/SeoPageLayout';
import Link from 'next/link';
import { Globe, CheckCircle2, ArrowRight, Shield, Clock, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Domínios em Moçambique - Registrar e Comprar Domínios | WEHOSTHERE',
  description: 'Registre o seu domínio em Moçambique com a WEHOSTHERE. Oferecemos domínios .co.mz, .com, .org e mais. Suporte local, rápida ativação e preço competitivo.',
  keywords: ['domínio', 'comprar domínio', 'registrar domínio', 'domínio Moçambique', 'comprar domínio Moçambique', 'domínio .co.mz', 'comprar domínio .co.mz', 'domínio .com', 'preço domínio', 'domínio empresarial'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Domínios em Moçambique - Registrar e Comprar Domínios | WEHOSTHERE',
    description: 'Registre o seu domínio em Moçambique com a WEHOSTHERE. Oferecemos domínios .co.mz, .com, .org e mais.',
    url: 'https://www.wehosthere.com/dominios',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Registo de Domínios .co.mz e .com em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Domínios em Moçambique | WEHOSTHERE',
    description: 'Registre o seu domínio .co.mz ou .com com a WEHOSTHERE. Suporte local e ativação rápida.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/dominios',
  },
};

export default function DominiosPage() {
  return (
    <SeoPageLayout
      title="Registre o Seu Domínio em Moçambique"
      description="Solução completa para registro de domínios em Moçambique. Proteja a sua marca online com domínios .co.mz, .com e extensões internacionais."
      breadcrumbs={[{ label: 'Domínios', href: '/dominios' }]}
    >
      {/* Content */}
      <div className="space-y-16">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Por Que Escolher a WEHOSTHERE para o Seu Domínio?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Um domínio é a identidade digital da sua empresa ou projeto. Na WEHOSTHERE, facilitamos o processo de registro de domínios em Moçambique, oferecendo suporte local, rápida ativação e preços competitivos.
          </p>
          <p className="text-gray-600 text-lg">
            Trabalhamos com as principais extensões de domínios, incluindo <strong>.co.mz</strong> (domínio nacional de Moçambique), <strong>.com</strong>, <strong>.org</strong>, <strong>.net</strong> e muitas outras extensões internacionais.
          </p>
        </section>

        {/* Benefits */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Vantagens de Registrar o Seu Domínio Conosco
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Zap className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ativação Rápida</h3>
              <p className="text-gray-600">Seu domínio fica ativo em até 24 horas após o registro e pagamento.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Shield className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Proteção WHOIS</h3>
              <p className="text-gray-600">Protegemos os seus dados pessoais no registro WHOIS do domínio.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Clock className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Renovação Automática</h3>
              <p className="text-gray-600">Opção de renovação automática para nunca perder o seu domínio.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Globe className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">DNS Gratuito</h3>
              <p className="text-gray-600">Gerenciamento DNS completo incluído sem custo adicional.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <CheckCircle2 className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Suporte Local</h3>
              <p className="text-gray-600">Equipa de suporte em Moçambique disponível para ajudar.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <ArrowRight className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Transferência Fácil</h3>
              <p className="text-gray-600">Transfira o seu domínio existente para nós sem complicações.</p>
            </div>
          </div>
        </section>

        {/* Extensions */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Extensões de Domínios Disponíveis
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Extensão</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ideal Para</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">.co.mz</td>
                  <td className="px-6 py-4 text-gray-600">Empresas e projetos em Moçambique</td>
                  <td className="px-6 py-4 text-gray-600">Via registro nacional</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">.com</td>
                  <td className="px-6 py-4 text-gray-600">Uso global, empresas internacionais</td>
                  <td className="px-6 py-4 text-gray-600">Imediato</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">.org</td>
                  <td className="px-6 py-4 text-gray-600">Organizações sem fins lucrativos</td>
                  <td className="px-6 py-4 text-gray-600">Imediato</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">.net</td>
                  <td className="px-6 py-4 text-gray-600">Serviços de internet e tecnologia</td>
                  <td className="px-6 py-4 text-gray-600">Imediato</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">.mz</td>
                  <td className="px-6 py-4 text-gray-600">Entidades oficiais em Moçambique</td>
                  <td className="px-6 py-4 text-gray-600">Via registro nacional</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Domain .co.mz Specific */}
        <section className="bg-primary-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Domínio .co.mz - A Identidade Digital de Moçambique
          </h2>
          <p className="text-gray-700 text-lg mb-6">
            O domínio <strong>.co.mz</strong> é a extensão nacional oficial de Moçambique para entidades comerciais. É ideal para empresas que operam no mercado moçambicano e desejam demonstrar a sua presença local.
          </p>
          <p className="text-gray-700 text-lg mb-6">
            Para registrar um domínio .co.mz, é necessário apresentar documentação empresarial. A WEHOSTHERE facilita todo o processo, cuidando da burocracia para que você possa focar no seu negócio.
          </p>
          <Link
            href="/dominio-co-mz"
            className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition"
          >
            Saiba mais sobre domínios .co.mz
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Perguntas Frequentes sobre Domínios
          </h2>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Quanto custa registrar um domínio em Moçambique?
              </h3>
              <p className="text-gray-600">
                O preço varia conforme a extensão. Domínios .co.mz têm custos específicos definidos pelo registro nacional, enquanto extensões internacionais como .com e .org têm preços competitivos. Contacte-nos para um orçamento personalizado.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Quanto tempo demora para ativar um domínio?
              </h3>
              <p className="text-gray-600">
                Extensões internacionais (.com, .org, .net) são ativadas em poucas horas. Domínios .co.mz podem demorar até 24-48 horas devido ao processo de verificação pelo registro nacional.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Posso transferir o meu domínio para a WEHOSTHERE?
              </h3>
              <p className="text-gray-600">
                Sim! Facilitamos a transferência de domínios de outros registradores. O processo é simples e nossa equipa guia você em cada passo.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                O que acontece se não renovar o domínio?
              </h3>
              <p className="text-gray-600">
                Se o domínio não for renovado, ele expira e fica disponível para registro por outros. Oferecemos renovação automática para evitar que isso aconteça.
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
            <Link href="/dominio-co-mz" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Domínio .co.mz</h3>
              <p className="text-sm text-gray-600">Saiba mais sobre domínios nacionais</p>
            </Link>
            <Link href="/hospedagem" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Hospedagem</h3>
              <p className="text-sm text-gray-600">Serviços de hospedagem web</p>
            </Link>
            <Link href="/criar-site" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Criar Site</h3>
              <p className="text-sm text-gray-600">Desenvolvimento web profissional</p>
            </Link>
            <Link href="/email-profissional" className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-1">Email Profissional</h3>
              <p className="text-sm text-gray-600">Email com domínio próprio</p>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para Registrar o Seu Domínio?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Entre em contato conosco e descubra o domínio perfeito para o seu projeto em Moçambique.
          </p>
          <Link
            href="/#contacto"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            Solicitar Orçamento
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </SeoPageLayout>
  );
}
