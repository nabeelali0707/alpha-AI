'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthProvider';
import { useToast } from '../../components/Toast';

export default function ProfilePage() {
  const { user, profile, logout, updateProfile } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Keep input in sync when profile loads
  React.useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName.trim() });
      showToast('Profile updated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/');
    } catch {
      showToast('Logout failed', 'error');
      setLoggingOut(false);
    }
  }

  const initials = (profile?.full_name || user?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <span style={{ color: 'var(--accent-green)', fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 600 }}>◈ OPERATOR PROFILE</span>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-headline)', marginTop: 6 }}>Account Settings</h1>
        </div>

        {/* Avatar + Info Card */}
        <div className="glass" style={{ padding: 32, borderRadius: 'var(--radius-xl)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28 }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid var(--accent-green)', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: 'white', border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                {initials}
              </div>
            )}
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{profile?.full_name || 'No name set'}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{user?.email}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Joined {joinedDate}</div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Full Name</label>
              <input
                type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                style={{ width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email</label>
              <input
                type="email" value={user?.email || ''} disabled
                style={{ width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: 'var(--text-muted)', fontSize: 14, cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed here</p>
            </div>
            <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
              <button type="submit" disabled={saving} style={{ padding: '11px 24px', background: saving ? 'rgba(59,130,246,0.4)' : 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                {saving ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Saving…</> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Stats */}
        <div className="glass" style={{ padding: 24, borderRadius: 'var(--radius-xl)', marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
          {[
            { label: 'Account Status', value: '✓ Active', color: 'var(--accent-green)' },
            { label: 'Auth Provider', value: user?.app_metadata?.provider || 'email', color: 'var(--accent-blue)' },
            { label: 'User ID', value: user?.id?.slice(0, 8) + '…', color: 'var(--text-secondary)' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: 16, fontWeight: 700, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="glass" style={{ padding: 24, borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Sign Out</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Log out of your AlphaAI account</div>
          </div>
          <button onClick={handleLogout} disabled={loggingOut}
            style={{ padding: '10px 22px', background: 'rgba(255,49,49,0.1)', border: '1px solid rgba(255,49,49,0.3)', color: '#ff6b6b', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loggingOut ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
            {loggingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
