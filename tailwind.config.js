/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
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
                    indicator: 'var(--indicator-color)',
                    carecol: 'var(--caret-color)'
                }
            },
            fontFamily: {
                // We will just use style={{ fontFamily: 'var(--font-family)' }} in React for dynamic switching
            },
        },
    },
    plugins: [],
};
