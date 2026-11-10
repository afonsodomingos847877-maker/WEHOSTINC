import { NextRequest, NextResponse } from 'next/server';
import { VisualComponent, GlobalSiteTheme } from '@/lib/builder/types';
import { generateComponentId } from '@/lib/builder/defaultComponents';
import { requireAuth } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ─── Heurísticas Inteligentes para Fallback (quando sem chave de API externa) ──
function applyHeuristicComponentEdit(
  component: VisualComponent,
  prompt: string,
  theme?: GlobalSiteTheme
): VisualComponent {
  const updated: VisualComponent = JSON.parse(JSON.stringify(component));
  const p = prompt.toLowerCase();

  // 1. Textos persuasivos / copy orientado a vendas
  if (p.includes('persuasivo') || p.includes('venda') || p.includes('copy') || p.includes('melhor')) {
    if (updated.type === 'heading') {
      updated.content.text = 'Transforme os Seus Resultados com Soluções de Alto Impacto';
    } else if (updated.type === 'text') {
      updated.content.text = 'Mais de 1.500 empresas confiam na nossa infraestrutura para escalar vendas, acelerar processos e garantir disponibilidade 24/7.';
    } else if (updated.type === 'button') {
      updated.content.buttonText = 'Começar Agora — Teste Grátis';
    } else if (updated.type === 'badge') {
      updated.content.badgeText = '⚡ Oferta Exclusiva por Tempo Limitado';
    }
  }

  // 2. Adaptação para Moçambique / M-Pesa / Meticais
  if (p.includes('moçambique') || p.includes('mocambique') || p.includes('m-pesa') || p.includes('mpesa') || p.includes('emola') || p.includes('meticais')) {
    if (updated.content.pricingPlans && updated.content.pricingPlans.length > 0) {
      updated.content.pricingPlans = updated.content.pricingPlans.map((plan, idx) => ({
        ...plan,
        currency: 'MT',
        price: idx === 0 ? '850' : idx === 1 ? '1.750' : '3.500',
        features: [
          ...plan.features.filter(f => !f.includes('Pagamento')),
          'Pagamento instantâneo via M-Pesa e e-Mola',
          'Suporte local em Maputo e Matola',
        ],
      }));
    }
    if (updated.content.whatsappMessage) {
      updated.content.whatsappMessage = 'Olá! Gostaria de falar sobre os vossos serviços em Moçambique e opções de pagamento via M-Pesa.';
    }
    if (updated.type === 'heading') {
      updated.content.text = `${updated.content.text || 'Líder em Moçambique'} — Soluções para Empresas em Moçambique`;
    }
  }

  // 3. Estilos e Cores
  if (p.includes('azul') || p.includes('blue')) {
    updated.styles.desktop.backgroundColor = '#1d4ed8';
    updated.styles.desktop.color = '#ffffff';
  } else if (p.includes('verde') || p.includes('green') || p.includes('esmeralda')) {
    updated.styles.desktop.backgroundColor = '#059669';
    updated.styles.desktop.color = '#ffffff';
  } else if (p.includes('escuro') || p.includes('dark') || p.includes('preto')) {
    updated.styles.desktop.backgroundColor = '#0f172a';
    updated.styles.desktop.color = '#f8fafc';
  } else if (p.includes('dourado') || p.includes('gold') || p.includes('ouro')) {
    updated.styles.desktop.backgroundColor = '#d97706';
    updated.styles.desktop.color = '#ffffff';
  }

  // 4. Tipografia
  if (p.includes('maior') || p.includes('grande')) {
    const currentSize = parseInt(updated.styles.desktop.fontSize || '24', 10);
    updated.styles.desktop.fontSize = `${Math.min(currentSize + 8, 72)}px`;
  } else if (p.includes('menor') || p.includes('pequeno')) {
    const currentSize = parseInt(updated.styles.desktop.fontSize || '24', 10);
    updated.styles.desktop.fontSize = `${Math.max(currentSize - 6, 12)}px`;
  }

  // 5. Alinhamento
  if (p.includes('centro') || p.includes('centralizar') || p.includes('center')) {
    updated.styles.desktop.textAlign = 'center';
  } else if (p.includes('esquerda') || p.includes('left')) {
    updated.styles.desktop.textAlign = 'left';
  } else if (p.includes('direita') || p.includes('right')) {
    updated.styles.desktop.textAlign = 'right';
  }

  return updated;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const {
      prompt,
      action = 'edit_component',
      targetComponent,
      theme,
      siteTitle = 'Meu Website',
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // ─── AÇÃO 1: EDIÇÃO CIRÚRGICA DE COMPONENTE EXISTENTE ──────────────────────
    if (action === 'edit_component' && targetComponent) {
      const compJson = JSON.stringify(targetComponent, null, 2);

      const systemPrompt = `Você é o assistente sênior de IA do WeHostHere Visual Builder.
Sua função é realizar uma ALTERAÇÃO CIRÚRGICA no componente fornecido, modificando APENAS o que o utilizador pediu e preservando toda a coerência técnica do JSON.

REGRAS OBRIGATÓRIAS:
1. Retorne ESTRITAMENTE um objeto JSON válido correspondente ao nó do componente. Não inclua texto explicativo antes ou depois.
2. Mantenha o mesmo 'id', 'type' e 'parentId'.
3. Atualize o 'content' (textos, títulos, links, badges, itens) ou 'styles' conforme o pedido.
4. Use português de Portugal/Moçambique natural e persuasivo.
5. Se for solicitado temas/cores, use classes Tailwind ou valores hexadecimais compatíveis.

Tema do Website:
- Cor Primária: ${theme?.primaryColor || '#2563eb'}
- Tipografia: ${theme?.fontFamily || 'Inter'} / ${theme?.headingFontFamily || 'Plus Jakarta Sans'}

Componente Original (JSON):
${compJson}

Pedido do Utilizador:
"${prompt}"`;

      // 1. Tentar Gemini API
      if (geminiKey) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: {
                  temperature: 0.6,
                  maxOutputTokens: 2048,
                  responseMimeType: 'application/json',
                },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              if (parsed && parsed.id && parsed.type) {
                return NextResponse.json({
                  success: true,
                  component: parsed,
                  message: `Componente atualizado com IA: "${prompt.slice(0, 40)}"`,
                });
              }
            }
          }
        } catch (err) {
          console.warn('[SurgicalEdit] Falha Gemini:', err);
        }
      }

      // 2. Tentar OpenAI API
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
              messages: [{ role: 'user', content: systemPrompt }],
              temperature: 0.6,
              response_format: { type: 'json_object' },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data?.choices?.[0]?.message?.content;
            if (text) {
              const parsed = JSON.parse(text);
              if (parsed && (parsed.id || parsed.type)) {
                parsed.id = targetComponent.id;
                parsed.type = targetComponent.type;
                return NextResponse.json({
                  success: true,
                  component: parsed,
                  message: `Componente atualizado com IA: "${prompt.slice(0, 40)}"`,
                });
              }
            }
          }
        } catch (err) {
          console.warn('[SurgicalEdit] Falha OpenAI:', err);
        }
      }

      // 3. Fallback Heurístico Inteligente
      const heuristicComponent = applyHeuristicComponentEdit(targetComponent, prompt, theme);
      return NextResponse.json({
        success: true,
        component: heuristicComponent,
        message: `Componente refinado com sucesso: "${prompt.slice(0, 40)}"`,
      });
    }

    // ─── AÇÃO 2: CRIAÇÃO DE NOVA SECÇÃO COESA COM O TEMA ────────────────────────
    if (action === 'create_section') {
      const sectionPrompt = `Você é o arquiteto de websites da WEHOSTHERE.
Crie uma nova secção completa para o website "${siteTitle}".
O utilizador solicitou: "${prompt}".

Tema do Website:
- Cor Primária: ${theme?.primaryColor || '#2563eb'}
- Cor Secundária: ${theme?.secondaryColor || '#1e293b'}
- Fonte: ${theme?.fontFamily || 'Inter'}
- Fonte Títulos: ${theme?.headingFontFamily || 'Plus Jakarta Sans'}

Crie uma secção com a seguinte estrutura de nó JSON:
{
  "id": "sec_${Date.now()}",
  "type": "section",
  "name": "Nova Secção",
  "content": {},
  "styles": {
    "desktop": {
      "paddingTop": "80px",
      "paddingBottom": "80px",
      "paddingLeft": "24px",
      "paddingRight": "24px",
      "backgroundColor": "transparent"
    }
  },
  "parentId": null,
  "children": [
    {
      "id": "container_${Date.now()}",
      "type": "container",
      "name": "Container Central",
      "content": {},
      "styles": {
        "desktop": {
          "maxWidth": "1280px",
          "marginLeft": "auto",
          "marginRight": "auto",
          "display": "flex",
          "flexDirection": "column",
          "gap": "24px"
        }
      },
      "parentId": null,
      "children": [...]
    }
  ]
}

Retorne EXCLUSIVAMENTE o JSON da secção.`;

      if (geminiKey) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: sectionPrompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 3072,
                  responseMimeType: 'application/json',
                },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              if (parsed && parsed.type) {
                return NextResponse.json({
                  success: true,
                  component: parsed,
                  message: `Nova secção criada com IA: "${prompt.slice(0, 40)}"`,
                });
              }
            }
          }
        } catch (err) {
          console.warn('[SurgicalCreateSection] Falha Gemini:', err);
        }
      }

      // Fallback: criar secção padrão estruturada com base no prompt
      const newSecId = generateComponentId('section');
      const newContId = generateComponentId('container');
      const newHeadId = generateComponentId('heading');
      const newTextId = generateComponentId('text');

      const fallbackSection: VisualComponent = {
        id: newSecId,
        type: 'section',
        name: `Secção: ${prompt.slice(0, 24)}`,
        content: {},
        styles: {
          desktop: {
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '24px',
            paddingRight: '24px',
            backgroundColor: 'transparent',
          },
        },
        parentId: null,
        children: [
          {
            id: newContId,
            type: 'container',
            name: 'Container',
            content: {},
            styles: {
              desktop: {
                maxWidth: '1200px',
                marginLeft: 'auto',
                marginRight: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                textAlign: 'center',
              },
            },
            parentId: newSecId,
            children: [
              {
                id: newHeadId,
                type: 'heading',
                name: 'Título da Secção',
                content: {
                  text: prompt.length > 5 ? prompt.charAt(0).toUpperCase() + prompt.slice(1) : 'Excelência e Confiança para o Seu Negócio',
                  headingLevel: 'h2',
                },
                styles: {
                  desktop: {
                    fontSize: '36px',
                    fontWeight: '800',
                    textAlign: 'center',
                    color: theme?.textColor || '#ffffff',
                  },
                },
                parentId: newContId,
                children: [],
              },
              {
                id: newTextId,
                type: 'text',
                name: 'Descrição',
                content: {
                  text: 'Criamos soluções inovadoras adaptadas às necessidades específicas da sua empresa, garantindo rapidez, suporte dedicado e resultados mensuráveis.',
                },
                styles: {
                  desktop: {
                    fontSize: '16px',
                    textAlign: 'center',
                    maxWidth: '720px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    color: '#94a3b8',
                  },
                },
                parentId: newContId,
                children: [],
              },
            ],
          },
        ],
      };

      return NextResponse.json({
        success: true,
        component: fallbackSection,
        message: `Secção gerada com sucesso: "${prompt.slice(0, 40)}"`,
      });
    }

    return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 });
  } catch (err: any) {
    console.error('[SurgicalEdit Error]', err);
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
