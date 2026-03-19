import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
    title: 'KlarGehalt - Entgelttransparenz fuer Unternehmen',
    description: 'Die B2B-Compliance-Plattform fuer die EU-Entgelttransparenzrichtlinie 2023/970. Gehaltsstrukturen verwalten, Lohngleichheit nachweisen.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="de" suppressHydrationWarning>
            <body className={font.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
