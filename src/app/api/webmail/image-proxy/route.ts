import { NextRequest, NextResponse } from 'next/server';
import { safeFetchPublicUrl } from '@/lib/ssrfGuard';

export const maxDuration = 20;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

// GET /api/webmail/image-proxy?url=...
// Carrega imagens externas de e-mails (http/https, assinaturas, logos) pelo servidor,
// com proteção contra SSRF (DNS rebinding e redirects internos).
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url') || '';

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return NextResponse.json({ error: 'Protocolo não suportado' }, { status: 400 });
  }

  try {
    const res = await safeFetchPublicUrl(target.toString(), {
      timeoutMs: 15000,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WEHOSTHERE-Webmail-ImageProxy/1.0)',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!res.ok || !res.body) {
      return new NextResponse(null, { status: 502 });
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'O recurso não é uma imagem' }, { status: 415 });
    }

    const declaredLength = parseInt(res.headers.get('content-length') || '0', 10);
    if (declaredLength && declaredLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Imagem demasiado grande' }, { status: 413 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Imagem demasiado grande' }, { status: 413 });
    }

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
      'X-Content-Type-Options': 'nosniff',
    };
    // SVG pode conter scripts: forçar sandbox
    if (contentType.includes('svg')) {
      headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
    }

    return new NextResponse(buffer, { status: 200, headers });
  } catch (err) {
    console.warn('[Webmail ImageProxy] Falha ao carregar imagem:', target.toString(), err);
    return new NextResponse(null, { status: 502 });
  }
}
