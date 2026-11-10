import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSessionUser, getWebmailSessionEmail } from '@/lib/serverAuth';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';

const ALLOWED_UPLOAD_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

function getCloudinaryCredentials() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Configuração Cloudinary ausente nas variáveis de ambiente.');
  }
  return { cloudName, apiKey, apiSecret };
}

// GET - Retorna assinatura segura para upload direto do navegador para o Cloudinary (evita limite de 4.5MB da Vercel)
export async function GET(req: Request) {
  const wmEmail = getWebmailSessionEmail(req);
  const portalUser = wmEmail ? null : await getSessionUser(req);
  if (!wmEmail && !portalUser) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const strToSign = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

    return NextResponse.json({
      success: true,
      cloudName,
      apiKey,
      timestamp,
      signature,
    });
  } catch (error) {
    console.error('Erro ao gerar assinatura Cloudinary:', error);
    return NextResponse.json({ error: 'Erro ao gerar assinatura de upload' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rl = rateLimit(getRateLimitIdentifier(clientIp, 'upload'), 15, 60000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Muitos uploads. Aguarde um minuto.' }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum ficheiro fornecido' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'O ficheiro excede o limite máximo de 10MB.' }, { status: 400 });
    }

    const mime = (file.type || '').toLowerCase();
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isPdf = mime === 'application/pdf' || ext === 'pdf';
    const isAllowedImage = ALLOWED_UPLOAD_TYPES.has(mime) && mime.startsWith('image/');
    if (!isAllowedImage && !isPdf) {
      return NextResponse.json(
        { error: 'Tipo de ficheiro não permitido. Apenas imagens (JPG, PNG, WebP, GIF) e PDF são aceites.' },
        { status: 400 }
      );
    }

    const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const strToSign = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', timestamp);
    cloudinaryFormData.append('signature', signature);

    const resourceType = isPdf ? 'raw' : 'image';
    // Upload direto na API REST do Cloudinary
    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData
      }
    );

    if (!cloudinaryRes.ok) {
      const errorText = await cloudinaryRes.text();
      console.error('Erro no upload para Cloudinary:', errorText);
      return NextResponse.json({ error: 'Falha no upload para Cloudinary' }, { status: 500 });
    }

    const data = await cloudinaryRes.json();
    const fileType = file.type.startsWith('image/')
      ? 'image'
      : file.type === 'application/pdf' || file.name.endsWith('.pdf')
      ? 'pdf'
      : 'file';

    return NextResponse.json({
      success: true,
      url: data.secure_url || data.url,
      name: file.name,
      type: fileType,
      format: data.format,
      bytes: data.bytes
    });
  } catch (error) {
    console.error('Erro na API de upload:', error);
    return NextResponse.json({ error: 'Erro interno ao processar o upload do ficheiro' }, { status: 500 });
  }
}
