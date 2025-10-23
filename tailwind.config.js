/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'swiggy': ['Futura', 'Futura PT', 'Century Gothic', 'Trebuchet MS', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'system-ui', 'sans-serif'],
        'serif': ['Playfair Display', 'serif'],
      },
          fontSize: {
            'xs': ['0.75rem', { lineHeight: '1rem' }],
            'sm': ['0.875rem', { lineHeight: '1.25rem' }],
            'base': ['1rem', { lineHeight: '1.5rem' }],
            'lg': ['1.125rem', { lineHeight: '1.75rem' }],
            'xl': ['1.25rem', { lineHeight: '1.75rem' }],
            '2xl': ['1.5rem', { lineHeight: '2rem' }],
            '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
            '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
            '5xl': ['3rem', { lineHeight: '1' }],
            '6xl': ['3.75rem', { lineHeight: '1' }],
            '7xl': ['4.5rem', { lineHeight: '1' }],
            '8xl': ['6rem', { lineHeight: '1' }],
            '9xl': ['8rem', { lineHeight: '1' }],
            // Professional typography scale
            'heading-1': ['2.5rem', { lineHeight: '1.1', fontWeight: '700' }],
            'heading-2': ['2rem', { lineHeight: '1.2', fontWeight: '600' }],
            'heading-3': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
            'heading-4': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
            'body-large': ['1.125rem', { lineHeight: '1.7', fontWeight: '400' }],
            'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
            'body-small': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
            'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
            'price': ['1.25rem', { lineHeight: '1.3', fontWeight: '700' }],
            'price-large': ['1.5rem', { lineHeight: '1.2', fontWeight: '700' }],
          },
          colors: {
            primary: {
              50: '#fff7ed',
              100: '#ffedd5',
              200: '#fed7aa',
              300: '#fdba74',
              400: '#fb923c',
              500: '#FC8019', // Swiggy Pumpkin Orange
              600: '#e6740f',
              700: '#d06b0e',
              800: '#b85f0c',
              900: '#a0540a',
              950: '#8a4908',
            },
            swiggy: {
              orange: '#FC8019',
              dark: '#121B33',
              text: '#1C1C1C',
            },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Main secondary
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Main accent
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        }
      }
    },
  },
  plugins: [],
}

