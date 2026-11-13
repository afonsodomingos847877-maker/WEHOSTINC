import { WebmailMessage } from './webmailClient';

export const DEMO_EMAIL = 'teste@wehosthere.com';

export function isDemoAccount(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === DEMO_EMAIL;
}

export function getDemoMessages(folder: string = 'inbox'): WebmailMessage[] {
  const normFolder = folder.toLowerCase();

  const now = new Date();
  const minsAgo = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();
  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  if (normFolder === 'inbox' || normFolder === 'entrada') {
    return [
      {
        id: 'demo-inbox-1',
        uid: 1001,
        accountEmail: DEMO_EMAIL,
        fromName: 'Afonso Domingos',
        fromEmail: 'info@wehosthere.com',
        toEmail: DEMO_EMAIL,
        subject: 'Bem-vindo ao Webmail Corporativo WEHOSTHERE 🚀',
        body: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <p>Olá e seja muito bem-vindo ao <strong>Webmail Corporativo da WEHOSTHERE</strong>!</p>
            <p>Este é o <strong>Modo de Demonstração Interativo</strong>. Aqui pode testar todas as funcionalidades da nossa plataforma exatamente como os nossos clientes utilizam no dia a dia:</p>
            
            <ul style="padding-left: 20px; margin: 16px 0;">
              <li><strong>Leitura & Formatação Rica:</strong> Visualize e-mails com HTML, imagens inline e assinaturas automáticas;</li>
              <li><strong>Organização & Produtividade:</strong> Marque com estrela ⭐, fixe no topo 📌, arquive ou mova para pastas;</li>
              <li><strong>Composição & Envio:</strong> Clique em <em>"Novo E-mail"</em> para redigir, adicionar anexos e testar respostas;</li>
              <li><strong>Pesquisa Inteligente:</strong> Pesquise mensagens por remetente, assunto ou palavras-chave instantaneamente;</li>
              <li><strong>Fila de Agendamento:</strong> Programe e-mails para envio automático em datas futuras.</li>
            </ul>

            <div style="background-color: #f3f4f6; border-left: 4px solid #4f46e5; padding: 14px 16px; margin: 18px 0; border-radius: 4px;">
              <strong style="color: #312e81;">💡 Quer ter contas de e-mail corporativo com o seu próprio domínio?</strong><br>
              Com a WEHOSTHERE pode registar domínios <code>.co.mz</code>, <code>.com</code>, <code>.org</code> e configurar caixas de correio profissionais (ex: <code>seu.nome@suaempresa.co.mz</code>) com segurança SSL e antispam de alta performance.
            </div>

            <p>Se tiver qualquer dúvida, a nossa equipa de apoio técnico está sempre à disposição no WhatsApp ou pelo portal do cliente.</p>
            
            <p style="margin-top: 24px;">Com os melhores cumprimentos,<br>
            <strong>Afonso Domingos</strong><br>
            <span style="color: #6b7280; font-size: 13px;">Equipa de Suporte & Engenharia — WEHOSTHERE</span></p>
          </div>
        `,
        textPreview: 'Seja muito bem-vindo ao Webmail Corporativo da WEHOSTHERE! Este é o Modo de Demonstração Interativo...',
        date: minsAgo(15),
        isRead: false,
        starred: true,
        pinned: true,
        priority: 'high',
        folder: 'inbox',
        avatarColor: 'bg-indigo-600',
      },
      {
        id: 'demo-inbox-2',
        uid: 1002,
        accountEmail: DEMO_EMAIL,
        fromName: 'Suporte WEHOSTHERE',
        fromEmail: 'suporte@wehosthere.com',
        toEmail: DEMO_EMAIL,
        subject: '🎉 O seu domínio da empresa foi registado e ativado',
        body: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <p>Prezado cliente,</p>
            <p>Temos o prazer de informar que o registo do seu domínio corporativo e os apontamentos DNS (MX, SPF, DKIM e DMARC) foram concluídos com sucesso.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
              <tr style="background: #f9fafb;">
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold;">Domínio:</td>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-family: monospace;">minhaempresa.co.mz</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold;">Servidor IMAP Seguro:</td>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-family: monospace;">imap.migadu.com (Porta 993 SSL)</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold;">Servidor SMTP Seguro:</td>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-family: monospace;">smtp.migadu.com (Porta 465 SSL)</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold;">Certificado SSL/TLS:</td>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; color: #059669; font-weight: bold;">Ativo e Válido ✓</td>
              </tr>
            </table>

            <p>Pode configurar esta conta em clientes de correio externos como Outlook, Thunderbird, Apple Mail, iOS e Android.</p>
            <p>Atenciosamente,<br><strong>Centro de Operações de Rede WEHOSTHERE</strong></p>
          </div>
        `,
        textPreview: 'Temos o prazer de informar que o registo do seu domínio corporativo e apontamentos DNS foram concluídos...',
        date: hoursAgo(2),
        isRead: false,
        starred: false,
        priority: 'normal',
        folder: 'inbox',
        avatarColor: 'bg-emerald-600',
      },
      {
        id: 'demo-inbox-3',
        uid: 1003,
        accountEmail: DEMO_EMAIL,
        fromName: 'Faturação WEHOSTHERE',
        fromEmail: 'faturas@wehosthere.com',
        toEmail: DEMO_EMAIL,
        subject: 'Fatura Pro-forma #2026-1048 — Alojamento NVMe & E-mail Ilimitado',
        body: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <p>Prezada equipa,</p>
            <p>Segue em anexo para conferência a Fatura Pro-forma correspondente à subscrição do plano <strong>Cloud Pro NVMe com Contas de E-mail Corporativo Ilimitadas</strong>.</p>
            
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; background: #fafafa;">
              <h4 style="margin: 0 0 10px 0; color: #111827;">Resumo do Documento #2026-1048</h4>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Serviço:</strong> Alojamento Cloud NVMe Anual + Registo .co.mz</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Valor:</strong> 3.850,00 MZN</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Métodos Aceites:</strong> M-Pesa, e-Mola, Cartão Visa/Mastercard, Transferência Bancária</p>
              <p style="margin: 4px 0; font-size: 13px; color: #059669; font-weight: bold;">Estado: Liquidado com Sucesso ✓</p>
            </div>

            <p>Agradecemos a preferência pelos serviços de infraestrutura e hospedagem da WEHOSTHERE.</p>
            <p>Cumprimentos,<br><strong>Departamento Financeiro</strong></p>
          </div>
        `,
        textPreview: 'Segue para conferência a Fatura Pro-forma correspondente à subscrição do plano Cloud Pro NVMe...',
        date: daysAgo(1),
        isRead: true,
        starred: false,
        priority: 'normal',
        folder: 'inbox',
        avatarColor: 'bg-neutral-800',
        attachments: [
          {
            name: 'Fatura_ProForma_2026_1048.pdf',
            size: 184320,
            type: 'application/pdf',
            url: '#',
          },
        ],
      },
      {
        id: 'demo-inbox-4',
        uid: 1004,
        accountEmail: DEMO_EMAIL,
        fromName: 'Carlos Mondlane',
        fromEmail: 'carlos.mondlane@techmoz.co.mz',
        toEmail: DEMO_EMAIL,
        subject: 'Solicitação de Cotação: Loja Virtual com Pagamentos M-Pesa & e-Mola',
        body: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <p>Olá equipa,</p>
            <p>Espero que este e-mail vos encontre bem.</p>
            <p>Estamos a preparar o lançamento da nossa nova loja virtual de produtos e equipamentos informáticos em Moçambique e gostaríamos de solicitar uma cotação para:</p>
            <ol style="padding-left: 20px; margin: 12px 0;">
              <li>Desenvolvimento e alojamento da loja em servidores de alta velocidade NVMe;</li>
              <li>Integração com gateways de pagamento automatizados M-Pesa e e-Mola;</li>
              <li>Configuração de 10 contas de e-mail corporativo para os nossos departamentos (vendas, suporte, financeiro).</li>
            </ol>
            <p>Agradecemos se nos puderem enviar uma estimativa de prazos e valores.</p>
            <p>Melhores cumprimentos,<br>
            <strong>Carlos Mondlane</strong><br>
            <span style="color: #6b7280; font-size: 13px;">Diretor Comercial — TechMoz Soluções Lda</span><br>
            <span style="color: #6b7280; font-size: 13px;">Maputo, Moçambique</span></p>
          </div>
        `,
        textPreview: 'Estamos a preparar o lançamento da nossa nova loja virtual e gostaríamos de solicitar uma cotação...',
        date: daysAgo(2),
        isRead: true,
        starred: true,
        priority: 'normal',
        folder: 'inbox',
        avatarColor: 'bg-purple-600',
      },
      {
        id: 'demo-inbox-5',
        uid: 1005,
        accountEmail: DEMO_EMAIL,
        fromName: 'Segurança WEHOSTHERE',
        fromEmail: 'seguranca@wehosthere.com',
        toEmail: DEMO_EMAIL,
        subject: '🛡️ Guia de Boas Práticas: Como proteger o seu e-mail corporativo',
        body: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <p>Caros colaboradores e parceiros,</p>
            <p>A segurança da informação é prioridade fundamental na WEHOSTHERE. Partilhamos convosco 4 recomendações essenciais para proteger a vossa caixa de correio contra fraudes e phishing:</p>
            
            <ul style="padding-left: 20px; margin: 14px 0;">
              <li><strong>Verifique sempre o remetente:</strong> Mensagens bancárias ou de serviços pedindo senhas com urgência são quase sempre tentativas de phishing;</li>
              <li><strong>Senhas Fortes & Únicas:</strong> Utilize frases-passe longas e ative autenticação de dois fatores sempre que disponível;</li>
              <li><strong>Cuidado com links suspeitos:</strong> Passe o cursor sobre o link antes de clicar para conferir o domínio real;</li>
              <li><strong>Proteção Antispam Ativa:</strong> Todos os e-mails na WEHOSTHERE passam por filtros com DMARC e verificação DKIM rigorosa.</li>
            </ul>

            <p>Mantenha as suas credenciais seguras e nunca partilhe senhas por telefone ou chat.</p>
            <p>Atenciosamente,<br><strong>Equipa de Cibersegurança WEHOSTHERE</strong></p>
          </div>
        `,
        textPreview: 'A segurança da informação é prioridade fundamental na WEHOSTHERE. Partilhamos convosco 4 recomendações...',
        date: daysAgo(3),
        isRead: true,
        starred: false,
        priority: 'low',
        folder: 'inbox',
        avatarColor: 'bg-blue-600',
      },
    ];
  }

  if (normFolder === 'sent' || normFolder === 'enviados') {
    return [
      {
        id: 'demo-sent-1',
        uid: 2001,
        accountEmail: DEMO_EMAIL,
        fromName: 'Conta de Demonstração',
        fromEmail: DEMO_EMAIL,
        toEmail: 'carlos.mondlane@techmoz.co.mz',
        subject: 'Re: Solicitação de Cotação: Loja Virtual com Pagamentos M-Pesa & e-Mola',
        body: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <p>Olá Carlos,</p>
            <p>Agradecemos pelo seu contacto e interesse nos nossos serviços!</p>
            <p>Temos todo o gosto em apoiar a TechMoz no lançamento da nova loja virtual. O nosso plano Cloud Pro com discos NVMe inclui infraestrutura otimizada para Moçambique e já dispõe de módulos prontos para integração instantânea com pagamentos móveis M-Pesa e e-Mola.</p>
            <p>Conforme solicitado, preparámos uma proposta comercial completa com opções de entrega em 7 a 14 dias úteis.</p>
            <p>Estamos disponíveis para uma breve chamada via WhatsApp ou reunião presencial se for conveniente.</p>
            <p>Com os melhores cumprimentos,<br>
            <strong>Equipa WEHOSTHERE</strong><br>
            <span style="color: #4f46e5; font-size: 13px;">https://www.wehosthere.com</span></p>
          </div>
        `,
        textPreview: 'Olá Carlos, Agradecemos pelo seu contacto e interesse nos nossos serviços! Temos todo o gosto em apoiar a TechMoz...',
        date: daysAgo(1),
        isRead: true,
        starred: true,
        folder: 'sent',
        avatarColor: 'bg-emerald-600',
      },
    ];
  }

  if (normFolder === 'drafts' || normFolder === 'rascunhos') {
    return [
      {
        id: 'demo-draft-1',
        uid: 3001,
        accountEmail: DEMO_EMAIL,
        fromName: 'Conta de Demonstração',
        fromEmail: DEMO_EMAIL,
        toEmail: 'comercial@novaparceria.co.mz',
        subject: 'Rascunho: Proposta de Parceria Estratégica em Serviços de Hospedagem Web',
        body: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <p>Prezada Direção Comercial,</p>
            <p>Gostaríamos de apresentar à vossa organização o nosso programa de parceiros e revenda de hospedagem corporativa na WEHOSTHERE...</p>
          </div>
        `,
        textPreview: 'Prezada Direção Comercial, Gostaríamos de apresentar à vossa organização o nosso programa de parceiros...',
        date: hoursAgo(5),
        isRead: true,
        starred: false,
        folder: 'drafts',
        avatarColor: 'bg-amber-600',
      },
    ];
  }

  if (normFolder === 'trash' || normFolder === 'lixeira') {
    return [
      {
        id: 'demo-trash-1',
        uid: 4001,
        accountEmail: DEMO_EMAIL,
        fromName: 'Tech Digest Africa',
        fromEmail: 'noticias@digest-africa.com',
        toEmail: DEMO_EMAIL,
        subject: 'Boletim Semanal: Novas tendências de comércio digital e pagamentos',
        body: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <p>Confira o resumo das principais notícias do setor de tecnologia da semana passada no continente africano.</p>
          </div>
        `,
        textPreview: 'Confira o resumo das principais notícias do setor de tecnologia da semana passada no continente africano...',
        date: daysAgo(6),
        isRead: true,
        starred: false,
        folder: 'trash',
        avatarColor: 'bg-neutral-500',
      },
    ];
  }

  if (normFolder === 'notifications' || normFolder === 'notificações') {
    return [
      {
        id: 'demo-notif-1',
        uid: 5001,
        accountEmail: DEMO_EMAIL,
        fromName: 'Sistema WEHOSTHERE',
        fromEmail: 'notificacoes@wehosthere.com',
        toEmail: DEMO_EMAIL,
        subject: 'Certificado SSL Let\'s Encrypt renovado automaticamente com sucesso',
        body: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <p>O certificado SSL gratuito do seu domínio corporativo foi renovado com chave RSA de 2048-bits. Não é necessária qualquer ação da sua parte.</p>
          </div>
        `,
        textPreview: 'O certificado SSL gratuito do seu domínio corporativo foi renovado com chave RSA de 2048-bits...',
        date: hoursAgo(6),
        isRead: false,
        starred: false,
        folder: 'notifications' as any,
        avatarColor: 'bg-indigo-600',
      },
    ];
  }

  return [];
}
