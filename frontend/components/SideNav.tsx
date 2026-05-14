'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/supabase/actions';

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/portfolio', icon: 'account_balance', label: 'Portfolio' },
  { href: '/ai-insights', icon: 'psychology', label: 'AI Insights' },
  { href: '/market-map', icon: 'language', label: 'Market Map' },
  { href: '/signals', icon: 'show_chart', label: 'Signals' },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 h-full w-[260px] hidden lg:flex flex-col bg-surface-container/40 backdrop-blur-xl border-r border-outline-variant/20 shadow-2xl py-md px-sm z-40 pt-[72px]">
      <div className="mb-lg px-sm">
        <div className="flex items-center gap-sm mb-xs">
          <span className="material-symbols-outlined text-primary-fixed-dim text-headline-lg filled" style={{fontVariationSettings: "'FILL' 1"}}>terminal</span>
          <span className="font-headline-lg text-headline-lg text-primary-fixed">Terminal</span>
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">V2.4 Active</span>
      </div>

      <div className="flex flex-col gap-xs flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-sm px-sm py-base rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-primary-container/20 text-primary-fixed-dim border-l-4 border-primary-fixed'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto space-y-md">
        <button className="w-full py-sm bg-primary-container text-on-primary-container font-label-md rounded-lg hover:brightness-110 transition-all active:scale-95">
          Upgrade to Pro
        </button>
        <div className="flex flex-col gap-xs pt-base border-t border-outline-variant/10">
          <a
            className="flex items-center gap-sm px-sm py-xs text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            <span className="material-symbols-outlined text-sm">help</span>
            <span className="font-label-sm text-label-sm">Support</span>
          </a>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-sm px-sm py-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span className="font-label-sm text-label-sm">Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
