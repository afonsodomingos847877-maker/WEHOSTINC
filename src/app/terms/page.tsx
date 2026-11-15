import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { SITE_URL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Termos de Serviço | WEHOSTHERE',
  description: 'Conheça os Termos de Serviço da WEHOSTHERE. Regras, condições e diretrizes de utilização dos nossos serviços de hospedagem, domínios e soluções web.',
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: `${SITE_URL}/terms`,
    title: 'Termos de Serviço | WEHOSTHERE',
    description: 'Conheça os Termos de Serviço da WEHOSTHERE para serviços de hospedagem e tecnologia.',
    images: [
      {
        url: `${SITE_URL}/servidores-banner.png`,
        secureUrl: `${SITE_URL}/servidores-banner.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Termos de Serviço',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Termos de Serviço | WEHOSTHERE',
    description: 'Conheça os Termos de Serviço da WEHOSTHERE.',
    images: [`${SITE_URL}/servidores-banner.png`],
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
            Termos de Serviço
          </h1>
          
          <p className="text-gray-600 mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-MZ')}
          </p>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
              <p>
                Ao utilizar os serviços da WEHOSTHERE, você concorda com estes Termos de Serviço. 
                Se você não concordar com estes termos, por favor, não utilize nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descrição dos Serviços</h2>
              <p>
                A WEHOSTHERE fornece serviços de hospedagem de sites, registro de domínios, 
                hospedagem de e-mail corporativo, servidores VPS e sistemas de aluguel. 
                Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer serviço 
                a qualquer momento sem aviso prévio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Obrigações do Cliente</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Manter informações de contato atualizadas</li>
                <li>Pagar todas as taxas de serviço pontualmente</li>
                <li>Não utilizar nossos serviços para atividades ilegais</li>
                <li>Respeitar as leis de Moçambique e regulamentações internacionais</li>
                <li>Não enviar spam ou e-mail não solicitado</li>
                <li>Manter senhas e credenciais de acesso seguras</li>
                <li>Responsabilizar-se pelo conteúdo hospedado em seus sites</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Pagamentos</h2>
              <p>
                Todos os serviços são pagos antecipadamente. Aceitamos pagamentos via M-Pesa, 
                eMola, cartão de crédito/débito e transferência bancária. O não pagamento 
                resultará na suspensão dos serviços após 3 dias e na remoção após 7 dias.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Uso Aceitável</h2>
              <p>
                É proibido utilizar nossos serviços para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Distribuição de malware, vírus ou software malicioso</li>
                <li>Violação de direitos autorais ou propriedade intelectual</li>
                <li>Ataques de negação de serviço (DDoS)</li>
                <li>Hacking ou tentativas de acesso não autorizado</li>
                <li>Conteúdo pornográfico ilegal</li>
                <li>Golpes ou atividades fraudulentas</li>
                <li>Qualquer atividade que viole as leis moçambicanas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Suspensão e Cancelamento</h2>
              <p>
                Reservamo-nos o direito de suspender ou cancelar serviços sem aviso prévio 
                em caso de violação destes termos, atividades ilegais ou não pagamento. 
                O cliente pode cancelar o serviço a qualquer momento, mas não haverá reembolso 
                proporcional do período já pago.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitação de Responsabilidade</h2>
              <p>
                A WEHOSTHERE não será responsável por danos diretos, indiretos, incidentais, 
                especiais ou consequenciais resultantes do uso ou incapacidade de uso de nossos 
                serviços. Não garantimos disponibilidade de 100%, embora nos esforcemos para 
                manter o SLA de 99.9% de uptime.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Backup e Segurança</h2>
              <p>
                Realizamos backups diários dos dados hospedados, mas não garantemos a 
                recuperação de dados em caso de falha catastrófica. Os clientes são 
                responsáveis por manter seus próprios backups dos dados importantes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo, design, software e tecnologia da WEHOSTHERE são propriedade 
                exclusiva nossa. O cliente retém todos os direitos sobre o conteúdo que 
                hospeda em nossos servidores.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Alterações nos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                As alterações entrarão em vigor imediatamente após a publicação. 
                O uso continuado dos serviços após alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Lei Aplicável</h2>
              <p>
                Estes termos são regidos pelas leis da República de Moçambique. 
                Quaisquer disputas serão resolvidas nos tribunais competentes de Maputo, Moçambique.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contacto</h2>
              <p>
                Para dúvidas sobre estes termos, entre em contacto:
              </p>
              <ul className="list-none space-y-1">
                <li>Email: info@wehosthere.com</li>
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
