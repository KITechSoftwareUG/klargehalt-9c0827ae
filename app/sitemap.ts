import type { MetadataRoute } from 'next';

const BASE_URL = 'https://klargehalt.de';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
    { path: '/',              priority: 1.0, changeFrequency: 'weekly' },
    { path: '/preise',        priority: 0.9, changeFrequency: 'weekly' },
    { path: '/funktionen',    priority: 0.9, changeFrequency: 'weekly' },
    { path: '/eu-richtlinie', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/ueber-uns',     priority: 0.6, changeFrequency: 'monthly' },
    { path: '/sicherheit',    priority: 0.6, changeFrequency: 'monthly' },
    { path: '/karriere',      priority: 0.5, changeFrequency: 'monthly' },
    { path: '/kontakt',       priority: 0.7, changeFrequency: 'monthly' },
    { path: '/impressum',     priority: 0.3, changeFrequency: 'yearly' },
    { path: '/datenschutz',   priority: 0.3, changeFrequency: 'yearly' },
    { path: '/agb',           priority: 0.3, changeFrequency: 'yearly' },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
