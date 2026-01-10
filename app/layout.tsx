import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Haven | Cloud',
    description: 'The Tailored Intelligence',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" data-skin="alfred">
            <body className="antialiased h-screen w-screen flex flex-col selection:bg-pink-500 selection:text-white">
                {children}
            </body>
        </html>
    );
}
