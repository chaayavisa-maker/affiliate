/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        fadeUp:   'fadeUp 0.5s ease both',
        fadeIn:   'fadeIn 0.35s ease both',
        slideIn:  'slideIn 0.3s ease both',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-100%)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
};
