/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Permite que builds na Vercel/Render concluam com sucesso mesmo com avisos
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/autodiscover/autodiscover.xml',
        destination: '/api/autodiscover',
      },
      {
        source: '/Autodiscover/Autodiscover.xml',
        destination: '/api/autodiscover',
      },
      {
        source: '/autodiscover/autodiscover.json',
        destination: '/api/autodiscover',
      },
      {
        source: '/Autodiscover/Autodiscover.json',
        destination: '/api/autodiscover',
      },
      {
        source: '/mail/config-v1.1.xml',
        destination: '/api/autoconfig',
      },
      {
        source: '/.well-known/autoconfig/mail/config-v1.1.xml',
        destination: '/api/autoconfig',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            // 🔒 CSP reforçado:
            // - Removido unsafe-eval (não necessário em Next.js produção)
            // - Removido wehostinc.onrender.com (não utilizado)
            // - Adicionado frame-ancestors para prevenir clickjacking
            // - connect-src restrito ao próprio domínio e APIs necessárias
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://accounts.google.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob: https://res.cloudinary.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://api.resend.com https://ipapi.co https://wehosthere.com https://res.cloudinary.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.youtube.com https://*.googlevideo.com",
              "media-src 'self' blob: data: https: https://res.cloudinary.com https://*.googlevideo.com",
              "child-src 'self' blob: https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://*.youtube.com https://*.youtube-nocookie.com https://player.vimeo.com https://*.vimeo.com https://drive.google.com https://*.googlevideo.com https://*.google.com",
              "frame-src 'self' blob: data: https://accounts.google.com https://www.googletagmanager.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://*.youtube.com https://*.youtube-nocookie.com https://player.vimeo.com https://*.vimeo.com https://drive.google.com https://*.googlevideo.com https://*.google.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig

