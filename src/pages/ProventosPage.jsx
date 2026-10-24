import React, { useEffect, useState } from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getProventosSummary } from '../services/proventosService';
import { toDateDisplayValue, toStoredDate } from '../utils/proventoDate.js';

const EMPTY_SUMMARY = { evolucaoMensal: [], resumoAtivos: [] };

export default function ProventosPage({
  proventos,
  formatMoney,
  themeStyle,
  cardClass,
  isDarkMode,
  privacyMode,
  lang,
  t,
  onSessionExpired,
  onAddProvento,
  onUpdateProvento,
  onDeleteProvento
}) {
  const [editingProvId, setEditingProvId] = useState(null);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const [summaryAttempt, setSummaryAttempt] = useState(0);
  const [chartPeriod, setChartPeriod] = useState('all');
  const [formData, setFormData] = useState({
    ticker: '',
    value: '',
    type: 'Dividendos',
    date: ''
  });

  useEffect(() => {
    let isActive = true;
    setSummaryFailed(false);
    getProventosSummary()
      .then((result) => {
        if (isActive) setSummary(result);
      })
      .catch((error) => {
        console.error('Proventos summary request failed:', error);
        if (isActive) {
          setSummary(EMPTY_SUMMARY);
          setSummaryFailed(true);
          if (error.status === 401) onSessionExpired();
        }
      });
    return () => { isActive = false; };
  }, [proventos, summaryAttempt, onSessionExpired]);

  const monthlyData = summary.evolucaoMensal.map(({ mes, total }) => ({
    mes,
    total: Number(total)
  }));
  const monthsToShow = chartPeriod === '6m' ? 6 : chartPeriod === '1y' ? 12 : null;
  const now = new Date();
  const currentMonthIndex = now.getFullYear() * 12 + now.getMonth();
  const filteredMonthlyData = monthsToShow
    ? monthlyData.filter(({ mes }) => {
        const [year, month] = mes.split('-').map(Number);
        const monthIndex = year * 12 + month - 1;
        return monthIndex >= currentMonthIndex - monthsToShow + 1
          && monthIndex <= currentMonthIndex;
      })
    : monthlyData;
  const chartGranularity = chartPeriod === 'all' && monthlyData.length > 24
    ? 'year'
    : 'month';
  const chartData = chartGranularity === 'year'
    ? Array.from(
        monthlyData.reduce((totalsByYear, { mes, total }) => {
          const year = mes.slice(0, 4);
          totalsByYear.set(year, (totalsByYear.get(year) || 0) + total);
          return totalsByYear;
        }, new Map()),
        ([mes, total]) => ({ mes, total: privacyMode ? null : total })
      )
    : filteredMonthlyData.map(({ mes, total }) => ({
        mes,
        total: privacyMode ? null : total
      }));
  const formatMonth = (value) => {
    const [year, month] = String(value).split('-').map(Number);
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'pt-BR', {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC'
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  };
  const formatChartLabel = (value) => (
    chartGranularity === 'year' ? String(value) : formatMonth(value)
  );

  const handleSaveProvento = (e) => {
    e.preventDefault();
    if (!formData.ticker || !formData.value) return;

    const entry = {
      ticker: formData.ticker.toUpperCase(),
      value: Number(formData.value),
      type: formData.type,
      date: toStoredDate(formData.date) || new Date().toISOString().split('T')[0]
    };

    if (editingProvId) {
      onUpdateProvento(editingProvId, entry);
      setEditingProvId(null);
    } else {
      onAddProvento(entry);
    }

    setFormData({ ticker: '', value: '', type: 'Dividendos', date: '' });
  };

  const handleEditProvento = (p) => {
    setEditingProvId(p.id);
    setFormData({
      ticker: p.ticker,
      value: String(p.value),
      type: p.type || 'Dividendos',
      date: toDateDisplayValue(p.date)
    });
  };

  const handleCancel = () => {
    setEditingProvId(null);
    setFormData({ ticker: '', value: '', type: 'Dividendos', date: '' });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className={`min-w-0 rounded-xl border p-4 md:p-5 lg:col-span-2 ${cardClass}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold">{t.evolucaoMensalProventos}</h3>
            <div className="flex rounded-lg border border-current/15 p-1" role="group" aria-label={t.filtroPeriodoGrafico}>
              {[
                ['6m', t.ultimos6Meses],
                ['1y', t.ultimoAno],
                ['all', t.todoPeriodo]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={chartPeriod === value}
                  onClick={() => setChartPeriod(value)}
                  className={`flex w-12 flex-none items-center justify-center rounded-md px-2.5 py-1 text-center text-xs font-semibold ${
                    chartPeriod === value
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-600'
                      : 'text-slate-400 hover:text-current'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {summaryFailed ? (
            <div className={`flex h-56 items-center justify-center text-center text-xs md:h-[260px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <div>
                <p>{t.erroResumoProventos}</p>
                <button type="button" className="mt-2 underline" onClick={() => setSummaryAttempt((attempt) => attempt + 1)}>
                  {t.tentarNovamente}
                </button>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className={`flex h-56 items-center justify-center text-center text-xs md:h-[260px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {t.semProventosResumo}
            </div>
          ) : (
            <div className={`relative h-56 w-full min-w-0 md:h-[260px] ${themeStyle.text}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="mes"
                    tickFormatter={formatChartLabel}
                    stroke="currentColor"
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    hide={privacyMode}
                    stroke="currentColor"
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => privacyMode ? '***' : formatMoney(value)}
                  />
                  <Tooltip
                    cursor={false}
                    labelFormatter={formatChartLabel}
                    formatter={(value) => [privacyMode ? 'R$ ***' : formatMoney(value), t.totalRecebidoResumo]}
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      color: '#ffffff',
                      border: '1px solid #374151',
                      borderRadius: 8
                    }}
                    labelStyle={{ color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Bar dataKey="total" name={t.totalRecebidoResumo} fill="currentColor" radius={[4, 4, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
              {privacyMode && (
                <div className={`pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  ***
                </div>
              )}
            </div>
          )}
        </section>

        <section className={`min-w-0 rounded-xl border p-4 md:p-5 ${cardClass}`}>
          <h3 className="mb-4 text-sm font-bold">{t.yieldOnCost}</h3>
          {summaryFailed ? (
            <p className={`py-8 text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {t.erroResumoProventos}
            </p>
          ) : summary.resumoAtivos.length === 0 ? (
            <p className={`py-8 text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {t.semProventosResumo}
            </p>
          ) : (
            <>
              <div className="app-scrollbar max-h-[250px] space-y-2 overflow-y-auto pr-1 md:hidden">
                {summary.resumoAtivos.map((item) => (
                  <article key={item.ticker} className={`rounded-lg border p-3 ${cardClass}`}>
                    <h4 className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{item.ticker}</h4>
                    <dl className="mt-2 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <dt className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{t.totalRecebidoResumo}</dt>
                        <dd className={`mt-1 font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                          {privacyMode ? 'R$ ***' : formatMoney(item.total_recebido)}
                        </dd>
                      </div>
                      <div>
                        <dt className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{t.yieldOnCost}</dt>
                        <dd className={`mt-1 font-semibold ${themeStyle.text}`}>
                          {privacyMode
                            ? '***'
                            : item.yield_on_cost == null
                              ? t.yieldOnCostUnavailable
                              : `${Number(item.yield_on_cost).toFixed(2)}%`}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
              <div className="app-scrollbar hidden max-h-[250px] overflow-y-auto md:block">
              <table className="w-full text-left text-xs">
                <thead className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <tr className="border-b border-current/15">
                    <th className="py-2 pr-2 font-semibold">{t.ticker}</th>
                    <th className="py-2 px-2 text-right font-semibold">{t.totalRecebidoResumo}</th>
                    <th className="py-2 pl-2 text-right font-semibold">{t.yieldOnCost}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.resumoAtivos.map((item) => (
                    <tr key={item.ticker} className="border-b border-current/10 last:border-0">
                      <td className="py-2 pr-2 font-bold">{item.ticker}</td>
                      <td className="py-2 px-2 text-right whitespace-nowrap">
                        {privacyMode ? 'R$ ***' : formatMoney(item.total_recebido)}
                      </td>
                      <td className={`py-2 pl-2 text-right whitespace-nowrap ${themeStyle.text}`}>
                        {privacyMode
                          ? '***'
                          : item.yield_on_cost == null
                            ? t.yieldOnCostUnavailable
                            : `${Number(item.yield_on_cost).toFixed(2)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </section>
      </div>

      <div className={`rounded-2xl border p-4 md:p-6 space-y-4 ${cardClass}`}>
        <h3 className="font-bold text-sm">{t.lancarProventos}</h3>
        <form onSubmit={handleSaveProvento} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400">
              {t.ticker}
            </label>
            <input
              type="text"
              placeholder=""
              value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400">
              {t.valorRecebido}
            </label>
            <input
              type="number"
              step="0.01"
              placeholder=""
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400">{t.tipoProvento}</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Dividendos">{t.dividendos}</option>
              <option value="JCP">{t.jcp}</option>
              <option value="Rendimento">{t.rendimento}</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400">
              {t.dataRecebimento}
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder=""
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
          <div className="flex justify-end gap-2 md:col-span-4">
            {editingProvId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 border border-rose-500/30"
              >
                {t.cancelar}
              </button>
            )}
            <button type="submit" className={`px-6 py-2 rounded-xl text-xs font-bold ${themeStyle.btn}`}>
              {editingProvId ? t.salvar : t.adicionar}
            </button>
          </div>
        </form>
      </div>

      <div className={`rounded-2xl border p-4 md:p-6 space-y-3 ${cardClass}`}>
        <h3 className="font-bold text-sm">{t.extratoEntradas}</h3>
        <div className="app-scrollbar max-h-[250px] space-y-2 overflow-y-auto pr-1">
          {proventos && proventos.length > 0 ? (
            proventos.map((p) => (
              <div
                key={p.id}
                className="extrato-entrada-item flex flex-col items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-xs md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-bold text-white">{p.ticker}</div>
                  <div className="text-[10px] text-slate-400">{p.date}</div>
                </div>
                <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
                  <span className="font-bold text-emerald-400">
                    {formatMoney(p.value)}
                  </span>
                  <button
                    onClick={() => handleEditProvento(p)}
                    className="text-slate-400 hover:text-sky-400"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteProvento(p.id)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 text-xs py-6">
              {t.semDados}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
