import webpush from 'web-push';

// Chaves VAPID persistentes para WEHOSTHERE Push Notifications via variáveis de ambiente
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || '';
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY?.trim() || '';
export const VAPID_EMAIL = 'mailto:info@wehosthere.com';

// Configura o webpush apenas quando ambas as chaves estiverem configuradas no ambiente
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      VAPID_EMAIL,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
  } catch (err) {
    console.warn('[VAPID] Erro ao inicializar webpush:', err);
  }
}

export default webpush;
