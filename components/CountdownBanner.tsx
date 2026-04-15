'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { getAppUrl } from '@/utils/url';

function getTimeLeft() {
  const deadline = new Date('2026-06-07T00:00:00+01:00');
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, expired: false };
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[#52e0de] font-extrabold text-sm sm:text-base tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-white/30 text-[9px] uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
}

export default function CountdownBanner() {
  const [time, setTime] = useState(getTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted || time.expired) return null;

  return (
    <div className="bg-[#071423] border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Clock className="w-3.5 h-3.5 text-[#52e0de] flex-shrink-0" />
          <span className="text-white/60 text-xs">
            Bis zur EU-Frist (EU-RL 2023/970):
          </span>
          <div className="flex items-center gap-3">
            <Digit value={time.days} label="Tage" />
            <span className="text-white/20 text-xs mb-3">:</span>
            <Digit value={time.hours} label="Std" />
            <span className="text-white/20 text-xs mb-3">:</span>
            <Digit value={time.minutes} label="Min" />
            <span className="text-white/20 text-xs mb-3">:</span>
            <Digit value={time.seconds} label="Sek" />
          </div>
        </div>
        <Link
          href={getAppUrl('/sign-up')}
          className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-[#52e0de] hover:text-white transition-colors"
        >
          Jetzt compliance-konform werden
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
