import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function fmt(ts) {
  const d = new Date(ts);
  return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+':'+d.getSeconds().toString().padStart(2,'0');
}
function fmtP(p) {
  if (p >= 1000) return '$'+p.toLocaleString('en-US',{maximumFractionDigits:0});
  return '$'+p.toFixed(2);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background:'rgba(8,8,20,0.9)', border:'1px solid rgba(255,255,255,0.1)',
      borderRadius:10, padding:'8px 14px', fontSize:11, fontFamily:'var(--font-mono)',
      backdropFilter:'blur(20px)' }}>
      <div style={{ color:'rgba(255,255,255,0.3)', marginBottom:4 }}>{fmt(d.ts)}</div>
      <div style={{ color:'white', fontWeight:500 }}>{fmtP(d.price)}</div>
    </div>
  );
};

export default function PriceChart({ data, symbol, color='#7b8fff' }) {
  if (!data || data.length < 2) return (
    <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center',
      color:'rgba(255,255,255,0.2)', fontSize:12, fontFamily:'var(--font-mono)' }}>
      — waiting for data —
    </div>
  );
  const prices = data.map(d => d.price);
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const pad = (maxP-minP)*0.1||maxP*0.01;
  const chartData = data.map(d => ({ ts: d.ts||new Date(d.timestamp).getTime(), price: d.price }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{top:8,right:8,left:0,bottom:0}}>
        <defs>
          <linearGradient id={`g-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.2}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false}/>
        <XAxis dataKey="ts" tickFormatter={fmt}
          tick={{ fontSize:10, fill:'rgba(255,255,255,0.25)' }}
          axisLine={false} tickLine={false} interval="preserveStartEnd"/>
        <YAxis domain={[minP-pad,maxP+pad]} tickFormatter={fmtP}
          tick={{ fontSize:10, fill:'rgba(255,255,255,0.25)' }}
          axisLine={false} tickLine={false} width={70}/>
        <Tooltip content={<CustomTooltip/>}/>
        <Area type="monotone" dataKey="price" stroke={color} strokeWidth={1.5}
          fill={`url(#g-${symbol})`} dot={false}
          activeDot={{ r:4, fill:color, strokeWidth:0 }} isAnimationActive={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}
