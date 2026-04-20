import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import '../(marketing)/globals.css';
import { Providers } from './providers';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
    title: 'klargehalt',
    description: 'Dashboard',
    robots: {
        index: false,
        follow: false,
    },
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/favicon.png', type: 'image/png' },
        ],
        apple: '/apple-touch-icon.png',
    },
};

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="de" suppressHydrationWarning>
            <head>
                <Script
                    defer
                    data-domain="app.klargehalt.de"
                    src="https://analytics.klargehalt.de/js/script.js"
                    strategy="afterInteractive"
                />
            </head>
            <body className={font.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
