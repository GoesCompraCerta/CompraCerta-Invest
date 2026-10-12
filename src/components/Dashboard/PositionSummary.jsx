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

  return (
    <div className={`resumo-posicionamento p-6 rounded-2xl border space-y-4 ${cardClass}`}>
      <h3 className="font-bold text-sm">{t.resumoPosicionamento}</h3>
      <div className="space-y-2.5 max-h-80 overflow-y-auto">
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
                className={`resumo-posicionamento-item item-ativo-resumo p-3 rounded-xl border text-xs ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-800/60' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="mt-0.5 w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: getChartColor(idx, isDarkMode) }}
                  />

                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className={`font-bold ${textBase} whitespace-nowrap`}>
                      {item.ticker}
                    </span>
                    <span className={`text-[9px] font-normal ${mutedText} whitespace-nowrap`}>
                      ({t[ASSET_TYPE_TRANSLATION_KEYS[item.type]] || item.type})
                    </span>
                  </div>

                  <div className={`w-[110px] shrink-0 text-right font-bold ${textBase}`}>
                    {formatMoney(item.valorTotal)}
                  </div>
                </div>

                <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                  <div className={`text-[10px] ${mutedText} whitespace-nowrap`}>
                    {t.averagePriceShort} {formatMoney(item.pm)} | {t.currentPriceShort} {formatMoney(item.price)}
                  </div>
                  <div className={`w-[110px] shrink-0 text-right text-[10px] ${mutedText}`}>
                    {renderAllocationPercent(pctCarteira)}
                  </div>
                </div>

                <div className={`mt-1 text-[10px] font-medium ${lucroClass} whitespace-nowrap`}>
                  {lucroLabel} {formatMoney(lucro)} ({renderReturnPercent(rentabilidade)})
                </div>

                <div className={`mt-0.5 w-[110px] self-end text-right text-[9px] uppercase tracking-wide ${mutedText}`}>
                  % da carteira
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
