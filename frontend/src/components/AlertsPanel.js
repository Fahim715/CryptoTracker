import React, { useState } from 'react';

export default function AlertsPanel({ alerts, createAlert, deleteAlert, triggered, symbol }) {
  const [sym, setSym]    = useState(symbol || 'BTC');
  const [cond, setCond]  = useState('ABOVE');
  const [price, setPrice] = useState('');
  const [err, setErr]    = useState('');

  const handleCreate = () => {
    const p = parseFloat(price);
    if (!p || p <= 0) { setErr('Enter a valid price'); return; }
    createAlert(sym, cond, p);
    setPrice('');
    setErr('');
  };

  const inputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: 6, padding: '6px 10px',
    fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none',
  };

  return (
    <div>
      {/* Triggered Alert Toasts */}
      {triggered.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {triggered.slice(0, 3).map((a, i) => (
            <div key={i} style={{
              background: '#00e67618', border: '1px solid #00e67644',
              borderRadius: 6, padding: '6px 10px', marginBottom: 6,
              fontSize: 11, fontFamily: 'var(--font-mono)', color: '#00e676',
            }}>
              🔔 {a.symbol} {a.condition} ${a.targetPrice?.toLocaleString()} triggered @ ${a.currentPrice?.toLocaleString()}
            </div>
          ))}
        </div>
      )}

      {/* Create Alert Form */}
      <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 10,
        border: '1px solid var(--border)', marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
          marginBottom: 8 }}>NEW ALERT</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <select value={sym} onChange={e => setSym(e.target.value)} style={inputStyle}>
            {['BTC','ETH','BNB','SOL','ADA'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={cond} onChange={e => setCond(e.target.value)} style={inputStyle}>
            <option>ABOVE</option>
            <option>BELOW</option>
          </select>
          <input
            type="number" placeholder="Target $" value={price}
            onChange={e => setPrice(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            style={{ ...inputStyle, width: 100 }}
          />
          <button onClick={handleCreate} style={{
            background: 'var(--accent)', color: '#000', border: 'none',
            borderRadius: 6, padding: '6px 14px', fontSize: 12,
            fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer',
          }}>+ ADD</button>
        </div>
        {err && <div style={{ color: 'var(--red)', fontSize: 11, marginTop: 4 }}>{err}</div>}
      </div>

      {/* Alert List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alerts.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 12,
            fontFamily: 'var(--font-mono)', textAlign: 'center', padding: 8 }}>
            No alerts set
          </div>
        )}
        {alerts.map(a => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: a.triggered ? '#00e67608' : 'var(--bg)',
            border: `1px solid ${a.triggered ? '#00e67633' : 'var(--border)'}`,
            borderRadius: 6, padding: '6px 10px',
          }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--accent)', marginRight: 6 }}>{a.symbol}</span>
              <span style={{ color: a.condition === 'ABOVE' ? '#00e676' : '#ff1744',
                marginRight: 6 }}>{a.condition}</span>
              <span>${a.targetPrice?.toLocaleString()}</span>
              {a.triggered && <span style={{ color: '#00e676', marginLeft: 6 }}>✓ TRIGGERED</span>}
            </div>
            {!a.triggered && (
              <button onClick={() => deleteAlert(a.id)} style={{
                background: 'none', border: 'none', color: 'var(--muted)',
                cursor: 'pointer', fontSize: 14, padding: '0 4px',
              }}>×</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
