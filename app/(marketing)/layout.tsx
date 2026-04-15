import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';
import CountdownBanner from '@/components/CountdownBanner';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
    title: {
        default: 'klargehalt — Entgelttransparenz für Unternehmen',
        template: '%s | klargehalt',
    },
    description: 'Die Compliance-Plattform für die EU-Entgelttransparenzrichtlinie 2023/970. Gehaltsstrukturen verwalten, Lohngleichheit nachweisen.',
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/favicon.png', type: 'image/png' },
        ],
        apple: '/apple-touch-icon.png',
    },
};

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="de" suppressHydrationWarning>
            <body className={font.className}>
                <Providers>
                    <div className="min-h-screen flex flex-col">
                        <Header />
                        <CountdownBanner />
                        <main className="flex-1">{children}</main>
                        <Footer />
                    </div>
                    <CookieBanner />
                </Providers>
            </body>
        </html>
    );
}
