import React from 'react';
import Link from 'next/link';

export default function Login() {
  return (
    <div className="flex-center" style={{ minHeight: '80vh', padding: 'var(--spacing-md)' }}>
      <div className="glass" style={{ maxWidth: '400px', width: '100%', padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div className="data-mono" style={{ color: 'var(--primary)', marginBottom: 'var(--spacing-xs)' }}>SECURE_CONNECTION_ESTABLISHED</div>
          <h1 className="headline-lg">Terminal Access</h1>
          <p style={{ opacity: 0.6, fontSize: '14px' }}>Please provide neural credentials</p>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ textAlign: 'left' }}>
            <label className="data-mono" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>OPERATOR_ID</label>
            <input 
              type="text" 
              placeholder="user@alphaai.io"
              style={{ 
                width: '100%', 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid var(--outline)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '12px', 
                color: 'white' 
              }}
            />
          </div>
          <div style={{ textAlign: 'left' }}>
            <label className="data-mono" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>ENCRYPTION_KEY</label>
            <input 
              type="password" 
              placeholder="••••••••••••"
              style={{ 
                width: '100%', 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid var(--outline)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '12px', 
                color: 'white' 
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--spacing-sm)' }}>
            BYPASS AUTHENTICATION
          </button>
        </form>

        <div style={{ marginTop: 'var(--spacing-lg)', fontSize: '14px', opacity: 0.5 }}>
          New operator? <Link href="#" style={{ color: 'var(--tertiary)' }}>Request Clearance</Link>
        </div>

        <div style={{ marginTop: 'var(--spacing-md)', fontSize: '10px', opacity: 0.3 }} className="data-mono">
          WARNING: UNAUTHORIZED ACCESS ATTEMPT WILL BE LOGGED. IP_TRACER_ACTIVE.
        </div>
      </div>
    </div>
  );
}
