/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        civic: {
          bg: '#0B1020',
          surface: '#121A2B',
          card: '#162035',
          cardHover: '#1B2844',
          border: '#223252',
          borderLight: '#2C416A',
          lime: '#C6FF5F',
          'lime-glow': 'rgba(198, 255, 95, 0.25)',
          cyan: '#43D9FF',
          'cyan-glow': 'rgba(67, 217, 255, 0.25)',
          muted: '#8E9EB8',
          text: '#F1F5F9',
        },
        severity: {
          critical: '#FF4D5E',
          high: '#FF9B42',
          medium: '#FFD166',
          low: '#47D18C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-lime': 'glowLime 2s ease-in-out infinite alternate',
        'scan': 'scanLine 2.5s ease-in-out infinite',
      },
      keyframes: {
        glowLime: {
          '0%': { boxShadow: '0 0 5px rgba(198, 255, 95, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(198, 255, 95, 0.7)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}
