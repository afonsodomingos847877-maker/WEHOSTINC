import crypto from 'crypto';

/**
 * Faz upload de uma imagem em formato Data URL (base64) para o Cloudinary
 * Retorna o URL público seguro (https://res.cloudinary.com/...)
 */
export async function uploadDataUrlToCloudinary(dataUrl: string, folder = 'webmail_signatures'): Promise<string | null> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return null;

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dnvnftvky';
    const apiKey = process.env.CLOUDINARY_API_KEY || '259851568455899';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '3hRsXzUVd3pnwn9IKQWN7UAeJLc';

    const [header, base64Data] = dataUrl.split(',');
    if (!base64Data) return null;

    const mimeMatch = header.match(/data:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const ext = mime.split('/')[1] || 'png';

    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: mime });

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

    const formData = new FormData();
    formData.append('file', blob, `sig_${Date.now()}.${ext}`);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      console.warn('[Cloudinary] Upload failed with status', res.status);
      return null;
    }

    const data = await res.json();
    return data.secure_url || data.url || null;
  } catch (err) {
    console.error('[Cloudinary] Error uploading data URL:', err);
    return null;
  }
}

/**
 * Substitui todas as imagens base64 inline (data:image/...) no corpo do email por URLs públicas HTTPS do Cloudinary.
 * Isso garante que clientes de e-mail (Gmail, Outlook, Apple Mail) renderizem a imagem imediatamente
 * sem recortar a mensagem com "[Message clipped]" e sem bloquear a imagem.
 */
export async function replaceDataImagesWithCloudinary(html: string): Promise<string> {
  if (!html || !html.includes('data:image/')) return html;

  const dataUriRegex = /src=["'](data:image\/[a-zA-Z0-9+.-]+;base64,[^"']+)["']/g;
  let match;
  const matches: string[] = [];

  while ((match = dataUriRegex.exec(html)) !== null) {
    if (match[1]) matches.push(match[1]);
  }

  let updatedHtml = html;
  for (const dataUri of matches) {
    try {
      const publicUrl = await uploadDataUrlToCloudinary(dataUri);
      if (publicUrl) {
        updatedHtml = updatedHtml.replaceAll(dataUri, publicUrl);
      }
    } catch (err) {
      console.warn('[Cloudinary] Failed to replace image data URI:', err);
    }
  }

  return updatedHtml;
}

