import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Instante do build: base da primeira renderização da campanha de frete
  // (lib/use-free-shipping-promo.ts), igual no servidor e no cliente.
  env: { NEXT_PUBLIC_BUILD_TIME: String(Date.now()) },
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  allowedDevOrigins: ['*.trycloudflare.com'],
  async headers() {
    const noStaleHtml = [
      {
        key: 'Cache-Control',
        value: 'no-store, no-cache, max-age=0, must-revalidate',
      },
    ];
    // A full Content-Security-Policy needs its own pass (allowlisting the
    // Google Ads conversion script, Next.js chunks, etc.) so it isn't
    // included here — these are the headers that are safe to ship without
    // that dedicated testing.
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ];

    return [
      { source: '/:path*', headers: securityHeaders },
      ...['/', '/conta', '/login', '/cadastro', '/carrinho', '/verificar-email'].map(
        (source) => ({ source, headers: noStaleHtml }),
      ),
    ];
  },
  async redirects() {
    return [
      // Links antigos da promoção e atalho para o "Monte seu look" da home.
      { source: "/produtos", has: [{ type: "query", key: "promo", value: "1" }], destination: "/promocoes", permanent: false },
      { source: "/monte-seu-look", destination: "/#conjunto", permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_API_URL || 'http://localhost:4007/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
