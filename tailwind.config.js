/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sangeetha: {
          red: '#C62127',
          redDark: '#9E151A',
          redLight: '#E53935',
          green: '#06874D',
          greenDark: '#045E35',
          greenLight: '#0CB866',
          gold: '#D4AF37',
          goldLight: '#F3CD68',
          cream: '#FAF8F5',
          dark: '#070F0A',
          darkLighter: '#0B1A12',
          darkCard: '#0A1710',
          darkBorder: '#142E20',
        },
        honey: {
          primary: '#C62127',
          dark: '#9E151A',
          light: '#06874D',
          muted: 'rgba(198, 33, 39, 0.15)',
          pale: '#FFF5F5',
          gold: '#D4AF37',
        },
        teal: {
          primary: '#06874D',
          dark: '#045E35',
          light: '#0CB866',
          muted: 'rgba(6, 135, 77, 0.15)',
        },
        midnight: {
          DEFAULT: '#070F0A',
          lighter: '#0B1A12',
          border: '#142E20',
          text: '#8BA595',
        },
        linen: {
          DEFAULT: '#FAF8F5',
          dark: '#ECE8DF',
        },
        coral: {
          DEFAULT: '#C62127',
          dark: '#9E151A',
          muted: 'rgba(198, 33, 39, 0.15)',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Fraunces', 'serif'],
        heading: ['Outfit', 'sans-serif'],
        dashboard: ['Plus Jakarta Sans', 'sans-serif'],
      },
      fontSize: {
        '10': '10px',
        '11': '11px',
        '9': '9px',
      },
      letterSpacing: {
        '04': '0.04em',
        '08': '0.08em',
        '16': '0.16em',
        '24': '0.24em',
      },
      borderRadius: {
        'arch': '12rem',
        '3xl': '1.5rem',
      },
      animation: {
        'spin-slow': 'spinSlow 14s linear infinite',
        'marquee': 'marquee 28s linear infinite',
        'honey-pulse': 'honeyPulse 2s ease-in-out infinite',
        'sangeetha-pulse': 'sangeethaPulse 2s ease-in-out infinite',
      },
      keyframes: {
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        honeyPulse: {
          '0%, 100%': { textShadow: '0 0 0px rgba(198, 33, 39,0)' },
          '50%': { textShadow: '0 0 20px rgba(198, 33, 39,0.5)' },
        },
        sangeethaPulse: {
          '0%, 100%': { textShadow: '0 0 0px rgba(6, 135, 77, 0)' },
          '50%': { textShadow: '0 0 20px rgba(6, 135, 77, 0.6)' },
        },
      },
      boxShadow: {
        'card-dark': '0 4px 24px rgba(7, 15, 10, 0.6)',
        'card-light': '0 4px 24px rgba(7, 15, 10, 0.08)',
        'honey-glow': '0 0 40px rgba(198, 33, 39, 0.3)',
        'gold-glow': '0 0 30px rgba(212, 175, 55, 0.35)',
        'emerald-glow': '0 0 35px rgba(6, 135, 77, 0.35)',
      },
      maxWidth: {
        '8xl': '88rem',
      },
    },
  },
  plugins: [],
};
