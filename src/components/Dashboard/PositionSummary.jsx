import React, { useMemo } from 'react';
import { getChartColor } from '../../utils/colors';
import { ASSET_TYPE_TRANSLATION_KEYS } from '../../constants/translations';
import CurrencyWidget from './CurrencyWidget';

export default function PositionSummary({
  assets,
  formatMoney,
  isDarkMode,
  cardClass,
  lang,
  privacyMode = false,
  t
}) {
  const sortedAssets = useMemo(
    () => [...assets].sort((first, second) => Number(second.valorTotal) - Number(first.valorTotal)),
    [assets]
  );

  const renderAllocationPercent = (value) => (
    privacyMode ? '••••%' : `${Number(value || 0).toFixed(2)}%`
  );

  const renderReturnPercent = (value) => (
    privacyMode ? '••••%' : `${(value >= 0 ? '+' : '') + Number(value || 0).toFixed(2)}%`
  );

  const renderAssetType = (itemType) => {
    const translated = t[ASSET_TYPE_TRANSLATION_KEYS[itemType]] || itemType;
    return translated;
  };

  return (
    <div className={`w-full rounded-2xl border p-4 md:p-5 ${cardClass}`}>
      <h3 className="mb-3 text-sm font-bold">{t.resumoPosicionamento}</h3>
      <div className="space-y-2.5">
        {sortedAssets.length > 0 ? (
          sortedAssets.map((item, idx) => {
            const lucro = Number(item.lucro) || 0;
            const rentabilidade = Number(item.rentabilidade) || 0;
            const pctCarteira = Number(item.pctAtual || 0);
            const lucroPositivo = lucro >= 0;
            const lucroLabel = lucroPositivo ? 'Lucro:' : 'Prejuízo:';
            const lucroClass = lucroPositivo
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400';
            const textBase = isDarkMode ? 'text-white' : 'text-slate-900';
            const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';

            return (
              <div
                key={item.id}
                className={`w-full min-w-0 rounded-xl border p-3 text-xs ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-800/60' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex w-full min-w-0 items-start gap-2">
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{ background: getChartColor(idx, isDarkMode) }}
                  />

                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5">
                        <span className={`${textBase} min-w-0 font-bold leading-tight [overflow-wrap:anywhere]`} style={{ fontSize: 'clamp(11px, 1.1vw, 15px)' }}>
                          {item.ticker}
                        </span>
                        <span className={`${mutedText} shrink-0 text-[9px] leading-tight`}>
                          ({renderAssetType(item.type)})
                        </span>
                    </div>

                    <div className={`flex-[0_0_96px] text-right font-bold ${textBase}`}>
                      {formatMoney(item.valorTotal)}
                    </div>
                  </div>
                </div>

                <div className="mt-1.5 flex w-full min-w-0 items-start justify-between gap-2">
                  <div className={`flex min-w-0 flex-1 flex-wrap items-center text-[10px] ${mutedText}`}>
                    <span className="whitespace-nowrap">{t.averagePriceShort} {formatMoney(item.pm)}</span>
                    <span className="mx-1 whitespace-nowrap">|</span>
                    <span className="whitespace-nowrap">{t.currentPriceShort} {formatMoney(item.price)}</span>
                  </div>

                  <div className={`flex-[0_0_80px] text-right text-[10px] ${mutedText}`}>
                    {renderAllocationPercent(pctCarteira)}
                  </div>
                </div>

                <div className={`mt-1 text-[10px] font-medium [overflow-wrap:anywhere] ${lucroClass}`}>
                  {lucroLabel} {formatMoney(lucro)} ({renderReturnPercent(rentabilidade)})
                </div>

                <div className="mt-1 flex justify-end">
                  <span className={`w-[80px] text-right text-[9px] uppercase tracking-wide ${mutedText}`}>
                    % da carteira
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-slate-500 text-xs py-8">
            {t.semDados}
          </div>
        )}
      </div>
      <CurrencyWidget t={t} lang={lang} />
    </div>
  );
}
