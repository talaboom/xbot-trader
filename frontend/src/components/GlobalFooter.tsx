import React from 'react';

const sponsors = [
  { name: 'Sponsor 1', slot: true },
  { name: 'Sponsor 2', slot: true },
  { name: 'Sponsor 3', slot: true },
  { name: 'Sponsor 4', slot: true },
  { name: 'Sponsor 5', slot: true },
  { name: 'Sponsor 6', slot: true },
];

export default function GlobalFooter() {
  return (
    <footer className="w-full bg-gray-950 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h3 className="text-center text-sm font-semibold uppercase tracking-widest text-gray-500 mb-8">
          Sponsored By
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {sponsors.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-center h-20 rounded-lg border border-dashed border-gray-700 bg-gray-900/50 hover:border-emerald-500/50 hover:bg-gray-900 transition-all duration-300 cursor-pointer group"
            >
              <span className="text-xs text-gray-600 group-hover:text-emerald-400 transition-colors">
                Your Logo Here
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 007.92 12.446A9 9 0 1112 2.992z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l-5 5m0-5l5 5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-400">1% for the Planet</p>
              <p className="text-xs text-gray-500">1% of all revenue goes to CO₂ reduction & world environment</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white">XBot Trader</p>
            <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} All rights reserved</p>
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
