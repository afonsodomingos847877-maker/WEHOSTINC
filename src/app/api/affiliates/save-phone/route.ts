import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/serverAuth';
import Affiliate from '@/lib/models/Affiliate';
import { invalidateCacheOnChange } from '@/lib/affiliateCache';

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request).catch(() => null);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const digitsOnly = rawPhone.replace(/\D/g, '');

    if (digitsOnly.length < 9) {
      return NextResponse.json(
        { success: false, error: 'Insira um número M-Pesa válido (ex: 841234567).' },
        { status: 400 }
      );
    }

    const affiliate = await Affiliate.findOne({
      $or: [{ userId: sessionUser.id }, { userId: sessionUser.email.toLowerCase() }],
    });

    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'Afiliado não encontrado.' }, { status: 404 });
    }

    // Permitir verificação gratuita apenas se foi selecionado pelo Admin ou já está ativo sem número
    const canSaveWithoutFee =
      (affiliate.addedByAdmin || affiliate.status === 'active') &&
      !affiliate.payoutDetails?.mpesaPhone;

    if (!canSaveWithoutFee && !affiliate.addedByAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Para alterar um número já verificado, utilize a verificação padrão.',
        },
        { status: 403 }
      );
    }

    affiliate.payoutMethod = 'mpesa';
    affiliate.payoutDetails = {
      ...affiliate.payoutDetails,
      mpesaPhone: rawPhone,
    };
    affiliate.status = 'active';
    affiliate.updatedAt = new Date().toISOString();
    await affiliate.save();

    invalidateCacheOnChange('affiliate', affiliate.userId);

    return NextResponse.json({
      success: true,
      affiliate,
      message: 'Número M-Pesa verificado e guardado com sucesso (sem taxa)!',
    });
  } catch (error) {
    console.error('[Affiliate Save-Phone Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao guardar número M-Pesa.' },
      { status: 500 }
    );
  }
}
