/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)'
        },
        primary: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
          light: 'var(--primary-light)'
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          dark: 'var(--secondary-dark)'
        },
        accent: {
          DEFAULT: 'var(--accent)',
          dark: 'var(--accent-dark)'
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)'
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '1.75rem',
        pill: '999px'
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.08)',
        soft: '0 4px 20px rgba(15, 23, 42, 0.06)',
        button: '0 2px 8px rgba(15, 23, 42, 0.1)'
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Space Grotesk', 'Manrope', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
