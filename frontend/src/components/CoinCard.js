import React, { useEffect, useRef, useState } from 'react';

const COIN_COLORS = {
  BTC: '#f7931a',
  ETH: '#627eea',
  BNB: '#f3ba2f',
  SOL: '#9945ff',
  ADA: '#0033ad',
};

const COIN_ICONS = {
  BTC: '₿',
  ETH: 'Ξ',
  BNB: 'B',
  SOL: '◎',
  ADA: '₳',
};

function formatPrice(p) {
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 1)    return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return '$' + p.toFixed(4);
}

function formatLarge(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(2) + 'M';
  return n.toLocaleString();
}

export default function CoinCard({ price, selected, onClick }) {
  const { symbol, name, price: p, change24h, volume24h, marketCap } = price;
  const color    = COIN_COLORS[symbol] || '#00e5ff';
  const positive = change24h >= 0;
  const prevRef  = useRef(p);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (p !== prevRef.current) {
      setFlash(p > prevRef.current ? 'up' : 'down');
      prevRef.current = p;
      const t = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(t);
    }
  }, [p]);

  return (
    <div onClick={onClick} style={{
      background: selected ? 'rgba(0,229,255,0.05)' : 'var(--surface)',
      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 12,
      padding: '16px 20px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative',
      overflow: 'hidden',
      outline: flash === 'up' ? '1px solid var(--green)' :
               flash === 'down' ? '1px solid var(--red)' : 'none',
    }}>
      {/* Accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 3,
        height: '100%', background: color, borderRadius: '12px 0 0 12px',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        {/* Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: color + '22', border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 16, color,
        }}>
          {COIN_ICONS[symbol] || symbol[0]}
        </div>

        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {symbol}
          </div>
        </div>

        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15,
            color: flash === 'up' ? 'var(--green)' : flash === 'down' ? 'var(--red)' : 'var(--text)',
            transition: 'color 0.3s',
          }}>
            {formatPrice(p)}
          </div>
          <div style={{
            fontSize: 12, fontFamily: 'var(--font-mono)',
            color: positive ? 'var(--green)' : 'var(--red)',
          }}>
            {positive ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}%
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)' }}>
        <span>VOL <span style={{ color: 'var(--text)' }}>{formatLarge(volume24h)}</span></span>
        <span>MCAP <span style={{ color: 'var(--text)' }}>{formatLarge(marketCap)}</span></span>
      </div>
    </div>
  );
}
