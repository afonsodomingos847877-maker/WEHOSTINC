/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
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
  async redirects() {
    return [
      // 0. Redirecionamento Canónico 301: Apex para WWW (wehosthere.com -> www.wehosthere.com)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'wehosthere.com',
          },
        ],
        destination: 'https://www.wehosthere.com/:path*',
        permanent: true,
      },
    ];
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
      // Roteamento de Subdomínio para Sites Gerados por IA (*.wehosthere.com)
      {
        source: '/((?!api|dashboard|admin|login|register|checkout|site|_next|favicon.ico).*)',
        has: [
          {
            type: 'host',
            value: '(?<subdomain>(?!(www|api|admin|mail|app|cpanel|webmail|staging|dev)$)[^.]+)\\.wehosthere\\.com',
          },
        ],
        destination: '/site/:subdomain/$1',
      },
      // Roteamento de Subdomínio para Desenvolvimento Local (*.localhost)
      {
        source: '/((?!api|dashboard|admin|login|register|checkout|site|_next|favicon.ico).*)',
        has: [
          {
            type: 'host',
            value: '(?<subdomain>(?!(www|api|admin|mail|app|cpanel|webmail|staging|dev)$)[^.]+)\\.localhost',
          },
        ],
        destination: '/site/:subdomain/$1',
      },
    ];
  },
  async headers() {
    return [
      // CORS para APIs
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'https://wehosthere.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-internal-auth' },
        ],
      },
      // Cabeçalhos de Segurança Globais
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
