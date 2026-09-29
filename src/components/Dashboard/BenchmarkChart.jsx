import React, { useEffect, useRef, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { assetsStorage } from '../../services/storageService';
import { getToken } from '../../services/authService';

const SERIES = [
  { key: 'carteira', label: 'Minha Carteira', color: '#10b981' },
  { key: 'cdi', label: 'CDI', color: '#38bdf8' },
  { key: 'poupanca', label: 'Poupança', color: '#f472b6' },
  { key: 'ipca', label: 'IPCA', color: '#fb923c' },
  { key: 'ibovespa', label: 'Ibovespa', color: '#facc15' }
];

const STORAGE_KEY = 'benchmark_last_result';
const CACHE_VERSION = 7;
const normalizeAssets = (assets) => Array.isArray(assets) ? assets : [];
const readCurrentAssets = (providedAssets) => {
  const currentAssets = normalizeAssets(providedAssets);
  if (currentAssets.length > 0) return currentAssets;
  return normalizeAssets(assetsStorage.get());
};

const getPortfolioHash = async (assets, months) => {
  const canonical = normalizeAssets(assets).map(({ ticker, qty, pm, price, buyDate }) => ({
    qty: Number(qty) || 0,
    buyPrice: Number(pm) || 0,
    currentPrice: Number(price) || 0,
    buyDate: String(buyDate || '')
  })).sort((first, second) => JSON.stringify(first).localeCompare(JSON.stringify(second)));
  const serialized = JSON.stringify({ formulaVersion: CACHE_VERSION, months, assets: canonical });

  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(serialized);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash = Math.imul(hash ^ serialized.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(16);
};

const formatData = (serie = []) => {
  const firstValue = (key) => serie.find((point) => Number.isFinite(point?.[key]))?.[key];
  const baselines = {
    cdi: firstValue('cdi'),
    poupanca: firstValue('poupanca'),
    ipca: firstValue('ipca')
  };
  const rebase = (value, baseline) => Number.isFinite(value) && Number.isFinite(baseline)
    ? Number((value - baseline).toFixed(2))
    : value ?? null;

  return serie.map((point) => ({
    date: point.mes,
    carteira: point.carteira?.rendimento ?? null,
    cdi: rebase(point.cdi, baselines.cdi),
    poupanca: rebase(point.poupanca, baselines.poupanca),
    ipca: rebase(point.ipca, baselines.ipca),
    ibovespa: point.ibovespa ?? null
  }));
};

export default function BenchmarkChart({ totals, isDarkMode, cardClass, t }) {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [selectedMonths, setSelectedMonths] = useState(12);
  const initializedRequestRef = useRef(null);

  const restoreLastResult = async (assets, months) => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved) return false;
      if (saved.cacheVersion !== CACHE_VERSION || saved.requestedMonths !== months || !Array.isArray(saved.serie) || !saved.portfolioHash) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }
      if (assets.length > 0 && !saved.serie.some((point) => point?.carteira)) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }
      if (saved.portfolioHash !== await getPortfolioHash(assets, months)) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }
      setData(formatData(saved.serie));
      setWarning(Array.isArray(saved.avisos) ? saved.avisos.join(' ') : '');
      setError('');
      setStatus('success');
      return true;
    } catch {
      return false;
    }
  };

  const synchronize = async (assetsOverride, monthsOverride) => {
    const assets = readCurrentAssets(assetsOverride ?? totals?.list);
    const months = monthsOverride ?? selectedMonths;
    setStatus('loading');
    setError('');
    setWarning('');

    if (assets.length === 0) {
      setData([]);
      setStatus('success');
      return;
    }

    try {
      const portfolioHash = await getPortfolioHash(assets, months);
      const token = getToken();
      const response = await fetch('/api/portfolio/evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ativos: assets.map(({ ticker, type, qty, pm, price, buyDate, moeda }) => ({
            ticker,
            type,
            quantity: qty,
            buyPrice: pm,
            currentPrice: price,
            currency: moeda || 'USD',
            buyDate
          })),
          meses: months
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Erro ao carregar benchmark');

      setData(formatData(payload.serie));
      setWarning(Array.isArray(payload.avisos) ? payload.avisos.join(' ') : '');
      setStatus('success');
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...payload,
          cacheVersion: CACHE_VERSION,
          requestedMonths: months,
          portfolioHash
        }));
      } catch {
        // O gráfico continua utilizável mesmo quando o armazenamento está indisponível.
      }
    } catch (requestError) {
      setData([]);
      setError(requestError?.message || 'Erro ao carregar benchmark');
      setStatus('error');
    }
  };

  useEffect(() => {
    const sourceAssets = totals?.list;
    const previousRequest = initializedRequestRef.current;
    if (previousRequest?.assets === sourceAssets && previousRequest.months === selectedMonths) return;
    initializedRequestRef.current = { assets: sourceAssets, months: selectedMonths };

    const assets = readCurrentAssets(sourceAssets);
    if (assets.length === 0) {
      setData([]);
      setWarning('');
      setError('');
      setStatus('success');
      return;
    }

    const loadPortfolioBenchmark = async () => {
      const restored = await restoreLastResult(assets, selectedMonths);
      if (!restored) await synchronize(assets, selectedMonths);
    };
    loadPortfolioBenchmark();
  }, [totals?.list, selectedMonths]);

  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipBackground = isDarkMode ? '#1e293b' : '#fff';
  const yValues = data.flatMap((point) => SERIES
    .map(({ key }) => point[key])
    .filter((value) => Number.isFinite(value)));
  const formatAxisDate = (date) => `${date.slice(5, 7)}/${date.slice(2, 4)}`;
  const renderTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="rounded-md border px-2.5 py-2 shadow-md" style={{ background: tooltipBackground, borderColor: gridColor, fontSize: 11 }}>
        <p className="mb-1 font-bold">{formatAxisDate(label)}</p>
        <div className="space-y-0.5">
          {payload.map((entry) => (
            <p key={entry.dataKey} className="flex justify-between gap-4">
              <span style={{ color: entry.color }}>{entry.name}</span>
              <span>{`${Number(entry.value).toFixed(2)}%`}</span>
            </p>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className={`w-full rounded-2xl border p-6 ${cardClass}`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-bold">{t.benchmarkTitle}</h3>
          <p className="mt-1 text-xs text-slate-400">{t.benchmarkSubtitle.replace('{months}', String(selectedMonths))}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label={t.benchmarkPeriod}
            value={selectedMonths}
            onChange={(event) => setSelectedMonths(Number(event.target.value))}
            disabled={status === 'loading'}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold outline-none ${isDarkMode ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-300 bg-white text-slate-700'}`}
          >
            <option value={12}>{t.benchmark12Months}</option>
            <option value={24}>{t.benchmark24Months}</option>
            <option value={36}>{t.benchmark36Months}</option>
          </select>
          <button type="button" onClick={() => synchronize(undefined, selectedMonths)} disabled={status === 'loading'} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-60">
            {status === 'loading' ? t.benchmarkSyncing : t.benchmarkSync}
          </button>
        </div>
      </div>
      {status === 'loading' && <div className="flex h-[360px] items-center justify-center text-xs text-slate-400">Carregando...</div>}
      {status === 'error' && <div className="flex h-[360px] items-center justify-center text-center text-xs text-rose-400">{error}</div>}
      {status === 'success' && warning && <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{warning}</p>}
      {status === 'success' && data.length === 0 && <div className="flex h-[360px] items-center justify-center text-xs text-slate-400">Cadastre ativos para ver a evolução.</div>}
      {status === 'success' && data.length >= 2 && (
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke={axisColor} tick={{ fontSize: 10 }} tickFormatter={formatAxisDate} />
              <YAxis domain={['auto', 'auto']} stroke={axisColor} tick={{ fontSize: 10 }} tickFormatter={(value) => `${Number(value).toFixed(1)}%`} width={58} />
              <Tooltip content={renderTooltip} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              {SERIES.filter(({ key }) => data.some((point) => point[key] != null)).map(({ key, label, color }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={t[key] || label}
                  stroke={color}
                  strokeWidth={key === 'carteira' ? 3 : 2}
                  dot={key === 'carteira'
                    ? { r: 6, fill: '#10b981' }
                    : { r: 4, fill: color }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
