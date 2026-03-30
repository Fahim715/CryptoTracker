import React, { useEffect, useRef, useState } from 'react';

const COIN_COLORS = {
  BTC: '#f7931a', ETH: '#627eea', BNB: '#f3ba2f', SOL: '#9945ff', ADA: '#3cc8c8',
};
const COIN_LOGOS = {
  BTC: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/btc.png',
  ETH: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/eth.png',
  BNB: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/bnb.png',
  SOL: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/sol.png',
  ADA: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/ada.png',
};

function fmt(p) {
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 1)    return '$' + p.toFixed(2);
  return '$' + p.toFixed(4);
}
function fmtLarge(n) {
  if (n >= 1e12) return '$' + (n/1e12).toFixed(2)+'T';
  if (n >= 1e9)  return '$' + (n/1e9).toFixed(2)+'B';
  if (n >= 1e6)  return '$' + (n/1e6).toFixed(2)+'M';
  return '$' + n.toLocaleString();
}

export default function CoinCard({ price, selected, onClick }) {
  const { symbol, name, price: p, change24h, volume24h, marketCap } = price;
  const color    = COIN_COLORS[symbol] || '#7b8fff';
  const positive = change24h >= 0;
  const prevRef  = useRef(p);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (p !== prevRef.current) {
      setFlash(p > prevRef.current ? 'up' : 'down');
      prevRef.current = p;
      const t = setTimeout(() => setFlash(null), 700);
      return () => clearTimeout(t);
    }
  }, [p]);

  return (
    <div onClick={onClick} style={{
      background: selected
        ? `linear-gradient(135deg, ${color}18, ${color}08)`
        : 'rgba(255,255,255,0.03)',
      border: `1px solid ${selected ? color + '40' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 14,
      padding: '14px 16px',
      cursor: 'pointer',
      transition: 'all 0.25s',
      position: 'relative',
      overflow: 'hidden',
      outline: flash === 'up'   ? `1px solid #4fffb044`
             : flash === 'down' ? `1px solid #ff4f6a44` : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${color}44, ${color}11)`,
          border: `1px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <img
            src={COIN_LOGOS[symbol]}
            alt={`${symbol} logo`}
            style={{ width: 22, height: 22, borderRadius: '50%' }}
          />
        </div>
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)' }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{symbol}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 14,
            color: flash === 'up' ? '#4fffb0' : flash === 'down' ? '#ff4f6a' : 'var(--text)',
            transition: 'color 0.3s',
          }}>{fmt(p)}</div>
          <div style={{
            fontSize: 11, fontFamily: 'var(--font-mono)',
            color: positive ? '#4fffb0' : '#ff4f6a',
          }}>{positive ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}%</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
        <span>VOL <span style={{ color: 'rgba(255,255,255,0.6)' }}>{fmtLarge(volume24h)}</span></span>
        <span>CAP <span style={{ color: 'rgba(255,255,255,0.6)' }}>{fmtLarge(marketCap)}</span></span>
      </div>
    </div>
  );
}
