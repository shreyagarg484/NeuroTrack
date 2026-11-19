/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#f7f1e8',
          deep: '#f0e6da',
        },
        surface: {
          DEFAULT: '#eee4d7',
          light: '#f5ece2',
        },
        burgundy: {
          DEFAULT: '#64182f',
          deep: '#481022',
          soft: '#ead4d5',
        },
        ink: '#2d3035',
        muted: '#887b70',
        cream: '#fbf7f1',
      },
      fontFamily: {
        body: ['"DM Sans"', 'sans-serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

