import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { calculateCompoundInterest } from '../services/calculationService';

export default function CompoundInterestPage({
  formatMoney,
  themeStyle,
  cardClass,
  isDarkMode,
  t,
  jcInicial,
  setJcInicial,
  jcAporte,
  setJcAporte,
  jcTempoAnos,
  setJcTempoAnos,
  jcTaxaMensal,
  setJcTaxaMensal,
  jcMetaRenda,
  setJcMetaRenda,
  jcInflacaoAnual,
  setJcInflacaoAnual
}) {
  const [resultadoSimulado, setResultadoSimulado] = useState(() =>
    calculateCompoundInterest(
      jcInicial,
      jcAporte,
      jcTempoAnos,
      jcTaxaMensal,
      jcMetaRenda
    )
  );

  const jcResult = resultadoSimulado;

  const handleSimular = () => {
    setResultadoSimulado(
      calculateCompoundInterest(
        jcInicial,
        jcAporte,
        jcTempoAnos,
        jcTaxaMensal,
        jcMetaRenda
      )
    );
  };

  const inflacao = Number(jcInflacaoAnual) || 0;
  const anos = Number(jcTempoAnos) || 0;
  const metaMensal = Number(jcMetaRenda) || 0;
  const progressoMeta = Number.isFinite(jcResult.progressoMeta)
    ? Math.min(100, Math.max(0, jcResult.progressoMeta))
    : 0;
  const restanteMeta = Math.max(metaMensal - jcResult.rendaMensalFinal, 0);
  const poderCompraReal =
    anos > 0 && inflacao > 0
      ? jcResult.patrimonioFinal / Math.pow(1 + inflacao / 100, anos)
      : jcResult.patrimonioFinal;

  const chartData = useMemo(
    () =>
      (jcResult.tabela || []).map((row, index) => ({
        name: `${index + 1}º ${t.ano}`,
        patrimonio: Number(row.patrimonio) || 0,
        investido: Number(row.investido) || 0,
        juros: Number(row.juros) || 0,
        rendaMensal: Number(row.rendaMensal) || 0
      })),
    [jcResult.tabela, t.ano]
  );

  const seriesColors = useMemo(
    () => ({
      dark: {
        investido: '#E2E8F0',
        juros: '#34D399',
        patrimonio: '#60A5FA',
        rendaMensal: '#FBBF24'
      },
      light: {
        investido: '#111827',
        juros: '#047857',
        patrimonio: '#1D4ED8',
        rendaMensal: '#B45309'
      }
    }),
    []
  );

  const palette = isDarkMode ? seriesColors.dark : seriesColors.light;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={`xl:col-span-2 p-6 rounded-2xl border space-y-4 ${cardClass}`}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-sm">{t.parametrosSimulacao}</h3>
            <button
              type="button"
              onClick={handleSimular}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-emerald-400"
            >
              {t.simular}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                {t.investimentoInicial}
              </label>
              <input
                type="number"
                value={jcInicial}
                onChange={(e) => setJcInicial(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                {t.aporteMensal}
              </label>
              <input
                type="number"
                value={jcAporte}
                onChange={(e) => setJcAporte(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                {t.periodoAnos}
              </label>
              <input
                type="number"
                value={jcTempoAnos}
                onChange={(e) => setJcTempoAnos(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                {t.rendimentoMensal}
              </label>
              <input
                type="number"
                step="0.01"
                value={jcTaxaMensal}
                onChange={(e) => setJcTaxaMensal(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                {t.inflacaoAnual}
              </label>
              <input
                type="number"
                step="0.01"
                value={jcInflacaoAnual}
                onChange={(e) => setJcInflacaoAnual(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                {t.metaRendaPassiva}
              </label>
              <input
                type="number"
                value={jcMetaRenda}
                onChange={(e) => setJcMetaRenda(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl border space-y-4 flex flex-col justify-between ${cardClass}`}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {t.resultadoEm} {jcTempoAnos} {t.anos}
            </span>
            <div className={`text-2xl font-black mt-1 ${themeStyle.text}`}>
              {formatMoney(jcResult.patrimonioFinal)}
            </div>
            <div className="mt-4 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{t.totalInvestido}:</span>
                <span className="font-bold" style={{ color: palette.investido }}>
                  {formatMoney(jcResult.investido)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{t.jurosAcumulados}:</span>
                <span className="font-bold" style={{ color: palette.juros }}>
                  {formatMoney(jcResult.jurosTotais)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{t.rendaMensalEstimada}:</span>
                <span className="font-bold" style={{ color: palette.rendaMensal }}>
                  {formatMoney(jcResult.rendaMensalFinal)}/mês
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>{t.metaRendaAndamento}</span>
                <span>{progressoMeta.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${progressoMeta}%` }}
                />
              </div>
            </div>
            <div
              className={`rounded-xl border p-3 text-[11px] ${
                isDarkMode
                  ? 'border-slate-800 bg-slate-950/30 text-slate-300'
                  : 'border-[#e5e7eb] bg-[#f3f4f6] text-slate-700'
              }`}
            >
              <div className="flex justify-between items-center gap-3">
                <span className="text-slate-600 font-medium">{t.poderCompraReal}</span>
                <span
                  className="font-black"
                  style={{ color: isDarkMode ? '#fbbf24' : '#d4a017' }}
                >
                  {formatMoney(poderCompraReal)}
                </span>
              </div>
              <div className="flex justify-between mt-2 items-center gap-3">
                <span className="text-slate-600 font-medium">{t.faltaMeta}</span>
                <span
                  className="font-black"
                  style={{ color: isDarkMode ? '#7dd3fc' : '#1e40af' }}
                >
                  {formatMoney(restanteMeta)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${cardClass}`}>
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-sm">{t.evolucaoAnoAno}</h3>
        </div>
        <div className="p-4">
          {chartData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#475569' }}
                  />
                  <YAxis
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#475569' }}
                    tickFormatter={(value) => `R$ ${Math.round(value / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [formatMoney(value), '']}
                    labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 12,
                      color: '#e2e8f0'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="patrimonio"
                    stroke={palette.patrimonio}
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 0, fill: palette.patrimonio }}
                    activeDot={{ r: 6, fill: palette.patrimonio, stroke: palette.patrimonio }}
                    name={t.patrimonioTotal}
                  />
                  <Line
                    type="monotone"
                    dataKey="investido"
                    stroke={palette.investido}
                    strokeWidth={2.5}
                    dot={{ r: 2.5, strokeWidth: 0, fill: palette.investido }}
                    activeDot={{ r: 5, fill: palette.investido, stroke: palette.investido }}
                    name={t.totalInvestido}
                  />
                  <Line
                    type="monotone"
                    dataKey="juros"
                    stroke={palette.juros}
                    strokeWidth={2.5}
                    dot={{ r: 2.5, strokeWidth: 0, fill: palette.juros }}
                    activeDot={{ r: 5, fill: palette.juros, stroke: palette.juros }}
                    name={t.jurosAcumulados}
                  />
                  <Line
                    type="monotone"
                    dataKey="rendaMensal"
                    stroke={palette.rendaMensal}
                    strokeWidth={2.5}
                    dot={{ r: 2.5, strokeWidth: 0, fill: palette.rendaMensal }}
                    activeDot={{ r: 5, fill: palette.rendaMensal, stroke: palette.rendaMensal }}
                    name={t.rendaMensalExp}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-xs text-slate-400 p-4">{t.semDados}</div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="p-3.5">{t.ano}</th>
                <th className="p-3.5">{t.totalInvestido}</th>
                <th className="p-3.5">{t.jurosGanhos}</th>
                <th className="p-3.5">{t.patrimonioTotal}</th>
                <th className="p-3.5">{t.rendaMensalExp}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {jcResult.tabela.map((row) => (
                <tr key={row.ano}>
                  <td className="p-3.5 font-bold">
                    {row.ano}º {t.ano}
                  </td>
                  <td className="p-3.5 font-bold" style={{ color: palette.investido }}>
                    {formatMoney(row.investido)}
                  </td>
                  <td className="p-3.5 font-bold" style={{ color: palette.juros }}>
                    {formatMoney(row.juros)}
                  </td>
                  <td className="p-3.5 font-black" style={{ color: palette.patrimonio }}>
                    {formatMoney(row.patrimonio)}
                  </td>
                  <td className="p-3.5 font-bold" style={{ color: palette.rendaMensal }}>
                    {formatMoney(row.rendaMensal)}/mês
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-2.5 mt-3 mb-6 text-[10.5px] leading-snug rounded-md border border-gray-700/60 bg-gray-100/80 text-gray-800 flex items-start gap-2 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200">
        <span className="text-yellow-500 font-bold shrink-0">⚠️</span>
        <p>{t.investmentAnalysisDisclaimer}</p>
      </div>
    </div>
  );
}
