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
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'json';
    
    // Construir filtro
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (channel) {
      filter.channel = channel;
    }
    
    if (startDate || endDate) {
      filter.sentAt = {};
      if (startDate) {
        filter.sentAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.sentAt.$lte = new Date(endDate);
      }
    }
    
    const logs = await CommunicationLog.find(filter)
      .sort({ sentAt: -1 })
      .limit(1000)
      .lean();
    
    if (format === 'csv') {
      // Converter para CSV
      const headers = ['ID', 'Email', 'Nome', 'Assunto', 'Status', 'Canal', 'Data Envio', 'Erro', 'Retry Count'];
      const rows = logs.map((log: any) => [
        log._id?.toString() || '',
        log.recipientEmail,
        log.recipientName,
        log.subject?.replace(/,/g, '') || '',
        log.status,
        log.channel,
        log.sentAt,
        log.error?.replace(/,/g, '') || '',
        log.retryCount
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="communication-logs-${Date.now()}.csv"`
        }
      });
    }
    
    // JSON format (default)
    return NextResponse.json({
      success: true,
      logs: logs.map((log: any) => ({
        id: log._id?.toString() || log.id,
        recipientEmail: log.recipientEmail,
        recipientName: log.recipientName,
        subject: log.subject,
        templateId: log.templateId,
        templateName: log.templateName,
        channel: log.channel,
        status: log.status,
        isAutomatic: log.isAutomatic,
        eventType: log.eventType,
        sentAt: log.sentAt,
        error: log.error,
        retryCount: log.retryCount,
        nextRetryAt: log.nextRetryAt
      })),
      filters: { status, channel, startDate, endDate, format },
      total: logs.length
    });
  } catch (err: any) {
    console.error('[Communication Export] Erro:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}
