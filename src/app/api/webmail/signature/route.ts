import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { EmailSignature } from '@/models/EmailSignature';
import { uploadDataUrlToCloudinary } from '@/lib/cloudinaryUpload';

// GET - Get signature for an email address
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    const signature = await EmailSignature.findOne({ email: email.toLowerCase().trim() });
    return NextResponse.json({
      success: true,
      signature: signature || null
    });
  } catch (error: any) {
    console.error('[Signature GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Falha ao buscar assinatura' }, { status: 500 });
  }
}

// POST - Save or update signature
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      email,
      signatureHtml,
      isEnabled = true,
      fullName,
      jobTitle,
      companyName,
      phone,
      website,
      logoUrl,
      signatureImage,
      signatureType = 'image'
    } = body;

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    // Se a imagem for base64 (data:image/...), enviar para o Cloudinary para que clientes de e-mail (Gmail, Outlook) renderizem perfeitamente
    let finalSignatureImage = signatureImage || '';
    if (finalSignatureImage && finalSignatureImage.startsWith('data:image/')) {
      const cdnUrl = await uploadDataUrlToCloudinary(finalSignatureImage);
      if (cdnUrl) {
        finalSignatureImage = cdnUrl;
      }
    }

    const updatedSignature = await EmailSignature.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      {
        email: email.toLowerCase().trim(),
        signatureHtml: signatureHtml || '',
        isEnabled,
        fullName,
        jobTitle,
        companyName,
        phone,
        website,
        logoUrl,
        signatureImage: finalSignatureImage,
        signatureType: signatureType || 'image',
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      signature: updatedSignature,
      message: 'Assinatura salva com sucesso!'
    });
  } catch (error: any) {
    console.error('[Signature POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Falha ao salvar assinatura' }, { status: 500 });
  }
}
