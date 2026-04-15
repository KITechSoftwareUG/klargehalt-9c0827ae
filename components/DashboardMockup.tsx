'use client';

import { motion } from 'framer-motion';

const bars = [
  { label: 'Entwicklung', womenPct: 82, manPct: 100, gap: -18 },
  { label: 'Marketing', womenPct: 96, manPct: 100, gap: -4 },
  { label: 'Vertrieb', womenPct: 88, manPct: 100, gap: -12 },
  { label: 'Finanzen', womenPct: 91, manPct: 100, gap: -9 },
];

const statCards = [
  { label: 'Mitarbeiter gesamt', value: '248', sub: '↑ 12 diesen Monat', color: '#52e0de' },
  { label: 'Bereinigter Pay-Gap', value: '3,8 %', sub: '↓ 1,2 % seit Q1', color: '#946df7' },
  { label: 'Offene Anfragen', value: '4', sub: '2 fällig in 48h', color: '#fbcd56' },
];

export default function DashboardMockup() {
  return (
    <div className="relative w-full">
      {/* Outer frame — browser chrome */}
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.6)] bg-[#0d1f33]">

        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#0a1929]">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <div className="ml-3 flex-1 h-5 rounded bg-white/[0.05] flex items-center px-3">
            <span className="text-[9px] text-white/30">app.klargehalt.de/dashboard</span>
          </div>
        </div>

        {/* App layout */}
        <div className="flex" style={{ minHeight: 320 }}>

          {/* Sidebar */}
          <div className="w-14 sm:w-44 border-r border-white/[0.06] bg-[#071423] p-3 hidden sm:flex flex-col gap-1">
            <div className="px-2 pt-2 pb-4">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Menü</span>
            </div>
            {[
              { label: 'Übersicht', active: true },
              { label: 'Mitarbeiter', active: false },
              { label: 'Pay-Gap', active: false },
              { label: 'Gehaltsbänder', active: false },
              { label: 'Berichte', active: false },
              { label: 'Audit-Log', active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`px-3 py-2 rounded-lg text-[11px] font-medium cursor-default ${
                  item.active
                    ? 'bg-[#52e0de]/10 text-[#52e0de]'
                    : 'text-white/40'
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 sm:p-5 overflow-hidden">

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
              {statCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-2.5 sm:p-3"
                >
                  <p className="text-[9px] sm:text-[10px] text-white/40 mb-1">{card.label}</p>
                  <p className="text-sm sm:text-base font-extrabold text-white leading-none">{card.value}</p>
                  <p className="text-[9px] mt-1" style={{ color: card.color }}>{card.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Pay gap chart section */}
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-white">Gender-Pay-Gap nach Abteilung</p>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#fbcd56]/10 text-[#fbcd56]">Q1 2026</span>
              </div>
              <div className="space-y-2.5">
                {bars.map((bar, i) => (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-white/50">{bar.label}</span>
                      <span className={`text-[10px] font-semibold ${Math.abs(bar.gap) >= 10 ? 'text-[#fbcd56]' : 'text-[#52e0de]'}`}>
                        {bar.gap} %
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: Math.abs(bar.gap) >= 10 ? '#fbcd56' : '#52e0de' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.womenPct}%` }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.05]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#52e0de]" />
                  <span className="text-[9px] text-white/40">&lt; 5 % (OK)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#fbcd56]" />
                  <span className="text-[9px] text-white/40">≥ 10 % (Handlungsbedarf)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -bottom-4 -right-4 sm:-bottom-5 sm:-right-5 bg-[#0d1f33] border border-white/10 rounded-xl p-3 shadow-2xl"
      >
        <p className="text-[10px] font-semibold text-[#52e0de]">✓ EU-konformer Bericht</p>
        <p className="text-[9px] text-white/40 mt-0.5">PDF generiert · 14:03 Uhr</p>
      </motion.div>
    </div>
  );
}
