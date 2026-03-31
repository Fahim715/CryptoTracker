import { useEffect, useState } from 'react';

export function useInitialPrices(apiBase = '/api') {
  const [initial, setInitial] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;

    const fetchLatest = () =>
      fetch(`${apiBase}/prices/latest`)
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          const safe = Array.isArray(data) ? data : [];
          setInitial(safe);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });

    fetchLatest();
    const id = setInterval(fetchLatest, 3000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [apiBase]);
  return { initial, loading };
}

export function usePriceHistory(symbol, hours = 24, apiBase = '/api') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;

    const fetchHistory = () =>
      fetch(`${apiBase}/prices/history/${symbol}?hours=${hours}`)
        .then(r => r.json())
        .then(d => {
          if (!cancelled) {
            setData(Array.isArray(d) ? d : []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });

    setLoading(true);
    fetchHistory();
    const id = setInterval(fetchHistory, 5000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol, hours, apiBase]);
  return { data, loading };
}

export function useIndicators(symbol, apiBase = '/api') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    fetch(`${apiBase}/indicators/${symbol}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol, apiBase]);
  return { data, loading };
}

export function useCandles(symbol, interval = '5m', apiBase = '/api') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;

    const fetchCandles = () =>
      fetch(`${apiBase}/candles/${symbol}?interval=${interval}&limit=60`)
        .then(r => r.json())
        .then(d => {
          if (!cancelled) {
            setData(Array.isArray(d) ? d : []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });

    setLoading(true);
    fetchCandles();
    const id = setInterval(fetchCandles, 5000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol, interval, apiBase]);
  return { data, loading };
}

export function useAlerts(apiBase = '/api') {
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = () =>
    fetch(`${apiBase}/alerts`)
      .then(r => r.json())
      .then(setAlerts)
      .catch(() => {});

  useEffect(() => { fetchAlerts(); }, [apiBase]);

  const createAlert = (symbol, condition, targetPrice) =>
    fetch(`${apiBase}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, condition, targetPrice }),
    }).then(() => fetchAlerts());

  const deleteAlert = (id) =>
    fetch(`${apiBase}/alerts/${id}`, { method: 'DELETE' })
      .then(() => fetchAlerts());

  return { alerts, createAlert, deleteAlert, refetch: fetchAlerts };
}

export function useSystemStats(apiBase = '/api') {
  const [stats, setStats] = useState({});
  useEffect(() => {
    const fetch_ = () =>
      fetch(`${apiBase}/system/stats`)
        .then(r => r.json())
        .then(setStats)
        .catch(() => {});
    fetch_();
    const id = setInterval(fetch_, 5000);
    return () => clearInterval(id);
  }, [apiBase]);
  return stats;
}

export function useAiMarketSummary(symbol, apiBase = '/api') {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = () => {
    if (!symbol) return Promise.resolve(null);
    setLoading(true);
    return fetch(`${apiBase}/ai/market-summary/${symbol}`)
      .then(async r => {
        if (!r.ok) {
          let details = '';
          try {
            details = await r.text();
          } catch (_) {
            details = '';
          }
          throw new Error(`AI endpoint failed (${r.status}). ${details}`.trim());
        }
        return r.json();
      })
      .then(d => {
        setSummary(d || { summary: 'AI returned an empty response.' });
        setLoading(false);
        return d;
      })
      .catch((err) => {
        setSummary({
          summary: err?.message || 'Failed to reach AI market analyst endpoint.',
          model: 'error',
          generatedAt: new Date().toISOString(),
        });
        setLoading(false);
        return null;
      });
  };

  useEffect(() => {
    setSummary(null);
    if (symbol) generate();
  }, [symbol, apiBase]);

  return { summary, loading, generate };
}
