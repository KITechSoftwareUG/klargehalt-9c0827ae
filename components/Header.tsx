'use client';

import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useState } from 'react';
import Link from 'next/link';
import { UserButton, useUser, SignInButton } from '@clerk/nextjs';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn, user } = useUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground lowercase tracking-tight">klargehalt</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Preise
            </Link>
            <Link href="/#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Kontakt
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isSignedIn ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'w-10 h-10',
                    },
                  }}
                />
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost">Anmelden</Button>
                </Link>
                <Link href="/sign-up">
                  <Button variant="hero">Kostenlos starten</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <Link
                href="/#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Preise
              </Link>
              <Link
                href="/#contact"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Kontakt
              </Link>

              <div className="pt-4 border-t border-border flex flex-col gap-2">
                {isSignedIn ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full">Dashboard</Button>
                    </Link>
                    <div className="flex items-center gap-2 p-2">
                      <UserButton afterSignOutUrl="/" />
                      <span className="text-sm">{user?.firstName || user?.emailAddresses[0].emailAddress}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full">Anmelden</Button>
                    </Link>
                    <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
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
