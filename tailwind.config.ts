import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        harbor: {
          50: '#e8eef5',
          100: '#c5d4e8',
          200: '#9fb8d9',
          300: '#789cca',
          400: '#5b87bf',
          500: '#3e72b4',
          600: '#3664a2',
          700: '#2c5189',
          800: '#1e3a6e',
          900: '#162d55',
          950: '#0d1b33',
        },
        teal: {
          50: '#e0f7f5',
          100: '#b3ece6',
          200: '#80e0d6',
          300: '#4dd4c6',
          400: '#26caba',
          500: '#00C1AE',
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
          500: '#FFC107',
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
        display: ['Atkinson Hyperlegible', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'stagger-1': 'fade-in-up 0.5s ease-out 0.05s both',
        'stagger-2': 'fade-in-up 0.5s ease-out 0.1s both',
        'stagger-3': 'fade-in-up 0.5s ease-out 0.15s both',
        'stagger-4': 'fade-in-up 0.5s ease-out 0.2s both',
        'stagger-5': 'fade-in-up 0.5s ease-out 0.25s both',
        'stagger-6': 'fade-in-up 0.5s ease-out 0.3s both',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'count-up': 'count-up 0.8s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-8px) rotate(1deg)' },
          '66%': { transform: 'translateY(-4px) rotate(-1deg)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 193, 174, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 193, 174, 0.4)' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow-teal': '0 0 20px rgba(0, 193, 174, 0.3)',
        'glow-mly': '0 0 20px rgba(255, 193, 7, 0.3)',
        'glow-harbor': '0 0 20px rgba(30, 58, 110, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, var(--color-teal) 0%, transparent 50%), radial-gradient(at 80% 80%, var(--color-mly) 0%, transparent 50%)',
      },
    },
  },
  plugins: [],
};

export default config;
