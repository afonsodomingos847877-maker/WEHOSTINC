import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';

export async function GET(req: Request) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const AdminNotification = (await import('@/lib/models/AdminNotification')).default;
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const read = searchParams.get('read');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '200');
    
    // Construir filtro
    const filter: any = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (read !== null && read !== undefined && read !== '') {
      filter.read = read === 'true';
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }
    
    const notifications = await AdminNotification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    return NextResponse.json({
      success: true,
      notifications: notifications.map((n: any) => ({
        id: n._id?.toString() || n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt,
        link: n.link,
        userEmail: n.userEmail,
        userName: n.userName,
        metadata: n.metadata
      })),
      filters: { type, read, startDate, endDate, limit },
      total: notifications.length
    });
  } catch (err: any) {
    console.error('[Admin Notifications GET] Erro:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const AdminNotification = (await import('@/lib/models/AdminNotification')).default;
    const body = await req.json();

    if (body.action === 'mark_all_read') {
      await AdminNotification.updateMany({}, { read: true });
      const notifications = await AdminNotification.find({})
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();
      
      return NextResponse.json({ 
        success: true, 
        notifications: notifications.map((n: any) => ({
          id: n._id?.toString() || n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read,
          createdAt: n.createdAt,
          link: n.link,
          userEmail: n.userEmail,
          userName: n.userName,
          metadata: n.metadata
        }))
      });
    }

    if (body.action === 'mark_read' && body.id) {
      await AdminNotification.findByIdAndUpdate(body.id, { read: true });
      const notifications = await AdminNotification.find({})
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();
      
      return NextResponse.json({ 
        success: true, 
        notifications: notifications.map((n: any) => ({
          id: n._id?.toString() || n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read,
          createdAt: n.createdAt,
          link: n.link,
          userEmail: n.userEmail,
          userName: n.userName,
          metadata: n.metadata
        }))
      });
    }

    if (body.action === 'clear') {
      await AdminNotification.deleteMany({});
      return NextResponse.json({ success: true, notifications: [] });
    }

    // Adicionar nova notificação
    const newNotif = await AdminNotification.create({
      title: body.title || 'Notificação do Sistema',
      message: body.message || '',
      type: body.type || 'system',
      read: false,
      link: body.link,
      userEmail: body.userEmail,
      userName: body.userName,
      metadata: body.metadata || {}
    });

    const notifications = await AdminNotification.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      success: true,
      notification: {
        id: newNotif._id.toString(),
        title: newNotif.title,
        message: newNotif.message,
        type: newNotif.type,
        read: newNotif.read,
        createdAt: newNotif.createdAt,
        link: newNotif.link,
        userEmail: newNotif.userEmail,
        userName: newNotif.userName,
        metadata: newNotif.metadata
      },
      notifications: notifications.map((n: any) => ({
        id: n._id?.toString() || n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt,
        link: n.link,
        userEmail: n.userEmail,
        userName: n.userName,
        metadata: n.metadata
      }))
    });
  } catch (err: any) {
    console.error('[Admin Notifications POST] Erro:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
