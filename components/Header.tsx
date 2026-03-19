'use client';

import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getAppUrl, getMarketingUrl } from '@/utils/url';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isSignedIn, user, signOut } = useAuth();
  const userLabel = user?.firstName || user?.email || 'Konto';
  const userInitial = (user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'K').toUpperCase();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href={getMarketingUrl('/')} className="flex items-center hover:opacity-80 transition-opacity">
            <Image src="/brandname.svg" alt="KlarGehalt" width={180} height={26} className="h-6 lg:h-7 w-auto" priority />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            <Link href={getMarketingUrl('/#features')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href={getMarketingUrl('/#security')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sicherheit
            </Link>
            <Link href={getMarketingUrl('/#pricing')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Preise
            </Link>
            <Link href={getMarketingUrl('/#contact')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Kontakt
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isSignedIn ? (
              <>
                <Link href={getAppUrl('/dashboard')}>
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
                <Button
                  variant="ghost"
                  className="h-9 w-9 rounded-full border border-border p-0 text-sm font-semibold"
                  onClick={() => void signOut()}
                  title="Abmelden"
                >
                  {userInitial}
                </Button>
              </>
            ) : (
              <>
                <Link href={getAppUrl('/sign-in')}>
                  <Button variant="ghost" size="sm">Anmelden</Button>
                </Link>
                <Link href={getAppUrl('/sign-up')}>
                  <Button variant="hero" size="sm">Kostenlos starten</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button — 3 bars */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-4">
              <Link
                href={getMarketingUrl('/#features')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href={getMarketingUrl('/#security')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sicherheit
              </Link>
              <Link
                href={getMarketingUrl('/#pricing')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Preise
              </Link>
              <Link
                href={getMarketingUrl('/#contact')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Kontakt
              </Link>

              <div className="pt-4 border-t border-border/50 flex flex-col gap-2">
                {isSignedIn ? (
                  <>
                    <Link href={getAppUrl('/dashboard')} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full">Dashboard</Button>
                    </Link>
                    <div className="flex items-center gap-2 p-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold">
                        {userInitial}
                      </div>
                      <span className="text-sm">{userLabel}</span>
                      <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                        Abmelden
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href={getAppUrl('/sign-in')} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full">Anmelden</Button>
                    </Link>
                    <Link href={getAppUrl('/sign-up')} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="hero" className="w-full">Kostenlos starten</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
