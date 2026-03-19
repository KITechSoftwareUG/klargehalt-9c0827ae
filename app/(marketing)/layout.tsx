import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
    title: {
        default: 'KlarGehalt - Entgelttransparenz fuer Unternehmen',
        template: '%s | KlarGehalt',
    },
    description: 'Die Compliance-Plattform fuer die EU-Entgelttransparenzrichtlinie 2023/970. Gehaltsstrukturen verwalten, Lohngleichheit nachweisen.',
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
                        <main className="flex-1">{children}</main>
                        <Footer />
                    </div>
                </Providers>
            </body>
        </html>
    );
}
