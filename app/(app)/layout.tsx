import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '../(marketing)/globals.css';
import { Providers } from './providers';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

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
        <html lang="de" suppressHydrationWarning>
            <body className={font.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
