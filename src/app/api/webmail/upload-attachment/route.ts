import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getWebmailSessionEmail } from '@/lib/serverAuth';

export async function POST(request: NextRequest) {
  const wmEmail = getWebmailSessionEmail(request);
  const portalUser = wmEmail ? null : await getSessionUser(request);
  if (!wmEmail && !portalUser) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum ficheiro fornecido' }, { status: 400 });
    }

    // Validação de tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'O ficheiro é muito grande! O tamanho máximo permitido é 10MB.' },
        { status: 400 }
      );
    }

    // Validação de tipo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Tipo de ficheiro não permitido. Formatos aceitos: PDF, Imagens, Word, Excel, Texto, ZIP.' },
        { status: 400 }
      );
    }

    // Converter arquivo para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Retornar o Buffer codificado em base64 para transporte seguro
    const base64Content = buffer.toString('base64');

    return NextResponse.json({
      success: true,
      name: file.name,
      size: file.size,
      type: file.type,
      content: base64Content
    });
  } catch (error) {
    console.error('[Webmail Upload Attachment] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o anexo. Tente novamente.' },
      { status: 500 }
    );
  }
}
