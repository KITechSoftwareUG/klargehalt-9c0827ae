/**
 * Utility to handle cross-domain URLs between marketing and app subdomains.
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'klargehalt.de';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || `https://app.${ROOT_DOMAIN}`;
const MARKETING_URL = `https://${ROOT_DOMAIN}`;

export const getAppUrl = (path: string = '') => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // If we are in development and not using subdomains, return local path
    if (process.env.NODE_ENV === 'development' && !window.location.hostname.includes(ROOT_DOMAIN)) {
        return cleanPath;
    }

    return `${APP_URL}${cleanPath}`;
};

export const getMarketingUrl = (path: string = '') => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // In dev, usually root is handled by the same dev server
    if (process.env.NODE_ENV === 'development' && !window.location.hostname.includes(ROOT_DOMAIN)) {
        return cleanPath;
    }

    return `${MARKETING_URL}${cleanPath}`;
};

export const isAppSubdomain = () => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname.startsWith('app.');
};
