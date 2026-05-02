import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';
import CountdownBanner from '@/components/CountdownBanner';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

const SITE_URL = 'https://klargehalt.de';
const SITE_TITLE = 'klargehalt — Entgelttransparenz für Unternehmen';
const SITE_DESCRIPTION =
    'Die Compliance-Plattform für die EU-Entgelttransparenzrichtlinie 2023/970. Gehaltsstrukturen verwalten, Lohngleichheit nachweisen, Pay-Gap reduzieren — von externem Rechtsberater geprüft.';

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: SITE_TITLE,
        template: '%s | klargehalt',
    },
    description: SITE_DESCRIPTION,
    keywords: [
        'Entgelttransparenz',
        'EU-Richtlinie 2023/970',
        'Pay Equity',
        'Gender Pay Gap',
        'Compliance',
        'HR Software',
        'Lohngleichheit',
        'Gehaltsbänder',
    ],
    authors: [{ name: 'KITech Software UG', url: SITE_URL }],
    alternates: {
        canonical: '/',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        type: 'website',
        locale: 'de_DE',
        url: SITE_URL,
        siteName: 'klargehalt',
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'klargehalt — Entgelttransparenz-Plattform',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        images: ['/og-image.png'],
    },
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
            <head>
                <Script
                    id="ld-organization"
                    type="application/ld+json"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'Organization',
                            name: 'klargehalt',
                            legalName: 'KITech Software UG (haftungsbeschränkt)',
                            url: SITE_URL,
                            logo: `${SITE_URL}/favicon.png`,
                            description: SITE_DESCRIPTION,
                            address: {
                                '@type': 'PostalAddress',
                                addressLocality: 'Berlin',
                                addressCountry: 'DE',
                            },
                            sameAs: [],
                        }),
                    }}
                />
                <Script
                    id="ld-software"
                    type="application/ld+json"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'SoftwareApplication',
                            name: 'klargehalt',
                            applicationCategory: 'BusinessApplication',
                            operatingSystem: 'Web',
                            offers: {
                                '@type': 'AggregateOffer',
                                priceCurrency: 'EUR',
                                lowPrice: '149',
                                highPrice: '299',
                            },
                        }),
                    }}
                />
                <Script
                    defer
                    data-domain="klargehalt.de"
                    src="https://analytics.klargehalt.de/js/script.js"
                    strategy="afterInteractive"
                />
            </head>
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
