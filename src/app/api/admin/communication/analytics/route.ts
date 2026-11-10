import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';

export async function GET(req: Request) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const CommunicationLog = (await import('@/lib/models/CommunicationLog')).default;
    
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Construir filtro de data
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.sentAt = {};
      if (startDate) {
        dateFilter.sentAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.sentAt.$lte = new Date(endDate);
      }
    }
    
    // Estatísticas gerais
    const total = await CommunicationLog.countDocuments(dateFilter);
    const sent = await CommunicationLog.countDocuments({ ...dateFilter, status: 'sent' });
    const failed = await CommunicationLog.countDocuments({ ...dateFilter, status: 'failed' });
    const pending = await CommunicationLog.countDocuments({ ...dateFilter, status: 'pending' });
    const retrying = await CommunicationLog.countDocuments({ ...dateFilter, status: 'retrying' });
    
    // Estatísticas por canal
    const emailStats = await CommunicationLog.countDocuments({ ...dateFilter, channel: 'email' });
    const whatsappStats = await CommunicationLog.countDocuments({ ...dateFilter, channel: 'whatsapp' });
    const smsStats = await CommunicationLog.countDocuments({ ...dateFilter, channel: 'sms' });
    
    // Estatísticas por tipo de evento
    const eventStats = await CommunicationLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Estatísticas de retry
    const retryStats = await CommunicationLog.aggregate([
      { $match: { ...dateFilter, retryCount: { $gt: 0 } } },
      { $group: { 
        _id: null, 
        totalRetries: { $sum: '$retryCount' },
        avgRetries: { $avg: '$retryCount' }
      }}
    ]);
    
    // Taxas de sucesso
    const successRateNum = total > 0 ? (sent / total) * 100 : 0;
    const failureRateNum = total > 0 ? (failed / total) * 100 : 0;
    
    // Tendência temporal (últimos 7 dias)
    const trendData = await CommunicationLog.aggregate([
      { $match: { 
        ...dateFilter,
        sentAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }},
      { $group: {
        _id: {
          year: { $year: '$sentAt' },
          month: { $month: '$sentAt' },
          day: { $dayOfMonth: '$sentAt' }
        },
        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          total,
          sent,
          failed,
          pending,
          retrying,
          successRate: successRateNum,
          failureRate: failureRateNum
        },
        byChannel: {
          email: emailStats,
          whatsapp: whatsappStats,
          sms: smsStats
        },
        byEventType: eventStats.map((stat: any) => ({
          eventType: stat._id || 'unknown',
          count: stat.count
        })),
        retryStats: retryStats[0] || {
          totalRetries: 0,
          avgRetries: 0
        },
        trend: trendData.map((trend: any) => ({
          date: `${trend._id.year}-${trend._id.month}-${trend._id.day}`,
          sent: trend.sent,
          failed: trend.failed
        }))
      },
      filters: { startDate, endDate }
    });
  } catch (err: any) {
    console.error('[Communication Analytics] Erro:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}
