import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14191B', // fond, charbon chaud — pas un noir pur
        paper: '#F2EDE4', // surfaces claires, parchemin
        indigo: '#2E3A6B', // accent primaire, teinture indigo
        ochre: '#C98A2E', // accent secondaire, chaleur
        jade: '#4F8B6E', // marqueur "vérifié"
        muted: '#8A8378', // texte secondaire chaud
      },
      fontFamily: {
        // next/font/google nécessite fonts.googleapis.com, indisponible dans
        // ce bac à sable (même contrainte que Prisma) — piles système en
        // attendant un hébergement local des fichiers de police réels.
        display: ['Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
        body: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['SF Mono', 'Cascadia Code', 'Roboto Mono', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
