import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
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
