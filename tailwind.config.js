/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                theme: {
                    bg: 'var(--bg-color)',
                    text: 'var(--text-color)',
                    accent: 'var(--accent-color)',
                    panel: 'var(--panel-color)',
                    border: 'var(--border-color)',
                    input: 'var(--input-bg)',
                    highlight: 'var(--highlight-color)',
                }
            },
            fontFamily: {
                mono: ['Courier New', 'monospace'],
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif']
            }
        },
    },
    plugins: [],
}
