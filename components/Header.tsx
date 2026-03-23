'use client';

import { Menu, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getMarketingUrl, getAppUrl } from '@/utils/url';

const navItems = [
  {
    label: 'Plattform',
    children: [
      { label: 'Funktionen', href: '/funktionen', desc: 'Alle Features im Überblick' },
      { label: 'Sicherheit', href: '/sicherheit', desc: 'Datenschutz & Compliance' },
      { label: 'Preise', href: '/preise', desc: 'Transparente Preisgestaltung' },
    ],
  },
  { label: 'EU-Richtlinie', href: '/eu-richtlinie' },
  { label: 'Über uns', href: '/ueber-uns' },
  { label: 'Kontakt', href: '/kontakt' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
          ? 'bg-[#071423]/95 backdrop-blur-xl shadow-lg'
          : 'bg-[#071423]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={getMarketingUrl('/')} className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer">
            <Image
              src="/brandname.svg"
              alt="klargehalt"
              width={160}
              height={28}
              priority
              className="h-8 sm:h-9 w-auto brightness-0 invert"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) =>
              'children' in item && item.children ? (
                <div
                  key={item.label}
                  ref={dropdownRef}
                  className="relative"
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    {item.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div
                    className={`absolute top-full left-0 mt-2 w-72 bg-[#0d1f33] rounded-xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-200 ${
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
                          className={`block px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                            isActive(child.href) ? 'bg-white/10' : 'hover:bg-white/5'
                          }`}
                        >
                          <span className="block text-sm font-medium text-white">{child.label}</span>
                          <span className="block text-xs text-white/40 mt-0.5">{child.desc}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={getMarketingUrl(item.href!)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive(item.href!)
                      ? 'text-white bg-white/10'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href={getAppUrl('/sign-in')}
              className="px-5 py-2 rounded-full text-sm font-medium text-[#071423] bg-white hover:bg-white/90 transition-colors cursor-pointer"
            >
              Login
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden pb-6 border-t border-white/10 animate-fade-in">
            <nav className="flex flex-col gap-1 pt-4">
              {navItems.map((item) =>
                'children' in item && item.children ? (
                  <div key={item.label}>
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] px-2 pt-4 pb-2">
                      {item.label}
                    </p>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={getMarketingUrl(child.href)}
                        className="block text-sm font-medium py-2.5 px-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => setMenuOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    href={getMarketingUrl(item.href!)}
                    className="text-sm font-medium py-2.5 px-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>
            <div className="pt-4 mt-2 border-t border-white/10">
              <Link
                href={getAppUrl('/sign-in')}
                onClick={() => setMenuOpen(false)}
                className="block text-center px-5 py-2.5 rounded-full text-sm font-medium text-[#071423] bg-white hover:bg-white/90 transition-colors cursor-pointer"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
