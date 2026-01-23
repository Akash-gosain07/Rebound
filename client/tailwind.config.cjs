/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Rebound UI Design System - New Blue/White Theme
        background: '#EFECE3', // User requested: App main background
        surface: '#FFFFFF',    // User requested: Card background
        border: '#8FABD4',     // User requested: Input/Tab border

        // Text colors
        text: {
          primary: '#000000',    // User requested: Primary text
          secondary: 'rgba(0, 0, 0, 0.65)' // User requested: Secondary text
        },

        // Primary Brand (Buttons)
        primary: {
          DEFAULT: '#4A70A9', // User requested: Primary CTA
          dark: '#3D5E8C',    // User requested: Hover
          light: '#6B8BB9'
        },

        // Secondary Brand (Cancel/Back)
        secondary: {
          DEFAULT: '#8FABD4',
          dark: '#7A9AC3'
        },

        // Accent (Transparent/Ghost)
        accent: {
          DEFAULT: '#4A70A9', // For text/border on ghost buttons
          dark: '#3D5E8C'
        },

        // Status colors
        success: '#16A34A', // User requested: Success
        warning: '#F59E0B', // User requested: Warning
        danger: '#DC2626'   // User requested: Danger
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
