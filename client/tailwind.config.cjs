/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Rebound UI Design System - Dynamic Theme via CSS Variables
        background: 'var(--background)',
        surface: 'var(--surface)',
        border: 'var(--border)',

        // Text colors
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)'
        },

        // Primary Brand (Buttons)
        primary: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
          light: 'var(--primary-light)'
        },

        // Secondary Brand (Cancel/Back)
        secondary: {
          DEFAULT: 'var(--secondary)',
          dark: 'var(--secondary-dark)'
        },

        // Accent Brand (Rose)
        accent: {
          DEFAULT: 'var(--accent)',
          dark: 'var(--accent-dark)'
        },

        // Status colors
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)'
      },

      borderRadius: {
        '2xl': '1.5rem',    // 24px
        '3xl': '1.75rem',   // 28px
        pill: '999px'
      },

      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.08)',
        soft: '0 4px 20px rgba(15, 23, 42, 0.06)',
        button: '0 2px 8px rgba(15, 23, 42, 0.1)'
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
};
