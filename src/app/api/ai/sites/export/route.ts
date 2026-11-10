import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AiSiteModel from '@/lib/models/AiSite';
import JSZip from 'jszip';
import { getSessionUser, isAdminRole } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug')?.toLowerCase().trim();
    const id = searchParams.get('id');
    const format = searchParams.get('format')?.toLowerCase() || 'zip'; // 'zip' | 'html'

    if (!slug && !id) {
      return NextResponse.json(
        { error: 'Parâmetro slug ou id é obrigatório' },
        { status: 400 }
      );
    }

    await connectDB();

    const site = await AiSiteModel.findOne({
      $or: [
        ...(slug ? [{ slug }, { subdomain: slug }, { customDomain: slug }] : []),
        ...(id ? [{ id }] : []),
      ],
    }).lean();

    if (!site || !site.htmlContent) {
      return NextResponse.json(
        { error: 'Website não encontrado ou sem código HTML disponível' },
        { status: 404 }
      );
    }

    if ((site as any).status !== 'published') {
      const sessionUser = await getSessionUser(request);
      if (!sessionUser || (!isAdminRole(sessionUser.role) && (site as any).userEmail !== sessionUser.email)) {
        return NextResponse.json({ error: 'Não autorizado a exportar este rascunho' }, { status: 403 });
      }
    }

    const projectTitle = site.title || 'Meu Website';
    const projectSlug = site.slug || 'website';
    const htmlContent = site.htmlContent;

    // Se o formato requisitado for apenas HTML (.html)
    if (format === 'html') {
      return new Response(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${projectSlug}.html"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // Gerar pacote ZIP completo com JSZip
    const zip = new JSZip();

    // Extrair blocos de CSS de tags <style> caso existam
    let extractedCss = '';
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let match;
    while ((match = styleRegex.exec(htmlContent)) !== null) {
      if (match[1]?.trim()) {
        extractedCss += match[1].trim() + '\n\n';
      }
    }

    if (extractedCss) {
      zip.folder('css')?.file('style.css', extractedCss);
    }

    // Adicionar o ficheiro index.html principal
    zip.file('index.html', htmlContent);

    // Adicionar README.md com instruções
    const exportDate = new Date().toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const readmeContent = `# ${projectTitle}
Código-fonte exportado da plataforma WEHOSTHERE Studio IA (https://www.wehosthere.com)
Data de Exportação: ${exportDate}

## 📁 Estrutura de Ficheiros:
- \`index.html\`: Código-fonte completo do website pronto para execução em qualquer navegador.
${extractedCss ? '- `css/style.css`: Folha de estilos CSS extraída para personalização avançada.\n' : ''}
## 🚀 Como Usar e Testar Localmente:
1. Extraia o ficheiro ZIP numa pasta no seu computador.
2. Dê duplo clique em \`index.html\` para abrir diretamente no Chrome, Edge, Safari ou Firefox.
3. Não é necessário servidor local ou Node.js para visualizar o site.

## 🌐 Publicar Online com Domínio Próprio (.mz / .com):
Para hospedar o seu website com SSL gratuito, servidores de alta velocidade SSD NVMe e domínio personalizado, visite:
👉 https://www.wehosthere.com
`;

    zip.file('README.md', readmeContent);

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${projectSlug}-wehosthere.zip"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('[Export API Error]:', error);
    return NextResponse.json(
      { error: 'Erro interno ao exportar código do website', details: error?.message },
      { status: 500 }
    );
  }
}
