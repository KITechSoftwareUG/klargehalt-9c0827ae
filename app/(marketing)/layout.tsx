import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
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
        <ClerkProvider
            localization={deDE}
            appearance={{
                variables: {
                    colorPrimary: '#0F172A',
                    colorBackground: '#FFFFFF',
                    colorInputBackground: '#FFFFFF',
                    colorInputText: '#0F172A',
                    fontFamily: 'inherit',
                },
                elements: {
                    formButtonPrimary: 'bg-primary hover:bg-primary/90 text-white',
                    card: 'shadow-lg',
                    headerTitle: 'text-2xl font-bold',
                    headerSubtitle: 'text-muted-foreground',
                    socialButtonsBlockButton: 'border-2 hover:bg-secondary',
                    formFieldLabel: 'font-medium',
                    footerActionLink: 'text-primary hover:text-primary/80',
                },
            }}
        >
            <html lang="de" suppressHydrationWarning>
                <body className={outfit.className}>
                    <Providers>{children}</Providers>
                </body>
            </html>
        </ClerkProvider>
    );
}
