import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bubble: {
          cream: '#F3EDDD',
          cream2: '#EAE2CC',
          ink: '#17130E',
          candy: '#D9CFB4',
          white: '#FAF6E9',
          brown: '#3A2F22',
          success: '#3F6B3F',
          danger: '#A6392B',
          line: 'rgba(23, 19, 14, 0.3)',
        },
      },
      fontFamily: {
        display: ['Archivo Black', 'sans-serif'],
        sans: ['Oswald', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      boxShadow: {
        bubble: '0 10px 30px rgba(23,19,14,.10)',
        drawer: '-10px 0 40px rgba(0,0,0,.2)',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 26s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
