import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // MiLyfe Brand Colors
        harbor: {
          50: '#e8eef5',
          100: '#c5d4e8',
          200: '#9fb8d9',
          300: '#789cca',
          400: '#5b87bf',
          500: '#3e72b4',
          600: '#3664a2',
          700: '#2c5189',
          800: '#1e3a6e',  // Deep Harbor Navy - Primary
          900: '#162d55',
          950: '#0d1b33',
        },
        teal: {
          50: '#e0f7f5',
          100: '#b3ece6',
          200: '#80e0d6',
          300: '#4dd4c6',
          400: '#26caba',
          500: '#00C1AE',  // Living Teal - Community
          600: '#00b09e',
          700: '#009b8b',
          800: '#008779',
          900: '#006558',
        },
        mly: {
          50: '#fff8e1',
          100: '#ffecb3',
          200: '#ffe082',
          300: '#ffd54f',
          400: '#ffca28',
          500: '#FFC107',  // $MLY Gold - Currency
          600: '#ffb300',
          700: '#ffa000',
          800: '#ff8f00',
          900: '#ff6f00',
        },
        surface: {
          light: '#FAFBFC',
          dark: '#0F1419',
        },
      },
      fontFamily: {
        sans: ['Atkinson Hyperlegible', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
