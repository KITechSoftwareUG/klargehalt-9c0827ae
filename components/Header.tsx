'use client';

import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getAppUrl, getMarketingUrl } from '@/utils/url';

const navLinks = [
  { label: 'Funktionen', href: '/#features' },
  { label: 'Sicherheit', href: '/#security' },
  { label: 'Preise', href: '/#pricing' },
  { label: 'Kontakt', href: '/#contact' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isSignedIn, user, signOut } = useAuth();
  const userInitial = (user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'K').toUpperCase();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo — groesser */}
          <Link href={getMarketingUrl('/')} className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer">
            <Image
              src="/brandname.svg"
              alt="KlarGehalt"
              width={200}
              height={32}
              priority
              className="h-8 sm:h-9 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={getMarketingUrl(l.href)}
                className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-3">
            {isSignedIn ? (
              <>
                <Link href={getAppUrl('/dashboard')}>
                  <Button variant="ghost" size="sm" className="text-[13px] cursor-pointer">Dashboard</Button>
                </Link>
                <Button
                  variant="ghost"
                  className="h-9 w-9 rounded-full bg-slate-100 p-0 text-sm font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
                  onClick={() => void signOut()}
                  title="Abmelden"
                >
                  {userInitial}
                </Button>
              </>
            ) : (
              <>
                <Link href={getAppUrl('/sign-in')}>
                  <Button variant="ghost" size="sm" className="text-[13px] text-slate-500 cursor-pointer">
                    Anmelden
                  </Button>
                </Link>
                <Link href={getAppUrl('/sign-up')}>
                  <Button
                    size="sm"
                    className="text-[13px] bg-[#1E293B] text-white hover:bg-[#0F172A] rounded-lg px-5 shadow-sm cursor-pointer"
                  >
                    Demo anfragen
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Menu schliessen' : 'Menu oeffnen'}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden pb-6 border-t border-slate-100 animate-fade-in">
            <nav className="flex flex-col gap-1 pt-4">
              {navLinks.map((l) => (
                <Link
                  key={l.label}
                  href={getMarketingUrl(l.href)}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 py-2.5 px-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-2">
              {isSignedIn ? (
                <Link href={getAppUrl('/dashboard')} onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full cursor-pointer">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href={getAppUrl('/sign-in')} onClick={() => setMenuOpen(false)}>
                    <Button variant="ghost" className="w-full cursor-pointer">Anmelden</Button>
                  </Link>
                  <Link href={getAppUrl('/sign-up')} onClick={() => setMenuOpen(false)}>
                    <Button className="w-full bg-[#1E293B] text-white hover:bg-[#0F172A] cursor-pointer">Demo anfragen</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
