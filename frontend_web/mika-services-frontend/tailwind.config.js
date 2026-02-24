/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs principales
        primary: {
          DEFAULT: '#FF6B35',
          dark: '#D94E1F',
          light: '#FF8C61',
        },
        secondary: {
          DEFAULT: '#2E5266',
          dark: '#1A3140',
          light: '#4A7491',
        },
        // Couleurs d'accent et statuts
        success: '#6BBF59',
        warning: '#F4A261',
        danger: '#E63946',
        info: '#17A2B8',
        pending: '#6C757D',
        // Couleurs neutres
        dark: '#2B2D42',
        medium: '#8D99AE',
        light: '#EDF2F4',
        white: '#FFFFFF',
      },
      fontSize: {
        'h1': '32px',
        'h2': '28px',
        'h3': '24px',
        'h4': '20px',
        'body': '16px',
        'small': '14px',
        'tiny': '12px',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
      },
    },
  },
  plugins: [],
}