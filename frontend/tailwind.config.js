/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Noto Serif"', 'Georgia', 'serif'],
        body:    ['"Noto Sans"', 'Arial', 'sans-serif'],
        mono:    ['"Courier New"', 'monospace'],
        hindi:   ['"Noto Sans Devanagari"', 'sans-serif'],
      },
      colors: {
        gov: {
          saffron:  '#FF9933',
          white:    '#FFFFFF',
          green:    '#138808',
          blue:     '#000080',
          darkblue: '#003580',
          midblue:  '#1a4fa0',
          lightblue:'#e8f0fe',
          gold:     '#c8a84b',
          darkgold: '#9a7a2e',
          cream:    '#fdf6e3',
          offwhite: '#f5f5f0',
        },
      },
      backgroundImage: {
        'tricolor': 'linear-gradient(180deg, #FF9933 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #138808 66.66%)',
        'gov-header': 'linear-gradient(135deg, #003580 0%, #1a4fa0 50%, #003580 100%)',
        'gov-dark': 'linear-gradient(180deg, #002060 0%, #003580 100%)',
      },
      boxShadow: {
        'gov': '0 2px 8px rgba(0,53,128,0.15), 0 1px 3px rgba(0,0,0,0.1)',
        'gov-lg': '0 4px 20px rgba(0,53,128,0.2)',
        'emblem': '0 0 20px rgba(200,168,75,0.4)',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-out',
        'slide-in':  'slideIn 0.3s ease-out',
        'pulse-slow':'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'marquee':   'marquee 30s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },                              to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateY(6px)'},  to: { opacity: 1, transform: 'translateY(0)' } },
        marquee: { from: { transform: 'translateX(100%)' },           to: { transform: 'translateX(-100%)' } },
      },
    },
  },
  plugins: [],
}
