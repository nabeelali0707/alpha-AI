'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../components/Toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the token in the URL hash; the client picks it up automatically
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else setError('Invalid or expired reset link. Please request a new one.');
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      showToast('Password updated successfully!', 'success');
      setTimeout(() => router.replace('/auth/login'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ color: 'var(--accent-green)', fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>🔒 SET NEW PASSWORD</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-headline)', letterSpacing: '-0.02em', marginBottom: 8 }}>Reset Password</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Choose a strong new password</p>
        </div>

        <div className="glass" style={{ padding: 32, borderRadius: 'var(--radius-xl)' }}>
          {!ready && error ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
              <p style={{ color: '#ff6b6b', fontSize: 14, marginBottom: 20 }}>{error}</p>
              <a href="/auth/forgot-password" style={{ color: 'var(--accent-blue)', fontSize: 14, fontWeight: 600 }}>Request new reset link</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" required autoComplete="new-password"
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required autoComplete="new-password"
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${confirmPassword && password !== confirmPassword ? 'rgba(255,49,49,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
              </div>

              {error && <div style={{ padding: '10px 14px', background: 'rgba(255,49,49,0.1)', border: '1px solid rgba(255,49,49,0.3)', borderRadius: 8, fontSize: 13, color: '#ff6b6b' }}>{error}</div>}

              <button type="submit" disabled={loading || !ready}
                style={{ width: '100%', padding: 13, background: loading ? 'rgba(0,255,65,0.4)' : 'var(--accent-green)', color: '#003907', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(0,57,7,0.3)', borderTopColor: '#003907', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Updating…</> : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
