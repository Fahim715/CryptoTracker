import React, { useEffect, useState } from 'react';
import { useLivePrices }   from './hooks/useLivePrices';
import { useInitialPrices, useIndicators, useCandles, useAlerts, useSystemStats } from './hooks/useApiData';
import CoinCard        from './components/CoinCard';
import PriceChart      from './components/PriceChart';
import CandleChart     from './components/CandleChart';
import StatusBar       from './components/StatusBar';
import IndicatorsPanel from './components/IndicatorsPanel';
import AlertsPanel     from './components/AlertsPanel';

const SYMBOLS     = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA'];
const COIN_COLORS = { BTC: '#f7931a', ETH: '#627eea', BNB: '#f3ba2f', SOL: '#9945ff', ADA: '#0033ad' };
const TABS        = ['CHART', 'CANDLES', 'INDICATORS', 'ALERTS'];

export default function App() {
  const [selected, setSelected]         = useState('BTC');
  const [tab, setTab]                   = useState('CHART');
  const [updateCount, setUpdateCount]   = useState(0);
  const [candleInterval, setCandleInterval] = useState('5m');

  const { prices: live, history, connected, triggeredAlerts } = useLivePrices('/api');
  const { initial }   = useInitialPrices('/api');
  const [prices, setPrices] = useState({});

  const { data: indicators } = useIndicators(selected, '/api');
  const { data: candles }    = useCandles(selected, candleInterval, '/api');
  const { alerts, createAlert, deleteAlert } = useAlerts('/api');
  const stats = useSystemStats('/api');

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

  const coin      = prices[selected];
  const chartData = history[selected] || [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg,#00e5ff,#7b61ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>₿</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15,
            letterSpacing: '0.05em' }}>
            CRYPTO<span style={{ color: 'var(--accent)' }}>TRACK</span>
          </span>
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4,
            background: '#00e5ff18', color: 'var(--accent)',
            border: '1px solid #00e5ff33', fontFamily: 'var(--font-mono)' }}>
            SPRING + KAFKA + MONGO
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* System stats pills */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'TOKENS', value: stats.rateLimiterTokens ?? '…' },
              { label: 'WS CLIENTS', value: stats.wsConnectedClients ?? '…' },
            ].map(({ label, value }) => (
              <div key={label} style={{ fontSize: 10, fontFamily: 'var(--font-mono)',
                color: 'var(--muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
                <span>{label}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{value}</span>
              </div>
            ))}
          </div>
          <StatusBar connected={connected} updateCount={updateCount} />
        </div>
      </header>

      {/* ── Main layout ── */}
      <main style={{ display: 'flex', height: 'calc(100vh - 55px)' }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: 285, minWidth: 285, borderRight: '1px solid var(--border)',
          padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
            marginBottom: 2, letterSpacing: '0.1em' }}>TRACKED ASSETS</div>
          {SYMBOLS.map(sym => {
            const p = prices[sym];
            if (!p) return (
              <div key={sym} style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 18px', color: 'var(--muted)',
                fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                {sym} — loading…
              </div>
            );
            return (
              <CoinCard key={sym} price={p} selected={selected === sym}
                onClick={() => setSelected(sym)} />
            );
          })}
        </aside>

        {/* ── Detail panel ── */}
        <section style={{ flex: 1, padding: '20px 28px', overflowY: 'auto' }}>

          {/* Price header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
                marginBottom: 3 }}>{coin?.name || selected} / USD</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 32,
                color: COIN_COLORS[selected] || 'var(--accent)' }}>
                {coin ? (coin.price >= 1000
                  ? '$' + coin.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
                  : '$' + coin.price.toFixed(2)) : '—'}
              </div>
            </div>
            {coin && (
              <div style={{ marginBottom: 5, fontFamily: 'var(--font-mono)', fontSize: 13,
                color: coin.change24h >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {coin.change24h >= 0 ? '▲' : '▼'} {Math.abs(coin.change24h).toFixed(2)}% (24h)
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16,
            borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: 'none', border: 'none',
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                color: tab === t ? 'var(--accent)' : 'var(--muted)',
                fontFamily: 'var(--font-mono)', fontSize: 11, padding: '6px 14px',
                cursor: 'pointer', letterSpacing: '0.05em', marginBottom: -1,
              }}>{t}</button>
            ))}
          </div>

          {/* ── CHART TAB ── */}
          {tab === 'CHART' && (
            <>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '16px 18px 10px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
                  marginBottom: 10 }}>
                  LIVE PRICE — {selected}/USD
                  <span style={{ marginLeft: 10, color: 'var(--accent)', fontSize: 10 }}>
                    ● Kafka → SSE → React
                  </span>
                </div>
                <PriceChart data={chartData} symbol={selected}
                  color={COIN_COLORS[selected] || '#00e5ff'} />
              </div>
              {coin && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {[
                    { label: 'MARKET CAP',  value: fmtLarge(coin.marketCap) },
                    { label: '24H VOLUME',  value: fmtLarge(coin.volume24h) },
                    { label: 'LAST UPDATE', value: new Date(coin.timestamp).toLocaleTimeString() },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'var(--surface)',
                      border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)',
                        fontFamily: 'var(--font-mono)', marginBottom: 5 }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                        fontSize: 17 }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── CANDLES TAB ── */}
          {tab === 'CANDLES' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                  OHLCV CANDLES — {selected}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['1m', '5m', '1h'].map(iv => (
                    <button key={iv} onClick={() => setCandleInterval(iv)} style={{
                      background: candleInterval === iv ? 'var(--accent)' : 'var(--bg)',
                      color: candleInterval === iv ? '#000' : 'var(--muted)',
                      border: '1px solid var(--border)', borderRadius: 4,
                      padding: '3px 10px', fontSize: 11, fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                    }}>{iv}</button>
                  ))}
                </div>
              </div>
              <CandleChart data={candles} color={COIN_COLORS[selected] || '#00e5ff'} />
              <div style={{ marginTop: 12, fontSize: 10, color: 'var(--muted)',
                fontFamily: 'var(--font-mono)' }}>
                {candles?.length || 0} candles · aggregated from Kafka price ticks
              </div>
            </div>
          )}

          {/* ── INDICATORS TAB ── */}
          {tab === 'INDICATORS' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
                marginBottom: 12 }}>
                TECHNICAL INDICATORS — {selected}
                <span style={{ marginLeft: 10, color: 'var(--muted)', fontSize: 10 }}>
                  RSI · MACD · Bollinger Bands · SMA · EMA
                </span>
              </div>
              <IndicatorsPanel data={indicators} symbol={selected} />
            </div>
          )}

          {/* ── ALERTS TAB ── */}
          {tab === 'ALERTS' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
                marginBottom: 12 }}>
                PRICE ALERTS
                <span style={{ marginLeft: 10, color: 'var(--muted)', fontSize: 10 }}>
                  triggers via SSE when price threshold is hit
                </span>
              </div>
              <AlertsPanel
                alerts={alerts}
                createAlert={createAlert}
                deleteAlert={deleteAlert}
                triggered={triggeredAlerts}
                symbol={selected}
              />
            </div>
          )}

          {/* Data flow footer */}
          <div style={{ marginTop: 16, background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px',
            fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.8 }}>
            <span style={{ color: 'var(--accent)' }}>PIPELINE:</span>
            {'  '}CoinGecko → RateLimiter → Kafka (crypto-prices)
            {' → '}Consumer → MongoDB + Candles + Alerts + SSE + WebSocket
            {' → '}React Dashboard
          </div>
        </section>
      </main>
    </div>
  );
}

function fmtLarge(n) {
  if (!n) return '—';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2) + 'M';
  return '$' + n.toLocaleString();
}
