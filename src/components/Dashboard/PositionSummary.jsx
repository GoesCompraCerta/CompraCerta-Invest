import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { getChartColor } from '../../utils/colors';
import { calculateAssetInvested } from '../../utils/assetValuation.js';
import { groupAssetsByClass } from '../../utils/assetClassification.js';
import CurrencyWidget from './CurrencyWidget';

export default function PositionSummary({
  assets,
  formatMoney,
  isDarkMode,
  cardClass,
  lang,
  privacyMode = false,
  view,
  onViewChange,
  t
}) {
  const [preferenceError, setPreferenceError] = useState(false);
  const sortedAssets = useMemo(
    () => (Array.isArray(assets) ? [...assets] : []).sort((first, second) => Number(second.valorTotal) - Number(first.valorTotal)),
    [assets]
  );
  const classGroups = useMemo(() => groupAssetsByClass(sortedAssets), [sortedAssets]);

  const renderAllocationPercent = (value) => (
    privacyMode ? '••••%' : `${Number(value || 0).toFixed(2)}%`
  );

  const handleViewChange = async (nextView) => {
    setPreferenceError(false);
    try {
      await onViewChange(nextView);
    } catch (error) {
      console.error('Position summary preference update failed:', error);
      setPreferenceError(true);
    }
  };

  return (
    <div className={`w-full rounded-2xl border p-4 md:p-5 ${cardClass}`}>
      <h3 className="mb-3 text-sm font-bold">{t.resumoPosicionamento}</h3>
      <div className="mb-3 flex rounded-lg border border-current/15 p-1" role="group" aria-label={t.positionSummaryView}>
        {[
          ['overview', t.positionViewOverview],
          ['class', t.positionViewByClass]
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            onClick={() => handleViewChange(value)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
              view === value
                ? 'bg-emerald-500 text-slate-950'
                : isDarkMode ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {preferenceError && (
        <p className="mb-3 text-xs text-rose-500" role="alert">{t.positionViewSaveError}</p>
      )}
      <div className="app-scrollbar max-h-[400px] overflow-y-auto pr-1">
        {sortedAssets.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">{t.semDados}</div>
        ) : view === 'overview' ? (
          <div className="space-y-2">
            {sortedAssets.map((item, index) => {
              const profit = Number(item.lucro) || 0;
              const ProfitIcon = profit >= 0 ? ArrowUpRight : ArrowDownRight;

              return (
                <div key={item.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border p-3 text-xs ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-800/60' : 'bg-white border-slate-200'
                }`}>
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: getChartColor(index, isDarkMode) }} />
                  <span className="min-w-[6rem] flex-1 font-bold">{item.ticker}</span>
                  <span className="whitespace-nowrap">{renderAllocationPercent(item.pctAtual)}</span>
                  <span className="whitespace-nowrap">{formatMoney(item.valorTotal)}</span>
                  <span className={`flex items-center gap-0.5 whitespace-nowrap ${profit >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                    <ProfitIcon className="h-4 w-4" aria-hidden="true" />
                    {formatMoney(profit)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {classGroups.map((group, index) => {
              const isProfit = group.profit >= 0;
              const ProfitIcon = isProfit ? ArrowUpRight : ArrowDownRight;
              const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';

              return (
                <div key={group.key} className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border p-3 text-xs ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-800/60' : 'bg-white border-slate-200'
                }`}>
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: getChartColor(index, isDarkMode) }} />
                  <span className={`w-12 shrink-0 text-right font-semibold ${mutedText}`}>
                    {privacyMode ? '••••%' : `${group.percentage.toFixed(2)}%`}
                  </span>
                  <span className="min-w-[8rem] flex-1 font-semibold">{t[group.translationKey]}</span>
                  <span className="whitespace-nowrap">{formatMoney(group.currentValue)}</span>
                  <span className={`flex items-center gap-0.5 whitespace-nowrap ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                    <ProfitIcon className="h-4 w-4" aria-hidden="true" />
                    {formatMoney(group.profit)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <CurrencyWidget t={t} lang={lang} />
    </div>
  );
}
