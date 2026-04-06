'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ConsentData {
  analytics: boolean;
  version: 1;
  timestamp: string;
}

const CONSENT_KEY = 'kg_cookie_consent';

function loadPlausible() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'klargehalt.de';
  const scriptUrl = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL;
  if (!scriptUrl) return;
  if (document.querySelector(`script[data-domain="${domain}"]`)) return;
  const script = document.createElement('script');
  script.defer = true;
  script.setAttribute('data-domain', domain);
  script.src = scriptUrl;
  document.head.appendChild(script);
}

function saveConsent(analytics: boolean) {
  const data: ConsentData = {
    analytics,
    version: 1,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
}

function getStoredConsent(): ConsentData | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentData;
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
    } else if (stored.analytics) {
      loadPlausible();
    }
  }, []);

  function handleAccept() {
    saveConsent(true);
    loadPlausible();
    setVisible(false);
  }

  function handleDecline() {
    saveConsent(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-[#071423] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-5 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
        <p className="text-sm text-white/60 leading-relaxed flex-1">
          Wir verwenden Analyse-Tools (Plausible Analytics), um die Nutzung unserer Website
          anonym auszuwerten. Keine Cookies, keine personenbezogenen Daten.{' '}
          <Link href="/datenschutz" className="text-white/80 underline hover:text-white transition-colors">
            Datenschutz
          </Link>
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleDecline}
            className="px-5 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            Nur notwendige
          </button>
          <button
            onClick={handleAccept}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-white text-[#071423] hover:bg-white/90 transition-colors cursor-pointer"
          >
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
