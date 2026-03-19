'use client';

import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getAppUrl, getMarketingUrl } from '@/utils/url';

const navItems = [
  { label: 'Funktionen', href: '/funktionen' },
  { label: 'Sicherheit', href: '/sicherheit' },
  { label: 'Preise', href: '/preise' },
  {
    label: 'Wissen',
    children: [
      { label: 'EU-Richtlinie 2023/970', href: '/eu-richtlinie', desc: 'Was Unternehmen jetzt wissen muessen' },
      { label: 'Ueber KlarGehalt', href: '/ueber-uns', desc: 'Team, Mission und Werte' },
    ],
  },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const { isSignedIn, user, signOut } = useAuth();
  const userInitial = (user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'K').toUpperCase();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const isActive = (href: string) => pathname === href;
  const isDropdownActive = navItems
    .find((item) => 'children' in item)
    ?.children?.some((child) => pathname === child.href);

  const handleDropdownEnter = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setDropdownOpen(true);
  };

  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => setDropdownOpen(false), 150);
  };

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
          {/* Logo */}
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
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) =>
              'children' in item ? (
                <div
                  key={item.label}
                  ref={dropdownRef}
                  className="relative"
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                      isDropdownActive
                        ? 'text-[#1E293B] bg-slate-100'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  <div
                    className={`absolute top-full left-0 mt-1 w-72 bg-white rounded-xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-200 ${
                      dropdownOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 -translate-y-1 pointer-events-none'
                    }`}
                  >
                    <div className="p-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={getMarketingUrl(child.href)}
                          onClick={() => setDropdownOpen(false)}
                          className={`block px-3.5 py-3 rounded-lg transition-colors cursor-pointer ${
                            isActive(child.href) ? 'bg-slate-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span className="block text-sm font-medium text-[#1E293B]">{child.label}</span>
                          <span className="block text-xs text-slate-400 mt-0.5">{child.desc}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={getMarketingUrl(item.href)}
                  className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                    isActive(item.href)
                      ? 'text-[#1E293B] bg-slate-100'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              )
            )}
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
                <Link href={getMarketingUrl('/kontakt')}>
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
              {navItems.map((item) =>
                'children' in item ? (
                  <div key={item.label}>
                    <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-[0.15em] px-2 pt-4 pb-2">
                      {item.label}
                    </p>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={getMarketingUrl(child.href)}
                        className={`block text-sm font-medium py-2.5 px-2 rounded-lg transition-colors cursor-pointer ${
                          isActive(child.href)
                            ? 'text-[#1E293B] bg-slate-50'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    href={getMarketingUrl(item.href)}
                    className={`text-sm font-medium py-2.5 px-2 rounded-lg transition-colors cursor-pointer ${
                      isActive(item.href)
                        ? 'text-[#1E293B] bg-slate-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}
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
                  <Link href={getMarketingUrl('/kontakt')} onClick={() => setMenuOpen(false)}>
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
