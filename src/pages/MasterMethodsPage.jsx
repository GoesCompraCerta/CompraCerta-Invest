import React from 'react';
import { BarChart3 } from 'lucide-react';
import MethodCard from '../components/Common/MethodCard';
import { calculateMasterMethods } from '../services/calculationService';

const TYPE_LABELS = {
  'Ação BR': 'Ação (B3)',
  'Ações (B3)': 'Ação (B3)',
  Acao: 'Ação (B3)',
  Stocks: 'Ação (EUA)',
  'Ações Internacionais': 'Ação (EUA)',
  'Ações (EUA / Globais)': 'Ação (EUA)'
};

export default function MasterMethodsPage({
  assets,
  formatMoney,
  themeStyle,
  cardClass,
  isDarkMode,
  t
}) {
  const stockAssets = (assets || []).filter((asset) => (
    asset.type === 'Ação BR' || asset.type === 'Ações (B3)' || asset.type === 'Stocks' || asset.type === 'Ações Internacionais' || asset.type === 'Ações (EUA / Globais)' || asset.type === 'Acao'
  ));

  return (
    <section className="w-full space-y-6">
      <div className={`w-full p-6 rounded-2xl border ${cardClass}`}>
        <div className="mb-5">
          <h2 className="font-bold text-xl text-emerald-400 flex items-center gap-2">
            <BarChart3 className={`w-4 h-4 ${themeStyle.text}`} />
            {t.analiseExcelencia}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.analiseDescricao}</p>
        </div>

        {stockAssets.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            {t.semAtivosAnalise}
          </div>
        ) : (
          (() => {
            const rows = Array.from({ length: Math.ceil(stockAssets.length / 3) }, (_, rowIndex) =>
              stockAssets.slice(rowIndex * 3, rowIndex * 3 + 3)
            );

            return rows.map((row, rowIndex) => (
              <React.Fragment key={`stock-row-${rowIndex}`}>
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                  {row.map((asset) => {
                    const precoAtual = Number(asset.price) || 0;
                    const readNumber = (value) => {
                      if (value === undefined || value === null || value === '') return null;
                      const number = Number(value);
                      return Number.isFinite(number) ? number : null;
                    };
                    const dividendYield = readNumber(asset.dividendYield);
                    const pL = readNumber(asset.pL);
                    const pVp = readNumber(asset.pVp);
                    const roe = readNumber(asset.roe);
                    const lpaCadastrado = readNumber(asset.lpa);
                    const vpaCadastrado = readNumber(asset.vpa);
                    const taxaCrescimento = readNumber(asset.growthRate);
                    const roic = readNumber(asset.roic);
                    const divEbitda = Number(asset.divEbitda);

                    const methods = calculateMasterMethods(asset);
                    const { bazin, lynch, graham, buffett } = methods;

                    return (
                      <article
                        key={asset.id}
                        className="w-full min-w-0 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-xl p-4"
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
                              {TYPE_LABELS[asset.type] || asset.type}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {t.atual}:{' '}
                            <span className="font-bold text-white">
                              {formatMoney(precoAtual)}
                            </span>
                          </span>
                        </div>

                        <div className="w-full grid grid-cols-3 2xl:grid-cols-4 auto-rows-fr gap-1.5 mb-3 text-[9px]">
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">DY</span>
                            <strong>{dividendYield === null ? '—' : `${dividendYield.toFixed(2)}%`}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">P/L</span>
                            <strong>{pL === null ? '—' : pL.toFixed(2)}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">P/VP</span>
                            <strong>{pVp === null ? '—' : pVp.toFixed(2)}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">ROE</span>
                            <strong>{roe === null ? '—' : `${roe.toFixed(2)}%`}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">{t.lpa}</span>
                            <strong>{lpaCadastrado === null ? '—' : lpaCadastrado.toFixed(2)}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">{t.vpa}</span>
                            <strong>{vpaCadastrado === null ? '—' : vpaCadastrado.toFixed(2)}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block truncate">{t.txCrescimento}</span>
                            <strong>{taxaCrescimento === null ? '—' : `${taxaCrescimento.toFixed(2)}%`}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block">{t.roic}</span>
                            <strong>{roic === null ? '—' : `${roic.toFixed(2)}%`}</strong>
                          </div>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-1.5 py-1">
                            <span className="text-slate-400 block truncate">{t.divEbitda}</span>
                            <strong>{Number.isFinite(divEbitda) ? divEbitda.toFixed(2) : '—'}</strong>
                          </div>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-3 mt-auto">
                          <MethodCard
                            title={`BAZIN — ${t.precoTeto}`}
                            subtitle={bazin ? `DPA: ${formatMoney(bazin.dpa)} | Teto: ${formatMoney(bazin.value)}` : null}
                            color={bazin ? bazin.color : null}
                            approved={bazin ? bazin.approved : null}
                            approvedText={t.bazinComprarMeta}
                            attentionText={t.atencaoCriterios}
                            rejectedText={t.bazinAguardarCaro}
                            insufficientText={t.insufficientData}
                            titleClassName="text-emerald-400"
                          />
                          <MethodCard
                            title={`LYNCH — ${t.precoJusto}`}
                            subtitle={lynch ? `Justo: ${formatMoney(lynch.value)}` : null}
                            color={lynch ? lynch.color : null}
                            approved={lynch ? lynch.approved : null}
                            approvedText={t.lynchAbaixoJusto}
                            attentionText={t.atencaoCriterios}
                            rejectedText={t.lynchAcimaJusto}
                            insufficientText={t.insufficientData}
                            titleClassName="text-emerald-400"
                          />
                          <MethodCard
                            title={`GRAHAM — ${t.valorIntrinseco}`}
                            subtitle={graham ? `Intrínseco: ${formatMoney(graham.value)}` : null}
                            color={graham ? graham.color : null}
                            approved={graham ? graham.approved : null}
                            approvedText={t.grahamComMargem}
                            attentionText={t.atencaoCriterios}
                            rejectedText={t.grahamSemMargem}
                            insufficientText={t.insufficientData}
                            titleClassName="text-emerald-400"
                          />
                          <MethodCard
                            title={`BUFFETT — ${t.fossoEconomico}`}
                            subtitle={buffett ? `${t.roic}: ${buffett.roic ? `${buffett.roic.toFixed(2)}%` : '—'} | ${t.divEbitda}: ${buffett.debt ? buffett.debt.value.toFixed(2) : '—'}` : null}
                            color={buffett ? buffett.color : null}
                            approved={buffett ? buffett.approved : null}
                            approvedText={t.excelenciaFinanceira}
                            attentionText={t.atencaoCriterios}
                            rejectedText={t.dividaAcimaSegura}
                            insufficientText={t.insufficientData}
                            titleClassName="text-emerald-400"
                            compact
                          />
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
