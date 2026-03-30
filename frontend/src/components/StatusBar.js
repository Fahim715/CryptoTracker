import React from 'react';

export default function StatusBar({ connected, updateCount }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)',
    }}>
      {/* Live dot */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: connected ? 'var(--green)' : 'var(--red)',
          boxShadow: connected ? '0 0 6px var(--green)' : 'none',
          display: 'inline-block',
          animation: connected ? 'pulse 2s infinite' : 'none',
        }} />
        {connected ? 'LIVE' : 'DISCONNECTED'}
      </span>

      <span>│</span>

      <span>
        KAFKA → SSE → UI
      </span>

      <span>│</span>

      <span>
        {updateCount} updates
      </span>

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.4; }
        }
      `}</style>
    </div>
  );
}
