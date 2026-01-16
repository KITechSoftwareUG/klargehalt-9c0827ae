import React from 'react';
import Image from 'next/image';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'light';
}

export const Logo = ({ className = "w-8 h-8", variant = 'default', ...props }: LogoProps) => {
    // Extract width/height from className strings roughly, or default to 32px
    // This is a helper to allow passing w-8 h-8 via tailwind
    let width = 32;
    let height = 32;

    if (className.includes('w-16')) width = 64;
    if (className.includes('h-16')) height = 64;
    if (className.includes('w-14')) width = 56;
    if (className.includes('h-14')) height = 56;
    if (className.includes('w-9')) width = 36;
    if (className.includes('h-9')) height = 36;
    if (className.includes('w-12')) width = 48;
    if (className.includes('h-12')) height = 48;
    if (className.includes('w-6')) width = 24;
    if (className.includes('h-6')) height = 24;

    // Check if we want white color (text-white) to apply inversion filter
    // OR if variant is light, we assume we want white/light appearance
    const isWhite = className.includes('text-white') || variant === 'light';

    // User explicitly requested 'logo_hell.png' for the light version
    const src = variant === 'light' ? '/logo_hell.png' : '/logo.png';

    return (
        <div className={`relative ${className}`} {...props}>
            <Image
                src={src}
                alt="KlarGehalt Logo"
                width={width}
                height={height}
                // If using specific light logo, we might not need invert filter, 
                // but if fallback is needed or if 'text-white' was passed to a default logo, keep filter logic.
                // For now: if specific light logo used, don't invert. If logo.png used with text-white, invert.
                className={`object-contain ${isWhite && src === '/logo.png' ? 'invert brightness-0' : ''}`}
                priority
            />
        </div>
    );
};
