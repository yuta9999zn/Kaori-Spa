import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          ivory: '#FAF9F6', cream: '#F4EFEA', gold: '#C9A87C',
          goldhover: '#B5956A', rose: '#D9B8B5', lavender: '#DCD6DD',
          textmain: '#4A443E', textmuted: '#8B837C'
        }
      },
      fontFamily: { serif: ['Cinzel', 'serif'], sans: ['Jost', 'system-ui', 'sans-serif'] },
      boxShadow: { soft: '0 10px 40px -10px rgba(74,68,62,0.08)' }
    }
  },
  plugins: []
};
export default config;
