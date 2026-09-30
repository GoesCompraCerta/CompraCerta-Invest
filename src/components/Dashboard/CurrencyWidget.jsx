import React, { useCallback, useEffect, useState } from 'react';
import { DollarSign, RefreshCw } from 'lucide-react';

const CACHE_DURATION = 60 * 60 * 1000;
const EMPTY_RATES = {
  USD: { bid: 0, pctChange: 0 },
  EUR: { bid: 0, pctChange: 0 }
};

let cachedRates = null;
let cacheTimestamp = 0;

const formatCurrency = (value) => Number(value || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const formatChange = (value) => {
  const change = Number(value || 0);
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
};

export default function CurrencyWidget() {
  const [rates, setRates] = useState(cachedRates || EMPTY_RATES);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [error, setError] = useState('');

  const fetchExchangeRates = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    if (!forceRefresh && cachedRates && now - cacheTimestamp < CACHE_DURATION) {
      setRates(cachedRates);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/exchange-rates');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const nextRates = {
        USD: {
          bid: Number(data.USDBRL?.bid) || 0,
          pctChange: Number(data.USDBRL?.pctChange) || 0
        },
        EUR: {
          bid: Number(data.EURBRL?.bid) || 0,
          pctChange: Number(data.EURBRL?.pctChange) || 0
        }
      };

      cachedRates = nextRates;
      cacheTimestamp = now;
      setRates(nextRates);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    } catch (requestError) {
      console.error('Exchange rate lookup failed:', requestError);
      setError('Câmbio indisponível');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExchangeRates();
  }, [fetchExchangeRates]);

  return (
    <div className="mt-3.5 border-t border-slate-800 pt-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-bold tracking-wide text-white">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-700/80 bg-emerald-950 text-[11px] font-extrabold text-emerald-400 shadow-sm">
            <DollarSign className="h-3 w-3 stroke-[3]" />
          </span>
          CÂMBIO INTERNACIONAL
        </span>
        <button
          type="button"
          onClick={() => fetchExchangeRates(true)}
          disabled={loading}
          className="cursor-pointer p-1 text-xs text-slate-400 transition-colors hover:text-white disabled:opacity-50"
          title="Atualizar cotações"
          aria-label="Atualizar cotações"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-1.5">
        {['USD', 'EUR'].map((currency) => (
          <div key={currency} className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold tracking-wide">
              <span className={currency === 'USD' ? 'text-emerald-400' : 'text-sky-400'}>{currency}</span>{' '}
              <span className="text-white">/ BRL</span>
            </span>
            <span className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-white">{formatCurrency(rates[currency].bid)}</span>
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${rates[currency].pctChange >= 0 ? 'bg-emerald-950/40 text-emerald-400' : 'bg-rose-950/40 text-rose-400'}`}>
                {formatChange(rates[currency].pctChange)}
              </span>
            </span>
          </div>
        ))}
      </div>

      {error && <div className="mt-2 text-[10px] text-rose-400">⚠️ {error}</div>}
      {lastUpdate && !error && (
        <div className="mt-2 text-right text-[10px] font-medium text-slate-400">Atualizado às {lastUpdate}</div>
      )}
    </div>
  );
}
