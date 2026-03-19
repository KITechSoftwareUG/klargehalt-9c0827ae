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
          ? 'bg-white/80 backdrop-blur-xl border-b border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-18 lg:h-20">
          <Link href={getMarketingUrl('/')} className="flex items-center hover:opacity-80 transition-opacity">
            <Image src="/brandname.svg" alt="KlarGehalt" width={220} height={32} className="h-7 lg:h-8 w-auto" priority />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {[
              { label: 'Funktionen', href: '/#features' },
              { label: 'Sicherheit', href: '/#security' },
              { label: 'Preise', href: '/#pricing' },
              { label: 'Kontakt', href: '/#contact' },
            ].map((link) => (
              <Link
                key={link.label}
                href={getMarketingUrl(link.href)}
                className="text-[13px] font-medium text-foreground/50 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-3">
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
                  <Button variant="ghost" size="sm" className="text-[13px] text-foreground/50">Anmelden</Button>
                </Link>
                <Link href={getAppUrl('/sign-up')}>
                  <Button size="sm" className="text-[13px] bg-foreground text-background hover:bg-foreground/90 rounded-lg px-5">
                    Demo anfragen
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Menu schliessen' : 'Menu oeffnen'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-6 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-4">
              {[
                { label: 'Funktionen', href: '/#features' },
                { label: 'Sicherheit', href: '/#security' },
                { label: 'Preise', href: '/#pricing' },
                { label: 'Kontakt', href: '/#contact' },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={getMarketingUrl(link.href)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

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
                      <Button className="w-full bg-foreground text-background hover:bg-foreground/90">Demo anfragen</Button>
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
