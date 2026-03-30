import React from 'react';

const RSI_COLOR = (v) => {
  if (v >= 70) return '#ff1744';
  if (v <= 30) return '#00e676';
  return '#00e5ff';
};

const TREND_COLOR = { BULLISH: '#00e676', BEARISH: '#ff1744', NEUTRAL: '#546e8a' };
const TREND_ICON  = { BULLISH: '▲', BEARISH: '▼', NEUTRAL: '—' };

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0',
      borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700,
        color: color || 'var(--text)' }}>{value}</span>
    </div>
  );
}

export default function IndicatorsPanel({ data, symbol }) {
  if (!data) return (
    <div style={{ padding: 16, color: 'var(--muted)', fontSize: 12,
      fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
      Loading indicators…
    </div>
  );

  const fmt = (v) => v != null ? v.toFixed(2) : '—';
  const fmtPrice = (v) => v != null ? '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—';

  return (
    <div>
      {/* Trend Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>TREND</span>
        <span style={{
          padding: '3px 10px', borderRadius: 4, fontSize: 11,
          fontFamily: 'var(--font-mono)', fontWeight: 700,
          background: TREND_COLOR[data.trend] + '22',
          color: TREND_COLOR[data.trend],
          border: `1px solid ${TREND_COLOR[data.trend]}44`,
        }}>
          {TREND_ICON[data.trend]} {data.trend}
        </span>
      </div>

      {/* RSI with bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>RSI (14)</span>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700,
            color: RSI_COLOR(data.rsi) }}>{fmt(data.rsi)}</span>
        </div>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(data.rsi || 50, 100)}%`,
            background: RSI_COLOR(data.rsi), borderRadius: 2,
            transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 9, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>OVERSOLD 30</span>
          <span style={{ fontSize: 9, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>70 OVERBOUGHT</span>
        </div>
      </div>

      {/* MACD */}
      <Row label="MACD" value={fmt(data.macd)}
        color={data.macd > 0 ? '#00e676' : '#ff1744'} />
      <Row label="MACD Signal" value={fmt(data.macdSignal)} />
      <Row label="MACD Histogram" value={fmt(data.macdHistogram)}
        color={data.macdHistogram > 0 ? '#00e676' : '#ff1744'} />

      {/* Moving Averages */}
      <div style={{ marginTop: 8, marginBottom: 4, fontSize: 10,
        color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>MOVING AVERAGES</div>
      <Row label="SMA (20)" value={fmtPrice(data.sma20)} />
      <Row label="EMA (12)" value={fmtPrice(data.ema12)} />
      <Row label="EMA (26)" value={fmtPrice(data.ema26)} />

      {/* Bollinger Bands */}
      <div style={{ marginTop: 8, marginBottom: 4, fontSize: 10,
        color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>BOLLINGER BANDS</div>
      <Row label="Upper" value={fmtPrice(data.bollingerUpper)} color="#ff1744" />
      <Row label="Middle" value={fmtPrice(data.bollingerMiddle)} />
      <Row label="Lower" value={fmtPrice(data.bollingerLower)} color="#00e676" />
    </div>
  );
}
