import { useEffect, useRef, useState } from 'react';

export function useLivePrices(apiBase = '/api') {
  const [prices, setPrices]   = useState({});
  const [history, setHistory] = useState({});
  const [connected, setConnected] = useState(false);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const esRef = useRef(null);
  const alertEsRef = useRef(null);

  useEffect(() => {
    // Price stream
    const es = new EventSource(`${apiBase}/prices/stream`);
    esRef.current = es;
    es.addEventListener('price-update', (e) => {
      const price = JSON.parse(e.data);
      const sym = price.symbol;
      setConnected(true);
      setPrices(prev => ({ ...prev, [sym]: price }));
      setHistory(prev => {
        const existing = prev[sym] || [];
        const updated = [...existing, { ...price, ts: Date.now() }].slice(-60);
        return { ...prev, [sym]: updated };
      });
    });
    es.onerror = () => setConnected(false);

    // Alert stream
    const alertEs = new EventSource(`${apiBase}/alerts/stream`);
    alertEsRef.current = alertEs;
    alertEs.addEventListener('alert-triggered', (e) => {
      const alert = JSON.parse(e.data);
      setTriggeredAlerts(prev => [alert, ...prev].slice(0, 10));
    });

    return () => { es.close(); alertEs.close(); };
  }, [apiBase]);

  return { prices, history, connected, triggeredAlerts };
}
