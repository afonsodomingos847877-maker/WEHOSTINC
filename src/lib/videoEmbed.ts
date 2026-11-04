/**
 * Utilitário para converter URLs de vídeo comuns (YouTube, Vimeo, Google Drive, MP4)
 * em URLs seguras e compatíveis de incorporação (embed) para iframes e players HTML5.
 */

// Vídeo educativo padrão (100% livre de restrições de incorporação e compatível mundialmente)
// Substitui automaticamente placeholders antigos de música/VEVO (como Rick Astley dQw4w9WgXcQ)
// que retornam 'X-Frame-Options: SAMEORIGIN' e bloqueiam a visualização nos navegadores (Edge/Chrome).
export const FALLBACK_PUBLIC_EDUCATION_VIDEO_ID = 'kUMe1FH4CHE';

export function formatVideoEmbedUrl(
  rawUrl?: string,
  options?: { useNoCookie?: boolean }
): {
  type: 'iframe' | 'video' | 'empty';
  embedUrl: string;
  alternativeEmbedUrl: string;
  isYouTube: boolean;
  originalWatchUrl?: string;
  videoId?: string;
} {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { type: 'empty', embedUrl: '', alternativeEmbedUrl: '', isYouTube: false };
  }

  const trimmed = rawUrl.trim();

  // 1. Arquivos diretos de vídeo (MP4, WebM, OGG, MOV)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)) {
    return {
      type: 'video',
      embedUrl: trimmed,
      alternativeEmbedUrl: trimmed,
      isYouTube: false,
      originalWatchUrl: trimmed
    };
  }

  // 2. YouTube (watch?v=, youtu.be/, shorts/, embed/, live/, v/)
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    let videoId = ytMatch[1];

    // Se for o ID de placeholder legado com restrição de embedding no YouTube (Rick Astley / VEVO),
    // substituir pelo ID educativo oficial 100% livre de bloqueios
    if (videoId === 'dQw4w9WgXcQ') {
      videoId = FALLBACK_PUBLIC_EDUCATION_VIDEO_ID;
    }

    const standardEmbed = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
    const noCookieEmbed = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;

    const primaryEmbed = options?.useNoCookie ? noCookieEmbed : standardEmbed;
    const secondaryEmbed = options?.useNoCookie ? standardEmbed : noCookieEmbed;

    return {
      type: 'iframe',
      embedUrl: primaryEmbed,
      alternativeEmbedUrl: secondaryEmbed,
      isYouTube: true,
      originalWatchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      videoId
    };
  }

  // 3. Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    const vId = vimeoMatch[3];
    const embed = `https://player.vimeo.com/video/${vId}?title=0&byline=0&portrait=0`;
    return {
      type: 'iframe',
      embedUrl: embed,
      alternativeEmbedUrl: embed,
      isYouTube: false,
      originalWatchUrl: `https://vimeo.com/${vId}`,
      videoId: vId
    };
  }

  // 4. Google Drive
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    const dId = driveMatch[1];
    const embed = `https://drive.google.com/file/d/${dId}/preview`;
    return {
      type: 'iframe',
      embedUrl: embed,
      alternativeEmbedUrl: embed,
      isYouTube: false,
      originalWatchUrl: `https://drive.google.com/file/d/${dId}/view`,
      videoId: dId
    };
  }

  // Fallback: Se já for um iframe embed ou outra URL válida
  const isYt = trimmed.includes('youtube.com') || trimmed.includes('youtu.be');
  return {
    type: 'iframe',
    embedUrl: trimmed,
    alternativeEmbedUrl: trimmed,
    isYouTube: isYt,
    originalWatchUrl: trimmed
  };
}
