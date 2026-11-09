import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { connectDB } from '@/lib/mongodb';
import RevistaStory from '@/models/RevistaStory';
import RevistaDownload from '@/models/RevistaDownload';
import { INITIAL_STORIES } from '@/lib/revistaData';

export const dynamic = 'force-dynamic';

// Helper para quebrar texto em linhas com limite de caracteres
function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [];
  const clean = text.replace(/[\r\n]+/g, ' ').trim();
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Limpar caracteres não suportados por WinAnsi (fontes padrão Helvetica)
function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/[•]/g, '-')
    .replace(/[…]/g, '...')
    .replace(/[^\x00-\xFF]/g, ' '); // Mantém Latin-1 / acentuação portuguesa válida
}

export async function GET(req: Request) {
  try {
    let stories: any[] = [];

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();

        // Rastreamento de download do PDF para o painel de administração
        try {
          const ip =
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            req.headers.get('x-real-ip') ||
            'unknown';
          const userAgent = req.headers.get('user-agent') || 'unknown';
          const referrer = req.headers.get('referer') || '';

          RevistaDownload.create({
            ip,
            userAgent,
            referrer,
            edition: 'Edição 01',
            downloadedAt: new Date(),
          }).catch((logErr: any) =>
            console.warn('[RevistaDownload] Erro ao gravar log assíncrono:', logErr)
          );
        } catch (trackErr) {
          console.warn('[RevistaDownload] Erro ao rastrear download:', trackErr);
        }

        stories = await RevistaStory.find({ status: 'published' })
          .sort({ publishedAt: -1, createdAt: -1 })
          .lean();
      } catch (err) {
        console.warn('[Revista PDF] Erro ao buscar histórias no MongoDB:', err);
      }
    }

    if (!stories || stories.length === 0) {
      stories = INITIAL_STORIES.filter(s => s.status === 'published' || !s.status);
      if (stories.length === 0) stories = INITIAL_STORIES;
    }

    // Criar o documento PDF
    const pdfDoc = await PDFDocument.create();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Cores da marca WEHOSTHERE
    const purpleDeep   = rgb(0.14, 0.0, 0.27);   // #240046
    const purpleMain   = rgb(0.35, 0.09, 0.60);  // #5A189A
    const purpleBright = rgb(0.48, 0.17, 0.75);  // #7B2CBF
    const purpleLight  = rgb(0.88, 0.67, 1.0);   // #E0AAFF
    const textDark     = rgb(0.06, 0.09, 0.16);  // #0f172a
    const textMuted    = rgb(0.39, 0.45, 0.55);  // #64748b
    const white        = rgb(1, 1, 1);
    const cardBg       = rgb(0.97, 0.98, 0.99);

    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;
    let pageNumber = 1;

    // Data da edição automática (Mês e Ano em maiúsculas)
    const now = new Date();
    const ptMonthsUpper = [
      'JANEIRO', 'FEVEREIRO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO',
      'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ];
    const latestDate = stories[0]?.publishedAt ? new Date(stories[0].publishedAt) : now;
    const editionMonthYear = `${ptMonthsUpper[latestDate.getMonth()]} ${latestDate.getFullYear()}`;

    // Helper para formatar a data de publicação de cada história (ex: 14 Out 2026)
    const formatStoryDate = (dateVal?: any): string => {
      if (!dateVal) return '';
      try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        const day = String(d.getDate()).padStart(2, '0');
        const ptMonthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${day} ${ptMonthsShort[d.getMonth()]} ${d.getFullYear()}`;
      } catch {
        return '';
      }
    };

    // Helper para rodapé padrão
    const addFooter = (page: any, pNum: number) => {
      page.drawLine({
        start: { x: 40, y: 45 },
        end: { x: PAGE_WIDTH - 40, y: 45 },
        thickness: 0.5,
        color: rgb(0.88, 0.91, 0.94),
      });
      page.drawText(sanitizeText(`codando histórias </> • Revista Digital WEHOSTHERE • ${editionMonthYear} • www.wehosthere.com/revista`), {
        x: 40,
        y: 30,
        size: 7.5,
        font: fontRegular,
        color: textMuted,
      });
      page.drawText(`${pNum}`, {
        x: PAGE_WIDTH - 50,
        y: 30,
        size: 8,
        font: fontBold,
        color: purpleMain,
      });
    };

    // Helper para cabeçalho padrão
    const addHeader = (page: any, titleStr: string) => {
      page.drawRectangle({
        x: 0,
        y: PAGE_HEIGHT - 50,
        width: PAGE_WIDTH,
        height: 50,
        color: purpleMain,
      });
      page.drawText(sanitizeText('codando histórias </>'), {
        x: 40,
        y: PAGE_HEIGHT - 32,
        size: 13,
        font: fontBold,
        color: white,
      });
      page.drawText(sanitizeText(titleStr), {
        x: PAGE_WIDTH - 220,
        y: PAGE_HEIGHT - 31,
        size: 9,
        font: fontBold,
        color: purpleLight,
      });
    };

    // ──────────────────────────────────────────────
    // PÁGINA 1: CAPA DA REVISTA
    // ──────────────────────────────────────────────
    const coverPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    // Fundo da capa
    coverPage.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      color: purpleDeep,
    });

    // Faixa superior com destaque
    coverPage.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 120,
      width: PAGE_WIDTH,
      height: 120,
      color: purpleMain,
    });

    // Badge Edição
    coverPage.drawRectangle({
      x: 40,
      y: PAGE_HEIGHT - 65,
      width: 78,
      height: 24,
      color: white,
    });
    coverPage.drawText('EDICAO 01', {
      x: 47,
      y: PAGE_HEIGHT - 58,
      size: 11,
      font: fontBold,
      color: purpleMain,
    });

    coverPage.drawText(`REVISTA DIGITAL OFICIAL • WEHOSTHERE • ${editionMonthYear}`, {
      x: 132,
      y: PAGE_HEIGHT - 56,
      size: 9.5,
      font: fontBold,
      color: purpleLight,
    });

    // Título da Revista: "codando histórias </>"
    const titleBase = 'codando histórias ';
    const titleTag = '</>';
    const titleBaseWidth = fontBold.widthOfTextAtSize(titleBase, 38);

    coverPage.drawText(titleBase, {
      x: 40,
      y: PAGE_HEIGHT - 190,
      size: 38,
      font: fontBold,
      color: white,
    });

    coverPage.drawText(titleTag, {
      x: 40 + titleBaseWidth,
      y: PAGE_HEIGHT - 190,
      size: 38,
      font: fontBold,
      color: purpleLight,
    });

    coverPage.drawText('A REVISTA TECH DE MOCAMBIQUE', {
      x: 42,
      y: PAGE_HEIGHT - 215,
      size: 12,
      font: fontBold,
      color: purpleLight,
    });

    coverPage.drawRectangle({
      x: 40,
      y: PAGE_HEIGHT - 228,
      width: PAGE_WIDTH - 80,
      height: 2,
      color: purpleBright,
    });

    // História Principal de Capa
    const topStory = stories[0] || {
      title: 'Construindo o Futuro da Tecnologia em Mocambique',
      author: { name: 'WEHOSTHERE' },
      excerpt: 'Historias reais de programadores, startups, design e inovacao digital.',
    };

    coverPage.drawRectangle({
      x: 40,
      y: 200,
      width: PAGE_WIDTH - 80,
      height: 380,
      color: rgb(0.20, 0.05, 0.35),
    });

    coverPage.drawText('HISTORIA PRINCIPAL DE CAPA', {
      x: 65,
      y: 545,
      size: 10,
      font: fontBold,
      color: purpleLight,
    });

    const coverTitleLines = wrapText(sanitizeText(topStory.title || ''), 35);
    coverTitleLines.slice(0, 3).forEach((line, i) => {
      coverPage.drawText(line, {
        x: 65,
        y: 505 - i * 26,
        size: 20,
        font: fontBold,
        color: white,
      });
    });

    const coverExcerptLines = wrapText(sanitizeText(topStory.excerpt || ''), 50);
    coverExcerptLines.slice(0, 3).forEach((line, i) => {
      coverPage.drawText(line, {
        x: 65,
        y: 420 - i * 16,
        size: 11,
        font: fontRegular,
        color: rgb(0.9, 0.9, 0.95),
      });
    });

    coverPage.drawText(sanitizeText(`Por: ${topStory.author?.name || 'WEHOSTHERE'}`), {
      x: 65,
      y: 360,
      size: 11,
      font: fontBold,
      color: purpleLight,
    });

    // Sumário rápido de capa
    coverPage.drawText(sanitizeText(`NESTA EDICAO (${stories.length} HISTORIAS REAIS):`), {
      x: 65,
      y: 315,
      size: 9,
      font: fontBold,
      color: rgb(0.8, 0.8, 0.9),
    });

    stories.slice(1, 5).forEach((s, idx) => {
      const line = wrapText(sanitizeText(s.title || ''), 45)[0] || '';
      coverPage.drawText(`- ${line}`, {
        x: 65,
        y: 288 - idx * 20,
        size: 9.5,
        font: fontRegular,
        color: white,
      });
    });

    // Rodapé Capa
    coverPage.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: 55,
      color: rgb(0.08, 0.0, 0.16),
    });

    coverPage.drawText(`WEHOSTHERE • www.wehosthere.com/revista • Maputo, Mocambique • ${editionMonthYear}`, {
      x: 75,
      y: 23,
      size: 9,
      font: fontBold,
      color: rgb(0.7, 0.7, 0.8),
    });

    // ──────────────────────────────────────────────
    // PÁGINA 2+: ÍNDICE / SUMÁRIO DINÂMICO
    // (Cria quantas páginas forem necessárias para caber TODAS as histórias)
    // ──────────────────────────────────────────────
    let indexPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pageNumber++;
    addHeader(indexPage, 'INDICE GERAL DA EDICAO');
    addFooter(indexPage, pageNumber);

    indexPage.drawText('INDICE DE MATERIAS E ARTIGOS', {
      x: 40,
      y: PAGE_HEIGHT - 85,
      size: 15,
      font: fontBold,
      color: purpleMain,
    });

    indexPage.drawText(sanitizeText(`Total de ${stories.length} materias publicadas nesta edicao • ${editionMonthYear}`), {
      x: 40,
      y: PAGE_HEIGHT - 102,
      size: 9.5,
      font: fontRegular,
      color: textMuted,
    });

    let currentY = PAGE_HEIGHT - 135;

    stories.forEach((st, idx) => {
      // Se não couber nesta página do índice, criar uma nova página de índice
      if (currentY < 90) {
        indexPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        pageNumber++;
        addHeader(indexPage, 'INDICE GERAL DA EDICAO (CONT.)');
        addFooter(indexPage, pageNumber);
        currentY = PAGE_HEIGHT - 90;
      }

      indexPage.drawRectangle({
        x: 40,
        y: currentY - 55,
        width: PAGE_WIDTH - 80,
        height: 50,
        color: cardBg,
      });

      indexPage.drawRectangle({
        x: 40,
        y: currentY - 55,
        width: 4,
        height: 50,
        color: purpleBright,
      });

      // Número e categoria
      const catText = `${idx + 1}. ${(st.category || 'CODIGO').toUpperCase()}`;
      indexPage.drawText(sanitizeText(catText), {
        x: 52,
        y: currentY - 18,
        size: 8.5,
        font: fontBold,
        color: purpleMain,
      });

      // Título
      const titleLine = wrapText(sanitizeText(st.title || ''), 58)[0] || '';
      indexPage.drawText(titleLine, {
        x: 52,
        y: currentY - 32,
        size: 10.5,
        font: fontBold,
        color: textDark,
      });

      // Autor, data e link
      const authorName = st.author?.name || 'WEHOSTHERE';
      const stDate = formatStoryDate(st.publishedAt || st.createdAt);
      const stDatePart = stDate ? `  •  ${stDate}` : '';
      indexPage.drawText(sanitizeText(`Por: ${authorName}${stDatePart}  •  wehosthere.com/revista/${st.slug}`), {
        x: 52,
        y: currentY - 47,
        size: 7.5,
        font: fontRegular,
        color: textMuted,
      });

      currentY -= 62;
    });

    // ──────────────────────────────────────────────
    // PÁGINAS DE ARTIGOS: CADA HISTÓRIA NA ÍNTEGRA
    // (Gera páginas completas com texto, quebras automáticas e formatação)
    // ──────────────────────────────────────────────
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      let storyPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageNumber++;
      addHeader(storyPage, `MATERIA #${i + 1} • ${(story.category || 'TECH').toUpperCase()}`);
      addFooter(storyPage, pageNumber);

      let sY = PAGE_HEIGHT - 85;

      // Categoria badge
      storyPage.drawRectangle({
        x: 40,
        y: sY - 14,
        width: 75,
        height: 18,
        color: rgb(0.95, 0.90, 1.0),
      });
      storyPage.drawText(sanitizeText((story.category || 'CODIGO').toUpperCase()), {
        x: 46,
        y: sY - 9,
        size: 8,
        font: fontBold,
        color: purpleMain,
      });

      sY -= 30;

      // Título da história
      const titleLines = wrapText(sanitizeText(story.title || ''), 45);
      for (const line of titleLines) {
        storyPage.drawText(line, {
          x: 40,
          y: sY,
          size: 18,
          font: fontBold,
          color: textDark,
        });
        sY -= 24;
      }

      sY -= 4;

      // Autor & Metadados com data automática de publicação
      const storyDateStr = formatStoryDate(story.publishedAt || story.createdAt);
      const datePart = storyDateStr ? `   •   Publicado: ${storyDateStr}` : '';
      const authorText = `Autor: ${story.author?.name || 'WEHOSTHERE'}${datePart}   •   Leitura: ${story.readingTime || 4} min`;
      storyPage.drawText(sanitizeText(authorText), {
        x: 40,
        y: sY,
        size: 8.5,
        font: fontBold,
        color: purpleBright,
      });

      sY -= 12;

      storyPage.drawText(sanitizeText(`Artigo completo online: www.wehosthere.com/revista/${story.slug}`), {
        x: 40,
        y: sY,
        size: 7.5,
        font: fontRegular,
        color: textMuted,
      });

      sY -= 12;

      // Linha divisória
      storyPage.drawLine({
        start: { x: 40, y: sY },
        end: { x: PAGE_WIDTH - 40, y: sY },
        thickness: 1,
        color: rgb(0.90, 0.93, 0.96),
      });

      sY -= 18;

      // Caixa de Resumo / Excerpt
      if (story.excerpt) {
        const excerptLines = wrapText(sanitizeText(story.excerpt), 65);
        const boxHeight = excerptLines.length * 15 + 16;

        storyPage.drawRectangle({
          x: 40,
          y: sY - boxHeight,
          width: PAGE_WIDTH - 80,
          height: boxHeight,
          color: cardBg,
        });
        storyPage.drawRectangle({
          x: 40,
          y: sY - boxHeight,
          width: 4,
          height: boxHeight,
          color: purpleMain,
        });

        excerptLines.forEach((el, eIdx) => {
          storyPage.drawText(el, {
            x: 52,
            y: sY - 14 - eIdx * 15,
            size: 9.5,
            font: fontItalic,
            color: rgb(0.2, 0.25, 0.35),
          });
        });

        sY -= (boxHeight + 20);
      }

      // Conteúdo do Artigo
      const rawContent = story.content || story.excerpt || '';
      const paragraphs = rawContent.split(/\n+/);

      for (const para of paragraphs) {
        const trimmed = para.trim();
        if (!trimmed) continue;

        const isHeading = trimmed.startsWith('#');
        const isQuote = trimmed.startsWith('>');
        const cleanPara = trimmed.replace(/^[#>\s*•-]+/, '').trim();

        const fontSize = isHeading ? 12 : 9.5;
        const font = isHeading ? fontBold : fontRegular;
        const color = isHeading ? purpleMain : (isQuote ? purpleDeep : textDark);
        const charsPerLine = isHeading ? 50 : 68;
        const lineHeight = isHeading ? 18 : 14;

        const lines = wrapText(sanitizeText(cleanPara), charsPerLine);

        // Se o parágrafo ultrapassar a página, criar nova página de continuação
        if (sY - (lines.length * lineHeight) < 60) {
          storyPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          pageNumber++;
          addHeader(storyPage, `${sanitizeText(story.title || '').slice(0, 35)}... (CONT.)`);
          addFooter(storyPage, pageNumber);
          sY = PAGE_HEIGHT - 80;
        }

        if (isHeading) sY -= 8;

        for (const line of lines) {
          storyPage.drawText(line, {
            x: isQuote ? 52 : 40,
            y: sY,
            size: fontSize,
            font: font,
            color: color,
          });
          sY -= lineHeight;
        }

        sY -= (isHeading ? 10 : 8);
      }
    }

    // ──────────────────────────────────────────────
    // PÁGINA FINAL: CONTRACAPA & CONVITE WEHOSTHERE
    // ──────────────────────────────────────────────
    const backCoverPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    // Fundo escuro imersivo
    backCoverPage.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      color: purpleDeep,
    });

    // Faixa superior decorativa
    backCoverPage.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 130,
      width: PAGE_WIDTH,
      height: 130,
      color: rgb(0.10, 0.0, 0.20),
    });

    // Badge superior
    backCoverPage.drawRectangle({
      x: 40,
      y: PAGE_HEIGHT - 70,
      width: 140,
      height: 24,
      color: purpleMain,
    });
    backCoverPage.drawText('ECOSSISTEMA DIGITAL', {
      x: 48,
      y: PAGE_HEIGHT - 63,
      size: 9.5,
      font: fontBold,
      color: white,
    });

    backCoverPage.drawText(sanitizeText(`codando histórias </> • Edição ${editionMonthYear}`), {
      x: 195,
      y: PAGE_HEIGHT - 61,
      size: 9.5,
      font: fontBold,
      color: purpleLight,
    });

    // Título Principal da Contracapa
    backCoverPage.drawText(sanitizeText('O Futuro da Tua Ideia Comeca Aqui.'), {
      x: 40,
      y: PAGE_HEIGHT - 175,
      size: 26,
      font: fontBold,
      color: white,
    });

    backCoverPage.drawText(
      sanitizeText('A plataforma completa de hospedagem, dominios e IA para Mocambique e o Mundo.'),
      {
        x: 40,
        y: PAGE_HEIGHT - 200,
        size: 10.5,
        font: fontRegular,
        color: rgb(0.85, 0.85, 0.95),
      }
    );

    // CARD DE DESTAQUE COM A URL DO SITE (GRANDE E DESTACADO)
    backCoverPage.drawRectangle({
      x: 40,
      y: PAGE_HEIGHT - 315,
      width: PAGE_WIDTH - 80,
      height: 95,
      color: rgb(0.18, 0.04, 0.32),
    });
    backCoverPage.drawRectangle({
      x: 40,
      y: PAGE_HEIGHT - 315,
      width: 6,
      height: 95,
      color: purpleBright,
    });

    backCoverPage.drawText('VISITE O NOSSO SITE OFICIAL:', {
      x: 60,
      y: PAGE_HEIGHT - 245,
      size: 9.5,
      font: fontBold,
      color: purpleLight,
    });

    // URL Gigante e Clara
    backCoverPage.drawText('https://wehosthere.com', {
      x: 60,
      y: PAGE_HEIGHT - 275,
      size: 24,
      font: fontBold,
      color: white,
    });

    backCoverPage.drawText(
      sanitizeText('Cria o teu site com IA, hospeda os teus projectos e le a revista online.'),
      {
        x: 60,
        y: PAGE_HEIGHT - 298,
        size: 9.5,
        font: fontRegular,
        color: rgb(0.82, 0.84, 0.92),
      }
    );

    // 3 CARDS DE SERVIÇOS & OPORTUNIDADES
    const promoCards = [
      {
        tag: 'CONSTRUTOR DE SITES IA',
        title: 'Cria o Teu Site em Menos de 2 Minutos',
        desc: 'Usa a nossa Inteligencia Artificial para gerar landing pages e sites completos sem precisar programar.',
        link: 'wehosthere.com/builder',
      },
      {
        tag: 'HOSPEDAGEM SSD NVME & DOMINIOS .MZ',
        title: 'Velocidade Extrema e Pagamentos Locais',
        desc: 'Servidores velozes, SSL gratis, suporte local e pagamentos faceis com M-Pesa e e-Mola.',
        link: 'wehosthere.com',
      },
      {
        tag: 'QUERES APARECER NA PROXIMA EDICAO?',
        title: 'Conta a Tua Historia na Revista',
        desc: 'Es programador, designer ou criador? Partilha os teus projectos, desafios e licoes com a comunidade.',
        link: 'wehosthere.com/revista/submeter',
      },
    ];

    let cY = PAGE_HEIGHT - 345;
    promoCards.forEach((card) => {
      backCoverPage.drawRectangle({
        x: 40,
        y: cY - 82,
        width: PAGE_WIDTH - 80,
        height: 75,
        color: rgb(0.13, 0.02, 0.23),
      });

      backCoverPage.drawText(sanitizeText(card.tag), {
        x: 55,
        y: cY - 22,
        size: 8,
        font: fontBold,
        color: purpleLight,
      });

      backCoverPage.drawText(sanitizeText(card.title), {
        x: 55,
        y: cY - 37,
        size: 11,
        font: fontBold,
        color: white,
      });

      const descLines = wrapText(sanitizeText(card.desc), 68);
      descLines.slice(0, 2).forEach((dl, dIdx) => {
        backCoverPage.drawText(dl, {
          x: 55,
          y: cY - 52 - dIdx * 12,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.78, 0.8, 0.88),
        });
      });

      backCoverPage.drawText(sanitizeText(`Link directo: ${card.link}`), {
        x: PAGE_WIDTH - 250,
        y: cY - 22,
        size: 8,
        font: fontBold,
        color: rgb(0.9, 0.8, 1.0),
      });

      cY -= 90;
    });

    // RODAPÉ FINAL DA CONTRACAPA
    backCoverPage.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: 75,
      color: rgb(0.06, 0.0, 0.12),
    });

    backCoverPage.drawText('WEHOSTHERE • TECNOLOGIA E HOSPEDAGEM PARA QUEM CRIA', {
      x: 40,
      y: 48,
      size: 9.5,
      font: fontBold,
      color: white,
    });

    backCoverPage.drawText(
      sanitizeText('Website Oficial: https://wehosthere.com  •  Maputo, Mocambique  •  Todos os direitos reservados'),
      {
        x: 40,
        y: 32,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.75, 0.78, 0.85),
      }
    );

    backCoverPage.drawText(sanitizeText(`Revista Codando Historias </> • ${editionMonthYear}`), {
      x: 40,
      y: 18,
      size: 7.5,
      font: fontBold,
      color: purpleLight,
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Codando-Historias-Edicao-01.pdf"',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error: any) {
    console.error('[Revista Download PDF] Erro:', error);
    return NextResponse.json({ error: 'Erro ao gerar PDF da revista' }, { status: 500 });
  }
}
