import React from 'react';
import { Edit3, Trash2, Download, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { normalizeFiiDyPeriod } from '../../services/calculationService';

const formatMetric = (value, suffix = '') => {
  if (value === null || value === undefined || value === '') return '-';

  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(2)}${suffix}` : '-';
};

const TYPE_LABELS = {
  'Ação BR': 'Ação (B3)', 'Ações (B3)': 'Ação (B3)', FII: 'FII (B3)', 'FIIs (B3)': 'FII (B3)', ETF: 'ETF (B3)', 'ETF (B3)': 'ETF (B3)', 'ETFs (B3)': 'ETF (B3)', 'ETF Nacional': 'ETF (B3)', 'Renda Fixa': 'Renda Fixa',
  Cripto: 'Cripto', Stocks: 'Ação (EUA)',
  'Ações Internacionais': 'Ação (EUA)', 'Ações (EUA / Globais)': 'Ação (EUA)', 'ETF Internacional': 'ETF (EUA)', 'ETFs (EUA / Globais)': 'ETF (EUA)', Internacional: 'Ação (EUA)',
  REITs: 'REIT (EUA)', 'REITs (EUA / Globais)': 'REIT (EUA)', BDR: 'BDR (B3)', 'BDRs (B3)': 'BDR (B3)'
};

const formatDate = (value) => value || '-';
const formatPurchaseDate = (value) => {
  if (!value) return '—';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : '—';
};
const formatPercent = (value, digits = 2) => {
  if (value === null || value === undefined || value === '') return '-';
  const number = Number(String(value).replace('%', '').replace(',', '.'));
  return Number.isFinite(number) ? `${number.toFixed(digits)}%` : '-';
};

const formatCompactCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const number = Number(value);
  if (!Number.isFinite(number)) return '-';

  const formatCompactNumber = (amount) =>
    Number(amount).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  if (Math.abs(number) >= 1000000000) return `R$ ${formatCompactNumber(number / 1000000000)} bi`;
  if (Math.abs(number) >= 1000000) return `R$ ${formatCompactNumber(number / 1000000)} mi`;
  if (Math.abs(number) >= 1000) return `R$ ${formatCompactNumber(number / 1000)} mil`;
  return `R$ ${number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatConcentration = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const number = Number(String(value).replace('%', '').replace(',', '.'));
  return Number.isFinite(number) ? `${number.toFixed(2)}%` : value;
};

const isStock = (type) => type === 'Ação BR' || type === 'Ações (B3)' || type === 'Stocks' || type === 'Ações Internacionais' || type === 'Ações (EUA / Globais)';
const isFii = (type) => type === 'FII' || type === 'FIIs' || type === 'FIIs (B3)' || type === 'Fundo Imobiliário' || type === 'REITs (EUA / Globais)';
const isFixedIncome = (type) => type === 'Renda Fixa' || type === 'Renda Fixa (B3)';

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

  if (isFixedIncome(item.type)) {
    metrics.push(
      ['Taxa de Rentabilidade', item.taxaRentabilidade],
      ['Data de Vencimento', item.dataVencimento]
    );
  }

  return metrics;
};

const formatDetailValue = (key, value) => {
  if (value === null || value === undefined || value === '') return '-';

  if (key === 'Liquidez Diária' || key === 'Patrimônio Real') {
    return formatCompactCurrency(value);
  }

  if ([
    'DY', 'DY Recorrente', 'DY 12M', 'DY 24M', 'ROE', 'ROIC', 'Tx. Cresc.', 'Vacância', 'Alavancagem',
    'Cap Rate', 'Taxa de Rentabilidade', 'Concentração'
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
  formatMoney,
  cardClass,
  t,
  onEdit,
  onDelete,
  onUpdateQuote,
  updatingAssetId,
  onExport
}) {
  const assetList = Array.isArray(assets) ? assets : [];
  const [expandedAssetId, setExpandedAssetId] = React.useState(null);

  const toggleAsset = (assetId) => {
    setExpandedAssetId((current) => (current === assetId ? null : assetId));
  };

  return (
    <div className={`rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40 ${cardClass}`}>
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
        <h3 className="font-bold text-sm text-slate-100">{t.ativosCadastrados}</h3>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> {t.exportarExcel}
        </button>
      </div>

      <div className="max-h-[500px] overflow-auto">
        <table className="w-full text-left text-xs whitespace-nowrap min-w-0">
          <thead className="bg-slate-900/60 text-slate-400 uppercase border-b border-slate-800">
            <tr>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 w-28">{t.tipo}</th>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 min-w-[120px]">{t.ticker}</th>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 text-right">{t.qtd}</th>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 text-right">{t.pm}</th>
              <th className="sticky top-0 z-10 bg-slate-900 p-2.5 text-center">DATA COMPRA</th>
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
                const metaPercent = item.metaPercent ?? item.meta ?? 0;
                const assetTypeLabel = TYPE_LABELS[item.type] || item.type || '-';

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
                      <td className="p-2.5 text-center text-slate-200">{formatPurchaseDate(item.buyDate)}</td>
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
                        {metaPercent}%
                      </td>
                      <td className="p-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleAsset(item.id)}
                            className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/70 p-1.5 text-slate-300 hover:border-sky-500 hover:text-sky-400 transition-colors"
                            aria-label={isExpanded ? 'Fechar análise' : 'Ver análise'}
                            title={isExpanded ? 'Fechar análise' : 'Ver análise'}
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
                            className="p-1.5 text-slate-400 hover:text-sky-400"
                            title={t.editarAtivo}
                            aria-label={t.editarAtivo}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400"
                            title={t.cancelar}
                            aria-label={t.cancelar}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
                                INDICADORES FUNDAMENTALISTAS
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
                                  <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</div>
                                  <div className="mt-1 text-sm font-semibold text-slate-100 truncate">
                                    {formatDetailValue(label, value)}
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
