import React from 'react';
import { Link } from 'react-router-dom';

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
          <div className="flex items-center gap-4">
            <a href="https://facebook.com/xbottrader" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#1877F2] transition-colors" aria-label="Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://t.me/xbottrader" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#2AABEE] transition-colors" aria-label="Telegram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
            <div className="flex gap-4 text-xs text-gray-500">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href="mailto:ivan@sync-security.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
