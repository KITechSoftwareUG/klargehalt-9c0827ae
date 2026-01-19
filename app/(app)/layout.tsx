import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import '../(marketing)/globals.css';
import { Providers } from './providers';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'KlarGehalt App',
    description: 'Dashboard',
    robots: {
        index: false,
        follow: false,
    }
};

export default function AppLayout({
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
