import React, { useMemo } from 'react';
import { getChartColor } from '../../utils/colors';
import CurrencyWidget from './CurrencyWidget';

export default function PositionSummary({
  assets,
  formatMoney,
  isDarkMode,
  cardClass,
  t
}) {
  const sortedAssets = useMemo(
    () => [...assets].sort((first, second) => Number(second.valorTotal) - Number(first.valorTotal)),
    [assets]
  );

  return (
    <div className={`resumo-posicionamento p-6 rounded-2xl border space-y-4 ${cardClass}`}>
      <h3 className="font-bold text-sm">{t.resumoPosicionamento}</h3>
      <div className="space-y-2.5 max-h-80 overflow-y-auto">
        {sortedAssets.length > 0 ? (
          sortedAssets.map((item, idx) => (
            <div
              key={item.id}
              className="resumo-posicionamento-item item-ativo-resumo p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: getChartColor(idx, isDarkMode) }}
                />
                <div>
                  <div className="font-bold text-white">
                    {item.ticker}{' '}
                    <span className="text-[10px] font-normal text-slate-400">
                      ({item.type})
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    PM: {formatMoney(item.pm)} | Cot: {formatMoney(item.price)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatMoney(item.valorTotal)}</div>
                <div className="text-[10px] text-emerald-400">
                  {item.pctAtual.toFixed(1)}%
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-slate-500 text-xs py-8">
            {t.semDados}
          </div>
        )}
      </div>
      <CurrencyWidget />
    </div>
  );
}
