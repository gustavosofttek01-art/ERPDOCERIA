/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4f7',
          100: '#fbe8ef',
          200: '#f7d3df',
          300: '#efb0c4',
          400: '#e382a1',
          500: '#d35b80',
          600: '#bd3f64',
          700: '#a12e4f',
          800: '#862944',
          900: '#72263d',
          950: '#431020',
        },
        caramel: {
          50: '#fffaf0',
          100: '#feeed4',
          200: '#fddba8',
          300: '#fbc173',
          400: '#f89e3a',
          500: '#f58216',
          600: '#e6680c',
          700: '#bf4c0d',
          800: '#983d12',
          900: '#7b3413',
        },
      },
    },
  },
  plugins: [],
};
