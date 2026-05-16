'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthProvider';
import { useToast } from '../../../components/Toast';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) return setError('Please enter your email address.');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      showToast('Password reset email sent!', 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ color: 'var(--accent-yellow)', fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>⚠ PASSWORD RECOVERY</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-headline)', letterSpacing: '-0.02em', marginBottom: 8 }}>Forgot Password</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Enter your email to receive a reset link</p>
        </div>

        <div className="glass" style={{ padding: 32, borderRadius: 'var(--radius-xl)' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
              <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 20, marginBottom: 12 }}>Email Sent!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                We sent a password reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Check your inbox and follow the instructions.
              </p>
              <Link href="/auth/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>← Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email"
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(255,49,49,0.1)', border: '1px solid rgba(255,49,49,0.3)', borderRadius: 8, fontSize: 13, color: '#ff6b6b' }}>{error}</div>
              )}

              <button type="submit" disabled={loading} style={{ width: '100%', padding: 13, background: loading ? 'rgba(59,130,246,0.4)' : 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Sending…</> : 'Send Reset Link'}
              </button>

              <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
                <Link href="/auth/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>← Back to Login</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
