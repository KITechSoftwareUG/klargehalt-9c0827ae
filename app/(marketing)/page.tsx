'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import SecuritySection from "@/components/SecuritySection";
import PricingSection from "@/components/PricingSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function HomePage() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only redirect if fully loaded and signed in
        // Use replace to avoid history issues
        if (isLoaded && isSignedIn) {
            router.replace('/dashboard');
        }
    }, [isLoaded, isSignedIn, router]);

    // Show loading only briefly
    if (!isLoaded) {
        return null; // or a simple spinner
    }

    // Don't render if redirecting
    if (isSignedIn) {
        return null;
    }

    // Show landing page only for non-authenticated users
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                <HeroSection />
                <FeaturesSection />
                <SecuritySection />
                <PricingSection />
                <ContactSection />
            </main>
            <Footer />
        </div>
    );
}
