'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StockSearchBar from './StockSearchBar';
import { useAuth } from '../context/AuthProvider';

function getMarketStatus() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const pktDate = new Date(utcMs + 5 * 60 * 60000);
  const day = pktDate.getUTCDay();
  const minutes = pktDate.getUTCHours() * 60 + pktDate.getUTCMinutes();
  const isWeekday = day >= 1 && day <= 5;
  const isOpen = isWeekday && minutes >= 570 && minutes < 930; // 09:30 to 15:30 PKT
  return isOpen
    ? { label: 'PSX OPEN', color: '#00ff41' }
    : { label: 'PSX CLOSED', color: '#ff3131' };
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const status = useMemo(getMarketStatus, []);
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleLogout() {
    setDropdownOpen(false);
    await logout();
    router.push('/');
  }

  const initials = (profile?.full_name || user?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 200, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,14,26,0.92)', backdropFilter: 'blur(16px)' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/dashboard" style={{ fontWeight: 800, letterSpacing: '0.08em', color: 'var(--accent-green)', textDecoration: 'none', fontSize: 18, flexShrink: 0 }}>
          ALPHA<span style={{ color: 'var(--text-primary)' }}>AI</span>
        </Link>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 'min(520px, 100%)' }}>
            <StockSearchBar placeholder="Search stocks, crypto, forex..." compact />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Market Status */}
          <div style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: status.color, letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: status.color, marginRight: 5, verticalAlign: 'middle', boxShadow: `0 0 6px ${status.color}` }} />
            {status.label}
          </div>

          {user ? (
            /* Logged-in avatar + dropdown */
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(s => !s)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '5px 12px 5px 5px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,255,65,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
                    {initials}
                  </div>
                )}
                <span style={{ fontSize: 13, color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.full_name || user.email?.split('@')[0]}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 10, transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
              </button>

              {dropdownOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 180, background: 'rgba(10,14,26,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', overflow: 'hidden', animation: 'fadeInUp 0.2s ease' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{profile?.full_name || 'User'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>
                  </div>
                  {[
                    { href: '/dashboard', label: '⬡ Dashboard' },
                    { href: '/portfolio', label: '◈ Portfolio' },
                    { href: '/profile', label: '⚙ Profile' },
                  ].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setDropdownOpen(false)}
                      style={{ display: 'block', padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                      {item.label}
                    </Link>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={handleLogout}
                      style={{ display: 'block', width: '100%', padding: '10px 16px', fontSize: 13, color: '#ff6b6b', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,49,49,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      ↩ Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged-out buttons */
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/auth/login" style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-primary)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(s => !s)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', cursor: 'pointer' }} aria-label="Toggle menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,14,26,0.96)' }}>
          <div style={{ maxWidth: 1440, margin: '0 auto', padding: '12px 24px 16px', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/markets', label: 'Markets' },
              { href: '/portfolio', label: 'Portfolio' },
              { href: '/assistant', label: 'AI Assistant' },
              ...(user ? [{ href: '/profile', label: 'Profile' }] : []),
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14 }}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
