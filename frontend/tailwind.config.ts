import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FBFBF9',
        foreground: '#1F2923',
        haven: {
          50: '#F5F7F5',
          100: '#E6ECE6',
          200: '#CFDBCF',
          300: '#A9BFA9',
          400: '#7E9F7E',
          500: '#5F7A61', // Muted Sage Green
          600: '#4A6B53', // Soft Forest Green
          700: '#3A5442',
          800: '#2D4A3E', // Deep Forest Green
          900: '#1F342B',
        },
        beige: {
          50: '#FAF8F5',
          100: '#F3EFEA',
          200: '#E8E1D7',
          300: '#D5C9B8',
        },
        charcoal: {
          50: '#F0F2F1',
          100: '#E1E4E2',
          500: '#4A5550',
          800: '#2B332E',
          900: '#1F2923',
        },
        mutedText: '#667085',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
