import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

function fmt(ts, interval = '5m') {
  const d = new Date(ts);
  if (interval.endsWith('d')) {
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  }
  return d.getHours().toString().padStart(2, '0') + ':' +
         d.getMinutes().toString().padStart(2, '0');
}

const CustomTooltip = ({ active, payload, interval }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: '#0d1220', border: '1px solid #1a2236',
      borderRadius: 8, padding: '8px 14px', fontSize: 11,
      fontFamily: 'var(--font-mono)' }}>
      <div style={{ color: '#546e8a', marginBottom: 4 }}>{fmt(new Date(d.openTime).getTime(), interval)}</div>
      <div>O: <span style={{ color: '#fff' }}>${d.open?.toLocaleString()}</span></div>
      <div>H: <span style={{ color: '#00e676' }}>${d.high?.toLocaleString()}</span></div>
      <div>L: <span style={{ color: '#ff1744' }}>${d.low?.toLocaleString()}</span></div>
      <div>C: <span style={{ color: '#00e5ff' }}>${d.close?.toLocaleString()}</span></div>
    </div>
  );
};

export default function CandleChart({ data, interval = '5m', color = '#00e5ff' }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--muted)', fontSize: 12,
        fontFamily: 'var(--font-mono)' }}>
        — waiting for candle data —
      </div>
    );
  }

  // Build bar data: height = high-low, with open/close overlay
  const chartData = data.map(c => ({
    ...c,
    range: [c.low, c.high],
    body: Math.abs(c.close - c.open),
    bullish: c.close >= c.open,
  }));

  const prices = data.flatMap(c => [c.high, c.low]);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const pad  = (maxP - minP) * 0.05 || maxP * 0.01;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#1a2236" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="openTime"
          tickFormatter={v => fmt(new Date(v).getTime(), interval)}
          tick={{ fontSize: 10, fill: '#546e8a' }}
          axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis domain={[minP - pad, maxP + pad]}
          tickFormatter={v => '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          tick={{ fontSize: 10, fill: '#546e8a' }}
          axisLine={false} tickLine={false} width={72} />
        <Tooltip content={<CustomTooltip interval={interval} />} />
        {/* High-Low wick as thin line */}
        <Line dataKey="high" dot={false} stroke="#546e8a" strokeWidth={1}
          isAnimationActive={false} />
        <Line dataKey="low" dot={false} stroke="#546e8a" strokeWidth={1}
          isAnimationActive={false} />
        {/* Close price line */}
        <Line dataKey="close" dot={false} stroke={color} strokeWidth={2}
          isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
