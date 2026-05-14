'use client';

import { useState } from 'react';
import { login, signup } from '@/lib/supabase/actions';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-md overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-fixed-dim/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]"></div>

      <div className="glass max-w-md w-full p-xl rounded-2xl relative z-10 border-t border-white/10 shadow-2xl">
        <div className="text-center mb-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-container mb-md">
            <span className="material-symbols-outlined text-4xl text-on-primary-container">terminal</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">AlphaAI Terminal</h1>
          <p className="font-body-md text-on-surface-variant">The future of financial intelligence</p>
        </div>

        {error && (
          <div className="mb-md p-sm bg-secondary-container/20 border border-secondary/30 rounded-lg text-secondary text-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-md" action={async (formData) => {
          setLoading(true);
          if (isLogin) {
            await login(formData);
          } else {
            await signup(formData);
          }
          setLoading(false);
        }}>
          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant ml-1" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="name@company.com"
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-md py-sm outline-none focus:border-primary-fixed transition-colors text-on-surface"
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant ml-1" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-md py-sm outline-none focus:border-primary-fixed transition-colors text-on-surface"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-md bg-primary-fixed text-on-primary-fixed rounded-xl font-label-lg hover:shadow-[0_0_20px_rgba(0,230,57,0.4)] transition-all active:scale-[0.98] mt-base disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-xl text-center">
          <p className="text-on-surface-variant text-body-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-fixed-dim ml-xs font-label-md hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
