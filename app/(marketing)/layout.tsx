import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'KlarGehalt - EU-Entgelttransparenz',
    description: 'B2B-Compliance-Plattform für die EU-Entgelttransparenzrichtlinie',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="de" suppressHydrationWarning>
            <body className={outfit.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
