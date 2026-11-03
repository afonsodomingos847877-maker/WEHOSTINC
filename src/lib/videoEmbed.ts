/**
 * Utilitário para converter URLs de vídeo comuns (YouTube, Vimeo, Google Drive, MP4)
 * em URLs seguras e compatíveis de incorporação (embed) para iframes e players HTML5.
 */
export function formatVideoEmbedUrl(rawUrl?: string): {
  type: 'iframe' | 'video' | 'empty';
  embedUrl: string;
  isYouTube: boolean;
  originalWatchUrl?: string;
} {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { type: 'empty', embedUrl: '', isYouTube: false };
  }

  const trimmed = rawUrl.trim();

  // 1. Arquivos diretos de vídeo (MP4, WebM, OGG, MOV)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)) {
    return { type: 'video', embedUrl: trimmed, isYouTube: false, originalWatchUrl: trimmed };
  }

  // 2. YouTube (watch?v=, youtu.be/, shorts/, embed/)
  // Exemplos:
  // - https://www.youtube.com/watch?v=sO4te2QKs4U
  // - https://youtu.be/sO4te2QKs4U
  // - https://www.youtube.com/shorts/sO4te2QKs4U
  // - https://youtube.com/embed/sO4te2QKs4U
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    // Usar youtube-nocookie.com para contornar bloqueios de cookies de terceiros no Chrome e Safari
    // playsinline=1 garante reprodução nativa sem forçar fullscreen em mobile
    return {
      type: 'iframe',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`,
      isYouTube: true,
      originalWatchUrl: `https://www.youtube.com/watch?v=${videoId}`
    };
  }

  // 3. Vimeo
  // Exemplo: https://vimeo.com/123456789
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      type: 'iframe',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?title=0&byline=0&portrait=0`,
      isYouTube: false,
      originalWatchUrl: `https://vimeo.com/${vimeoMatch[3]}`
    };
  }

  // 4. Google Drive
  // Exemplo: https://drive.google.com/file/d/1a2b3c.../view
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    return {
      type: 'iframe',
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      isYouTube: false,
      originalWatchUrl: `https://drive.google.com/file/d/${driveMatch[1]}/view`
    };
  }

  // Fallback: Se já for um iframe embed ou outra URL válida
  const isYt = trimmed.includes('youtube.com') || trimmed.includes('youtu.be');
  return {
    type: 'iframe',
    embedUrl: trimmed,
    isYouTube: isYt,
    originalWatchUrl: trimmed
  };
}
