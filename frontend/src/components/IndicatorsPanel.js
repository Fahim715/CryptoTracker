import React from 'react';

const RSI_COLOR = v => v >= 70 ? '#ff4f6a' : v <= 30 ? '#4fffb0' : '#7b8fff';
const TREND_COLOR = { BULLISH: '#4fffb0', BEARISH: '#ff4f6a', NEUTRAL: 'rgba(255,255,255,0.3)' };
const TREND_ICON  = { BULLISH: '▲', BEARISH: '▼', NEUTRAL: '—' };

function Row({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 0',
      borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'var(--font-mono)' }}>{label}</span>
      <span style={{ fontSize:12, fontFamily:'var(--font-mono)', fontWeight:500,
        color: color||'rgba(255,255,255,0.8)' }}>{value}</span>
    </div>
  );
}

export default function IndicatorsPanel({ data, symbol }) {
  if (!data) return (
    <div style={{ padding:16, color:'rgba(255,255,255,0.2)', fontSize:12,
      fontFamily:'var(--font-mono)', textAlign:'center' }}>Loading indicators…</div>
  );
  const fmt = v => v!=null ? v.toFixed(2) : '—';
  const fmtP = v => v!=null ? '$'+v.toLocaleString('en-US',{maximumFractionDigits:2}) : '—';

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:'var(--font-mono)' }}>TREND</span>
        <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11,
          fontFamily:'var(--font-mono)', fontWeight:500,
          background: TREND_COLOR[data.trend]+'18',
          color: TREND_COLOR[data.trend],
          border:`1px solid ${TREND_COLOR[data.trend]}33` }}>
          {TREND_ICON[data.trend]} {data.trend}
        </span>
      </div>

      {/* RSI bar */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'var(--font-mono)' }}>RSI (14)</span>
          <span style={{ fontSize:12, fontFamily:'var(--font-mono)', fontWeight:500,
            color: RSI_COLOR(data.rsi) }}>{fmt(data.rsi)}</span>
        </div>
        <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${Math.min(data.rsi||50,100)}%`,
            background: RSI_COLOR(data.rsi), borderRadius:2, transition:'width 0.5s' }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
          <span style={{ fontSize:9, color:'#4fffb0', fontFamily:'var(--font-mono)' }}>OVERSOLD 30</span>
          <span style={{ fontSize:9, color:'#ff4f6a', fontFamily:'var(--font-mono)' }}>70 OVERBOUGHT</span>
        </div>
      </div>

      <Row label="MACD" value={fmt(data.macd)} color={data.macd>0?'#4fffb0':'#ff4f6a'}/>
      <Row label="MACD Signal" value={fmt(data.macdSignal)}/>
      <Row label="MACD Histogram" value={fmt(data.macdHistogram)}
        color={data.macdHistogram>0?'#4fffb0':'#ff4f6a'}/>
      <div style={{ marginTop:12, marginBottom:4, fontSize:10,
        color:'rgba(255,255,255,0.2)', fontFamily:'var(--font-mono)' }}>MOVING AVERAGES</div>
      <Row label="SMA (20)" value={fmtP(data.sma20)}/>
      <Row label="EMA (12)" value={fmtP(data.ema12)}/>
      <Row label="EMA (26)" value={fmtP(data.ema26)}/>
      <div style={{ marginTop:12, marginBottom:4, fontSize:10,
        color:'rgba(255,255,255,0.2)', fontFamily:'var(--font-mono)' }}>BOLLINGER BANDS</div>
      <Row label="Upper" value={fmtP(data.bollingerUpper)} color="#ff4f6a"/>
      <Row label="Middle" value={fmtP(data.bollingerMiddle)}/>
      <Row label="Lower" value={fmtP(data.bollingerLower)} color="#4fffb0"/>
    </div>
  );
}
