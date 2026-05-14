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
        // Dashboard tokens (CSS vars — switch auto light/dark)
        db: {
          'bg-base': 'var(--db-bg-base)',
          'bg-surface': 'var(--db-bg-surface)',
          'bg-elevated': 'var(--db-bg-surface-elevated)',
          'text-primary': 'var(--db-text-primary)',
          'text-muted': 'var(--db-text-muted)',
          'text-faint': 'var(--db-text-faint)',
          'border-subtle': 'var(--db-border-subtle)',
          'border-default': 'var(--db-border-default)',
          'border-strong': 'var(--db-border-strong)',
          'accent': 'var(--db-accent)',
          'accent-muted': 'var(--db-accent-muted)',
          'success-text': 'var(--db-success-text)',
          'success-bg': 'var(--db-success-bg)',
          'success-border': 'var(--db-success-border)',
          'warning-text': 'var(--db-warning-text)',
          'warning-bg': 'var(--db-warning-bg)',
          'warning-border': 'var(--db-warning-border)',
          'danger-text': 'var(--db-danger-text)',
          'danger-bg': 'var(--db-danger-bg)',
          'danger-border': 'var(--db-danger-border)',
          'info-text': 'var(--db-info-text)',
          'info-bg': 'var(--db-info-bg)',
          'info-border': 'var(--db-info-border)',
        },
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