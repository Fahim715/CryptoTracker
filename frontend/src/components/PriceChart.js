import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

function fmt(ts) {
  const d = new Date(ts);
  return d.getHours().toString().padStart(2,'0') + ':' +
         d.getMinutes().toString().padStart(2,'0') + ':' +
         d.getSeconds().toString().padStart(2,'0');
}

function fmtPrice(p) {
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return '$' + p.toFixed(2);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#0d1220', border: '1px solid #1a2236',
      borderRadius: 8, padding: '8px 14px', fontSize: 12,
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ color: '#546e8a', marginBottom: 4 }}>{fmt(d.ts)}</div>
      <div style={{ color: '#00e5ff', fontWeight: 700 }}>{fmtPrice(d.price)}</div>
    </div>
  );
};

export default function PriceChart({ data, symbol, color = '#00e5ff' }) {
  if (!data || data.length < 2) {
    return (
      <div style={{
        height: 220, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--muted)', fontSize: 13,
        fontFamily: 'var(--font-mono)',
      }}>
        {data?.length === 0
          ? '— waiting for data —'
          : '— receiving first ticks —'}
      </div>
    );
  }

  const prices = data.map(d => d.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const pad  = (maxP - minP) * 0.1 || maxP * 0.01;

  const chartData = data.map(d => ({
    ts: d.ts || new Date(d.timestamp).getTime(),
    price: d.price,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1a2236" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="ts" tickFormatter={fmt} tick={{ fontSize: 10, fill: '#546e8a' }}
          axisLine={false} tickLine={false} interval="preserveStartEnd"
        />
        <YAxis
          domain={[minP - pad, maxP + pad]}
          tickFormatter={fmtPrice}
          tick={{ fontSize: 10, fill: '#546e8a' }}
          axisLine={false} tickLine={false} width={70}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone" dataKey="price"
          stroke={color} strokeWidth={2}
          fill={`url(#grad-${symbol})`}
          dot={false} activeDot={{ r: 4, fill: color }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
