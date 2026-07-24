import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bubble Fitness Wear - Moda fitness feminina',
  description: 'Moda fitness feminina que une qualidade, conforto e design autentico.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Oswald:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
