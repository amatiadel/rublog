import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#00ADB5',
        dark: {
          bg: '#000000',
          card: '#393E46',
          border: '#393E46'
        },
        light: '#EEEEEE'
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '75ch'
          }
        }
      }
    }
  },
  plugins: [typography]
};
