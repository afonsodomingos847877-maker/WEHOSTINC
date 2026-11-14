import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import User from '@/lib/models/User';
import { dispatchMessage } from '@/lib/notifications';

async function generateUniqueAffiliateCode(userName?: string): Promise<string> {
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  if (userName) {
    const cleanName = userName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 8);

    if (cleanName.length >= 2) {
      const randomNum = Math.floor(100 + Math.random() * 900);
      code = `${cleanName}${randomNum}`;
      const existing = await Affiliate.findOne({ affiliateCode: code });
      if (!existing) return code;
    }
  }

  while (attempts < maxAttempts) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await Affiliate.findOne({ affiliateCode: code });
    if (!existing) return code;
    attempts++;
  }

  return Date.now().toString().slice(-6);
}

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();

    const [users, affiliates] = await Promise.all([
      User.find({})
        .select('id name email phone createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      Affiliate.find({})
        .select('userId affiliateCode status')
        .lean(),
    ]);

    const affiliateByUserId = new Map<string, { affiliateCode: string; status: string }>();
    for (const aff of affiliates as any[]) {
      if (aff.userId) {
        affiliateByUserId.set(String(aff.userId).toLowerCase(), {
          affiliateCode: aff.affiliateCode,
          status: aff.status,
        });
      }
    }

    const formattedUsers = (users as any[]).map((u) => {
      const affById = u.id ? affiliateByUserId.get(String(u.id).toLowerCase()) : undefined;
      const affByEmail = u.email ? affiliateByUserId.get(String(u.email).toLowerCase()) : undefined;
      const aff = affById || affByEmail;

      return {
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        phone: u.phone || '',
        isAffiliate: !!aff,
        affiliateStatus: aff?.status || null,
        affiliateCode: aff?.affiliateCode || null,
      };
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    console.error('[Admin Affiliate Users List Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar utilizadores.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const customCode = typeof body.customCode === 'string'
      ? body.customCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const sendWelcomeEmail = body.sendWelcomeEmail !== false;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email válido é obrigatório.' },
        { status: 400 }
      );
    }

    // Procurar utilizador pelo email
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhum utilizador encontrado com este email. O utilizador precisa ter uma conta registada.',
        },
        { status: 404 }
      );
    }

    // Verificar se já existe registo de afiliado
    const existingAffiliate = await Affiliate.findOne({
      $or: [{ userId: user.id }, { userId: user.email.toLowerCase() }],
    });

    if (existingAffiliate) {
      if (existingAffiliate.status === 'active') {
        return NextResponse.json({
          success: true,
          alreadyActive: true,
          affiliate: existingAffiliate,
          message: `${user.name || user.email} já é um afiliado ativo (Código: ${existingAffiliate.affiliateCode}).`,
        });
      }

      existingAffiliate.status = 'active';
      if (phone) {
        existingAffiliate.payoutMethod = 'mpesa';
        existingAffiliate.payoutDetails = {
          ...existingAffiliate.payoutDetails,
          mpesaPhone: phone,
        };
      }
      await existingAffiliate.save();

      return NextResponse.json({
        success: true,
        reactivated: true,
        affiliate: existingAffiliate,
        message: `Conta de afiliado de ${user.name || user.email} ativada com sucesso!`,
      });
    }

    // Validar código personalizado se fornecido
    let affiliateCode = '';
    if (customCode) {
      const codeExists = await Affiliate.findOne({ affiliateCode: customCode });
      if (codeExists) {
        return NextResponse.json(
          { success: false, error: `O código "${customCode}" já está em uso por outro afiliado.` },
          { status: 409 }
        );
      }
      affiliateCode = customCode;
    } else {
      affiliateCode = await generateUniqueAffiliateCode(user.name);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wehosthere.com';
    const affiliateLink = `${baseUrl}/ref/${affiliateCode}`;

    const affiliateData: Record<string, any> = {
      userId: user.id,
      affiliateCode,
      affiliateLink,
      status: 'active',
      totalEarnings: 0,
      availableBalance: 0,
      totalClicks: 0,
      totalConversions: 0,
      conversionRate: 0,
    };

    if (phone) {
      affiliateData.payoutMethod = 'mpesa';
      affiliateData.payoutDetails = { mpesaPhone: phone };
    }

    const affiliate = await Affiliate.create(affiliateData);

    // Enviar email de boas-vindas se solicitado
    if (sendWelcomeEmail) {
      try {
        await dispatchMessage({
          recipientEmail: user.email,
          recipientName: user.name,
          templateId: 'affiliate-welcome',
          variables: {
            nome_afiliado: user.name || user.email,
            link_afiliado: affiliateLink,
            codigo_afiliado: affiliateCode,
          },
          isAutomatic: true,
          eventType: 'affiliate_registered',
        });
      } catch (mailErr) {
        console.warn('[Admin Affiliate Create] Falha não impeditiva ao enviar email:', mailErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        affiliate,
        message: `${user.name || user.email} agora é um afiliado ativo (Código: ${affiliateCode})!`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Admin Affiliate Create Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar afiliado.' },
      { status: 500 }
    );
  }
}
