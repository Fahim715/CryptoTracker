import React, { useState } from 'react';

export default function AlertsPanel({ alerts, createAlert, deleteAlert, triggered, symbol }) {
  const [sym, setSym]    = useState(symbol||'BTC');
  const [cond, setCond]  = useState('ABOVE');
  const [price, setPrice] = useState('');
  const [err, setErr]    = useState('');

  const handleCreate = () => {
    const p = parseFloat(price);
    if (!p||p<=0) { setErr('Enter a valid price'); return; }
    createAlert(sym,cond,p);
    setPrice(''); setErr('');
  };

  const inp = {
    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
    color:'rgba(255,255,255,0.8)', borderRadius:8, padding:'7px 12px',
    fontSize:12, fontFamily:'var(--font-mono)', outline:'none',
  };

  return (
    <div>
      {triggered.length > 0 && (
        <div style={{ marginBottom:14 }}>
          {triggered.slice(0,3).map((a,i) => (
            <div key={i} style={{ background:'rgba(79,255,176,0.08)',
              border:'1px solid rgba(79,255,176,0.2)', borderRadius:8,
              padding:'7px 12px', marginBottom:6, fontSize:11,
              fontFamily:'var(--font-mono)', color:'#4fffb0' }}>
              🔔 {a.symbol} {a.condition} ${a.targetPrice?.toLocaleString()} hit @ ${a.currentPrice?.toLocaleString()}
              {a.explanation && (
                <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.82)', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                  {a.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ background:'rgba(255,255,255,0.02)',
        border:'1px solid rgba(255,255,255,0.07)', borderRadius:12,
        padding:'14px', marginBottom:14 }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)',
          fontFamily:'var(--font-mono)', marginBottom:10 }}>NEW ALERT</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <select value={sym} onChange={e=>setSym(e.target.value)} style={inp}>
            {['BTC','ETH','BNB','SOL','ADA'].map(s=><option key={s} style={{background:'#0a0a14'}}>{s}</option>)}
          </select>
          <select value={cond} onChange={e=>setCond(e.target.value)} style={inp}>
            <option style={{background:'#0a0a14'}}>ABOVE</option>
            <option style={{background:'#0a0a14'}}>BELOW</option>
          </select>
          <input type="number" placeholder="Target $" value={price}
            onChange={e=>setPrice(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleCreate()}
            style={{...inp, width:110}}/>
          <button onClick={handleCreate} style={{
            background:'rgba(123,143,255,0.15)', border:'1px solid rgba(123,143,255,0.3)',
            borderRadius:8, padding:'7px 16px', fontSize:12,
            fontFamily:'var(--font-mono)', color:'#a0b0ff', cursor:'pointer',
          }}>+ ADD</button>
        </div>
        {err && <div style={{color:'#ff4f6a',fontSize:11,marginTop:4}}>{err}</div>}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {alerts.length===0 && (
          <div style={{ color:'rgba(255,255,255,0.2)', fontSize:12,
            fontFamily:'var(--font-mono)', textAlign:'center', padding:10 }}>
            No alerts set
          </div>
        )}
        {alerts.map(a => (
          <div key={a.id} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            background: a.triggered ? 'rgba(79,255,176,0.04)' : 'rgba(255,255,255,0.02)',
            border:`1px solid ${a.triggered ? 'rgba(79,255,176,0.2)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius:8, padding:'8px 12px',
          }}>
            <div style={{fontSize:11,fontFamily:'var(--font-mono)'}}>
              <span style={{color:'#7b8fff',marginRight:6}}>{a.symbol}</span>
              <span style={{color:a.condition==='ABOVE'?'#4fffb0':'#ff4f6a',marginRight:6}}>{a.condition}</span>
              <span style={{color:'rgba(255,255,255,0.6)'}}>${a.targetPrice?.toLocaleString()}</span>
              {a.triggered&&<span style={{color:'#4fffb0',marginLeft:8}}>✓ TRIGGERED</span>}
            </div>
            {!a.triggered&&(
              <button onClick={()=>deleteAlert(a.id)} style={{
                background:'none', border:'none', color:'rgba(255,255,255,0.2)',
                cursor:'pointer', fontSize:16, padding:'0 4px',
              }}>×</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
