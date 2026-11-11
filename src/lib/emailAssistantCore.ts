import { DOMAIN_PRICES } from '@/lib/domains';
import { hostingPlans, websiteTypes } from '@/lib/data';

export function decodeHtmlEntitiesServer(text: string): string {
  return text
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&rarr;/gi, '→')
    .replace(/&larr;/gi, '←')
    .replace(/&bull;/gi, '•')
    .replace(/&copy;/gi, '©')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

export function cleanEmailHtmlToReadableText(raw: string): string {
  const withoutStyleAndScript = raw
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const withParagraphs = withoutStyleAndScript
    .replace(/<\/(p|div|h[1-6]|section|article|header|footer|table|tr)>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/td>/gi, '  ')
    .replace(/<[^>]+>/g, '');

  return decodeHtmlEntitiesServer(withParagraphs)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function cleanEmailHtmlToLines(raw: string): string[] {
  const withoutStyleAndScript = raw
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  const withLineBreaks = withoutStyleAndScript
    .replace(/<\/(p|div|tr|li|h[1-6]|section|article|header|footer|table)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/td>/gi, ' — ')
    .replace(/<[^>]+>/g, ' ');

  const decoded = decodeHtmlEntitiesServer(withLineBreaks)
    .replace(/\*\*+/g, '')
    .replace(/[ \t]+/g, ' ');

  const rawLines = decoded
    .split(/\n+/)
    .map(l => l.replace(/^[\s•\-\*—–]+/, '').trim())
    .filter(l => l.length > 10);

  const uniqueLines: string[] = [];
  for (const line of rawLines) {
    const lower = line.toLowerCase();
    if (
      lower.includes('notificação gerada automaticamente') ||
      lower.includes('todos os direitos reservados') ||
      lower.includes('abrir painel de visitantes em tempo real') ||
      lower.startsWith('wehosthere —')
    ) {
      continue;
    }
    if (!uniqueLines.some(u => u.toLowerCase() === lower || u.toLowerCase().includes(lower))) {
      uniqueLines.push(line);
    }
  }
  return uniqueLines;
}

export function stripMarkdownAsterisks(text: string): string {
  return decodeHtmlEntitiesServer(text)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .trim();
}

export function normalizeIncomingEmailText(raw: string): string {
  return raw.replace(/https?:\/\/(?:www\.)?google\.com\/url\?[^\s)]*q=([^&\s)]+)[^\s)]*/gi, (_, target) => {
    try {
      return decodeURIComponent(target);
    } catch {
      return target;
    }
  });
}

export function isLikelyEnglishEmail(subject: string, text: string): boolean {
  const sample = `${subject} ${text}`.toLowerCase();
  const enMatches = (sample.match(/\b(hello|hi|dear|please|thank|thanks|regards|pricing|price|domain|hosting|would like|could you|how much|available|support|invoice|payment)\b/g) || []).length;
  const ptMatches = (sample.match(/\b(olá|ola|prezado|bom dia|boa tarde|obrigado|obrigada|cumprimentos|preço|precos|preços|domínio|dominio|hospedagem|gostaria|podem|quanto|custa|renovação|renovar|atenciosamente|suporte|fatura)\b/g) || []).length;
  return enMatches > ptMatches && enMatches >= 2;
}

export function resolveReplyIdentities(from: string, fromName?: string, senderName?: string, isEn = false) {
  let recipientName = (fromName || '').trim();
  if (!recipientName && from) {
    const rawFromName = from.split('<')[0].replace(/["']/g, '').trim();
    if (rawFromName && !rawFromName.includes('@')) {
      recipientName = rawFromName;
    } else {
      const local = (from.split('@')[0] || '').replace(/[._\-0-9]+/g, ' ').trim();
      if (local && !/^(info|admin|suporte|support|noreply|no-reply|contato|contact|comercial|vendas|wehosthereinc)$/i.test(local)) {
        recipientName = local
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      }
    }
  }

  let signatureLabel = isEn ? 'Afonso Domingos | WEHOSTHERE' : 'Afonso Domingos | WEHOSTHERE';
  if (senderName) {
    const cleanSender = senderName.split('@')[0].trim().toLowerCase();
    if (cleanSender === 'info' || cleanSender.includes('afonso')) {
      signatureLabel = 'Afonso Domingos | WEHOSTHERE';
    } else if (cleanSender === 'suporte') {
      signatureLabel = isEn ? 'WEHOSTHERE Support Team' : 'Equipa de Suporte WEHOSTHERE';
    } else if (cleanSender === 'admin') {
      signatureLabel = isEn ? 'WEHOSTHERE Administration' : 'Administração WEHOSTHERE';
    } else if (cleanSender) {
      signatureLabel = `${cleanSender.charAt(0).toUpperCase() + cleanSender.slice(1)} | WEHOSTHERE`;
    }
  }

  return { recipientName, signatureLabel };
}

export function getWehosthereKnowledgeContext(): string {
  const domainLines = DOMAIN_PRICES.map(
    (d) => `  • ${d.extension} (${d.label}): ${d.price.toLocaleString('pt-MZ')} MT/ano (registo anual e renovação)`
  ).join('\n');
  const hostingLines = hostingPlans
    .filter((p) => p.id !== 'website_creation')
    .map(
      (p) =>
        `  • Plano ${p.name}: ${p.price.toLocaleString('pt-MZ')} MT/mês (${p.priceAnnual.toLocaleString('pt-MZ')} MT/ano) — ${p.features.sites === -1 ? 'Sites ilimitados' : `${p.features.sites} site(s)`}, ${p.features.emails === -1 ? 'E-mails ilimitados' : `${p.features.emails} contas de e-mail`}, ${p.features.storage}GB SSD, Tráfego ${p.features.bandwidth}${p.features.ssl ? ', SSL Gratuito' : ''}`
    )
    .join('\n');
  const websiteLines = websiteTypes
    .map(
      (w) =>
        `  • ${w.name}: ${w.basePrice.toLocaleString('pt-MZ')} MT (${w.priceNote}) — prazo estimado: ${w.deliveryDays} dias úteis`
    )
    .join('\n');

  return `WEHOSTHERE (Moçambique) — Base de Conhecimento Completa Oficial:

1. DOMÍNIOS & .CO.MZ (https://www.wehosthere.com/dominios | https://www.wehosthere.com/dominio-co-mz):
${domainLines}
  • Regras .co.mz / .org.mz (CIUEM): Requer Alvará Comercial / Registo Comercial / BR e NUIT da entidade. Ativação em 24-48h. Extensões internacionais (.com, .net) ativam em poucas horas.
  • DNS: Gestão DNS gratuita e completa (A, CNAME, MX, TXT, Nameservers) para apontar para qualquer hospedagem externa sem taxas ocultas.

2. HOSPEDAGEM WEB & WORDPRESS (https://www.wehosthere.com/hospedagem | https://www.wehosthere.com/hospedagem-wordpress):
${hostingLines}
  • Inclui cPanel, SSL Let's Encrypt gratuito e suporte a WordPress/WooCommerce 1-clique com M-Pesa/Kivora.

3. SERVIDORES VPS (https://www.wehosthere.com/vps):
  • VPS Basic: 2.500 MT/mês (1 vCPU, 2 GB RAM, 40 GB NVMe, 1 TB tráfego, IP dedicado, Acesso Root/SSH)
  • VPS Pro: 5.000 MT/mês (2 vCPU, 4 GB RAM, 80 GB NVMe, 2 TB tráfego, IP dedicado, Acesso Root/SSH)
  • VPS Enterprise: 10.000 MT/mês (4 vCPU, 8 GB RAM, 160 GB NVMe, 4 TB tráfego, IP dedicado, Acesso Root/SSH)

4. CRIAÇÃO DE SITES & ORÇAMENTO (https://www.wehosthere.com/criar-site | https://www.wehosthere.com/site-quote | https://www.wehosthere.com/loja-online | https://www.wehosthere.com/vendas-online):
${websiteLines}
  • Simulador de cotação interativo disponível em https://www.wehosthere.com/site-quote.

5. ALUGUER DE SISTEMAS PRONTOS / SaaS (https://www.wehosthere.com/systems):
  • Sistema de Gestão Financeira: 2.500 MT/mês ou 25.000 MT/ano (Setup gratuito 0 MT; fluxo de caixa, faturamento, integração M-Pesa/e-Mola, relatórios PDF/Excel).
  • Sistema de Gestão de Inscrições: 2.000 MT/mês ou 20.000 MT/ano (Setup gratuito 0 MT; matrículas, eventos, validação M-Pesa e credenciais digitais).
  • Página de Vendas Profissional: 1.500 MT/mês ou 15.000 MT/ano (Setup gratuito 0 MT; landing page de alta conversão com checkout M-Pesa e botão WhatsApp).

6. CRIADOR DE SITES COM IA & SOLUÇÕES IA (https://www.wehosthere.com/ai-website-builder | https://www.wehosthere.com/inteligencia-artificial):
  • AI Website Builder: Permite gerar e publicar sites com inteligência artificial em 1 clique diretamente na infraestrutura WEHOSTHERE (experimentação gratuita).

7. E-MAIL PROFISSIONAL, WEBMAIL & CONFIGURAÇÃO (https://www.wehosthere.com/email-profissional | https://www.wehosthere.com/email-corporativo | https://www.wehosthere.com/webmail | https://www.wehosthere.com/ajuda/configurar-email):
  • Planos avulsos de E-mail Profissional: Básico 350 MT/mês (1 conta, 10 GB), Profissional 800 MT/mês (5 contas, 50 GB), Empresarial 1.500 MT/mês (contas ilimitadas, 100 GB/conta).
  • Servidores (Migadu): Entrada IMAP imap.migadu.com (Porta 993 SSL/TLS) | Saída SMTP smtp.migadu.com (Porta 465 SSL/TLS ou 587 STARTTLS) | POP3 pop.migadu.com (Porta 995 SSL/TLS).
  • Regra técnica importante: O nome de utilizador (username) é SEMPRE o endereço de e-mail completo (ex: nome@empresa.co.mz).

8. ACADEMIA WEB WEHOSTHERE & CERTIFICADOS (https://www.wehosthere.com/academy | https://www.wehosthere.com/verify-certificate):
  • Curso "Criação de Página de Vendas Profissional" (12h, 13 módulos): Módulo 1 (Aula Aberta) gratuito; acesso completo (módulos 2 a 13) + Certificado Oficial por 500 MT.
  • Autenticidade dos certificados verificável publicamente por código em https://www.wehosthere.com/verify-certificate.

9. REVISTA DIGITAL "CODANDO HISTÓRIAS" (https://www.wehosthere.com/revista | https://www.wehosthere.com/revista/submeter):
  • Revista comunitária de tecnologia, código, startups, IA, design e carreira em Moçambique, com exportação em PDF.
  • Desenvolvedores e autores podem submeter artigos gratuitamente em https://www.wehosthere.com/revista/submeter.

10. PROGRAMA DE AFILIADOS / PARCEIROS (https://www.wehosthere.com/dashboard/affiliates):
  • Comissão: 30% sobre qualquer contratação (hospedagem, domínio, aluguer de sistema ou criação de site).
  • Janela de atribuição: Cookie de 30 dias via link exclusivo (/ref/codigo).
  • Saque mínimo: 1.000 MT via M-Pesa, Transferência Bancária ou PayPal.

11. SCALEPAY, CASHVIBE & PAGAMENTOS ONLINE (https://www.wehosthere.com/scalepay | https://www.wehosthere.com/pagamentos-online | https://www.wehosthere.com/cashvibe/meu-credito):
  • ScalePay: Gateway/solução de pagamentos digitais para lojas e empresas em Moçambique (M-Pesa, Visa/Mastercard, API REST).
  • Cashvibe: Portal de microcrédito — consulta de empréstimos por telefone ou BI em https://www.wehosthere.com/cashvibe/meu-credito e envio de comprovativos para WhatsApp +258 84 567 8901.
  • Métodos aceites na WEHOSTHERE: M-Pesa (Vodacom), e-Mola (Movitel), Cartões Visa/Mastercard e Transferência Bancária.

12. GUIAS DE NEGÓCIO DIGITAL & BLOG (https://www.wehosthere.com/dropshipping | https://www.wehosthere.com/produtos-digitais | https://www.wehosthere.com/plr | https://www.wehosthere.com/blog):
  • Conteúdos e soluções sobre Dropshipping em Moçambique, Venda de Produtos Digitais, Licenças PLR e Blog oficial da plataforma.

13. TERMOS, SLA & POLÍTICA COMERCIAL (https://www.wehosthere.com/terms | https://www.wehosthere.com/privacy):
  • Modelo pré-pago; SLA de 99,9% de disponibilidade (uptime).
  • Atraso no pagamento: Suspensão após 3 dias de atraso; remoção definitiva após 7 dias.
  • Cancelamento/Reembolso: Cancelamento disponível a qualquer momento, sem reembolso proporcional de períodos já pagos.

14. CONTACTOS OFICIAIS:
  • E-mail: info@wehosthere.com | WhatsApp / Telefone: +258 84 833 5618 (Cashvibe: +258 84 567 8901) | Site: https://www.wehosthere.com`;
}

export async function callOpenSourceLLM(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  seed?: number;
}): Promise<{ text?: string; provider?: string; model?: string; diagnostics: string[] }> {
  const { systemPrompt, userPrompt, temperature = 0.7, seed } = params;
  const diagnostics: string[] = [];
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const openRouterModel = process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-oss-20b';
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const groqModel = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-20b';

  if (openRouterKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'https://www.wehosthere.com',
          'X-Title': 'WEHOSTHERE Webmail AI',
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
        }),
        signal: AbortSignal.timeout(16000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && String(text).trim()) {
          return { text: String(text).trim(), provider: 'openrouter', model: data?.model || openRouterModel, diagnostics };
        }
        diagnostics.push('openrouter:empty');
      } else {
        diagnostics.push(`openrouter:${res.status}`);
      }
    } catch (err: any) {
      diagnostics.push(`openrouter:err:${err?.name || 'fail'}`);
    }
  }

  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
        }),
        signal: AbortSignal.timeout(14000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && String(text).trim()) {
          return { text: String(text).trim(), provider: 'groq', model: data?.model || groqModel, diagnostics };
        }
        diagnostics.push('groq:empty');
      } else {
        diagnostics.push(`groq:${res.status}`);
      }
    } catch (err: any) {
      diagnostics.push(`groq:err:${err?.name || 'fail'}`);
    }
  }

  const pollinationsEndpoints = [
    'https://text.pollinations.ai/openai',
    'https://text.pollinations.ai/openai/v1/chat/completions',
  ];
  for (const endpoint of pollinationsEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'WEHOSTHERE-Webmail/1.0 (+https://www.wehosthere.com)',
        },
        body: JSON.stringify({
          model: 'openai-fast',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          seed: seed ?? Math.floor(Math.random() * 100000),
        }),
        signal: AbortSignal.timeout(16000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && String(text).trim()) {
          return { text: String(text).trim(), provider: 'pollinations', model: data?.model || 'gpt-oss-20b', diagnostics };
        }
        diagnostics.push('pollinations:empty');
      } else {
        diagnostics.push(`pollinations:${res.status}`);
      }
    } catch (err: any) {
      diagnostics.push(`pollinations:err:${err?.name || 'fail'}`);
    }
  }

  return { diagnostics };
}

export function buildContextualEmailReply(params: {
  subject: string;
  cleanText: string;
  from: string;
  fromName?: string;
  senderName?: string;
  tone: string;
  variation?: number;
}): string {
  const { subject, cleanText, from, fromName, senderName, tone, variation = 0 } = params;
  const variant = Math.abs(Number(variation) || 0) % 3;
  const normalizedText = normalizeIncomingEmailText(cleanText);
  const textWithoutEmails = normalizedText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
  const fullContext = `${subject} ${textWithoutEmails}`.toLowerCase();
  const isEn = isLikelyEnglishEmail(subject, normalizedText);

  const { recipientName, signatureLabel } = resolveReplyIdentities(from, fromName, senderName, isEn);

  if (tone === 'quick_accept') {
    const nameStr = recipientName ? ` ${recipientName}` : '';
    return isEn
      ? `Dear${nameStr},\n\nThank you for your message. We confirm receipt and agree with the details presented.\n\nWe will proceed with the next steps as discussed.\n\nBest regards,\n${signatureLabel}`
      : `Prezado(a)${nameStr},\n\nConfirmamos a receção da sua mensagem e estamos inteiramente de acordo com os pontos apresentados.\n\nDaremos seguimento aos próximos passos conforme alinhado.\n\nCom os melhores cumprimentos,\n${signatureLabel}`;
  }

  if (tone === 'quick_decline') {
    const nameStr = recipientName ? ` ${recipientName}` : '';
    return isEn
      ? `Dear${nameStr},\n\nThank you sincerely for reaching out and for your consideration.\n\nAfter careful review, we are unable to proceed with this specific request at the moment, though we remain available for future opportunities.\n\nBest regards,\n${signatureLabel}`
      : `Prezado(a)${nameStr},\n\nAgradecemos sinceramente pelo contacto e pela consideração.\n\nApós análise, não nos será possível avançar com esta solicitação específica neste momento, mantendo-nos disponíveis para futuras oportunidades.\n\nCordialmente,\n${signatureLabel}`;
  }

  const asksDomain = /\b(dom[ií]nio|dominios|domínios|\.com|\.co\.mz|co\.mz|\.org\.mz|\.net|\.mz|tld|nameserver|whois)\b/i.test(fullContext);
  const asksDomainProcess = /\b(processo|pesquisa|pesquisar|regist[oa]r?|ativa[çc][ãa]o|ativar|como funciona|adquirir|comprar)\b/i.test(fullContext);
  const asksRenewalOrYear = /\b(ano|anual|renova[çc][ãa]o|renovar|validade|dura[çc][ãa]o|quanto custa)\b/i.test(fullContext);
  const asksDns = /\b(dns|apontar|apontamento|nameserver|ns1|ns2|cname|mx|outro servi[çc]o|outra hospedagem|externa)\b/i.test(fullContext);
  const asksExtraCosts = /\b(custo[s]? adicionai[s]?|taxa[s]?|extra[s]?|inclu[ií]do[s]?|oculto[s]?|gratu[ií]to)\b/i.test(fullContext);

  const asksHosting = /\b(hospedagem|alojamento|hosting|plano[s]? de hospedagem|servidor web|ssd|cpanel|wordpress|tr[áa]fego)\b/i.test(fullContext);
  const asksEmail = /\b(e-?mail corporativo|e-?mail profissional|webmail|imap|smtp|migadu|caixa[s]? de e-?mail)\b/i.test(fullContext);
  const asksSiteCreation = /\b(cria[çc][ãa]o de site|criar\s+(?:um\s+)?site|fazer\s+(?:um\s+)?site|loja\s+online|e-?commerce|website|desenvolvimento\s+web|desenvolver\s+(?:um\s+)?site|landing\s+page)\b/i.test(fullContext);
  const asksPayment = /\b(pagamento|pagar|m-?pesa|emola|e-?mola|cart[ãa]o|visa|mastercard|fatura|transfer[êe]ncia|mbway|scalepay|cashvibe|cr[ée]dito)\b/i.test(fullContext);
  const asksVps = /\b(vps|servidor virtual|root|ip dedicado|nvme)\b/i.test(fullContext);
  const asksAcademy = /\b(academia|academy|curso[s]?|aula[s]?|certificado[s]?|forma[çc][ãa]o)\b/i.test(fullContext);
  const asksRevista = /\b(revista|codando hist[óo]rias|artigo[s]?|publicar artigo|submeter)\b/i.test(fullContext);
  const asksAffiliates = /\b(afiliado[s]?|parceiro[s]?|comiss[ãa]o|comiss[õo]es|indica[çc][ãa]o|ref|ganhar dinheiro)\b/i.test(fullContext);
  const asksSystems = /\b(aluguer de sistema|alugar sistema|sistema de gest[ãa]o|gest[ãa]o financeira|gest[ãa]o de inscri[çc][õo]es|saas|sistemas prontos)\b/i.test(fullContext);
  const asksAiBuilder = /\b(ai website builder|construtor.*ia|site.*ia|intelig[êe]ncia artificial)\b/i.test(fullContext);
  const asksMeeting = /\b(reuni[ãa]o|encontro|chamada|call|agendar|hor[áa]rio|dispon[íi]vel)\b/i.test(fullContext);
  const asksSupport = /\b(erro|problema|falha|n[ãa]o funciona|suporte|ajuda|ticket|lento|offline|suspens[ãa]o)\b/i.test(fullContext);
  const isConfirmation = /\b(confirmamos|confirmo|de acordo|aprovado|combinado|acordado|avan[çc]aremos|pr[óo]ximos passos)\b/i.test(fullContext);

  const sections: string[] = [];

  if (asksDomain) {
    const comPrice = DOMAIN_PRICES.find((d) => d.extension === '.com')?.price || 1250;
    const comzPrice = DOMAIN_PRICES.find((d) => d.extension === '.co.mz')?.price || 3000;
    const orgmzPrice = DOMAIN_PRICES.find((d) => d.extension === '.org.mz')?.price || 3000;
    const netPrice = DOMAIN_PRICES.find((d) => d.extension === '.net')?.price || 1300;

    if (isEn) {
      let domainBlock = `1. Domain Registration Pricing (Annual):\n• .com: ${comPrice.toLocaleString('en-US')} MT / year\n• .co.mz: ${comzPrice.toLocaleString('en-US')} MT / year\n• .org.mz: ${orgmzPrice.toLocaleString('en-US')} MT / year\n• .net: ${netPrice.toLocaleString('en-US')} MT / year`;
      if (asksDomainProcess) {
        domainBlock += `\n\n2. Search, Registration & Activation Process:\n• Search your desired name directly at https://www.wehosthere.com/dominios, select the extension, and complete checkout.\n• .com and .net domains are typically activated within a few hours; .co.mz domains take up to 24–48 hours due to national registry verification.`;
      }
      if (asksRenewalOrYear) {
        domainBlock += `\n\n3. Registration Period & Renewal:\n• All listed prices cover 1 full year (12 months) of registration. Annual renewal follows the same yearly rate and can be managed directly in your client dashboard.`;
      }
      if (asksDns) {
        domainBlock += `\n\n4. DNS Management & External Hosting:\n• Yes! You get full DNS management (A, CNAME, MX, TXT records and custom Nameservers) and can point your domain to any external hosting provider at any time.`;
      }
      if (asksExtraCosts) {
        domainBlock += `\n\n5. Additional Costs & Included Services:\n• There are no hidden fees. Full DNS management, WHOIS protection, and local technical support are included free of charge. Web hosting or corporate email can be added separately if needed.`;
      }
      sections.push(domainBlock);
    } else {
      let stepNum = 1;
      let domainBlock = `${stepNum++}. Preços Atuais de Domínios:\n• Domínio .com: ${comPrice.toLocaleString('pt-MZ')} MT / ano\n• Domínio .co.mz: ${comzPrice.toLocaleString('pt-MZ')} MT / ano\n• Domínio .org.mz: ${orgmzPrice.toLocaleString('pt-MZ')} MT / ano\n• Domínio .net: ${netPrice.toLocaleString('pt-MZ')} MT / ano`;

      if (asksDomainProcess) {
        domainBlock += `\n\n${stepNum++}. Processo de Pesquisa, Registo e Ativação:\n• Acede a https://www.wehosthere.com/dominios, pesquisa o nome pretendido para verificar a disponibilidade imediata e conclui o pedido online.\n• Extensões internacionais (.com, .net) ficam ativas em poucas horas após confirmação do pagamento; extensões nacionais (.co.mz / .org.mz) são ativadas em 24 a 48 horas devido à validação do registo nacional.`;
      }
      if (asksRenewalOrYear) {
        domainBlock += `\n\n${stepNum++}. Duração do Registo e Renovação:\n• Sim, os valores apresentados correspondem a 1 ano completo (12 meses) de registo.\n• A renovação é igualmente anual pelo mesmo valor da extensão (.com: ${comPrice.toLocaleString('pt-MZ')} MT/ano | .co.mz: ${comzPrice.toLocaleString('pt-MZ')} MT/ano), com aviso prévio no painel do cliente.`;
      }
      if (asksDns) {
        domainBlock += `\n\n${stepNum++}. Gestão de DNS e Apontamento para Outra Hospedagem:\n• Sim, tem autonomia total para gerir todos os registos DNS (A, AAAA, CNAME, MX, TXT) e alterar os Nameservers para apontar o domínio para qualquer outro serviço de hospedagem ou servidor externo.`;
      }
      if (asksExtraCosts) {
        domainBlock += `\n\n${stepNum++}. Custos Adicionais e Serviços Incluídos:\n• Não existem custos ocultos na compra do domínio. O painel de gestão DNS gratuito, a proteção WHOIS (quando aplicável) e o suporte técnico local em português já estão incluídos.\n• Serviços como hospedagem de sites ou e-mail corporativo são opcionais e contratados apenas se desejar.`;
      }
      sections.push(domainBlock);
    }
  }

  if (asksHosting) {
    const basic = hostingPlans.find((p) => p.id === 'basic');
    const pro = hostingPlans.find((p) => p.id === 'pro');
    const ent = hostingPlans.find((p) => p.id === 'enterprise');
    if (isEn) {
      sections.push(
        `Web Hosting Plans:\n• Basic (${basic?.price || 550} MT/mo): 1 website, 5 email accounts, 10GB SSD, unlimited bandwidth.\n• Professional (${pro?.price || 2500} MT/mo): 5 websites, 20 email accounts, 50GB SSD, free SSL.\n• Enterprise (${ent?.price || 6200} MT/mo): Unlimited websites & emails, 200GB SSD, free SSL & CDN.\nDetails: https://www.wehosthere.com/hospedagem`
      );
    } else if (!asksDns || fullContext.includes('hospedagem wehosthere') || fullContext.includes('planos de hospedagem') || fullContext.includes('alojamento')) {
      sections.push(
        `Planos de Hospedagem de Sites:\n• Plano Básico (${(basic?.price || 550).toLocaleString('pt-MZ')} MT/mês): 1 site, 5 contas de e-mail, 10GB SSD, tráfego ilimitado.\n• Plano Profissional (${(pro?.price || 2500).toLocaleString('pt-MZ')} MT/mês): 5 sites, 20 contas de e-mail, 50GB SSD, SSL gratuito.\n• Plano Empresarial (${(ent?.price || 6200).toLocaleString('pt-MZ')} MT/mês): Sites e e-mails ilimitados, 200GB SSD, SSL + CDN.\nMais detalhes em: https://www.wehosthere.com/hospedagem`
      );
    }
  }

  if (asksEmail) {
    sections.push(
      isEn
        ? `Corporate Email:\n• Professional email with your own domain, secure Webmail access (https://www.wehosthere.com/webmail), anti-spam protection, and full IMAP (imap.migadu.com:993) / SMTP (smtp.migadu.com:465) support.`
        : `E-mail Corporativo:\n• Contas profissionais com o seu próprio domínio, acesso imediato via Webmail (https://www.wehosthere.com/webmail), proteção anti-spam e compatibilidade com Outlook/Telemóvel (IMAP: imap.migadu.com porta 993 | SMTP: smtp.migadu.com porta 465/587).`
    );
  }

  if (asksSiteCreation) {
    sections.push(
      isEn
        ? `Website & Online Store Development:\n• Landing Page: from 12,000 MT (7 business days)\n• Portfolio: 15,000 MT (10 business days)\n• Institutional Website: from 25,000 MT (14 business days)\n• Online Store (E-commerce with M-Pesa/e-Mola): from 65,000 MT (30 business days)\n• Custom Web Systems / CRM / ERP: from 150,000 MT (by quote)\nRequest an instant quote at: https://www.wehosthere.com/site-quote`
        : `Criação de Sites, Lojas Online e Sistemas:\n• Landing Page: 12.000 MT (7 dias úteis)\n• Portfólio: 15.000 MT (10 dias úteis)\n• Website Institucional: 25.000 MT (14 dias úteis)\n• Loja Virtual (E-commerce com M-Pesa/e-Mola): 65.000 MT (30 dias úteis)\n• Sistema Web / ERP / SaaS: a partir de 150.000 MT (sob orçamento)\nSimule ou peça cotação em segundos em: https://www.wehosthere.com/site-quote`
    );
  }

  if (asksVps) {
    sections.push(
      isEn
        ? `VPS Servers (Dedicated NVMe SSD, Dedicated IP & Root SSH):\n• VPS Basic: 2,500 MT/mo (1 vCPU, 2 GB RAM, 40 GB NVMe, 1 TB)\n• VPS Pro: 5,000 MT/mo (2 vCPU, 4 GB RAM, 80 GB NVMe, 2 TB)\n• VPS Enterprise: 10,000 MT/mo (4 vCPU, 8 GB RAM, 160 GB NVMe, 4 TB)\nDetails: https://www.wehosthere.com/vps`
        : `Servidores VPS (NVMe SSD Dedicado, IP Dedicado e Acesso Root SSH):\n• VPS Basic: 2.500 MT/mês (1 vCPU, 2 GB RAM, 40 GB NVMe, 1 TB tráfego)\n• VPS Pro: 5.000 MT/mês (2 vCPU, 4 GB RAM, 80 GB NVMe, 2 TB tráfego)\n• VPS Enterprise: 10.000 MT/mês (4 vCPU, 8 GB RAM, 160 GB NVMe, 4 TB tráfego)\nVeja mais em: https://www.wehosthere.com/vps`
    );
  }

  if (asksSystems) {
    sections.push(
      isEn
        ? `Ready-to-Use Rentable Systems (Zero Setup Fee):\n• Financial Management System: 2,500 MT/mo or 25,000 MT/year\n• Registration & Enrollment System: 2,000 MT/mo or 20,000 MT/year\n• Professional Sales Page: 1,500 MT/mo or 15,000 MT/year\nExplore at: https://www.wehosthere.com/systems`
        : `Aluguer de Sistemas Prontos (Setup Gratuito 0 MT):\n• Sistema de Gestão Financeira: 2.500 MT/mês ou 25.000 MT/ano\n• Sistema de Gestão de Inscrições: 2.000 MT/mês ou 20.000 MT/ano\n• Página de Vendas Profissional: 1.500 MT/mês ou 15.000 MT/ano\nSaiba mais em: https://www.wehosthere.com/systems`
    );
  }

  if (asksAcademy) {
    sections.push(
      isEn
        ? `WEHOSTHERE Web Academy & Certificates:\n• Course "Criação de Página de Vendas Profissional" (12h, 13 modules): Module 1 is free (open preview); full course + official verifiable certificate costs 500 MT.\n• Portal: https://www.wehosthere.com/academy | Verify certificate: https://www.wehosthere.com/verify-certificate`
        : `Academia Web WEHOSTHERE & Certificados:\n• Curso "Criação de Página de Vendas Profissional" (12h, 13 módulos): o Módulo 1 é gratuito (degustação); o curso completo + Certificado Oficial custa 500 MT.\n• Aceda em: https://www.wehosthere.com/academy | Validação de certificados em: https://www.wehosthere.com/verify-certificate`
    );
  }

  if (asksRevista) {
    sections.push(
      isEn
        ? `Codando Histórias Digital Magazine:\n• Mozambique's tech, dev, startups, AI, and career magazine — read online, download as PDF, or submit your own article at https://www.wehosthere.com/revista (submissions: https://www.wehosthere.com/revista/submeter).`
        : `Revista Digital "Codando Histórias":\n• A nossa revista tech de Moçambique (Código, Startups, IA, Design e Carreira), com leitura gratuita e download em PDF.\n• Leia em: https://www.wehosthere.com/revista | Submeta o seu artigo em: https://www.wehosthere.com/revista/submeter`
    );
  }

  if (asksAffiliates) {
    sections.push(
      isEn
        ? `WEHOSTHERE Affiliate Program:\n• Commission: 30% on every referral purchase (hosting, domains, rentable systems, or website creation).\n• Cookie window: 30 days | Minimum payout: 1,000 MT via M-Pesa, Bank Transfer, or PayPal.\n• Dashboard: https://www.wehosthere.com/dashboard/affiliates`
        : `Programa de Afiliados WEHOSTHERE:\n• Comissão: 30% em qualquer contratação feita através do seu link exclusivo (/ref/seu-codigo).\n• Validade do cookie: 30 dias | Saque mínimo: 1.000 MT via M-Pesa, Transferência Bancária ou PayPal.\n• Painel de Afiliados: https://www.wehosthere.com/dashboard/affiliates`
    );
  }

  if (asksAiBuilder) {
    sections.push(
      isEn
        ? `AI Website Builder:\n• Generate and publish modern websites with AI in one click on WEHOSTHERE infrastructure: https://www.wehosthere.com/ai-website-builder`
        : `Criador de Sites com IA:\n• Gere e publique sites modernos com inteligência artificial em 1 clique diretamente na WEHOSTHERE: https://www.wehosthere.com/ai-website-builder`
    );
  }

  if (asksPayment && !asksDomain) {
    sections.push(
      isEn
        ? `Payment Methods:\n• We accept M-Pesa, e-Mola, Visa/Mastercard cards, and bank transfers with fast activation.`
        : `Métodos de Pagamento:\n• Aceitamos M-Pesa (Vodacom), e-Mola (Movitel), cartões Visa/Mastercard e transferência bancária com confirmação rápida.`
    );
  } else if (asksDomain && asksPayment) {
    sections.push(
      isEn
        ? `Payment Methods:\n• M-Pesa, e-Mola, Visa/Mastercard, and bank transfer are all supported.`
        : `Formas de Pagamento Aceites:\n• Pode pagar facilmente via M-Pesa (Vodacom), e-Mola (Movitel), cartão Visa/Mastercard ou transferência bancária.`
    );
  }

  if (asksMeeting) {
    sections.push(
      isEn
        ? `Meeting / Call:\n• We would be glad to schedule a brief call or meeting. Please let us know your preferred date and time, or reach us on WhatsApp (+258 84 833 5618).`
        : `Agendamento de Reunião:\n• Teremos todo o gosto em agendar uma conversa. Por favor, indique o dia e horário da sua preferência ou contacte-nos diretamente pelo WhatsApp (+258 84 833 5618).`
    );
  }

  if (asksSupport && sections.length === 0) {
    sections.push(
      isEn
        ? `Technical Support:\n• Our technical team has received your report and is reviewing it with priority. If possible, please confirm the domain or account email involved so we can speed up the resolution.`
        : `Suporte Técnico:\n• A nossa equipa técnica já recebeu a sua ocorrência e está a analisar com prioridade. Caso ainda não tenha indicado, por favor confirme o domínio ou endereço da conta para acelerarmos a verificação.`
    );
  }

  const greeting = isEn
    ? variant === 1
      ? `Hi${recipientName ? ` ${recipientName}` : ''},`
      : variant === 2
      ? `Hello${recipientName ? ` ${recipientName}` : ''}, hope you are having a great day!`
      : `Dear${recipientName ? ` ${recipientName}` : ''},`
    : variant === 1
    ? `Caro(a)${recipientName ? ` ${recipientName}` : ''},`
    : variant === 2
    ? `Olá${recipientName ? ` ${recipientName}` : ''}, tudo bem?`
    : tone === 'friendly'
    ? `Olá${recipientName ? ` ${recipientName}` : ''}!`
    : tone === 'formal'
    ? `Prezado(a)${recipientName ? ` ${recipientName}` : ''},`
    : `Olá${recipientName ? ` ${recipientName}` : ''},`;

  if (sections.length > 0) {
    if (variant === 1) {
      const conciseSections = sections
        .map((s) => s.replace(/^\d+\.\s+/gm, '▸ ').replace(/\n{2,}/g, '\n'))
        .join('\n\n');
      const shortIntro = isEn
        ? `Thanks for reaching out! Here is a quick summary of what you need:`
        : `Obrigado pela mensagem! Segue o resumo objetivo com todas as informações:`;
      const shortOutro = isEn
        ? `Let us know when you're ready to proceed — we can activate everything quickly.\n\nBest,\n${signatureLabel}`
        : `Assim que quiser avançar, responda por aqui ou pelo WhatsApp (+258 84 833 5618) que tratamos de imediato.\n\nCumprimentos,\n${signatureLabel}`;
      return `${greeting}\n\n${shortIntro}\n\n${conciseSections}\n\n${shortOutro}`;
    }

    if (variant === 2) {
      const consultIntro = isEn
        ? `Thank you for considering WEHOSTHERE! We would be delighted to help you get started smoothly. Here are all the details:`
        : `É um prazer poder ajudar! Na WEHOSTHERE acompanhamos todo o processo consigo do início ao fim. Aqui estão os detalhes para a sua decisão:`;
      const consultOutro = isEn
        ? `If you'd like, just reply with your preferred option or domain name and our team will reserve and configure everything for you today (WhatsApp: +258 84 833 5618).\n\nWarm regards,\n${signatureLabel}`
        : `Se já tiver um nome em mente ou quiser ajuda para escolher o melhor plano, basta responder a este e-mail (ou chamar no WhatsApp +258 84 833 5618) e a nossa equipa trata da ativação consigo hoje mesmo.\n\nUm abraço e bons negócios,\n${signatureLabel}`;
      return `${greeting}\n\n${consultIntro}\n\n${sections.join('\n\n')}\n\n${consultOutro}`;
    }

    const intro = isEn
      ? `Thank you for contacting WEHOSTHERE. Please find below the details regarding your inquiry:`
      : tone === 'friendly'
      ? `Muito obrigado pelo seu contacto! Seguem abaixo todos os esclarecimentos sobre as suas questões:`
      : `Agradecemos o seu contacto com a WEHOSTHERE. Seguem abaixo os esclarecimentos detalhados sobre os pontos solicitados:`;

    const outro = isEn
      ? `If you need help completing your order or have any additional questions, we are fully available (also on WhatsApp: +258 84 833 5618).\n\nBest regards,\n${signatureLabel}`
      : `Caso pretenda avançar ou tenha qualquer dúvida adicional, estamos inteiramente à disposição por aqui ou pelo WhatsApp (+258 84 833 5618).\n\nCom os melhores cumprimentos,\n${signatureLabel}`;

    return `${greeting}\n\n${intro}\n\n${sections.join('\n\n')}\n\n${outro}`;
  }

  if (isConfirmation) {
    if (isEn) {
      if (variant === 1) {
        return `${greeting}\n\nThank you for confirming! Everything is aligned on our side and we are ready to move forward with the next steps.\n\nBest,\n${signatureLabel}`;
      }
      if (variant === 2) {
        return `${greeting}\n\nGreat news — thank you for your confirmation regarding "${subject || 'our agreement'}". We will proceed immediately and keep you updated.\n\nWarm regards,\n${signatureLabel}`;
      }
      return `${greeting}\n\nThank you for your confirmation and agreement. We are all set to advance with the next steps as discussed.\n\nBest regards,\n${signatureLabel}`;
    }

    if (variant === 1) {
      return `${greeting}\n\nExcelente! Obrigado pela confirmação. Da nossa parte está tudo alinhado para avançarmos com os próximos passos.\n\nCumprimentos,\n${signatureLabel}`;
    }
    if (variant === 2) {
      return `${greeting}\n\nFicamos muito satisfeitos com a confirmação! Vamos dar seguimento imediato conforme combinado e mantemos-vos atualizados.\n\nUm abraço,\n${signatureLabel}`;
    }
    return `${greeting}\n\nAgradecemos a confirmação! Estamos inteiramente alinhados e prontos para avançar com os próximos passos conforme acordado.\n\nCom os melhores cumprimentos,\n${signatureLabel}`;
  }

  if (isEn) {
    if (variant === 1) {
      return `${greeting}\n\nMessage received regarding "${subject || 'your inquiry'}". Our team is already reviewing it and will reply with an update shortly.\n\nBest,\n${signatureLabel}`;
    }
    if (variant === 2) {
      return `${greeting}\n\nThank you for getting in touch about "${subject || 'your request'}"! We have forwarded your message to the responsible team so we can assist you right away.\n\nWarm regards,\n${signatureLabel}`;
    }
    return `${greeting}\n\nThank you for your email regarding "${subject || 'your request'}". We confirm receipt and are reviewing the details carefully.\n\nWe will get back to you shortly with a complete follow-up.\n\nBest regards,\n${signatureLabel}`;
  }

  if (variant === 1) {
    return `${greeting}\n\nRecebemos o seu e-mail sobre "${subject || 'este assunto'}" e já estamos a verificar. Assim que tivermos retorno, enviamos por aqui.\n\nCumprimentos,\n${signatureLabel}`;
  }
  if (variant === 2) {
    return `${greeting}\n\nAgradecemos o contacto! A sua mensagem sobre "${subject || 'este tema'}" já foi encaminhada internamente para lhe darmos a melhor resposta possível ainda hoje.\n\nAté breve,\n${signatureLabel}`;
  }

  if (tone === 'formal') {
    return `${greeting}\n\nAgradecemos pelo contacto e pelas informações partilhadas relativamente a "${subject || 'este assunto'}".\n\nConfirmamos a receção da sua mensagem e daremos o devido seguimento com a maior brevidade possível.\n\nCom os melhores cumprimentos,\n${signatureLabel}`;
  }
  if (tone === 'friendly') {
    return `${greeting}\n\nMuito obrigado pelo seu e-mail!\n\nConfirmamos a receção da sua mensagem e já estamos a dar atenção ao assunto. Em breve retornamos com mais novidades.\n\nTenha um excelente dia!\n\nAtenciosamente,\n${signatureLabel}`;
  }

  return `${greeting}\n\nObrigado pela sua mensagem referente a "${subject || 'este assunto'}". Confirmamos que foi recebida e já estamos a tratar do seguimento.\n\nEntraremos em contacto muito em breve.\n\nCom os melhores cumprimentos,\n${signatureLabel}`;
}

export interface GenerateSmartReplyParams {
  content: string;
  subject?: string;
  from?: string;
  fromName?: string;
  senderName?: string;
  tone?: string;
  prompt?: string;
  variation?: number;
  previousReply?: string;
  isAutomatedAgent?: boolean;
}

export async function generateSmartReply(params: GenerateSmartReplyParams): Promise<{
  result: string;
  provider: string;
  model?: string;
  diagnostics: string[];
}> {
  const {
    content = '',
    subject = '',
    from = '',
    fromName = '',
    senderName = '',
    tone = 'professional',
    prompt = '',
    variation = 0,
    previousReply = '',
    isAutomatedAgent = false,
  } = params;

  const structuredLines = cleanEmailHtmlToLines(content);
  const cleanText = structuredLines.join('\n');
  const readableEmailText = normalizeIncomingEmailText(cleanEmailHtmlToReadableText(content) || cleanText);
  const isEnIncoming = isLikelyEnglishEmail(subject, readableEmailText);
  const { recipientName, signatureLabel } = resolveReplyIdentities(from, fromName, senderName, isEnIncoming);

  const altRule = Number(variation) > 0
    ? `\n- IMPORTANTE: Gere uma versão alternativa #${Number(variation) + 1} com estrutura, saudação e formulação claramente diferentes da resposta anterior.${previousReply ? `\n- Evite repetir a resposta anterior:\n"""\n${String(previousReply).slice(0, 600)}\n"""` : ''}`
    : '';

  const toneDesc = tone === 'formal'
    ? 'muito formal e protocolar'
    : tone === 'friendly'
    ? 'amigável, próximo e caloroso'
    : tone === 'quick_accept'
    ? 'confirmação rápida e positiva'
    : tone === 'quick_decline'
    ? 'recusa educada e diplomática'
    : 'profissional, claro e objetivo';

  const agentRule = isAutomatedAgent
    ? `\n- Escreva diretamente em nome de Afonso Domingos / WEHOSTHERE de forma 100% natural, humana e prestativa. NUNCA mencione que é um robô, IA ou assistente automático, e NUNCA adicione avisos ou notas de resposta automática.`
    : '';

  const openSystemPrompt = `Você é o assistente de e-mail oficial da WEHOSTHERE. Escreva uma resposta completa e pronta para enviar, especificamente adaptada ao conteúdo real do e-mail recebido.
Regras obrigatórias:
- Leia com atenção o e-mail recebido e responda diretamente ao que essa mensagem diz ou pergunta.
- NÃO copie nem despeje tabelas inteiras ou serviços não relacionados se o e-mail recebido perguntou apenas sobre um assunto específico (ou se não perguntou sobre serviços/preços).
- Quando o cliente perguntar sobre um serviço, produto, rota, política, Academia Web, Revista, Afiliados, VPS, Sites, Sistemas ou pagamentos, inclua apenas os factos exatos e o link oficial específico (https://www.wehosthere.com/...) desse tema.
- Tom solicitado: ${toneDesc}.
- Idioma: responda no mesmo idioma do e-mail recebido (${isEnIncoming ? 'Inglês' : 'Português'}).
- Saudação: dirija-se a ${recipientName ? `"${recipientName}"` : 'forma cordial adequada (ex.: "Prezado(a)," ou "Olá,")'}. NUNCA escreva placeholders entre colchetes como [Nome], [Seu Nome], [Empresa].
- Assinatura final: assine como "${signatureLabel}".
- NÃO use asteriscos (** ou *) nem formatação Markdown.${altRule}${agentRule}

Base de Conhecimento Oficial Completa da Plataforma WEHOSTHERE (use apenas as secções relevantes à pergunta):
${getWehosthereKnowledgeContext()}`;

  const openUserPrompt = `E-mail recebido:\nAssunto: ${subject || '(Sem assunto)'}\nDe: ${fromName ? `${fromName} <${from}>` : from}\n\nConteúdo:\n${readableEmailText.slice(0, 3500)}\n\nInstrução extra: ${prompt || 'Nenhuma'}`;

  const aiRes = await callOpenSourceLLM({
    systemPrompt: openSystemPrompt,
    userPrompt: openUserPrompt,
    temperature: Number(variation) > 0 ? 0.85 : 0.65,
    seed: Date.now() + Number(variation || 0) * 97,
  });

  if (aiRes?.text) {
    return {
      result: stripMarkdownAsterisks(aiRes.text),
      provider: aiRes.provider || 'open-llm',
      model: aiRes.model,
      diagnostics: aiRes.diagnostics,
    };
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${openSystemPrompt}\n\n${openUserPrompt}` }] }],
        }),
        signal: AbortSignal.timeout(14000),
      });
      const data = await res.json();
      const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generated) {
        return {
          result: stripMarkdownAsterisks(generated),
          provider: 'gemini',
          diagnostics: aiRes.diagnostics,
        };
      }
    } catch (geminiErr) {
      console.warn('[AI Core] Gemini fallback:', geminiErr);
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: openSystemPrompt },
            { role: 'user', content: openUserPrompt },
          ],
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(14000),
      });
      const data = await res.json();
      const generated = data?.choices?.[0]?.message?.content;
      if (generated) {
        return {
          result: stripMarkdownAsterisks(generated),
          provider: 'openai',
          diagnostics: aiRes.diagnostics,
        };
      }
    } catch (oaErr) {
      console.warn('[AI Core] OpenAI fallback:', oaErr);
    }
  }

  let fallbackText = buildContextualEmailReply({
    subject,
    cleanText: readableEmailText,
    from,
    fromName,
    senderName,
    tone,
    variation: Number(variation) || 0,
  });

  if (isAutomatedAgent && prompt?.trim()) {
    fallbackText = `${fallbackText}\n\n${prompt.trim()}`;
  }

  return {
    result: stripMarkdownAsterisks(fallbackText),
    provider: 'local-fallback',
    diagnostics: aiRes.diagnostics,
  };
}

