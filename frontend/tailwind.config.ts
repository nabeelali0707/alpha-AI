import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#171f33',
        surfaceGlass: 'rgba(23, 31, 51, 0.6)',
        primary: '#00ff41',
        accent: '#0a84ff',
        danger: '#ff3131',
      },
      boxShadow: {
        glow: '0 16px 60px rgba(0, 255, 65, 0.18)',
      },
      backgroundImage: {
        'panel-glow': 'radial-gradient(circle at top left, rgba(0,255,65,0.14), transparent 40%), radial-gradient(circle at bottom right, rgba(10,132,255,0.14), transparent 35%)',
      },
    },
  },
  plugins: [],
};

export default config;
