import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 20;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

// Bloquear hosts internos/privados para evitar SSRF
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (h === '0.0.0.0' || h === '::1' || h === '[::1]') return true;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [parseInt(ipv4[1], 10), parseInt(ipv4[2], 10)];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  if (h.startsWith('[') && (h.includes('fc') || h.includes('fd') || h.includes('fe80'))) return true;
  return false;
}

// GET /api/webmail/image-proxy?url=...
// Carrega imagens externas de e-mails (http/https, assinaturas, logos) pelo servidor,
// evitando bloqueios de conteúdo misto (http), CSP e proteção anti-hotlink.
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
  if (isBlockedHost(target.hostname)) {
    return NextResponse.json({ error: 'Host não permitido' }, { status: 403 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WEHOSTHERE-Webmail-ImageProxy/1.0)',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

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
