import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..'),
  allowedDevOrigins: ['*.trycloudflare.com'],
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.wearbubble.com.br' }],
        destination: 'https://wearbubble.com.br/:path*',
        permanent: false,
      },
    ];
  },
  async headers() {
    const noStaleHtml = [
      {
        key: 'Cache-Control',
        value: 'no-store, no-cache, max-age=0, must-revalidate',
      },
    ];

    return ['/', '/conta', '/login', '/cadastro', '/carrinho', '/verificar-email'].map(
      (source) => ({ source, headers: noStaleHtml }),
    );
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
