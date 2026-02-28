/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { 50:'#f0f4ff', 100:'#dce6ff', 500:'#3558c8', 600:'#2546b0', 700:'#1a3499', 900:'#0d1f66' },
        jade:  { 400:'#34d399', 500:'#10b981', 600:'#059669' },
        amber: { 400:'#fbbf24', 500:'#f59e0b' },
        rose:  { 400:'#fb7185', 500:'#f43f5e' },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn .35s ease-out',
        'slide-up':   'slideUp .4s cubic-bezier(.16,1,.3,1)',
        'pulse-ring': 'pulseRing 1.5s ease infinite',
      },
      keyframes: {
        fadeIn:    { from:{ opacity:0 },           to:{ opacity:1 } },
        slideUp:   { from:{ opacity:0, transform:'translateY(12px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        pulseRing: { '0%,100%':{ opacity:1 }, '50%':{ opacity:.5 } },
      },
      boxShadow: {
        card:  '0 1px 3px rgba(13,31,102,.08), 0 4px 12px rgba(13,31,102,.06)',
        'card-hover': '0 4px 16px rgba(13,31,102,.14)',
        glow:  '0 0 0 3px rgba(53,88,200,.25)',
      },
    },
  },
  plugins: [],
}
