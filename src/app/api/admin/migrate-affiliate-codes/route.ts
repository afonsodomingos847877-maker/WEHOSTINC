import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    console.log('Iniciando migração de códigos de afiliados...');
    await connectDB();

    // Buscar todos os afiliados
    const affiliates = await Affiliate.find({});
    console.log(`Encontrados ${affiliates.length} afiliados para migrar`);

    let updated = 0;
    let skipped = 0;
    const results: any[] = [];

    for (const affiliate of affiliates) {
      // Buscar usuário para obter o nome
      const user = await User.findOne({ id: affiliate.userId });
      
      if (!user) {
        console.log(`Usuário não encontrado para afiliado ${affiliate.userId}, pulando...`);
        skipped++;
        results.push({ userId: affiliate.userId, status: 'skipped', reason: 'user_not_found' });
        continue;
      }

      // Verificar se já está no novo formato (tem letras)
      if (/[a-zA-Z]/.test(affiliate.affiliateCode)) {
        console.log(`Código ${affiliate.affiliateCode} já está no novo formato, pulando...`);
        skipped++;
        results.push({ userId: affiliate.userId, status: 'skipped', reason: 'already_new_format', oldCode: affiliate.affiliateCode });
        continue;
      }

      // Gerar novo código baseado no nome
      const cleanName = user.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 8);
      
      const randomNum = Math.floor(100 + Math.random() * 900);
      const newCode = `${cleanName}${randomNum}`;

      // Verificar se o novo código já existe
      const existing = await Affiliate.findOne({ affiliateCode: newCode });
      if (existing) {
        console.log(`Código ${newCode} já existe, usando timestamp...`);
        const fallbackCode = `${cleanName}${Date.now().toString().slice(-4)}`;
        affiliate.affiliateCode = fallbackCode;
        affiliate.affiliateLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://wehosthere.com'}/ref/${fallbackCode}`;
      } else {
        affiliate.affiliateCode = newCode;
        affiliate.affiliateLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://wehosthere.com'}/ref/${newCode}`;
      }

      await affiliate.save();
      console.log(`Atualizado: ${affiliate.userId} -> ${affiliate.affiliateCode}`);
      updated++;
      results.push({ 
        userId: affiliate.userId, 
        status: 'updated', 
        oldCode: affiliate.affiliateCode, 
        newCode: affiliate.affiliateCode,
        userName: user.name
      });
    }

    console.log(`\nMigração concluída:`);
    console.log(`- Atualizados: ${updated}`);
    console.log(`- Pulados: ${skipped}`);
    console.log(`- Total: ${affiliates.length}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Migração concluída com sucesso',
      stats: {
        total: affiliates.length,
        updated,
        skipped
      },
      results
    });

  } catch (error) {
    console.error('Erro durante migração:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro durante migração' 
    }, { status: 500 });
  }
}
