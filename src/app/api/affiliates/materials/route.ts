import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MarketingMaterial from '@/lib/models/MarketingMaterial';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const platform = searchParams.get('platform');
    const category = searchParams.get('category');
    const affiliateCode = searchParams.get('affiliateCode');

    // Build query
    const query: any = { isActive: true };
    
    if (type) query.type = type;
    if (platform) query.platform = platform;
    if (category) query.category = category;

    const materials = await MarketingMaterial.find(query)
      .sort({ createdAt: -1 });

    // Replace placeholders in content with affiliate code
    const materialsWithLinks = materials.map(material => {
      let content = material.content;
      if (affiliateCode) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wehosthere.com';
        const affiliateLink = `${baseUrl}/ref/${affiliateCode}`;
        content = content.replace(/\[AFFILIATE_LINK\]/g, affiliateLink);
        content = content.replace(/\[AFFILIATE_CODE\]/g, affiliateCode);
      }
      return {
        ...material.toObject(),
        content,
      };
    });

    return NextResponse.json({ 
      success: true, 
      materials: materialsWithLinks
    });

  } catch (error) {
    console.error('Erro ao buscar materiais de marketing:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar materiais de marketing' 
    }, { status: 500 });
  }
}
