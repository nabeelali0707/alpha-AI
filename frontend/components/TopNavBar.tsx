'use client';

import Link from 'next/link';

export default function TopNavBar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/60 backdrop-blur-lg border-b border-outline-variant/30 shadow-[0_0_15px_rgba(0,230,57,0.1)] flex justify-between items-center px-margin-mobile md:px-margin-desktop py-base w-full max-w-full">
      <div className="flex items-center gap-md">
        <Link href="/" className="font-headline-xl text-headline-xl font-bold text-primary-fixed tracking-tighter hover:opacity-80 transition-opacity">
          AlphaAI
        </Link>
        <div className="hidden md:flex items-center gap-sm bg-surface-container px-sm py-xs rounded-full border border-outline-variant/20">
          <div className="w-2 h-2 rounded-full bg-primary-fixed-dim animate-pulse"></div>
          <span className="font-label-sm text-label-sm text-primary-fixed-dim uppercase tracking-wider">Market Open</span>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-lg hidden md:block">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-sm text-on-surface-variant">search</span>
          <input
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg py-xs pl-xl pr-sm text-body-md focus:outline-none focus:border-primary-fixed transition-colors"
            placeholder="Search markets, stocks, or AI signals..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-md">
        <div className="flex gap-sm">
          <button className="material-symbols-outlined p-base rounded-full hover:bg-surface-variant/50 transition-colors text-on-surface-variant cursor-pointer active:scale-95">
            notifications
          </button>
          <button className="material-symbols-outlined p-base rounded-full hover:bg-surface-variant/50 transition-colors text-on-surface-variant cursor-pointer active:scale-95">
            account_balance_wallet
          </button>
          <button className="material-symbols-outlined p-base rounded-full hover:bg-surface-variant/50 transition-colors text-on-surface-variant cursor-pointer active:scale-95">
            settings
          </button>
        </div>
        <div className="w-lg h-lg rounded-full bg-surface-container-highest border border-outline-variant/50 overflow-hidden">
          <img
            alt="User Profile"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZkeDEcwGKOPbMxma4O-cTr3RU8cGMR_u5xp1fxXvFrciAndFXDZfrMvXckiw7lvRv2YaqonXcEmRtH3nUq6pBDkqL8EhxnsgHZXcj2lZTCvM00wt0WvFJGGnHh2enCS2TO_A50AerxKTZYKfsN-TWYVknaOjdCygdy0maHMtzRSEC7HaxG4lr0MEBoKdw8p50kvQhZwB4ePK5QeRgM9hGN4jT7VFkzHkS8GikmY0F1dn8rStL6uSjMBVLL8Bb1jRtDT1dXxKT2nc"
          />
        </div>
      </div>
    </header>
  );
}
