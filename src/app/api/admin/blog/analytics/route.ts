import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';

export async function GET(req: Request) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const BlogPost = (await import('@/lib/models/BlogPost')).default;
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    // Calcular data limite
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    
    // Buscar todos os posts publicados
    const posts = await BlogPost.find({
      status: 'published',
      publishedAt: { $gte: dateLimit }
    }).select('title slug category views clicks publishedAt').lean();
    
    // Calcular analytics
    const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
    const totalClicks = posts.reduce((sum, post) => sum + (post.clicks || 0), 0);
    const totalPosts = posts.length;
    const averageViews = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;
    
    // Top posts
    const topPosts = posts
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10)
      .map(post => ({
        id: post._id?.toString() || post.id,
        title: post.title,
        views: post.views || 0,
        clicks: post.clicks || 0,
        category: post.category
      }));
    
    // Views por categoria
    const categoryMap = new Map();
    posts.forEach(post => {
      const category = post.category || 'outros';
      categoryMap.set(category, (categoryMap.get(category) || 0) + (post.views || 0));
    });
    
    const viewsByCategory = Array.from(categoryMap.entries()).map(([category, views]) => ({
      category,
      views
    }));
    
    // Views ao longo do tempo (agrupado por dia)
    const timeMap = new Map();
    posts.forEach(post => {
      const date = new Date(post.publishedAt).toISOString().split('T')[0];
      timeMap.set(date, {
        date,
        views: (timeMap.get(date)?.views || 0) + (post.views || 0),
        clicks: (timeMap.get(date)?.clicks || 0) + (post.clicks || 0)
      });
    });
    
    const viewsOverTime = Array.from(timeMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return NextResponse.json({
      success: true,
      analytics: {
        totalViews,
        totalClicks,
        totalPosts,
        averageViews,
        topPosts,
        viewsByCategory,
        viewsOverTime
      }
    });
  } catch (error) {
    console.error('[Blog Analytics] Erro ao buscar analytics:', error);
    return NextResponse.json({ error: 'Erro ao buscar analytics' }, { status: 500 });
  }
}
