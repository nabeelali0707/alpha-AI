'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthProvider';
import { useToast } from '../../../components/Toast';

function getStrength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'];
  const colors = ['', '#ff3131', '#f59e0b', '#3b82f6', '#00ff41', '#00ff41'];
  return { score: s, label: labels[s] || 'Weak', color: colors[s] || '#ff3131' };
}

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: 'var(--text-primary)',
  fontSize: 14, outline: 'none',
};
const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 6,
  letterSpacing: '0.08em', textTransform: 'uppercase' as const,
};

export default function SignupPage() {
  const { signup } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const strength = getStrength(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) return setError('Please enter your full name.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await signup(email, password, fullName.trim());
      setSuccess(true);
      showToast('Account created! Check your email to confirm.', 'success');
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="glass" style={{ maxWidth: 400, width: '100%', padding: 40, textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 24, marginBottom: 12 }}>Check your inbox</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            We sent a confirmation link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
          </p>
          <Link href="/auth/login" className="btn btn-primary" style={{ display: 'inline-block', padding: '12px 28px' }}>Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ color: 'var(--accent-green)', fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>◈ NEW OPERATOR REGISTRATION</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-headline)', letterSpacing: '-0.02em', marginBottom: 8 }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Join AlphaAI and start investing smarter</p>
        </div>

        <div className="glass" style={{ padding: 32, borderRadius: 'var(--radius-xl)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={labelStyle}>Full Name</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Smith" autoComplete="name" required style={inputStyle} /></div>
            <div><label style={labelStyle}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" required style={{ ...inputStyle, paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15 }}>{showPass ? '🙈' : '👁'}</button>
              </div>
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />)}
                  </div>
                  <span style={{ fontSize: 11, color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required style={{ ...inputStyle, borderColor: confirmPassword && password !== confirmPassword ? 'rgba(255,49,49,0.5)' : 'rgba(255,255,255,0.1)' }} />
              {confirmPassword && password !== confirmPassword && <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>Passwords do not match</p>}
            </div>

            {error && <div style={{ padding: '10px 14px', background: 'rgba(255,49,49,0.1)', border: '1px solid rgba(255,49,49,0.3)', borderRadius: 8, fontSize: 13, color: '#ff6b6b' }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: 13, background: loading ? 'rgba(0,255,65,0.4)' : 'var(--accent-green)', color: '#003907', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(0,57,7,0.3)', borderTopColor: '#003907', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Creating…</> : 'Create Account'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
