import React from 'react';

export default function AiMarketAnalystPanel({ symbol, summary, model, generatedAt, loading, onGenerate }) {
  return (
    <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
          AI MARKET ANALYST · GROQ
        </div>
        <button
          onClick={onGenerate}
          disabled={loading}
          style={{
            border: '1px solid rgba(123,143,255,0.45)',
            background: loading ? 'rgba(123,143,255,0.16)' : 'rgba(123,143,255,0.08)',
            color: 'rgba(255,255,255,0.9)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Analyzing...' : `Analyze ${symbol}`}
        </button>
      </div>

      <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.82)', fontSize: 12, lineHeight: 1.6 }}>
        {summary || 'Generate an AI summary based on live price and indicators (RSI, MACD, Bollinger).'}
      </div>

      {generatedAt && (
        <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
          Model: {model || 'n/a'} · Updated: {new Date(generatedAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
