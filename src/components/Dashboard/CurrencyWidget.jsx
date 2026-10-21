import React, { useCallback, useEffect, useState } from 'react';
import { DollarSign, RefreshCw } from 'lucide-react';
import { getToken } from '../../services/authService.js';

const EMPTY_RATES = {
  USD: { bid: 0, pctChange: 0 },
  EUR: { bid: 0, pctChange: 0 }
};

let cachedRates = null;
let cachedRatesEstimated = false;

const formatCurrency = (value, locale) => Number(value || 0).toLocaleString(locale, {
  style: 'currency',
  currency: 'BRL'
});

const formatChange = (value) => {
  const change = Number(value || 0);
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
};

export default function CurrencyWidget({ t, lang }) {
  const [rates, setRates] = useState(cachedRates || EMPTY_RATES);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [error, setError] = useState('');
  const [isEstimated, setIsEstimated] = useState(cachedRatesEstimated);

  const fetchExchangeRates = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL', {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (!data?.USDBRL?.bid || !data?.EURBRL?.bid) {
        throw new Error('A AwesomeAPI retornou cotações inválidas.');
      }
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
  cachedRatesEstimated = false;
      setRates(nextRates);
      setIsEstimated(cachedRatesEstimated);
      setLastUpdate(new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));

      const token = getToken();
      if (token) {
        try {
          const cacheResponse = await fetch('/api/exchange-rates/update', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
          });
          if (!cacheResponse.ok) {
            console.warn('Não foi possível salvar as cotações no backend.');
          }
        } catch (cacheError) {
          console.warn('Não foi possível salvar as cotações no backend:', cacheError);
        }
      }
    } catch (requestError) {
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
        cachedRatesEstimated = Boolean(data._fallback);
        setRates(nextRates);
        setIsEstimated(cachedRatesEstimated);
        setLastUpdate(new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }));
      } catch (fallbackError) {
        console.error('Exchange rate lookup failed:', requestError, fallbackError);
        setError(t.exchangeUnavailable);
      }
    } finally {
      setLoading(false);
    }
  }, [lang, t]);

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
          {t.exchangeWidgetTitle}
          {isEstimated && (
            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
              {lang === 'en' ? 'Estimate' : 'Estimativa'}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => fetchExchangeRates(true)}
          disabled={loading}
          className="cursor-pointer p-1 text-xs text-slate-400 transition-colors hover:text-white disabled:opacity-50"
          title={t.exchangeRefresh}
          aria-label={t.exchangeRefresh}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-1.5">
        {(isEstimated ? ['USD'] : ['USD', 'EUR']).map((currency) => (
          <div key={currency} className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold tracking-wide">
              <span className={currency === 'USD' ? 'text-emerald-400' : 'text-sky-400'}>{currency}</span>{' '}
              <span className="text-white">/ BRL</span>
            </span>
            <span className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-white">{formatCurrency(rates[currency].bid, lang === 'en' ? 'en-US' : 'pt-BR')}</span>
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${rates[currency].pctChange >= 0 ? 'bg-emerald-950/40 text-emerald-400' : 'bg-rose-950/40 text-rose-400'}`}>
                {formatChange(rates[currency].pctChange)}
              </span>
            </span>
          </div>
        ))}
      </div>

      {error && <div className="mt-2 text-[10px] text-rose-400">⚠️ {error}</div>}
      {lastUpdate && !error && (
        <div className="mt-2 text-right text-[10px] font-medium text-slate-400">{t.exchangeUpdatedAt.replace('{time}', lastUpdate)}</div>
      )}
    </div>
  );
}
