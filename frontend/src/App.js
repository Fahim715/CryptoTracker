import React, { useEffect, useState } from 'react';
import { useLivePrices } from './hooks/useLivePrices';
import { useInitialPrices, usePriceHistory, useIndicators, useCandles, useAlerts, useSystemStats } from './hooks/useApiData';
import CoinCard        from './components/CoinCard';
import PriceChart      from './components/PriceChart';
import CandleChart     from './components/CandleChart';
import StatusBar       from './components/StatusBar';
import IndicatorsPanel from './components/IndicatorsPanel';
import AlertsPanel     from './components/AlertsPanel';

const SYMBOLS     = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA'];
const COIN_COLORS = { BTC: '#f7931a', ETH: '#627eea', BNB: '#f3ba2f', SOL: '#9945ff', ADA: '#3cc8c8' };
const COIN_LOGOS  = {
  BTC: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/btc.png',
  ETH: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/eth.png',
  BNB: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/bnb.png',
  SOL: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/sol.png',
  ADA: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/ada.png',
};
const TABS        = ['CHART', 'CANDLES', 'INDICATORS', 'ALERTS'];

// Floating coin bubble positions (match the screenshot layout)
const FLOAT_COINS = [
  { sym: 'BTC', x: '8%',  y: '18%', delay: 0 },
  { sym: 'ETH', x: '88%', y: '16%', delay: 1.2 },
  { sym: 'BNB', x: '5%',  y: '42%', delay: 0.6 },
  { sym: 'SOL', x: '91%', y: '40%', delay: 1.8 },
  { sym: 'ADA', x: '50%', y: '8%',  delay: 0.9 },
];

function fmtLarge(n) {
  if (!n) return '—';
  if (n >= 1e12) return '$' + (n/1e12).toFixed(2)+'T';
  if (n >= 1e9)  return '$' + (n/1e9).toFixed(2)+'B';
  if (n >= 1e6)  return '$' + (n/1e6).toFixed(2)+'M';
  return '$' + n.toLocaleString();
}
function fmtPrice(p) {
  if (!p) return '—';
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return '$' + p.toFixed(2);
}

export default function App() {
  const [page, setPage]         = useState('home'); // 'home' | 'dashboard'
  const [selected, setSelected] = useState('BTC');
  const [tab, setTab]           = useState('CHART');
  const [updateCount, setUpdateCount] = useState(0);
  const [candleInterval, setCandleInterval] = useState('5m');
  const [chartDeadlinePassed, setChartDeadlinePassed] = useState(false);

  const { prices: live, history, connected, triggeredAlerts } = useLivePrices('/api');
  const { initial } = useInitialPrices('/api');
  const [prices, setPrices] = useState({});
  const { data: historyFallback } = usePriceHistory(selected, 24, '/api');

  const { data: indicators } = useIndicators(selected);
  const { data: candles }    = useCandles(selected, candleInterval);
  const { alerts, createAlert, deleteAlert } = useAlerts();
  const stats = useSystemStats();

  useEffect(() => {
    if (initial.length) {
      const map = {};
      initial.forEach(p => { map[p.symbol] = p; });
      setPrices(map);
    }
  }, [initial]);

  useEffect(() => {
    if (Object.keys(live).length) {
      setPrices(prev => ({ ...prev, ...live }));
      setUpdateCount(c => c + 1);
    }
  }, [live]);

  useEffect(() => {
    setChartDeadlinePassed(false);
    const id = setTimeout(() => setChartDeadlinePassed(true), 10000);
    return () => clearTimeout(id);
  }, [selected]);

  const coin = prices[selected];
  const liveChartData = history[selected] || [];
  const fallbackData = (historyFallback || []).map(d => ({
    price: d.price,
    ts: new Date(d.timestamp).getTime(),
  }));

  // Keep chart responsive: use live stream when available, then API history,
  // and finally seed with the latest known price after the 10s deadline.
  const chartData = (() => {
    if (liveChartData.length >= 2) return liveChartData;

    if (fallbackData.length >= 2) {
      const merged = [...fallbackData];
      if (coin?.price) {
        const latestTs = coin.timestamp ? new Date(coin.timestamp).getTime() : Date.now();
        const lastTs = merged[merged.length - 1]?.ts || 0;
        if (latestTs > lastTs) merged.push({ price: coin.price, ts: latestTs });
      }
      return merged.slice(-60);
    }

    if (chartDeadlinePassed && coin?.price) {
      const nowTs = coin.timestamp ? new Date(coin.timestamp).getTime() : Date.now();
      return [
        { price: coin.price, ts: nowTs - 1000 },
        { price: coin.price, ts: nowTs },
      ];
    }

    return [];
  })();

  // ─── LANDING PAGE ────────────────────────────────────────────────────────────
  if (page === 'home') {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        overflow: 'hidden', position: 'relative',
        fontFamily: 'var(--font-sans)',
      }}>
        {/* ── Stars background ── */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: `
            radial-gradient(ellipse at 50% 0%, #1a1f4a 0%, transparent 60%),
            radial-gradient(ellipse at 20% 50%, #0d0f2a 0%, transparent 50%),
            #040408
          `,
        }}/>

        {/* ── Noise texture overlay ── */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1, opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}/>

        {/* ── Large arch / planet shape ── */}
        <div style={{
          position: 'absolute', left: '50%', top: '60px',
          transform: 'translateX(-50%)',
          width: 900, height: 900,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at 50% 30%, #1c1f3a 0%, #0a0b1a 40%, #040408 70%)`,
          border: '1px solid rgba(255,255,255,0.06)',
          zIndex: 1,
          boxShadow: `
            0 0 120px 40px rgba(20,30,80,0.5),
            inset 0 1px 0 rgba(255,255,255,0.08)
          `,
        }}/>

        {/* ── Light beam ── */}
        <div style={{
          position: 'absolute', left: '50%', top: 0,
          transform: 'translateX(-50%)',
          width: 3, height: '65%',
          background: 'linear-gradient(to bottom, #6080ff, #3050cc44, transparent)',
          zIndex: 2,
          animation: 'beamPulse 3s ease-in-out infinite',
          filter: 'blur(1px)',
        }}/>
        {/* Beam glow */}
        <div style={{
          position: 'absolute', left: '50%', top: 0,
          transform: 'translateX(-50%)',
          width: 80, height: '55%',
          background: 'linear-gradient(to bottom, rgba(80,110,255,0.15), transparent)',
          zIndex: 2,
          animation: 'beamPulse 3s ease-in-out infinite',
          filter: 'blur(20px)',
        }}/>

        {/* ── Floating coin bubbles ── */}
        {FLOAT_COINS.map(({ sym, x, y, delay }) => {
          const p = prices[sym];
          const col = COIN_COLORS[sym];
          return (
            <div key={sym} style={{
              position: 'absolute', left: x, top: y,
              zIndex: 4,
              animation: `float 4s ease-in-out ${delay}s infinite`,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(10,12,28,0.7)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 40, padding: '8px 14px 8px 8px',
                backdropFilter: 'blur(20px)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${col}55, ${col}11)`,
                  border: `1px solid ${col}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <img
                    src={COIN_LOGOS[sym]}
                    alt={`${sym} logo`}
                    style={{ width: 18, height: 18, borderRadius: '50%' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                    {p ? (p.name.split(' ')[0]) : sym}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)',
                    fontFamily: 'var(--font-mono)' }}>
                    {p ? (p.price >= 1000
                      ? p.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
                      : p.price.toFixed(2))
                    : '…'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Navbar ── */}
        <nav style={{
          position: 'relative', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 48px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>


        </nav>

        {/* ── Hero text ── */}
        <div style={{
          position: 'relative', zIndex: 5,
          textAlign: 'center',
          marginTop: '80px',
          animation: 'fadeUp 1s ease both',
        }}>
          {/* Main headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(56px, 8vw, 96px)',
            fontWeight: 300,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: 'rgba(255,255,255,0.92)',
            margin: '0 auto 10px',
          }}>
            CryptoTrack Odyssey
          </h1>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 300,
            lineHeight: 1.1,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '-0.02em',
            marginBottom: 24,
          }}>
            Track Real-Time Cryptocurrency Price
          </h2>

          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.4)',
            maxWidth: 520, margin: '0 auto 40px',
            lineHeight: 1.6, fontWeight: 300,
          }}>
            Real-time blockchain price intelligence — Kafka-powered streaming,
            technical analysis, and live market data.
          </p>

          <button onClick={() => setPage('dashboard')} style={{
            background: 'white', color: '#040408',
            border: 'none', borderRadius: 40,
            padding: '14px 36px', fontSize: 14,
            fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            boxShadow: '0 0 40px rgba(255,255,255,0.15)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseOver={e => { e.target.style.transform='scale(1.03)'; e.target.style.boxShadow='0 0 60px rgba(255,255,255,0.25)'; }}
            onMouseOut={e => { e.target.style.transform='scale(1)'; e.target.style.boxShadow='0 0 40px rgba(255,255,255,0.15)'; }}
          >
            Open Dashboard
          </button>
        </div>

        <style>{`
          @keyframes float {
            0%,100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes beamPulse {
            0%,100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // ─── DASHBOARD PAGE ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      {/* Subtle background glow */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 0%, #10163a 0%, transparent 50%)`,
      }}/>

      {/* ── Header ── */}
      <header style={{
        position: 'relative', zIndex: 10,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(20px)',
        background: 'rgba(4,4,8,0.8)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setPage('home')} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18,
            fontWeight: 400, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>
            CryptoTrack
          </span>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4,
            background: 'rgba(123,143,255,0.12)', color: '#7b8fff',
            border: '1px solid rgba(123,143,255,0.25)',
            fontFamily: 'var(--font-mono)' }}>LIVE</span>
        </div>


        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* System stats */}
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)',
            color: 'rgba(255,255,255,0.3)', display: 'flex', gap: 12 }}>
            <span>TOKENS <span style={{ color: '#7b8fff' }}>{stats.rateLimiterTokens ?? '…'}</span></span>
            <span>WS <span style={{ color: '#7b8fff' }}>{stats.wsConnectedClients ?? '…'}</span></span>
          </div>
          <StatusBar connected={connected} updateCount={updateCount} />
          <button onClick={() => setPage('home')} style={{
            background: 'white',
            border: 'none',
            borderRadius: 20, padding: '6px 16px',
            color: '#040408', fontSize: 12,
            fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}>← Home</button>
        </div>
      </header>

      {/* ── Dashboard body ── */}
      <main style={{
        position: 'relative', zIndex: 1,
        display: 'flex', height: 'calc(100vh - 57px)',
      }}>
        {/* ── Sidebar ── */}
        <aside style={{
          width: 272, minWidth: 272,
          borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '16px 14px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 8,
          background: 'rgba(255,255,255,0.01)',
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)',
            fontFamily: 'var(--font-mono)', marginBottom: 4,
            letterSpacing: '0.12em', padding: '0 4px' }}>TRACKED ASSETS</div>
          {SYMBOLS.map(sym => {
            const p = prices[sym];
            if (!p) return (
              <div key={sym} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: '14px 16px',
                color: 'rgba(255,255,255,0.2)', fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}>{sym} — loading…</div>
            );
            return <CoinCard key={sym} price={p} selected={selected === sym}
              onClick={() => setSelected(sym)} />;
          })}
        </aside>

        {/* ── Detail ── */}
        <section style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>

          {/* Price header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                {coin?.name || selected} / USD
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 48,
                color: COIN_COLORS[selected] || 'white', letterSpacing: '-0.02em',
              }}>
                {fmtPrice(coin?.price)}
              </div>
            </div>
            {coin && (
              <div style={{ marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: 13,
                color: coin.change24h >= 0 ? '#4fffb0' : '#ff4f6a' }}>
                {coin.change24h >= 0 ? '▲' : '▼'} {Math.abs(coin.change24h).toFixed(2)}% (24h)
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 2, marginBottom: 20,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 30, padding: '3px 5px',
            width: 'fit-content',
          }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? 'rgba(255,255,255,0.08)' : 'none',
                border: 'none', borderRadius: 24,
                color: tab === t ? 'white' : 'rgba(255,255,255,0.4)',
                padding: '7px 18px', fontSize: 11,
                fontFamily: 'var(--font-mono)', cursor: 'pointer',
                letterSpacing: '0.05em', transition: 'all 0.2s',
              }}>{t}</button>
            ))}
          </div>

          {/* ── CHART ── */}
          {tab === 'CHART' && (
            <>
              <div style={{ background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20,
                padding: '20px 20px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)',
                  fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                  LIVE PRICE — {selected}/USD
                  <span style={{ marginLeft: 10, color: '#7b8fff', fontSize: 10 }}>
                    ● Kafka → SSE → React
                  </span>
                </div>
                <PriceChart data={chartData} symbol={selected}
                  color={COIN_COLORS[selected] || '#7b8fff'} />
              </div>
              {coin && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {[
                    { label: 'MARKET CAP',  value: fmtLarge(coin.marketCap) },
                    { label: '24H VOLUME',  value: fmtLarge(coin.volume24h) },
                    { label: 'LAST UPDATE', value: new Date(coin.timestamp).toLocaleTimeString() },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 16, padding: '14px 18px' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)',
                        fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300,
                        fontSize: 22, letterSpacing: '-0.01em' }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── CANDLES ── */}
          {tab === 'CANDLES' && (
            <div style={{ background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20,
              padding: '20px 20px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)',
                  fontFamily: 'var(--font-mono)' }}>OHLCV — {selected}</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['1m','5m','1h'].map(iv => (
                    <button key={iv} onClick={() => setCandleInterval(iv)} style={{
                      background: candleInterval === iv ? 'rgba(255,255,255,0.1)' : 'none',
                      color: candleInterval === iv ? 'white' : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${candleInterval === iv ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 8, padding: '4px 12px',
                      fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer',
                    }}>{iv}</button>
                  ))}
                </div>
              </div>
              <CandleChart data={candles} color={COIN_COLORS[selected] || '#7b8fff'} />
              <div style={{ marginTop: 10, fontSize: 10,
                color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}>
                {candles?.length || 0} candles · aggregated from Kafka ticks
              </div>
            </div>
          )}

          {/* ── INDICATORS ── */}
          {tab === 'INDICATORS' && (
            <div style={{ background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20,
              padding: '20px 20px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
                TECHNICAL INDICATORS — {selected}
              </div>
              <IndicatorsPanel data={indicators} symbol={selected} />
            </div>
          )}

          {/* ── ALERTS ── */}
          {tab === 'ALERTS' && (
            <div style={{ background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20,
              padding: '20px 20px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
                PRICE ALERTS
              </div>
              <AlertsPanel alerts={alerts} createAlert={createAlert}
                deleteAlert={deleteAlert} triggered={triggeredAlerts} symbol={selected} />
            </div>
          )}

          {/* Pipeline footer */}
          <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12,
            padding: '10px 16px', fontSize: 10,
            color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)',
            lineHeight: 1.8 }}>
            <span style={{ color: '#7b8fff' }}>PIPELINE:</span>
            {'  '}CoinGecko → RateLimiter → Kafka (crypto-prices)
            {' → '}Consumer → MongoDB + Candles + Alerts + SSE + WebSocket
            {' → '}React
          </div>
        </section>
      </main>
    </div>
  );
}
