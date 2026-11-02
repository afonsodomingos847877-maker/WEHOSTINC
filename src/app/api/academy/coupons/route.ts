import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import CouponModel from '@/lib/models/Coupon';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const courseId = searchParams.get('courseId');
    const amount = Number(searchParams.get('amount') || 0);

    // Validation mode
    if (code) {
      const coupon = await CouponModel.findOne({
        code: code.trim().toUpperCase(),
        active: true
      });

      if (!coupon) {
        return NextResponse.json({ valid: false, message: 'Cupom inválido ou inexistente.' });
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json({ valid: false, message: 'Este cupom já expirou.' });
      }

      if (coupon.maxUses && coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ valid: false, message: 'Este cupom atingiu o limite de utilizações.' });
      }

      if (coupon.courseIds && coupon.courseIds.length > 0 && courseId) {
        if (!coupon.courseIds.includes(courseId)) {
          return NextResponse.json({ valid: false, message: 'Este cupom não é aplicável a este curso.' });
        }
      }

      let discountAmount = 0;
      if (coupon.discountType === 'percentage') {
        discountAmount = Math.round((amount * coupon.discountValue) / 100);
      } else {
        discountAmount = Math.min(amount, coupon.discountValue);
      }

      const finalAmount = Math.max(0, amount - discountAmount);

      return NextResponse.json({
        valid: true,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        finalAmount,
        message: `Cupom aplicado com sucesso!`
      });
    }

    // List mode for admin
    const coupons = await CouponModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    console.error('[API Coupons GET Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao processar cupom' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, coupon, id } = body;

    if (action === 'create' && coupon) {
      const codeUpper = (coupon.code || '').trim().toUpperCase();
      if (!codeUpper) {
        return NextResponse.json({ success: false, error: 'Código de cupom obrigatório' }, { status: 400 });
      }

      const existing = await CouponModel.findOne({ code: codeUpper });
      if (existing) {
        return NextResponse.json({ success: false, error: 'Já existe um cupom com este código.' }, { status: 400 });
      }

      const newCoupon = new CouponModel({
        id: `CPN_${Date.now().toString().slice(-6)}`,
        code: codeUpper,
        discountType: coupon.discountType || 'percentage',
        discountValue: Number(coupon.discountValue || 0),
        minPurchaseAmount: Number(coupon.minPurchaseAmount || 0),
        courseIds: Array.isArray(coupon.courseIds) ? coupon.courseIds : [],
        maxUses: Number(coupon.maxUses || 0),
        usedCount: 0,
        expiresAt: coupon.expiresAt || undefined,
        active: coupon.active !== false,
        createdAt: new Date().toISOString()
      });

      await newCoupon.save();
      return NextResponse.json({ success: true, coupon: newCoupon });
    }

    if (action === 'delete' && id) {
      await CouponModel.deleteOne({ id });
      return NextResponse.json({ success: true });
    }

    if (action === 'increment_use' && id) {
      await CouponModel.updateOne({ id }, { $inc: { usedCount: 1 } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('[API Coupons POST Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao guardar cupom' }, { status: 500 });
  }
}

