import React from 'react';
export default function StatusBar({ connected, updateCount }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14,
      fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: connected ? '#4fffb0' : '#ff4f6a',
          boxShadow: connected ? '0 0 8px #4fffb0' : 'none',
          display: 'inline-block',
        }}/>
        {connected ? 'LIVE' : 'OFFLINE'}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
      <span>{updateCount} ticks</span>
    </div>
  );
}
