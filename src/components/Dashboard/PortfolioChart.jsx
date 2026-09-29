import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getChartColor } from '../../utils/colors';

export default function PortfolioChart({
  assets,
  patrimonio,
  formatMoney,
  isDarkMode,
  pieRadiusLevel,
  setPieRadiusLevel,
  t
}) {
  const pieRadii = [
    { inner: 40, outer: 65 },
    { inner: 55, outer: 85 },
    { inner: 70, outer: 105 }
  ];

  const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent, ticker }) => {
    if (!percent || percent <= 0.01) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 22;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill={isDarkMode ? '#94A3B8' : '#475569'}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: 11, fontWeight: 700 }}
      >
        {`${ticker} (${(percent * 100).toFixed(1)}%)`}
      </text>
    );
  };

  const cardClass = isDarkMode
    ? 'bg-[#111827] border-slate-800'
    : 'bg-white border-slate-200';
  const sortedAssets = useMemo(
    () => [...assets].sort((first, second) => Number(second.valorTotal) - Number(first.valorTotal)),
    [assets]
  );

  return (
    <div className={`card-ativo-alocacao lg:col-span-2 p-6 rounded-2xl border space-y-4 ${cardClass}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">{t.alocacaoCarteira}</h3>
        <div className="controle-rosca tamanho-rosca-container flex items-center gap-1 bg-slate-900/40 p-1 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold px-1.5">
            {t.tamanhoPizza}:
          </span>
          {[0, 1, 2].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setPieRadiusLevel(lvl)}
              className={`btn-tamanho px-2 py-0.5 rounded text-[10px] font-bold ${
                pieRadiusLevel === lvl
                  ? 'ativo bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold'
                  : 'text-slate-400'
              }`}
            >
              {lvl === 0 ? 'P' : lvl === 1 ? 'M' : 'G'}
            </button>
          ))}
        </div>
      </div>

      {/* Fixed-height wrapper */}
      <div style={{ width: '100%', height: 288 }} className="relative">
        {sortedAssets.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sortedAssets}
                cx="50%"
                cy="50%"
                innerRadius={pieRadii[pieRadiusLevel].inner}
                outerRadius={pieRadii[pieRadiusLevel].outer}
                paddingAngle={3}
                dataKey="valorTotal"
                nameKey="ticker"
                label={renderPieLabel}
                labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
              >
                {sortedAssets.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={getChartColor(index, isDarkMode)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val) => [formatMoney(val)]}
                contentStyle={{
                  background: isDarkMode ? '#1e293b' : '#fff',
                  border: '1px solid #334155',
                  borderRadius: 12,
                  fontSize: 12
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
            {t.semDados}
          </div>
        )}

        {sortedAssets.length > 0 && (
          <div className="absolute bottom-1 left-1 text-xs font-black text-emerald-400 flex items-center gap-1">
            <span>{formatMoney(patrimonio)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
