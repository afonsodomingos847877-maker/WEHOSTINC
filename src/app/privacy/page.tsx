import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { SITE_URL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Política de Privacidade | WEHOSTHERE',
  description: 'A WEHOSTHERE valoriza a sua privacidade. Saiba como recolhemos, utilizamos e protegemos os seus dados pessoais em conformidade com as melhores práticas.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: `${SITE_URL}/privacy`,
    title: 'Política de Privacidade | WEHOSTHERE',
    description: 'Saiba como a WEHOSTHERE protege a sua privacidade e os seus dados pessoais.',
    images: [
      {
        url: `${SITE_URL}/servidores-banner.png`,
        secureUrl: `${SITE_URL}/servidores-banner.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Política de Privacidade',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Política de Privacidade | WEHOSTHERE',
    description: 'Saiba como a WEHOSTHERE protege a sua privacidade.',
    images: [`${SITE_URL}/servidores-banner.png`],
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
            Política de Privacidade
          </h1>
          
          <p className="text-gray-600 mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-MZ')}
          </p>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introdução</h2>
              <p>
                A WEHOSTHERE valoriza a sua privacidade e está comprometida em proteger 
                os seus dados pessoais. Esta Política de Privacidade descreve como 
                recolhemos, utilizamos e protegemos as suas informações quando utiliza 
                os nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informações que Recolhemos</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2.1 Informações Pessoais</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Número de telefone</li>
                <li>Endereço físico (para faturação)</li>
                <li>Informações de pagamento (processadas de forma segura)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">2.2 Informações Técnicas</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Endereço IP</li>
                <li>Tipo de navegador e dispositivo</li>
                <li>Sistema operacional</li>
                <li>Páginas visitadas e tempo de navegação</li>
                <li>Cookies e tecnologias similares</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Como Utilizamos as Suas Informações</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Para fornecer e manter os nossos serviços</li>
                <li>Para processar pagamentos e faturação</li>
                <li>Para comunicar sobre o seu serviço (atualizações, alertas)</li>
                <li>Para melhorar a qualidade dos nossos serviços</li>
                <li>Para prevenir fraudes e abusos</li>
                <li>Para cumprir obrigações legais</li>
                <li>Para personalizar a sua experiência</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Partilha de Informações</h2>
              <p>
                Não vendemos, alugamos ou partilhamos as suas informações pessoais com 
                terceiros, exceto nas seguintes circunstâncias:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Com provedores de serviços que nos ajudam a operar o negócio (pagamentos, hospedagem)</li>
                <li>Quando exigido por lei ou autoridade competente</li>
                <li>Para proteger nossos direitos, propriedade ou segurança</li>
                <li>Com o seu consentimento explícito</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Segurança dos Dados</h2>
              <p>
                Implementamos medidas de segurança robustas para proteger as suas informações:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Criptografia SSL/TLS para todas as transmissões de dados</li>
                <li>Servidores seguros com firewalls e proteção contra intrusões</li>
                <li>Acesso restrito às informações pessoais</li>
                <li>Backups regulares e redundância de dados</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Conformidade com GDPR e regulamentações de proteção de dados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies e Publicidade (Google AdSense)</h2>
              <p>
                Utilizamos cookies e tecnologias semelhantes para melhorar a sua experiência de navegação e exibir conteúdos relevantes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cookies essenciais:</strong> Necessários para o funcionamento seguro e autenticação no site.</li>
                <li><strong>Cookies de desempenho:</strong> Analisam o uso do site e tráfego para melhorias contínuas.</li>
                <li><strong>Cookies de funcionalidade:</strong> Recordam as suas preferências de idioma e tema.</li>
                <li><strong>Cookies de publicidade (Google AdSense / DoubleClick):</strong> Terceiros, incluindo o Google, utilizam cookies (como o cookie DART) para veicular anúncios personalizados com base nas visitas anteriores dos utilizadores ao nosso site ou a outros sites na Internet.</li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                Os utilizadores podem desativar a publicidade personalizada acedendo às <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">Definições de Anúncios do Google</a> ou através do portal <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">aboutads.info</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Seus Direitos</h2>
              <p>
                De acordo com a legislação de proteção de dados, você tem o direito de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Aceder às suas informações pessoais</li>
                <li>Corrigir informações incorretas</li>
                <li>Solicitar a eliminação dos seus dados</li>
                <li>Opor-se ao processamento dos seus dados</li>
                <li>Solicitar a portabilidade dos seus dados</li>
                <li>Retirar consentimento a qualquer momento</li>
              </ul>
              <p className="mt-2">
                Para exercer esses direitos, entre em contacto através de info@wehosthere.com
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Retenção de Dados</h2>
              <p>
                Mantemos as suas informações pessoais apenas pelo tempo necessário para 
                fornecer os serviços solicitados, cumprir obrigações legais e resolver disputas. 
                Após o cancelamento do serviço, os dados são retidos por um período de 
                90 dias para fins de backup e compliance legal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Crianças e Menores</h2>
              <p>
                Nossos serviços não são destinados a menores de 18 anos. Não recolhemos 
                intencionalmente informações de crianças. Se descobrirmos que recolhemos 
                informações de um menor, tomaremos medidas para remover esses dados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Transferências Internacionais</h2>
              <p>
                Seus dados podem ser transferidos e processados em países fora de Moçambique. 
                Garantimos que todas as transferências cumpram as leis aplicáveis de 
                proteção de dados e que as informações são adequadamente protegidas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Alterações à Política</h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos 
                os usuários sobre alterações significativas através de e-mail ou aviso 
                no nosso site. O uso continuado dos serviços após alterações constitui 
                aceitação da nova política.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contacto</h2>
              <p>
                Para questões sobre privacidade ou para exercer seus direitos, entre em contacto:
              </p>
              <ul className="list-none space-y-1">
                <li>Email: privacy@wehosthere.com</li>
                <li>Email geral: info@wehosthere.com</li>
                <li>Telefone: +258 84 833 5618</li>
                <li>Website: www.wehosthere.com</li>
              </ul>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link 
              href="/" 
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Voltar à página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
