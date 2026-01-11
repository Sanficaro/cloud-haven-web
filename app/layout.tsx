import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Haven Design Lab v3.4 (Final Polish)',
    description: 'The Tailored Intelligence',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" data-skin="alfred">
            <body className="h-screen w-screen overflow-hidden antialiased bg-[var(--bg-color)] text-[var(--text-color)]">
                {children}
            </body>
        </html>
    );
}
