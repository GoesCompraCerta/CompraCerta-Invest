import React from 'react';
import { Edit3, Trash2, RefreshCw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { normalizeFiiDyPeriod } from '../../services/calculationService';
import { ASSET_TYPE_TRANSLATION_KEYS } from '../../constants/translations';

const formatMetric = (value, suffix = '') => {
  if (value === null || value === undefined || value === '') return '-';

  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(2)}${suffix}` : '-';
};

const formatDate = (value) => value || '-';
const formatPurchaseDate = (value, lang) => {
  if (!value) return '—';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  if (!year || !month || !day) return '—';
  return lang === 'en' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
};
const formatPercent = (value, digits = 2) => {
  if (value === null || value === undefined || value === '') return '-';
  const number = Number(String(value).replace('%', '').replace(',', '.'));
  return Number.isFinite(number) ? `${number.toFixed(digits)}%` : '-';
};
const formatAssetMeta = (item) => {
  const value = item.metaPercent === undefined || item.metaPercent === null || item.metaPercent === ''
    ? item.meta
    : item.metaPercent;
  const numericValue = Number(String(value ?? 0).replace('%', '').replace(',', '.'));
  return Number.isFinite(numericValue) ? `${Number(numericValue.toFixed(2))}%` : '-';
};

const formatCompactCurrency = (value, t, lang) => {
  if (value === null || value === undefined || value === '') return '-';
  const number = Number(value);
  if (!Number.isFinite(number)) return '-';

  const formatCompactNumber = (amount) =>
    Number(amount).toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  if (Math.abs(number) >= 1000000000) return `R$ ${formatCompactNumber(number / 1000000000)} ${t.compactBillion}`;
  if (Math.abs(number) >= 1000000) return `R$ ${formatCompactNumber(number / 1000000)} ${t.compactMillion}`;
  if (Math.abs(number) >= 1000) return `R$ ${formatCompactNumber(number / 1000)} ${t.compactThousand}`;
  return `R$ ${number.toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatConcentration = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const number = Number(String(value).replace('%', '').replace(',', '.'));
  return Number.isFinite(number) ? `${number.toFixed(2)}%` : value;
};

const isStock = (type) => type === 'Ação BR' || type === 'Ações (B3)' || type === 'Stocks' || type === 'Ações Internacionais' || type === 'Ações (EUA / Globais)';
const isFii = (type) => type === 'FII' || type === 'FIIs' || type === 'FIIs (B3)' || type === 'Fundo Imobiliário' || type === 'REITs (EUA / Globais)';
const isFixedIncome = (type) => type === 'Renda Fixa' || type === 'Renda Fixa (B3)';
const DETAIL_METRIC_TRANSLATIONS = {
  'P/L': 'priceEarningsMetric',
  'P/VP': 'priceBookMetric',
  LPA: 'epsMetric',
  VPA: 'bvpsMetric',
  'Tx. Cresc.': 'growthMetric',
  'Dív. Líq./EBITDA': 'divEbitda',
  'DY Recorrente': 'fiiRecurringYieldShort',
  'P/VP Ajustado': 'fiiAdjustedPvp',
  Vacância: 'fiiVacancy',
  Rating: 'fiiRating',
  LTV: 'fiiLtv',
  Indexador: 'fiiIndexador',
  Spread: 'fiiSpread',
  'Liquidez Diária': 'fiiDailyLiquidity',
  Alavancagem: 'fiiLeverage',
  Concentração: 'fiiConcentration',
  'Patrimônio Real': 'patrimonioReal',
  'Taxa de Rentabilidade': 'taxaRentabilidade',
  'Data de Vencimento': 'dataVencimento'
};
const translateDetailMetric = (label, t) => {
  if (label === 'DY 12M' || label === 'DY 24M') {
    return t.dyPeriodLabel.replace('{period}', label.slice(3));
  }
  return t[DETAIL_METRIC_TRANSLATIONS[label]] || label;
};

const getFiiDyCard = (item) => {
  const selectedPeriod = normalizeFiiDyPeriod(item?.dyPeriod || (
    item?.dividendo24m !== undefined && item?.dividendo24m !== null && item?.dividendo24m !== '' ? '24M' : '12M'
  ));

  const value = selectedPeriod === '24M'
    ? item?.dividendo24m ?? item?.dyHistorico12M ?? item?.dividendo12m ?? null
    : item?.dividendo12m ?? item?.dyHistorico12M ?? item?.dividendo24m ?? null;

  return {
    label: `DY ${selectedPeriod}`,
    value
  };
};

const detailMetricsForItem = (item) => {
  const metrics = [];

  if (isStock(item.type)) {
    metrics.push(
      ['DY', item.dividendYield],
      ['P/L', item.pL],
      ['P/VP', item.pVp],
      ['ROE', item.roe],
      ['LPA', item.lpa],
      ['VPA', item.vpa],
      ['Tx. Cresc.', item.growthRate],
      ['ROIC', item.roic],
      ['Dív. Líq./EBITDA', item.divEbitda]
    );
  }

  if (isFii(item.type)) {
    const fiiDy = getFiiDyCard(item);

    if (item.fiiCategory === 'Papel') {
      metrics.push(
        ['DY Recorrente', item.dividendYieldRecorrente],
        ['Liquidez Diária', item.liquidezDiaria],
        [fiiDy.label, fiiDy.value],
        ['Patrimônio Real', item.patrimonioReal],
        ['Rating', item.rating],
        ['LTV', item.ltv],
        ['Indexador', item.indexador],
        ['Spread', item.spread]
      );
    } else {
      metrics.push(
        ['DY Recorrente', item.dividendYieldRecorrente],
        ['P/VP Ajustado', item.pVpAjustado],
        ['Vacância', item.vacancia],
        ['Cap Rate', item.capRate],
        ['Liquidez Diária', item.liquidezDiaria],
        ['Alavancagem', item.alavancagem],
        ['Concentração', item.concentracao],
        [fiiDy.label, fiiDy.value],
        ['Patrimônio Real', item.patrimonioReal]
      );
    }
  }

  if (isFixedIncome(item.type)) {
    metrics.push(
      ['Taxa de Rentabilidade', item.taxaRentabilidade],
      ['Data de Vencimento', item.dataVencimento]
    );
  }

  return metrics;
};

const formatDetailValue = (key, value, t, lang) => {
  if (value === null || value === undefined || value === '') return '-';

  if (key === 'Liquidez Diária' || key === 'Patrimônio Real') {
    return formatCompactCurrency(value, t, lang);
  }

  if ([
    'DY', 'DY Recorrente', 'DY 12M', 'DY 24M', 'ROE', 'ROIC', 'Tx. Cresc.', 'Vacância', 'Alavancagem',
    'Cap Rate', 'Taxa de Rentabilidade', 'Concentração', 'LTV'
  ].includes(key)) {
    return formatPercent(value);
  }

  if (key === 'Data de Vencimento') {
    return formatDate(value);
  }

  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : String(value);
};

export default function AssetsTable({
  assets,
  isDarkMode,
  formatMoney,
  cardClass,
  t,
  lang,
  onEdit,
  onDelete,
  loadingEditAssetId,
  onUpdateQuote,
  updatingAssetId
}) {
  const assetList = Array.isArray(assets) ? assets : [];
  const [expandedAssetId, setExpandedAssetId] = React.useState(null);
  const [deletingAssetId, setDeletingAssetId] = React.useState(null);

  const toggleAsset = (assetId) => {
    setExpandedAssetId((current) => (current === assetId ? null : assetId));
  };

  const handleDeleteAsset = async (assetId) => {
    setDeletingAssetId(assetId);
    try {
      await onDelete(assetId);
    } finally {
      setDeletingAssetId(null);
    }
  };

  return (
    <div className={`rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40 ${cardClass}`}>
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
        <h3 className="font-bold text-sm text-slate-100">{t.ativosCadastrados}</h3>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {assetList.length > 0 ? assetList.map((item) => {
          const isExpanded = expandedAssetId === item.id;
          const isEditing = String(loadingEditAssetId) === String(item.id);
          const isDeleting = String(deletingAssetId) === String(item.id);
          const assetTypeLabel = t[ASSET_TYPE_TRANSLATION_KEYS[item.type]] || item.type || '-';
          const fields = [
            [t.qtd, item.qty],
            [t.pm, formatMoney(item.pm)],
            [t.purchaseDate, formatPurchaseDate(item.buyDate, lang)],
            [t.cotacao, formatMoney(item.price)],
            [t.valorTotal, formatMoney(item.valorTotal)],
            [t.pctAtual, formatMetric(item.pctAtual, '%')],
            [t.meta, formatAssetMeta(item)]
          ];

          return (
            <article key={item.id} className={`rounded-xl border p-4 ${cardClass}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className={`truncate text-base font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    {item.ticker}
                  </h4>
                  <span className="text-xs text-slate-500">{assetTypeLabel}</span>
                  {item.name && <p className="truncate text-xs text-slate-500">{item.name}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleAsset(item.id)}
                    className="rounded-lg border border-slate-700 bg-slate-900/70 p-2 text-slate-300"
                    aria-label={isExpanded ? t.closeAnalysis : t.viewAnalysis}
                    title={isExpanded ? t.closeAnalysis : t.viewAnalysis}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateQuote(item)}
                    disabled={Boolean(updatingAssetId)}
                    className="p-2 text-slate-400 disabled:opacity-50"
                    aria-label={updatingAssetId === item.id ? t.atualizando : t.atualizarCotas}
                    title={updatingAssetId === item.id ? t.atualizando : t.atualizarCotas}
                  >
                    <RefreshCw className={`h-4 w-4 ${updatingAssetId === item.id ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>
                  <button type="button" onClick={() => onEdit(item)} disabled={isEditing || isDeleting} aria-busy={isEditing} className="p-2 text-slate-400 disabled:cursor-wait disabled:opacity-50" aria-label={isEditing ? t.assetEditing : t.editarAtivo} title={isEditing ? t.assetEditing : t.editarAtivo}>
                    {isEditing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => handleDeleteAsset(item.id)} disabled={isDeleting || isEditing} aria-busy={isDeleting} className="p-2 text-slate-400 disabled:cursor-wait disabled:opacity-50" aria-label={isDeleting ? t.assetDeleting : t.cancelar} title={isDeleting ? t.assetDeleting : t.cancelar}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                {fields.map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase text-slate-500">{label}</dt>
                    <dd className={`truncate text-sm font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{value}</dd>
                  </div>
                ))}
                <div className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase text-slate-500">{t.lucroPrejuizo}</dt>
                  <dd className={`truncate text-sm font-bold ${Number(item.lucro) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatMoney(item.lucro)} ({Number(item.rentabilidade) >= 0 ? '+' : ''}{formatMetric(item.rentabilidade, '%')})
                  </dd>
                </div>
              </dl>
              {isExpanded && (
                <div className="mt-4 border-t border-slate-700/50 pt-3">
                  <div className="mb-2 text-[10px] font-bold uppercase text-slate-500">{t.analysisIndicators}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {detailMetricsForItem(item).map(([label, value]) => (
                      <div key={`${item.id}-${label}`} className={`min-w-0 rounded-lg border p-2 ${cardClass}`}>
                        <div className="truncate text-[10px] text-slate-500">{translateDetailMetric(label, t)}</div>
                        <div className={`truncate text-sm font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                          {formatDetailValue(label, value, t, lang)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        }) : (
          <div className="py-8 text-center text-xs text-slate-500">{t.semDados}</div>
        )}
      </div>

      <div className="hidden max-h-[500px] overflow-auto md:block">
        <table className="w-full text-left text-xs whitespace-nowrap min-w-0">
          <thead className="bg-slate-900/60 text-slate-400 uppercase border-b border-slate-800">
            <tr>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 w-28">{t.tipo}</th>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 min-w-[120px]">{t.ticker}</th>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 text-right">{t.qtd}</th>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 text-right">{t.pm}</th>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 text-center">{t.purchaseDate}</th>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 text-right">{t.cotacao}</th>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 text-right">{t.valorTotal}</th>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 text-right">{t.lucroPrejuizo}</th>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 text-center">{t.pctAtual}</th>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 text-center">{t.meta}</th>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 text-right w-32">{t.acoes}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {assetList.length > 0 ? (
              assetList.map((item) => {
                const isExpanded = expandedAssetId === item.id;
                const isEditing = String(loadingEditAssetId) === String(item.id);
                const isDeleting = String(deletingAssetId) === String(item.id);
                const metaPercent = formatAssetMeta(item);
                const assetTypeLabel = t[ASSET_TYPE_TRANSLATION_KEYS[item.type]] || item.type || '-';

                return (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-slate-900/30 align-top">
                      <td className="p-2.5 align-middle">
                        <span className="inline-flex rounded-full border border-slate-700 bg-slate-800/90 px-2 py-1 text-[10px] font-semibold text-slate-200">
                          {assetTypeLabel}
                        </span>
                      </td>
                      <td className="p-2.5 align-middle font-bold text-slate-100">
                        <div className="flex flex-col">
                          <span>{item.ticker}</span>
                          {item.name && (
                            <span className="text-[10px] text-slate-500 truncate max-w-[160px]">{item.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5 text-right text-slate-200">{item.qty}</td>
                      <td className="p-2.5 text-right text-slate-200">{formatMoney(item.pm)}</td>
                      <td className="p-2.5 text-center text-slate-200">{formatPurchaseDate(item.buyDate, lang)}</td>
                      <td className="p-2.5 text-right text-slate-200">{formatMoney(item.price)}</td>
                      <td className="p-2.5 text-right font-bold text-slate-100">{formatMoney(item.valorTotal)}</td>
                      <td
                        className={`p-2.5 text-right font-bold ${
                          Number(item.lucro) >= 0 ? 'text-emerald-400' : 'text-rose-500'
                        }`}
                      >
                        <div>{formatMoney(item.lucro)}</div>
                        <div className="text-[10px] text-slate-400">
                          {Number(item.rentabilidade) >= 0 ? '+' : ''}{formatMetric(item.rentabilidade, '%')}
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-100">
                        {formatMetric(item.pctAtual, '%')}
                      </td>
                      <td className="p-2.5 text-center text-slate-300">
                        {metaPercent}
                      </td>
                      <td className="p-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleAsset(item.id)}
                            className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/70 p-1.5 text-slate-300 hover:border-sky-500 hover:text-sky-400 transition-colors"
                            aria-label={isExpanded ? t.closeAnalysis : t.viewAnalysis}
                            title={isExpanded ? t.closeAnalysis : t.viewAnalysis}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateQuote(item)}
                            disabled={Boolean(updatingAssetId)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={updatingAssetId === item.id ? t.atualizando : t.atualizarCotas}
                            aria-label={updatingAssetId === item.id ? t.atualizando : t.atualizarCotas}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${updatingAssetId === item.id ? 'animate-spin text-emerald-400' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            disabled={isEditing || isDeleting}
                            aria-busy={isEditing}
                            className="p-1.5 text-slate-400 hover:text-sky-400 disabled:cursor-wait disabled:opacity-50"
                            title={isEditing ? t.assetEditing : t.editarAtivo}
                            aria-label={isEditing ? t.assetEditing : t.editarAtivo}
                          >
                            {isEditing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(item.id)}
                            disabled={isDeleting || isEditing}
                            aria-busy={isDeleting}
                            className="p-1.5 text-slate-400 hover:text-rose-400 disabled:cursor-wait disabled:opacity-50"
                            title={isDeleting ? t.assetDeleting : t.cancelar}
                            aria-label={isDeleting ? t.assetDeleting : t.cancelar}
                          >
                            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={11} className="p-0 border-b border-slate-800">
                          <div className="bg-slate-950/80 px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                                {t.analysisIndicators}
                              </span>
                              <div className="flex items-center gap-2">
                                {isFii(item.type) && (
                                  <span className="inline-flex rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-[10px] font-semibold text-sky-300">
                                    {getFiiDyCard(item).label}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500">{assetTypeLabel}</span>
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                              {detailMetricsForItem(item).map(([label, value]) => (
                                <div
                                  key={`${item.id}-${label}`}
                                  className="min-h-[72px] rounded-xl border border-slate-800 bg-slate-900/70 p-2.5 shadow-[inset_0_1px_0_rgba(148,163,184,0.06)]"
                                >
                                  <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{translateDetailMetric(label, t)}</div>
                                  <div className="mt-1 text-sm font-semibold text-slate-100 truncate">
                                    {formatDetailValue(label, value, t, lang)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="11" className="text-center p-8 text-slate-500">
                  {t.semDados}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
