import React from 'react';

export default function Portfolio() {
  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-md)' }}>
      <h1 className="headline-lg">Neural Portfolio</h1>
      <p className="data-mono" style={{ opacity: 0.5, marginBottom: 'var(--spacing-lg)' }}>TRACKING_ASSETS_IN_REAL_TIME</p>
      
      <div className="glass" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <p style={{ opacity: 0.7 }}>Portfolio data is being synced from your brokerage accounts.</p>
        <div style={{ marginTop: 'var(--spacing-md)', fontSize: '48px' }}>◌</div>
        <p className="data-mono" style={{ fontSize: '12px', color: 'var(--primary)', marginTop: 'var(--spacing-md)' }}>SYNC_STATUS: 82% COMPLETE</p>
      </div>
    </div>
  );
}
