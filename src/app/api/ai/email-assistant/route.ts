import { NextRequest, NextResponse } from 'next/server';

function decodeHtmlEntitiesServer(text: string): string {
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

function cleanEmailHtmlToReadableText(raw: string): string {
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

function cleanEmailHtmlToLines(raw: string): string[] {
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

  // Deduplicate similar lines and filter out boilerplate footer lines
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

function stripMarkdownAsterisks(text: string): string {
  return decodeHtmlEntitiesServer(text)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .trim();
}

async function translateTextNeural(text: string, targetLang: 'pt' | 'en'): Promise<string> {
  if (!text || !text.trim()) return '';
  const cleanInput = text.trim();

  // 1. Motor Neural Direto (Google GTX Neural Translate - rápido, preserva quebras de linha e gratuito)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(cleanInput)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedParts = data[0]
          .map((segment: any) => (Array.isArray(segment) && segment[0] ? String(segment[0]) : ''))
          .join('');
        if (translatedParts.trim()) {
          return translatedParts.trim();
        }
      }
    }
  } catch (err) {
    console.warn('[AI Translate] GTX fallback:', err);
  }

  // 2. Fallback para MyMemory Neural API
  try {
    const sourceLang = targetLang === 'pt' ? 'en' : 'pt';
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanInput.slice(0, 1500))}&langpair=${sourceLang}|${targetLang}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return decodeHtmlEntitiesServer(String(data.responseData.translatedText)).trim();
      }
    }
  } catch (err) {
    console.warn('[AI Translate] MyMemory fallback:', err);
  }

  return cleanInput;
}

// Helper: Transformar fala/voz natural num e-mail corporativo estruturado + assunto inteligente
function transformVoiceTranscriptToCorporateEmail(
  rawTranscript: string,
  recipientEmailOrName: string = '',
  senderName: string = '',
  tone: string = 'professional',
  lang: 'pt' | 'en' = 'pt'
): { body: string; generatedSubject: string } {
  let text = decodeHtmlEntitiesServer(rawTranscript || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) {
    return {
      body: '',
      generatedSubject: '',
    };
  }

  // Extrair possível nome do destinatário falado no comando (ex: "Diz ao João que...", "Envia um email para a Maria a dizer que...")
  let spokenRecipient = '';
  const commandMatch = text.match(
    /^(?:olá\s+|bom dia\s+|boa tarde\s+|boa noite\s+)?(?:por favor\s+)?(?:escreve|escreva|envia|envie|manda|mande|diz|diga|fala|avisa|avise|informa|informe)\s+(?:um\s+e-?mail\s+|uma\s+mensagem\s+)?(?:para\s+o\s+|para\s+a\s+|para\s+|ao\s+|à\s+)?([A-ZÀ-Úa-zà-ú]+(?:\s+[A-ZÀ-Úa-zà-ú]+)?)\s+(?:a\s+dizer\s+que|dizendo\s+que|sobre|para\s+informar\s+que|que)\s+([\s\S]+)$/i
  );

  if (commandMatch) {
    const candidateName = commandMatch[1].trim();
    const stopWords = ['cliente', 'equipa', 'equipe', 'diretor', 'empresa', 'ele', 'ela', 'eles'];
    if (!stopWords.includes(candidateName.toLowerCase())) {
      spokenRecipient = candidateName.charAt(0).toUpperCase() + candidateName.slice(1);
    }
    text = commandMatch[2].trim();
  } else {
    // Remover prefixos simples de comando de voz ("escreve um email a dizer que...", "informa que...", "diz que...")
    text = text.replace(
      /^(?:por favor\s+)?(?:escreve|escreva|envia|envie|manda|mande|diz|diga|informa|informe)\s+(?:um\s+e-?mail\s+|uma\s+mensagem\s+)?(?:a\s+dizer\s+que\s+|dizendo\s+que\s+|para\s+informar\s+que\s+|que\s+)/i,
      ''
    ).trim();
  }

  // Limpar vícios de linguagem oral no início
  text = text.replace(/^(?:então|hum|ahn|olha|bem|pronto|basicamente)[,\s]+/i, '').trim();

  // Converter 3ª pessoa indireta ("o serviço dele já está ativo") para tratamento direto cordial ("o seu serviço já se encontra ativo")
  text = text
    .replace(/\bdele\b/gi, 'seu')
    .replace(/\bdela\b/gi, 'sua')
    .replace(/\bque ele\b/gi, 'que V. Exa.')
    .replace(/\bque ela\b/gi, 'que V. Exa.')
    .replace(/\bpara ele\b/gi, 'para si')
    .replace(/\bpara ela\b/gi, 'para si');

  // Garantir pontuação e letras maiúsculas em cada frase
  const rawSentences = text
    .split(/(?<=[.!?])\s+|\s+(?:e\s+também|além\s+disso|outro\s+ponto\s+é\s+que)\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const polishedSentences = rawSentences.map((s) => {
    const capitalized = s.charAt(0).toUpperCase() + s.slice(1);
    return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
  });

  // Determinar nome do destinatário
  let recipientDisplay = spokenRecipient;
  if (!recipientDisplay && recipientEmailOrName) {
    const cleanRec = recipientEmailOrName.split('@')[0].replace(/[._\-0-9]+/g, ' ').trim();
    if (cleanRec) {
      recipientDisplay = cleanRec
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  // Gerar assunto profissional automático baseado no conteúdo falado
  const lower = text.toLowerCase();
  let generatedSubject = lang === 'en' ? 'Professional Update & Information' : 'Informação e Atualização Corporativa';

  if (lower.includes('fatura') || lower.includes('pagamento') || lower.includes('comprovativo') || lower.includes('recibo')) {
    generatedSubject = 'Confirmação de Pagamento e Faturação';
  } else if (lower.includes('reunião') || lower.includes('encontro') || lower.includes('agenda') || lower.includes('call')) {
    generatedSubject = 'Agendamento e Alinhamento de Reunião';
  } else if (lower.includes('orçamento') || lower.includes('proposta') || lower.includes('cotação') || lower.includes('preço')) {
    generatedSubject = 'Proposta Comercial e Condições';
  } else if (lower.includes('ativo') || lower.includes('ativação') || lower.includes('conta') || lower.includes('serviço') || lower.includes('domínio')) {
    generatedSubject = 'Atualização sobre Ativação de Serviço';
  } else if (lower.includes('relatório') || lower.includes('documento') || lower.includes('anexo') || lower.includes('ficheiro')) {
    generatedSubject = 'Envio de Documentação e Informações';
  } else if (lower.includes('prazo') || lower.includes('entrega') || lower.includes('projeto')) {
    generatedSubject = 'Ponto de Situação do Projeto';
  } else {
    const words = polishedSentences[0]
      .replace(/[.!?]+$/, '')
      .split(/\s+/)
      .slice(0, 7)
      .join(' ');
    if (words.length > 5) {
      generatedSubject = words.charAt(0).toUpperCase() + words.slice(1);
    }
  }

  const greeting =
    lang === 'en'
      ? `Dear ${recipientDisplay || 'Sir/Madam'},`
      : tone === 'friendly'
      ? `Olá${recipientDisplay ? ` ${recipientDisplay}` : ''},`
      : `Prezado(a)${recipientDisplay ? ` ${recipientDisplay}` : ''},`;

  const introLine =
    lang === 'en'
      ? 'I hope this email finds you well.'
      : tone === 'friendly'
      ? 'Espero que esteja tudo ótimo consigo.'
      : 'Espero que este e-mail o(a) encontre bem.';

  const mainParagraph =
    polishedSentences.length > 1
      ? polishedSentences.join('\n\n')
      : `Venho por este meio informar que ${polishedSentences[0].charAt(0).toLowerCase() + polishedSentences[0].slice(1)}`;

  const closingLine =
    lang === 'en'
      ? 'Please let me know if you need any further information.\n\nBest regards,'
      : tone === 'friendly'
      ? 'Qualquer dúvida, estou inteiramente à disposição.\n\nMelhores cumprimentos,'
      : 'Permanecemos à inteira disposição para quaisquer esclarecimentos adicionais.\n\nCom os melhores cumprimentos,';

  const cleanSender = senderName
    ? senderName.split('@')[0].replace(/[._\-]+/g, ' ').trim()
    : '';

  const signatureBlock = cleanSender
    ? `${closingLine}\n${cleanSender.charAt(0).toUpperCase() + cleanSender.slice(1)}`
    : closingLine;

  return {
    body: `${greeting}\n\n${introLine}\n\n${mainParagraph}\n\n${signatureBlock}`,
    generatedSubject,
  };
}

// POST - Webmail AI Assistant (Summarize, Translate, Smart Reply, Improve Writing, Voice to Email)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action = 'summarize', 
      content = '', 
      subject = '', 
      from = '', 
      recipient = '',
      senderName = '',
      tone = 'professional',
      targetLang = 'pt',
      prompt = ''
    } = body;

    if (!content && !prompt && !subject) {
      return NextResponse.json({ error: 'Conteúdo é obrigatório' }, { status: 400 });
    }

    // Ação 23: Voice to Email (Transforma a voz do utilizador num e-mail profissional + assunto sugerido)
    if (action === 'voice_to_email') {
      const lang: 'pt' | 'en' = targetLang === 'en' ? 'en' : 'pt';
      const fallbackVoice = transformVoiceTranscriptToCorporateEmail(
        content,
        recipient,
        senderName,
        tone,
        lang
      );

      const geminiKey = process.env.GEMINI_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;

      if (geminiKey) {
        try {
          const voicePrompt = `O utilizador ditou por voz o seguinte comando ou mensagem: "${content}".
Transforme esta fala num e-mail corporativo altamente profissional, claro, educado e pronto para enviar em ${lang === 'en' ? 'inglês' : 'português'} (tom: ${tone}).
Destinatário: ${recipient || 'Cliente/Parceiro'}.
Remetente: ${senderName || 'Equipa'}.
NÃO utilize asteriscos (**).
Responda no formato exato:
ASSUNTO: [Assunto profissional sugerido]
CORPO:
[Corpo completo do e-mail com saudação, desenvolvimento e despedida]`;

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: voicePrompt }] }],
            }),
          });
          const data = await res.json();
          const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generated) {
            const subjMatch = generated.match(/ASSUNTO:\s*(.+)/i);
            const bodyMatch = generated.match(/CORPO:\s*([\s\S]+)/i);
            return NextResponse.json({
              success: true,
              result: stripMarkdownAsterisks(bodyMatch ? bodyMatch[1].trim() : generated),
              generatedSubject: stripMarkdownAsterisks(subjMatch ? subjMatch[1].trim() : fallbackVoice.generatedSubject),
            });
          }
        } catch (err) {
          console.warn('[AI Voice-to-Email] Gemini fallback:', err);
        }
      }

      if (openaiKey) {
        try {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content:
                    'Você transforma transcrições de voz do utilizador em e-mails corporativos impecáveis, sem asteriscos (**). Responda sempre com ASSUNTO: ... na primeira linha e CORPO: nas linhas seguintes.',
                },
                {
                  role: 'user',
                  content: `Fala transcrita: "${content}"\nDestinatário: ${recipient}\nTom: ${tone}`,
                },
              ],
              temperature: 0.6,
            }),
          });
          const data = await res.json();
          const generated = data?.choices?.[0]?.message?.content;
          if (generated) {
            const subjMatch = generated.match(/ASSUNTO:\s*(.+)/i);
            const bodyMatch = generated.match(/CORPO:\s*([\s\S]+)/i);
            return NextResponse.json({
              success: true,
              result: stripMarkdownAsterisks(bodyMatch ? bodyMatch[1].trim() : generated),
              generatedSubject: stripMarkdownAsterisks(subjMatch ? subjMatch[1].trim() : fallbackVoice.generatedSubject),
            });
          }
        } catch (err) {
          console.warn('[AI Voice-to-Email] OpenAI fallback:', err);
        }
      }

      return NextResponse.json({
        success: true,
        result: stripMarkdownAsterisks(fallbackVoice.body),
        generatedSubject: stripMarkdownAsterisks(fallbackVoice.generatedSubject),
      });
    }

    // Ação de Tradução Instantânea (Português <-> Inglês)
    if (action === 'translate') {
      const lang: 'pt' | 'en' = targetLang === 'en' ? 'en' : 'pt';
      const readableBody = cleanEmailHtmlToReadableText(content);
      const cleanSubj = decodeHtmlEntitiesServer(subject || '').trim();

      const [translatedBody, translatedSubject] = await Promise.all([
        readableBody ? translateTextNeural(readableBody, lang) : Promise.resolve(''),
        cleanSubj ? translateTextNeural(cleanSubj, lang) : Promise.resolve(''),
      ]);

      return NextResponse.json({
        success: true,
        result: stripMarkdownAsterisks(translatedBody),
        translatedSubject: stripMarkdownAsterisks(translatedSubject || cleanSubj),
        targetLang: lang,
      });
    }

    const structuredLines = cleanEmailHtmlToLines(content);
    const cleanText = structuredLines.join('\n');

    // Check if Gemini or OpenAI API Key exists
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        let systemPrompt = '';
        if (action === 'summarize') {
          systemPrompt = 'Resuma o e-mail abaixo em português de forma clara, executiva e bem estruturada em 3 pontos-chave curtos usando o marcador "• ". NÃO utilize asteriscos (**) nem formatação Markdown. No final, adicione uma linha iniciada por "💡 Ação recomendada: " com o próximo passo sugerido.';
        } else if (action === 'reply') {
          systemPrompt = `Escreva uma resposta profissional de e-mail em português no tom "${tone}". O e-mail recebido é sobre "${subject}" de "${from}". Responda de forma cortês, estruturada e pronta para envio, sem usar asteriscos (**).`;
        } else if (action === 'improve') {
          systemPrompt = `Reescreva e aprimore o seguinte rascunho de e-mail em português, mantendo a mensagem central, mas com tom ${tone}, gramática perfeita, pontuação impecável e vocabulário corporativo de alto nível. Não utilize asteriscos (**).`;
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${systemPrompt}\n\nAssunto: ${subject}\nE-mail:\n${cleanText}\n\nInstrução adicional: ${prompt || 'Nenhuma'}` }]
            }]
          })
        });
        const data = await res.json();
        const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated) {
          return NextResponse.json({ success: true, result: stripMarkdownAsterisks(generated) });
        }
      } catch (geminiErr) {
        console.warn('[AI Assistant] Gemini API fallback:', geminiErr);
      }
    }

    if (openaiKey) {
      try {
        const systemPrompt = 'Você é um assistente executivo de e-mails corporativos da WEHOSTHERE. Nunca utilize asteriscos (**) na resposta.';
        let userPrompt = '';

        if (action === 'summarize') {
          userPrompt = `Resuma o seguinte e-mail em 3 tópicos curtos e diretos iniciados por "• ", sem usar asteriscos (**), e termine com "💡 Ação recomendada: ...":\n\nAssunto: ${subject}\n${cleanText}`;
        } else if (action === 'reply') {
          userPrompt = `Escreva uma resposta de e-mail com tom ${tone} (sem usar **) para a seguinte mensagem:\n\nAssunto: ${subject}\nDe: ${from}\nMensagem: ${cleanText}`;
        } else if (action === 'improve') {
          userPrompt = `Aprimore este rascunho de e-mail com tom ${tone} e gramática impecável (sem usar **):\n\n${cleanText}`;
        }

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7
          })
        });
        const data = await res.json();
        const generated = data?.choices?.[0]?.message?.content;
        if (generated) {
          return NextResponse.json({ success: true, result: stripMarkdownAsterisks(generated) });
        }
      } catch (oaErr) {
        console.warn('[AI Assistant] OpenAI API fallback:', oaErr);
      }
    }

    // Built-in Smart Fallback Engine (Zero-config instant response)
    let fallbackResult = '';

    if (action === 'summarize') {
      const candidatePoints: string[] = [];
      for (const line of structuredLines) {
        const parts = line.split(/(?<=[.!?])\s+/).map(p => p.trim()).filter(p => p.length > 12);
        for (const part of parts) {
          const cleanPart = part.length > 130 ? `${part.slice(0, 127).trim()}...` : part;
          if (!candidatePoints.some(c => c.toLowerCase() === cleanPart.toLowerCase())) {
            candidatePoints.push(cleanPart);
          }
          if (candidatePoints.length >= 3) break;
        }
        if (candidatePoints.length >= 3) break;
      }

      const bulletPoints = candidatePoints.length > 0
        ? candidatePoints.map((s: string) => `• ${s}`).join('\n')
        : `• Assunto principal: ${subject || 'Mensagem corporativa recebida.'}`;

      const lowerContext = `${subject} ${cleanText}`.toLowerCase();
      let recommendedAction = 'Analisar os pontos principais e responder conforme necessário.';
      if (lowerContext.includes('visitantes') || lowerContext.includes('audiência') || lowerContext.includes('tráfego')) {
        recommendedAction = 'Acompanhar as métricas de crescimento no painel de estatísticas em tempo real.';
      } else if (lowerContext.includes('fatura') || lowerContext.includes('pagamento') || lowerContext.includes('recibo')) {
        recommendedAction = 'Verificar os dados financeiros e confirmar o estado do pagamento no painel.';
      } else if (lowerContext.includes('orçamento') || lowerContext.includes('proposta') || lowerContext.includes('cotação')) {
        recommendedAction = 'Avaliar a proposta comercial e enviar confirmação ou retorno ao remetente.';
      } else if (lowerContext.includes('pedido') || lowerContext.includes('e-mail corporativo')) {
        recommendedAction = 'Rever os detalhes da solicitação e proceder com a ativação ou resposta ao cliente.';
      }

      fallbackResult = `📌 Resumo Inteligente da Mensagem:\n${bulletPoints}\n💡 Ação recomendada: ${recommendedAction}`;
    } else if (action === 'reply') {
      const senderName = from.split('<')[0].replace(/["']/g, '').trim() || 'Prezado(a)';
      if (tone === 'formal') {
        fallbackResult = `Prezado(a) ${senderName},\n\nAgradeço pelo contacto e pelas informações compartilhadas.\n\nRecepcionamos a sua mensagem referente a "${subject || 'este assunto'}" e já estamos a dar o devido seguimento.\n\nQualquer dúvida adicional ou atualização, estarei inteiramente à disposição.\n\nCom os melhores cumprimentos,\nEquipa`;
      } else if (tone === 'friendly') {
        fallbackResult = `Olá ${senderName},\n\nMuito obrigado pelo seu e-mail!\n\nConfirmamos a receção e já estamos a analisar com atenção. Em breve retornaremos com mais detalhes.\n\nTenha um excelente dia!\n\nAtenciosamente,`;
      } else if (tone === 'quick_accept') {
        fallbackResult = `Prezado(a) ${senderName},\n\nConfirmamos a receção e estamos de acordo com os termos apresentados.\n\nAvançaremos com os próximos passos conforme acordado.\n\nObrigado,\nEquipa`;
      } else if (tone === 'quick_decline') {
        fallbackResult = `Prezado(a) ${senderName},\n\nAgradecemos sinceramente pela proposta e pela consideração.\n\nNo momento, avaliámos a solicitação e não será possível prosseguir com esta solicitação específica.\n\nFicamos em contacto para futuras oportunidades.\n\nCordialmente,`;
      } else {
        fallbackResult = `Estimado(a) ${senderName},\n\nObrigado pela sua mensagem. Confirmamos que foi recebida e já se encontra em análise.\n\nEntraremos em contacto muito em breve.\n\nMelhores cumprimentos,`;
      }
    } else if (action === 'improve') {
      // Clean up and polish format
      const lines = cleanText.split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
      fallbackResult = `Prezado(a),\n\n${lines.join('\n\n')}\n\nFicamos à total disposição para quaisquer esclarecimentos adicionais.\n\nAtenciosamente,`;
    }

    return NextResponse.json({
      success: true,
      result: stripMarkdownAsterisks(fallbackResult)
    });
  } catch (error: any) {
    console.error('[AI Email Assistant POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao processar requisição com IA' },
      { status: 500 }
    );
  }
}
