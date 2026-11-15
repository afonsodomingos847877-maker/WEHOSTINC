// ============================================================================
// 🔄 WEHOSTHERE VISUAL BUILDER - PARSER BIDIRECIONAL (HTML -> JSON Document)
// ============================================================================

import { 
  SiteDocument, 
  PageDocument, 
  VisualComponent, 
  GlobalSiteTheme,
  ComponentType
} from './types';

// Gerador de ID estável único
function genId(prefix: string = 'comp'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

// Tema Padrão
export const DEFAULT_SITE_THEME: GlobalSiteTheme = {
  primaryColor: '#2563eb',
  secondaryColor: '#4f46e5',
  accentColor: '#06b6d4',
  backgroundColor: '#020617',
  textColor: '#f8fafc',
  fontFamily: 'Plus Jakarta Sans',
  headingFontFamily: 'Plus Jakarta Sans',
  borderRadius: 'rounded-2xl',
  mode: 'dark'
};

// ─── Extrair Atributos de Tags HTML ──────────────────────────────────────────
function extractAttr(tagStr: string, attrName: string): string | undefined {
  const regex = new RegExp(`${attrName}=["']([^"']*)["']`, 'i');
  const match = tagStr.match(regex);
  return match ? match[1] : undefined;
}

// ─── Parser Inteligente de HTML para SiteDocument ────────────────────────────
export function parseHtmlToSiteDocument(
  html: string, 
  siteId: string = 'site_default',
  siteTitle: string = 'Meu Website'
): SiteDocument {
  if (!html || typeof html !== 'string') {
    return createEmptySiteDocument(siteId, siteTitle);
  }

  // 1. Extrair Título e Metadados do <head>
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const parsedTitle = titleMatch ? titleMatch[1].trim() : siteTitle;

  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const metaDescription = descMatch ? descMatch[1].trim() : '';

  // 2. Extrair Tema (detectar modo dark/light e cores principais)
  const isLight = /class="[^"]*bg-white[^"]*"/i.test(html);
  const theme: GlobalSiteTheme = {
    ...DEFAULT_SITE_THEME,
    backgroundColor: isLight ? '#ffffff' : '#020617',
    textColor: isLight ? '#0f172a' : '#f8fafc',
    mode: isLight ? 'light' : 'dark'
  };

  // 3. Fatiar secções principais do HTML (<header>, <section>, <footer>)
  const rootComponents: VisualComponent[] = [];

  // Regex para capturar tags de bloco de topo dentro do body
  const sectionRegex = /(<(?:header|section|footer)[^>]*>)([\s\S]*?)(<\/(?:header|section|footer)>)/gi;
  let match;
  let sectionIndex = 0;

  while ((match = sectionRegex.exec(html)) !== null) {
    sectionIndex++;
    const openTag = match[1];
    const innerContent = match[2];
    const tagName = openTag.match(/<(header|section|footer)/i)?.[1]?.toLowerCase() || 'section';

    const sectionId = extractAttr(openTag, 'id') || genId(tagName);
    const sectionClass = extractAttr(openTag, 'class') || '';

    // Nome amigável para a árvore do editor
    let friendlyName = `Secção ${sectionIndex}`;
    if (tagName === 'header') friendlyName = 'Cabeçalho / Navegação';
    else if (tagName === 'footer') friendlyName = 'Rodapé';
    else if (sectionId === 'inicio' || sectionId === 'hero') friendlyName = 'Banner Hero';
    else if (sectionId === 'solucoes' || sectionId === 'servicos') friendlyName = 'Serviços & Soluções';
    else if (sectionId === 'precos' || sectionId === 'pricing') friendlyName = 'Tabela de Preços';
    else if (sectionId === 'vantagens') friendlyName = 'Vantagens & Benefícios';
    else if (sectionId === 'contacto') friendlyName = 'Contacto';

    // Parse de sub-elementos comuns dentro da secção
    const sectionChildren: VisualComponent[] = [];

    // Detectar Headings (h1, h2, h3)
    const headingMatches = Array.from(innerContent.matchAll(/<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi));
    for (const hm of headingMatches) {
      const hLevel = hm[1].toLowerCase() as 'h1' | 'h2' | 'h3';
      const cleanText = hm[2].replace(/<[^>]*>/g, '').trim();
      if (cleanText) {
        sectionChildren.push({
          id: genId('head'),
          type: 'heading',
          name: cleanText.length > 25 ? cleanText.substring(0, 25) + '...' : cleanText,
          content: {
            text: cleanText,
            headingLevel: hLevel
          },
          styles: { desktop: { textAlign: 'center' } },
          parentId: sectionId,
          children: []
        });
      }
    }

    // Detectar Parágrafos (<p>)
    const pMatches = Array.from(innerContent.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
    for (const pm of pMatches) {
      const cleanText = pm[1].replace(/<[^>]*>/g, '').trim();
      if (cleanText && cleanText.length > 5) {
        sectionChildren.push({
          id: genId('txt'),
          type: 'text',
          name: cleanText.length > 25 ? cleanText.substring(0, 25) + '...' : cleanText,
          content: {
            text: cleanText
          },
          styles: { desktop: { textAlign: 'center' } },
          parentId: sectionId,
          children: []
        });
      }
    }

    // Detectar Botões de Ação (<a class="...btn..." ou links estilizados)
    const btnMatches = Array.from(innerContent.matchAll(/<a([^>]*)href=["']([^"']*)["']([^>]*)>([\s\S]*?)<\/a>/gi));
    for (const bm of btnMatches) {
      const href = bm[2];
      const cleanText = bm[4].replace(/<[^>]*>/g, '').trim();
      if (cleanText && !cleanText.includes('©') && cleanText.length < 50) {
        sectionChildren.push({
          id: genId('btn'),
          type: 'button',
          name: `Botão: ${cleanText}`,
          content: {
            text: cleanText,
            href: href
          },
          styles: { desktop: {} },
          parentId: sectionId,
          children: []
        });
      }
    }

    // Se identificarmos tabela de preços
    const isPricingSection = sectionId === 'precos' || /preco|pricing/i.test(innerContent);
    const compType: ComponentType = isPricingSection ? 'pricing-table' : (tagName === 'header' ? 'navbar' : (tagName === 'footer' ? 'footer' : 'section'));

    rootComponents.push({
      id: sectionId,
      type: compType,
      name: friendlyName,
      content: {
        htmlRaw: innerContent
      },
      styles: {
        desktop: {
          customClasses: sectionClass
        }
      },
      parentId: null,
      children: sectionChildren
    });
  }

  // Detectar Botão Flutuante de WhatsApp
  const waMatch = html.match(/href=["'](https:\/\/wa\.me\/[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
  if (waMatch) {
    rootComponents.push({
      id: 'wehost-floating-whatsapp',
      type: 'whatsapp-button',
      name: 'Botão Flutuante WhatsApp',
      content: {
        href: waMatch[1],
        text: 'Falar no WhatsApp'
      },
      styles: { desktop: {} },
      parentId: null,
      children: []
    });
  }

  // Se nenhuma secção estruturada foi encontrada, encapsula em secção genérica
  if (rootComponents.length === 0) {
    rootComponents.push({
      id: 'comp_main_content',
      type: 'section',
      name: 'Conteúdo Principal',
      content: {
        htmlRaw: html
      },
      styles: { desktop: {} },
      parentId: null,
      children: []
    });
  }

  const pageDoc: PageDocument = {
    id: 'page_home',
    title: parsedTitle,
    slug: '/',
    seo: {
      metaTitle: parsedTitle,
      metaDescription: metaDescription
    },
    rootComponents: rootComponents
  };

  return {
    version: 1,
    schemaVersion: '1.0',
    site: {
      id: siteId,
      name: parsedTitle,
      slug: siteId.replace('site_', ''),
      theme: theme
    },
    activePageId: 'page_home',
    pages: [pageDoc],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      builderVersion: '2.0.0-visual'
    }
  };
}

// ─── Criador de Documento em Branco com Template Mínimo ───────────────────────
export function createEmptySiteDocument(
  siteId: string = 'site_default', 
  title: string = 'Meu Novo Site'
): SiteDocument {
  const heroSection: VisualComponent = {
    id: 'comp_hero',
    type: 'section',
    name: 'Banner Principal (Hero)',
    content: {},
    styles: {
      desktop: {
        paddingTop: '5rem',
        paddingBottom: '5rem',
        textAlign: 'center'
      }
    },
    parentId: null,
    children: [
      {
        id: 'comp_hero_badge',
        type: 'badge',
        name: 'Badge de Destaque',
        content: { badgeText: '⚡ Nova Geração 2026' },
        styles: { desktop: {} },
        parentId: 'comp_hero',
        children: []
      },
      {
        id: 'comp_hero_title',
        type: 'heading',
        name: 'Título Principal',
        content: { headingLevel: 'h1', text: 'Transforme a sua Presença Digital' },
        styles: { desktop: { fontSize: '3rem', fontWeight: '800' } },
        parentId: 'comp_hero',
        children: []
      },
      {
        id: 'comp_hero_desc',
        type: 'text',
        name: 'Subtítulo',
        content: { text: 'Criamos websites de alto impacto, rápidos, responsivos e preparados para vendas online.' },
        styles: { desktop: { color: '#94a3b8', maxWidth: '42rem', marginLeft: 'auto', marginRight: 'auto' } },
        parentId: 'comp_hero',
        children: []
      },
      {
        id: 'comp_hero_cta',
        type: 'button',
        name: 'Botão Começar',
        content: { text: 'Começar Agora', href: '#contacto' },
        styles: { desktop: { backgroundColor: '#2563eb', color: '#ffffff' } },
        parentId: 'comp_hero',
        children: []
      }
    ]
  };

  return {
    version: 1,
    schemaVersion: '1.0',
    site: {
      id: siteId,
      name: title,
      slug: 'meu-site',
      theme: DEFAULT_SITE_THEME
    },
    activePageId: 'page_home',
    pages: [
      {
        id: 'page_home',
        title: 'Página Inicial',
        slug: '/',
        seo: { metaTitle: title },
        rootComponents: [heroSection]
      }
    ],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      builderVersion: '2.0.0-visual'
    }
  };
}
