import React from 'react';
import { Building2 } from 'lucide-react';
import MethodCard from '../../components/Common/MethodCard';
import { calculateFiiMethods, getFiiIndicators, getSelectedFiiDy } from '../../services/calculationService';

export default function ThreeMusketeersPage({
  assets,
  formatMoney,
  themeStyle,
  cardClass,
  isDarkMode,
  t
}) {
  const displayNumber = (value, suffix = '') => (
    value === null ? '—' : `${value.toFixed(2)}${suffix}`
  );
  const displayCurrencyShort = (value) => {
    if (value === null) return '—';
    if (Math.abs(value) >= 1000000000) return `R$ ${(value / 1000000000).toFixed(2)}B`;
    if (Math.abs(value) >= 1000000) return `R$ ${(value / 1000000).toFixed(2)}M`;
    if (Math.abs(value) >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
    return `R$ ${value.toFixed(2)}`;
  };
  const displayConcentration = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    const number = Number(String(value).replace('%', '').replace(',', '.'));
    return Number.isFinite(number) ? `${number.toFixed(2)}%` : value;
  };
  const fiiAssets = (assets || []).filter((asset) => (
    asset.type === 'FII' || asset.type === 'FIIs' || asset.type === 'FIIs (B3)' || asset.type === 'Fundo Imobiliário' || asset.type === 'REITs (EUA / Globais)'
  ));

  return (
    <section className="w-full space-y-6">
      <div className={`w-full p-6 rounded-2xl border ${cardClass}`}>
        <div className="mb-5">
          <h2 className="font-bold text-xl text-emerald-400 flex items-center gap-2">
            <Building2 className={`w-4 h-4 ${themeStyle.text}`} />
            {t.fiiPageTitle || 'Três Mosqueteiros (FIIs)'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.fiiPageDescription || 'Análise de excelência para Fundos Imobiliários.'}
          </p>
        </div>

        {fiiAssets.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            {t.fiiNoAssets || t.semAtivosAnalise || 'Nenhum FII cadastrado para análise.'}
          </div>
        ) : (
          (() => {
            const rows = Array.from({ length: Math.ceil(fiiAssets.length / 3) }, (_, rowIndex) =>
              fiiAssets.slice(rowIndex * 3, rowIndex * 3 + 3)
            );

            return rows.map((row, rowIndex) => (
              <React.Fragment key={`fii-row-${rowIndex}`}>
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {row.map((asset) => {
                    const {
                      currentPrice,
                      recurringYield,
                      adjustedPvp,
                      vacancy,
                      capRate,
                      leverage,
                      concentration,
                      realPatrimony,
                      dailyLiquidity
                    } = getFiiIndicators(asset);
                    const selectedDy = getSelectedFiiDy(asset);
                    const activeDividendValue = selectedDy.value ?? null;
                    const activeDividendLabel = `${t.fiiDividendPrefix || 'Div.'} ${selectedDy.period}`;
                    const precoAtual = currentPrice ?? 0;

                    const methods = calculateFiiMethods ? calculateFiiMethods(asset) : {};
                    const { bastter, baragiola, caetano } = methods;

                    return (
                      <article
                        key={asset.id}
                        className={`w-full min-w-0 p-3 rounded-xl border ${
                          isDarkMode
                            ? 'border-slate-800 bg-slate-900/30'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div>
                            <strong className="text-sm">{asset.ticker}</strong>
                            <span
                              className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded ${
                                isDarkMode
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {asset.type}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {t.atual || 'Atual'}:{' '}
                            <span className="font-bold text-white">
                              {formatMoney(precoAtual)}
                            </span>
                          </span>
                        </div>

                        <div className="w-full grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 auto-rows-fr gap-1.5 mb-3 text-[9px]">
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">{t.fiiRecurringYieldShort || 'DY Rec.'}</span>
                            <strong>{displayNumber(recurringYield, '%')}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">{t.fiiAdjustedPvp || 'P/VP Ajustado'}</span>
                            <strong>{displayNumber(adjustedPvp)}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">{t.fiiVacancy || 'Vacância'}</span>
                            <strong>{displayNumber(vacancy, '%')}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">{t.fiiCapRate || 'Cap Rate'}</span>
                            <strong>{displayNumber(capRate, '%')}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">{t.fiiLeverage || 'Alavanc.'}</span>
                            <strong>{displayNumber(leverage, '%')}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">{activeDividendLabel}</span>
                            <strong>{displayNumber(activeDividendValue, '%')}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">{t.fiiConcentration || 'Concentr.'}</span>
                            <strong className="block truncate">{displayConcentration(concentration)}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">{t.fiiPatrimony || 'Patrim.'}</span>
                            <strong>{displayCurrencyShort(realPatrimony)}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">{t.fiiDailyLiquidity || 'Liq. Diária'}</span>
                            <strong>{displayCurrencyShort(dailyLiquidity)}</strong>
                          </div>
                        </div>

                        <div className="w-full grid grid-cols-2 2xl:grid-cols-4 gap-3 items-start">
                          <MethodCard
                            title={t.fiiBastterTitle || 'BASTTER — SEGURANÇA & VALOR'}
                            subtitle={bastter ? `${t.fiiMethodSubtitlePvp || 'P/VP'}: ${bastter.pvp} | ${t.fiiLeverage || 'Alav'}: ${displayNumber(leverage, '%')}` : null}
                            color={bastter ? bastter.color : null}
                            approvedText={t.fiiStatusApproved || 'Ativo no Critério'}
                            attentionText={t.fiiRiskAlert || 'Atenção / Risco'}
                            rejectedText={t.fiiStatusRejected || 'Fora dos Critérios'}
                            insufficientText={t.insufficientData || 'Dados insuficientes'}
                            titleClassName="text-emerald-400"
                          />
                          <MethodCard
                            title={t.fiiBaragiolaTitle || 'BARAGIOLA — PREÇO TETO FII'}
                            subtitle={baragiola ? `${t.fiiCeiling || 'Teto'}: ${formatMoney(baragiola.value)} | DY: ${displayNumber(recurringYield, '%')} | ${t.fiiCapRate || 'Cap'}: ${displayNumber(capRate, '%')}` : null}
                            color={baragiola ? baragiola.color : null}
                            approvedText={t.fiiStatusAbaixoTeto || 'Abaixo do Teto'}
                            attentionText={t.fiiNearCeiling || 'Quase no Limite'}
                            rejectedText={t.fiiStatusAcimaTeto || 'Acima do Teto'}
                            insufficientText={
                              capRate === null || capRate <= 0
                                ? 'Cap Rate não informado'
                                : t.insufficientData || 'Dados insuficientes'
                            }
                            titleClassName="text-emerald-400"
                          />
                          <div className="col-span-1">
                            <MethodCard
                              title={t.fiiCaetanoTitle || 'CAETANO — EFICIÊNCIA OPERACIONAL'}
                              subtitle={caetano ? `Vac: ${displayNumber(vacancy, '%')} | ${t.fiiCapRate || 'Cap'}: ${displayNumber(capRate, '%')} | ${t.fiiConcentration || 'Conc'}: ${displayConcentration(concentration)} | ${t.fiiDailyLiquidity || 'Liq'}: ${displayCurrencyShort(dailyLiquidity)}` : null}
                              color={caetano ? caetano.color : null}
                              approvedText={t.fiiStatusHealthy || 'Operação Saudável'}
                              attentionText={t.fiiVacancyAttention || 'Atenção à Vacância'}
                              rejectedText={t.fiiCriticalVacancy || 'Vacância Crítica'}
                              insufficientText={t.insufficientData || 'Dados insuficientes'}
                              titleClassName="text-emerald-400"
                            />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="p-2.5 mt-3 mb-6 text-[10.5px] leading-snug rounded-md border border-gray-700/60 bg-gray-100/80 text-gray-800 flex items-start gap-2 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200">
                  <span className="text-yellow-500 font-bold shrink-0">⚠️</span>
                  <p>
                    Esta ferramenta foi desenvolvida para elevar o seu nível de autonomia através de dados numéricos inteligentes para potencializar sua análise, mas não substitui seu critério fundamentalista. Não a utilize como recomendação de compra ou venda; a decisão final é sempre sua!
                  </p>
                </div>
              </React.Fragment>
            ));
          })()
        )}
      </div>
    </section>
  );
}