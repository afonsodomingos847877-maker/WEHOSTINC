import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const encoder = new TextEncoder();

  // Criar stream SSE
  const stream = new ReadableStream({
    async start(controller) {
      let lastNotificationCount = 0;
      
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Função para verificar novas notificações
      const checkNotifications = async () => {
        try {
          const AdminNotification = (await import('@/lib/models/AdminNotification')).default;
          const { connectDB } = await import('@/lib/mongodb');
          await connectDB();
          
          const notifications = await AdminNotification.find({})
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();
          
          const currentCount = notifications.length;
          
          if (currentCount !== lastNotificationCount) {
            const newNotifications = notifications.map((n: any) => ({
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
            }));
            
            sendEvent({
              type: 'notifications',
              data: newNotifications,
              count: currentCount
            });
            
            lastNotificationCount = currentCount;
          }
        } catch (error) {
          console.error('[SSE] Erro ao verificar notificações:', error);
        }
      };

      // Enviar heartbeat para manter conexão viva
      const sendHeartbeat = () => {
        sendEvent({ type: 'heartbeat', timestamp: Date.now() });
      };

      // Verificar notificações imediatamente
      await checkNotifications();
      sendHeartbeat();

      // Intervalo para verificar notificações (a cada 5 segundos)
      const notificationInterval = setInterval(checkNotifications, 30000);
      
      // Intervalo para heartbeat (a cada 30 segundos)
      const heartbeatInterval = setInterval(sendHeartbeat, 30000);

      // Limpar quando cliente desconectar
      req.signal.addEventListener('abort', () => {
        clearInterval(notificationInterval);
        clearInterval(heartbeatInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}
