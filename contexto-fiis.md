# Contexto Técnico: Sistema de Avaliação de FIIs (Métodos Bastter, Baragiola e Caetano)
## Projeto: COMPRACERTA INVEST

---

## Caminho: src/services/calculationService.js
```javascript
// ── Calculate portfolio totals ───────────────────────────────────────────────
export const calculatePortfolioTotals = (assets, proventos) => {
  let patrimonio = 0;
  let investido = 0;

  const list = (assets || []).map((item) => {
    const valorTotal = Number(item.qty) * Number(item.price);
    const valorInvestido = Number(item.qty) * Number(item.pm);
    const lucro = valorTotal - valorInvestido;
    const rentabilidade = valorInvestido > 0 ? (lucro / valorInvestido) * 100 : 0;
    
    patrimonio += valorTotal;
    investido += valorInvestido;
    
    return { ...item, valorTotal, valorInvestido, lucro, rentabilidade };
  });

  const lucroTotal = patrimonio - investido;
  const rentabilidadeTotal = investido > 0 ? (lucroTotal / investido) * 100 : 0;
  const totalProventos = (proventos || []).reduce(
    (acc, curr) => acc + Number(curr.value || 0),
    0
  );

  const listWithPct = list.map((item) => ({
    ...item,
    pctAtual: patrimonio > 0 ? (item.valorTotal / patrimonio) * 100 : 0
  }));

  return {
    patrimonio,
    investido,
    lucroTotal,
    rentabilidadeTotal,
    totalProventos,
    list: listWithPct
  };
};

// ── Calculate compound interest ──────────────────────────────────────────────
export const calculateCompoundInterest = (
  initialInvestment,
  monthlyDeposit,
  periodYears,
  monthlyRate,
  targetMonthlyIncome
) => {
  const vInicial = Number(initialInvestment) || 0;
  const vAporte = Number(monthlyDeposit) || 0;
  const taxa = (Number(monthlyRate) || 0) / 100;
  const anos = Number(periodYears) || 0;
  const totalMeses = anos * 12;

  let saldo = vInicial;
  let investido = vInicial;
  const tabela = [];

  for (let m = 1; m <= totalMeses; m++) {
    saldo += saldo * taxa + vAporte;
    investido += vAporte;

    if (m % 12 === 0) {
      tabela.push({
        ano: m / 12,
        investido,
        juros: saldo - investido,
        patrimonio: saldo,
        rendaMensal: saldo * taxa
      });
    }
  }

  const patrimonioFinal = saldo;
  const jurosTotais = patrimonioFinal - investido;
  const rendaMensalFinal = patrimonioFinal * taxa;
  const metaRenda = Number(targetMonthlyIncome) || 1;
  const progressoMeta = Math.min(100, (rendaMensalFinal / metaRenda) * 100);

  return {
    patrimonioFinal,
    investido,
    jurosTotais,
    rendaMensalFinal,
    progressoMeta,
    tabela
  };
};

// ── Calculate investment methods ────────────────────────────────────────────
export const calculateMasterMethods = (asset) => {
  const readPositive = (value) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  };
  const readOptionalNumber = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  const currentPrice = readPositive(asset?.price);
  const averagePrice = readPositive(asset?.pm);
  const lpa = readPositive(asset?.lpa);
  const vpa = readPositive(asset?.vpa);
  const growthRatePercent = readPositive(asset?.growthRate);
  const growthMultiplier = growthRatePercent && growthRatePercent <= 1
    ? growthRatePercent * 100
    : growthRatePercent;
  const roicPercent = readPositive(asset?.roic);
  const dividendYield = readPositive(asset?.dividendYield);
  const normalizedDividendYield = dividendYield > 1 ? dividendYield / 100 : dividendYield;
  const divEbitda = readOptionalNumber(asset?.divEbitda);
  const debtSafety = divEbitda !== null
    ? { value: divEbitda, approved: divEbitda <= 0 }
    : null;

  const bazinDpa = currentPrice && normalizedDividendYield
    ? currentPrice * normalizedDividendYield
    : null;
  const bazinValue = bazinDpa ? bazinDpa / 0.06 : null;
  const bazin = bazinValue && currentPrice
    ? {
        dpa: bazinDpa,
        value: bazinValue,
        approved: currentPrice <= bazinValue
      }
    : null;

  const lynchValue = lpa && growthMultiplier ? lpa * growthMultiplier : null;
  const lynch = lynchValue && currentPrice
    ? {
        value: lynchValue,
        approved: currentPrice < lynchValue
      }
    : null;

  const grahamValue = lpa && vpa ? Math.sqrt(22.5 * lpa * vpa) : null;
  const graham = grahamValue && currentPrice && averagePrice
    ? {
        value: grahamValue,
        approved: currentPrice <= grahamValue && averagePrice <= grahamValue
      }
    : null;

  const buffett = roicPercent || debtSafety
    ? {
        roic: roicPercent,
        debt: debtSafety,
        approved: debtSafety ? debtSafety.approved : false
      }
    : null;

  return { bazin, lynch, graham, debtSafety, buffett };
};

const readFiiNumber = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue;
    const normalized = String(value).trim().replace(/\s/g, '').replace(/%$/, '');
    const numberValue = normalized.includes(',')
      ? normalized.replace(/\./g, '').replace(',', '.')
      : /^\d{1,3}(\.\d{3})+$/.test(normalized)
        ? normalized.replace(/\./g, '')
        : normalized;
    const number = Number(numberValue);
    if (Number.isFinite(number)) return number;
  }
  return null;
};

const readConcentration = (value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'baixa') return 10;
    if (normalized === 'média' || normalized === 'media') return 25;
    if (normalized === 'alta') return 50;
  }
  return readFiiNumber(value);
};

export const normalizeFiiDyPeriod = (value) => {
  const normalizedValue = String(value || '12M').trim().toUpperCase();
  return normalizedValue === '24M' ? '24M' : '12M';
};

export const getSelectedFiiDy = (asset) => {
  const selectedPeriod = normalizeFiiDyPeriod(asset?.dyPeriod || (
    readFiiNumber(asset?.dividendo24m) !== null ? '24M' : '12M'
  ));

  const value = selectedPeriod === '24M'
    ? readFiiNumber(asset?.dividendo24m, asset?.dyHistorico12M, asset?.dividendo12m)
    : readFiiNumber(asset?.dividendo12m, asset?.dyHistorico12M, asset?.dividendo24m);

  return {
    period: selectedPeriod,
    value
  };
};

export const getFiiIndicators = (asset) => {
  const selectedDy = getSelectedFiiDy(asset);

  return {
    currentPrice: readFiiNumber(asset?.price),
    recurringYield: readFiiNumber(asset?.dividendYieldRecorrente, asset?.dividendYield),
    adjustedPvp: readFiiNumber(asset?.pVpAjustado, asset?.pVp),
    vacancy: readFiiNumber(asset?.vacancia, asset?.vacancy),
    capRate: readFiiNumber(asset?.capRate),
    leverage: readFiiNumber(asset?.alavancagem),
    dividend12m: readFiiNumber(asset?.dividendo12m, asset?.dyHistorico12M),
    dividend24m: readFiiNumber(asset?.dividendo24m),
    selectedDyPeriod: selectedDy.period,
    selectedDyValue: selectedDy.value,
    concentration: asset?.concentracao ?? null,
    concentrationRate: readConcentration(asset?.concentracao),
    realPatrimony: readFiiNumber(asset?.patrimonioReal ?? asset?.patrimonio),
    dailyLiquidity: readFiiNumber(asset?.liquidezDiaria)
  };
};

export const calculateFiiMethods = (asset) => {
  const {
    currentPrice,
    recurringYield,
    adjustedPvp,
    vacancy,
    capRate,
    leverage,
    selectedDyValue,
    concentrationRate,
    dailyLiquidity
  } = getFiiIndicators(asset);
  const referenceRate = capRate !== null && capRate > 0 ? capRate / 100 : 0.08;
  const yieldValue = selectedDyValue ?? recurringYield ?? null;
  const normalizedYield = yieldValue !== null
    ? (yieldValue > 1 ? yieldValue / 100 : yieldValue)
    : null;
  const annualDividend = currentPrice !== null && normalizedYield !== null
    ? currentPrice * normalizedYield
    : null;
  const ceilingValue = annualDividend !== null && referenceRate > 0
    ? annualDividend / referenceRate
    : null;

  const bastter = adjustedPvp !== null && leverage !== null
    ? { pvp: adjustedPvp.toFixed(2), leverage: leverage.toFixed(2), approved: adjustedPvp <= 1 && leverage < 10 }
    : null;

  const baragiola = ceilingValue === null || currentPrice === null ? null : {
    value: ceilingValue,
    approved: currentPrice <= ceilingValue
  };

  const caetano = vacancy !== null && capRate !== null && concentrationRate !== null && dailyLiquidity !== null
    ? {
        value: vacancy < 10 && capRate >= 7 && concentrationRate < 25 && dailyLiquidity > 50000 ? 'Saudável' : 'Atenção Operacional',
        approved: vacancy < 10 && capRate >= 7 && concentrationRate < 25 && dailyLiquidity > 50000
      }
    : null;

  return { bastter, baragiola, caetano };
};

// ── Export portfolio and proventos as one tax-focused Excel workbook ────────
export const exportPortfolioToExcel = async (assets = [], proventos = []) => {
  const portfolioAssets = Array.isArray(assets) ? assets : [];
  const portfolioIncome = Array.isArray(proventos) ? proventos : [];
  if (portfolioAssets.length === 0 && portfolioIncome.length === 0) return;

  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const currencyFormat = 'R$ #,##0.00';
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F766E' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  const applySheetFormatting = (sheet, widths, currencyColumns = [], dateColumns = []) => {
    sheet['!cols'] = widths.map((wch) => ({ wch }));
    sheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    sheet['!autofilter'] = { ref: sheet['!ref'] };
    const range = XLSX.utils.decode_range(sheet['!ref']);
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const header = sheet[XLSX.utils.encode_cell({ r: 0, c: column })];
      if (header) header.s = headerStyle;
    }
    for (let row = 1; row <= range.e.r; row += 1) {
      currencyColumns.forEach((column) => {
        const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
        if (cell && typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = currencyFormat;
        }
      });
      dateColumns.forEach((column) => {
        const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
        if (cell && cell.v instanceof Date) cell.z = 'dd/mm/yyyy';
      });
    }
  };

  const assetRows = portfolioAssets.map((asset) => {
    const quantity = Number(asset.qty) || 0;
    const averagePrice = Number(asset.pm) || 0;
    return [asset.ticker || '', asset.type || '', quantity, averagePrice, quantity * averagePrice];
  });

  const incomeRows = portfolioIncome
    .filter((income) => income && (income.ticker || income.ativo))
    .map((income) => {
      const rawDate = String(income.date || income.data || '');
      const brazilianDate = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      const parsedDate = brazilianDate
        ? new Date(`${brazilianDate[3]}-${brazilianDate[2]}-${brazilianDate[1]}T00:00:00`)
        : rawDate ? new Date(`${rawDate}T00:00:00`) : null;
      const type = String(income.type || income.tipo || '').toLowerCase();
      return [
        parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : rawDate,
        String(income.ticker || income.ativo).toUpperCase(),
        type.includes('jcp') || type.includes('juros') ? 'JCP' : 'Dividendos',
        Number(income.value ?? income.amount ?? income.valor) || 0
      ];
    });

  const complete = XLSX.utils.aoa_to_sheet([
    ['ATIVOS / RESUMO DA CARTEIRA'],
    ['Ticker', 'Tipo', 'Quantidade', 'Preco medio (R$)', 'Custo total (R$)'],
    ...assetRows,
    [],
    ['RENDIMENTOS E PROVENTOS'],
    ['Data', 'Ativo', 'Tipo', 'Valor recebido (R$)'],
    ...incomeRows
  ]);
  applySheetFormatting(complete, [18, 18, 14, 22, 22], [3, 4]);
  XLSX.utils.book_append_sheet(workbook, complete, 'Resumo Completo');

  const summary = XLSX.utils.aoa_to_sheet([
    ['Ticker', 'Tipo', 'Quantidade', 'Preco medio (R$)', 'Custo total (R$)'],
    ...assetRows
  ]);
  applySheetFormatting(summary, [16, 16, 14, 20, 20], [3, 4]);
  XLSX.utils.book_append_sheet(workbook, summary, 'Ativos - Resumo');

  const bens = XLSX.utils.aoa_to_sheet([
    ['Codigo / Ticker', 'Tipo de bem', 'Quantidade em 31/12', 'Custo medio de aquisicao (R$)', 'Custo de aquisicao (R$)', 'Descricao para Bens e Direitos'],
    ...portfolioAssets.map((asset) => [asset.ticker || '', asset.type || '', Number(asset.qty) || 0, Number(asset.pm) || 0, (Number(asset.qty) || 0) * (Number(asset.pm) || 0), `${asset.qty} cotas de ${asset.ticker} (${asset.type}), adquiridas pelo custo total informado.`])
  ]);
  applySheetFormatting(bens, [20, 18, 20, 30, 25, 72], [3, 4]);
  XLSX.utils.book_append_sheet(workbook, bens, 'IR - Bens e Direitos');

  const income = XLSX.utils.aoa_to_sheet([
    ['Data', 'Ativo', 'Tipo', 'Valor recebido (R$)'],
    ...incomeRows
  ]);
  applySheetFormatting(income, [14, 16, 18, 24], [3], [0]);
  XLSX.utils.book_append_sheet(workbook, income, 'Rendimentos e Proventos');

  XLSX.writeFile(workbook, `carteira_ir_${new Date().getFullYear()}.xlsx`);
};
```

---

## Caminho: src/components/Common/MethodCard.jsx
```jsx
import React from 'react';

export default function MethodCard({
  title,
  subtitle,
  approved,
  approvedText,
  rejectedText,
  insufficientText,
  className = '',
  titleClassName = 'text-slate-300'
}) {
  const insufficient = approved === null;

  return (
    <div
      className={`aspect-square w-full min-w-0 p-3 rounded-xl border shadow-lg flex flex-col justify-between ${className} ${
        insufficient
          ? 'bg-slate-500/10 border-slate-500/30'
          : approved
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-rose-500/10 border-rose-500/30'
      }`}
    >
      <div>
        <div className={`min-w-0 break-words text-[10px] font-bold tracking-wider uppercase mb-2 pb-1.5 border-b border-slate-700 ${titleClassName}`}>
          {title}
        </div>
        {subtitle && <div className="min-w-0 break-words text-[10px] text-slate-300 leading-tight mb-3">{subtitle}</div>}
      </div>
      <div className={`pt-2 border-t border-slate-700/60 text-[10px] font-semibold ${
        insufficient ? 'text-slate-400' : approved ? 'text-emerald-400' : 'text-rose-400'
      }`}>
        ● {insufficient ? insufficientText : approved ? approvedText : rejectedText}
      </div>
    </div>
  );
}
```

---

## Caminho: src/pages/TresMosqueteirosFII/TresMosqueteirosFIIPage.jsx
```jsx
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
    asset.type === 'FII' || asset.type === 'FIIs' || asset.type === 'Fundo Imobiliário'
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
                            approved={bastter ? bastter.approved : null}
                            approvedText={t.fiiStatusApproved || 'Ativo no Critério'}
                            rejectedText={t.fiiRiskAlert || 'Atenção / Risco'}
                            insufficientText={t.insufficientData || 'Dados insuficientes'}
                            titleClassName="text-emerald-400"
                          />
                          <MethodCard
                            title={t.fiiBaragiolaTitle || 'BARAGIOLA — PREÇO TETO FII'}
                            subtitle={baragiola ? `${t.fiiCeiling || 'Teto'}: ${formatMoney(baragiola.value)} | DY: ${displayNumber(recurringYield, '%')} | ${t.fiiCapRate || 'Cap'}: ${displayNumber(capRate, '%')}` : null}
                            approved={baragiola ? baragiola.approved : null}
                            approvedText={t.fiiStatusAbaixoTeto || 'Abaixo do Teto'}
                            rejectedText={t.fiiStatusAcimaTeto || 'Acima do Teto'}
                            insufficientText={t.insufficientData || 'Dados insuficientes'}
                            titleClassName="text-emerald-400"
                          />
                          <div className="col-span-1">
                            <MethodCard
                              title={t.fiiCaetanoTitle || 'CAETANO — EFICIÊNCIA OPERACIONAL'}
                              subtitle={caetano ? `Vac: ${displayNumber(vacancy, '%')} | ${t.fiiCapRate || 'Cap'}: ${displayNumber(capRate, '%')} | ${t.fiiConcentration || 'Conc'}: ${displayConcentration(concentration)} | ${t.fiiDailyLiquidity || 'Liq'}: ${displayCurrencyShort(dailyLiquidity)}` : null}
                              approved={caetano ? caetano.approved : null}
                              approvedText={t.fiiStatusHealthy || 'Operação Saudável'}
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
```

---

## Caminho: src/constants/config.js
```javascript
// Asset types supported by Brapi (Brazilian market)
export const BRAPI_TYPES = new Set(['Ação BR', 'FII', 'ETF', 'BDR']);

// Asset type options for the form
export const ASSET_TYPES = [
  'Ação BR',
  'FII',
  'ETF',
  'Renda Fixa',
  'Cripto',
  'Stocks',
  'REITs',
  'BDR',
  'Commodity'
];

// Local storage keys
export const STORAGE_KEYS = {
  ASSETS: 'goes_compra_certa_assets',
  PROVENTOS: 'goes_compra_certa_proventos'
};

// Theme styles
export const THEME_STYLES = {
  emerald: {
    btn: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold',
    text: 'text-emerald-400'
  },
  blue: {
    btn: 'bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold',
    text: 'text-sky-400'
  },
  purple: {
    btn: 'bg-purple-500 hover:bg-purple-600 text-white font-bold',
    text: 'text-purple-400'
  }
};

// Pie chart radius levels
export const PIE_RADII = [
  { inner: 40, outer: 65 },
  { inner: 55, outer: 85 },
  { inner: 70, outer: 105 }
];
```

---

## Caminho: src/constants/translations.js
```javascript
export const TRANSLATIONS = {
  pt: {
    appName: 'COMPRACERTA',
    appSub: 'INVEST',
    dashboard: 'Painel de Controle',
    carteira: 'Minha Carteira',
    rebalanceador: 'Rebalanceador',
    proventos: 'Proventos',
    jurosCompostos: 'Simulador da Liberdade',
    metodosMestres: 'Quarteto Fantástico (Ações)',
    enviar: 'Enviar',
    analiseExcelencia: 'Quarteto Fantástico (Ações)',
    analiseDescricao: 'Análise de excelência: Bazin, Lynch, Graham e Buffett.',
    semAtivosAnalise: 'Cadastre ativos na carteira para visualizar as análises.',
    atual: 'Atual',
    precoTeto: 'Preço-teto',
    precoJusto: 'Preço justo',
    precoMedio: 'Preço Médio',
    comprarAgora: 'Comprar',
    aguardar: 'Aguardar',
    oportunidade: 'Na oportunidade',
    acimaJusto: 'Acima do justo',
    bazinComprarMeta: 'Comprar / Na Meta',
    bazinAguardarCaro: 'Aguardar / Caro',
    lynchAbaixoJusto: 'Abaixo do Justo',
    lynchAcimaJusto: 'Acima do Justo',
    valorIntrinseco: 'Valor Intrínseco',
    grahamComMargem: 'Com Margem de Segurança',
    grahamSemMargem: 'Sem Margem de Segurança',
    dividaLiquidaSeguranca: 'Dívida Líquida / EBITDA',
    fossoEconomico: 'Fosso Econômico',
    excelenciaFinanceira: 'Verde / Excelência financeira',
    dividaAcimaSegura: 'Acima do nível seguro',
    insufficientData: 'Insufficient Data',
    abaixoPm: 'Abaixo/No PM',
    acimaPm: 'Acima do PM',
    patrimonioTotal: 'PATRIMÔNIO TOTAL',
    totalInvestido: 'TOTAL INVESTIDO',
    lucroRentabilidade: 'LUCRO & RENTABILIDADE',
    proventosRecebidos: 'PROVENTOS RECEBIDOS',
    alocacaoCarteira: 'Alocação da Carteira',
    tamanhoPizza: 'Tamanho da Rosca',
    resumoPosicionamento: 'Resumo de Posicionamento',
    cadastrarAtivo: 'Cadastrar Novo Ativo',
    editarAtivo: 'Editar Ativo',
    cancelar: 'Cancelar',
    salvar: 'Salvar Alterações',
    adicionar: 'Adicionar à Carteira',
    tipo: 'TIPO',
    ticker: 'ATIVO',
    exemploTicker: 'Ex: TAEE11',
    tipoAcaoBR: 'Ação BR',
    tipoFii: 'FII',
    tipoEtf: 'ETF',
    tipoRendaFixa: 'Renda Fixa',
    tipoCripto: 'Cripto',
    tipoStocks: 'Ações Internacionais',
    tipoReits: 'REITs',
    tipoBdr: 'BDR',
    tipoCommodity: 'Commodity',
    configuracoes: 'Configurações',
    abrirConfiguracoes: 'Abrir configurações',
    fecharConfiguracoes: 'Fechar configurações',
    qtd: 'QUANTIDADE',
    pm: 'PREÇO MÉDIO (R$)',
    cotacao: 'COTAÇÃO ATUAL (R$)',
    valorTotal: 'VALOR TOTAL (R$)',
    dividendYield: 'Dividend Yield (%)',
    pl: 'P/L',
    pvp: 'P/VP',
    roe: 'ROE (%)',
    lpa: 'LPA',
    vpa: 'VPA',
    txCrescimento: 'Tx. Cresc. (%)',
    roic: 'ROIC (%)',
    divEbitda: 'DÍV. LÍQ. / EBITDA',
    dividendYieldRecorrente: 'DIVIDEND YIELD RECORRENTE (%)',
    pvpAjustado: 'P/VP AJUSTADO',
    vacancia: 'VACÂNCIA (%)',
    capRate: 'CAP RATE (%)',
    liquidezDiaria: 'LIQ. DIÁRIA',
    alavancagem: 'ALAVANCAGEM (%)',
    concentracao: 'CONCENTRAÇÃO',
    dyHistorico12M: 'DY 12M (%)',
    dividendo12m: 'DIVIDENDOS 12M (%)',
    dividendo24m: 'DIVIDENDOS 24M (%)',
    div12m24m: 'DIVIDENDOS 12M / 24M (%)',
    patrimonioReal: 'PATRIMÔNIO',
    taxaRentabilidade: 'TAXA DE RENTABILIDADE (%)',
    dataVencimento: 'DATA DE VENCIMENTO',
    tresMosqueteirosFiis: 'Três Mosqueteiros (FIIs)',
    fiiPageTitle: 'Três Mosqueteiros (FIIs)',
    fiiPageDescription: 'Análise de excelência para Fundos Imobiliários.',
    fiiNoAssets: 'Nenhum FII cadastrado ainda.',
    fiiGreen: 'Verde — Excelência',
    fiiYellow: 'Amarelo — Atenção',
    fiiRed: 'Vermelho — Risco',
    fiiBastterTitle: 'BASTTER — Segurança & Valor',
    fiiBaragiolaTitle: 'BARAGIOLA — Preço Teto FII',
    fiiCaetanoTitle: 'CAETANO — Eficiência Operacional',
    fiiAdjustedPvp: 'P/VP Ajustado',
    fiiRecurringYield: 'Dividend Yield Recorrente',
    fiiRecurringYieldShort: 'DY Recorrente',
    fiiVacancy: 'Vacância',
    fiiCapRate: 'Cap Rate',
    fiiLeverage: 'Alavancagem',
    fiiConcentration: 'Concentração',
    fiiPatrimony: 'Patrimônio',
    fiiDailyLiquidity: 'Liq. Diária',
    fiiDividendPrefix: 'Div.',
    fiiCeiling: 'Preço teto',
    fiiAttractionRate: 'Taxa de atratividade',
    fiiBuyBelowCeiling: 'Comprar / Abaixo do Teto',
    fiiNearCeiling: 'Quase no Limite',
    fiiAboveCeiling: 'Acima do Teto / Caro',
    fiiOperationalExcellence: 'Excelência Operacional',
    fiiVacancyAttention: 'Atenção à Vacância',
    fiiCriticalVacancy: 'Vacância Crítica',
    fiiStatusApproved: 'Ativo no Critério',
    fiiStatusHealthy: 'Operação Saudável',
    fiiRiskAlert: 'Atenção / Risco',
    fiiStatusAbaixoTeto: 'Abaixo do Teto',
    fiiStatusAcimaTeto: 'Acima do Teto',
    fiiMethodSubtitlePvp: 'P/VP',
    fiiMethodSubtitleTeto: 'Teto',
    fiiMethodSubtitleConcentration: 'Conc.',
    meta: 'META %',
    ativosCadastrados: 'Ativos Cadastrados',
    exportarExcel: 'Exportar Excel (IR)',
    tipoProvento: 'TIPO DE PROVENTO',
    dividendos: 'Dividendos',
    jcp: 'JCP',
    acoes: 'AÇÕES',
    lucroPrejuizo: 'LUCRO / PREJUÍZO',
    pctAtual: '% ATUAL',
    novoAporte: 'Novo Aporte Disponível (R$)',
    sugestaoAporte: 'Calculadora de Rebalanceamento Inteligente',
    lancarProventos: 'Lançar Dividendos / Rendimentos',
    valorRecebido: 'Valor Recebido (R$)',
    dataRecebimento: 'Data do Recebimento',
    extratoEntradas: 'Extrato de Entradas',
    parametrosSimulacao: 'Parâmetros de Simulação',
    investimentoInicial: 'Investimento Inicial (R$)',
    aporteMensal: 'Aporte Mensal (R$)',
    periodoAnos: 'Período (Anos)',
    rendimentoMensal: 'Rendimento Mensal (%)',
    inflacaoAnual: 'Inflação Anual Esperada (%)',
    metaRendaPassiva: 'Expectativa de Renda Passiva Mensal (R$)',
    resultadoEm: 'Resultado em',
    anos: 'Anos',
    jurosAcumulados: 'Juros Acumulados',
    rendaMensalEstimada: 'Renda Mensal Estimada',
    poderCompraReal: 'Poder de Compra Real',
    composicaoMontante: 'Composição do Montante Final',
    valorInvestido: 'Valor Investido',
    progressoEstimado: 'Progresso Estimado',
    faltaMeta: 'Falta para a meta',
    metaRendaAndamento: 'Meta de Renda Passiva em Andamento',
    evolucaoAnoAno: 'Evolução Patrimonial Ano a Ano',
    ano: 'ANO',
    jurosGanhos: 'JUROS GANHOS',
    rendaMensalExp: 'RENDA MENSAL ESTIMADA',
    simular: 'Simular',
    semInflacao: 'Sem ajuste de inflação',
    modoPrivacidade: 'Modo Privacidade',
    idioma: 'Idioma',
    modoEscuro: 'Modo Escuro',
    modoClaro: 'Modo Claro',
    atualizarCotas: 'Atualizar Cotas',
    atualizando: 'Atualizando...',
    semDados: 'Nenhum item cadastrado ainda.',
    comprar: 'Comprar / Aportar',
    metaAtingida: 'Meta Atingida',
    cotacoesAtualizadas: 'Cotações atualizadas com sucesso!',
    cotacaoAtualizada: 'atualizado.',
    erroCotacoes: 'Erro ao buscar cotações. Tente novamente.',
    semTickersBR: 'Nenhum ativo BR/FII encontrado para atualizar.',
    atualizadoParcial: 'ativos atualizados via Brapi.',
  },
  en: {
    appName: 'COMPRACERTA',
    appSub: 'INVEST',
    dashboard: 'Dashboard',
    carteira: 'My Portfolio',
    rebalanceador: 'Rebalancer',
    proventos: 'Dividends',
    jurosCompostos: 'Compound Interest',
    metodosMestres: 'Fantastic Four (Stocks)',
    enviar: 'Send',
    analiseExcelencia: 'Fantastic Four (Stocks)',
    analiseDescricao: 'Excellence analysis: Bazin, Lynch, Graham and Buffett.',
    semAtivosAnalise: 'Add assets to the portfolio to view the analyses.',
    atual: 'Current',
    precoTeto: 'Ceiling price',
    precoJusto: 'Fair price',
    precoMedio: 'Avg Price',
    comprarAgora: 'Buy',
    aguardar: 'Wait',
    oportunidade: 'Opportunity',
    acimaJusto: 'Above fair value',
    bazinComprarMeta: 'Buy / On Target',
    bazinAguardarCaro: 'Wait / Expensive',
    lynchAbaixoJusto: 'Below Fair Value',
    lynchAcimaJusto: 'Above Fair Value',
    valorIntrinseco: 'Intrinsic Value',
    grahamComMargem: 'Margin of Safety',
    grahamSemMargem: 'No Margin of Safety',
    dividaLiquidaSeguranca: 'Net Debt / EBITDA',
    fossoEconomico: 'Economic Moat',
    excelenciaFinanceira: 'Green / Financial excellence',
    dividaAcimaSegura: 'Above safe level',
    insufficientData: 'Insufficient Data',
    abaixoPm: 'Below/At average',
    acimaPm: 'Above average',
    patrimonioTotal: 'TOTAL NET WORTH',
    totalInvestido: 'TOTAL INVESTED',
    lucroRentabilidade: 'PROFIT & RETURN',
    proventosRecebidos: 'DIVIDENDS RECEIVED',
    alocacaoCarteira: 'Portfolio Allocation',
    tamanhoPizza: 'Donut Size',
    resumoPosicionamento: 'Position Summary',
    cadastrarAtivo: 'Add New Asset',
    editarAtivo: 'Edit Asset',
    cancelar: 'Cancel',
    salvar: 'Save Changes',
    adicionar: 'Add to Portfolio',
    tipo: 'TYPE',
    ticker: 'ASSET',
    exemploTicker: 'E.g.: TAEE11',
    tipoAcaoBR: 'Stock BR',
    tipoFii: 'REIT (FII)',
    tipoEtf: 'ETF',
    tipoRendaFixa: 'Fixed Income',
    tipoCripto: 'Crypto',
    tipoStocks: 'International Stocks',
    tipoReits: 'REITs',
    tipoBdr: 'BDR',
    tipoCommodity: 'Commodity',
    configuracoes: 'Settings',
    abrirConfiguracoes: 'Open settings',
    fecharConfiguracoes: 'Close settings',
    qtd: 'QUANTITY',
    pm: 'AVG PRICE',
    cotacao: 'CURRENT PRICE',
    valorTotal: 'TOTAL VALUE ($)',
    dividendYield: 'Dividend Yield (%)',
    pl: 'P/L',
    pvp: 'P/VP',
    roe: 'ROE (%)',
    lpa: 'EPS',
    vpa: 'BVPS',
    txCrescimento: 'Growth (%)',
    roic: 'ROIC (%)',
    divEbitda: 'NET DEBT / EBITDA',
    dividendYieldRecorrente: 'RECURRING DIVIDEND YIELD (%)',
    pvpAjustado: 'ADJUSTED P/VP',
    vacancia: 'VACANCY (%)',
    capRate: 'CAP RATE (%)',
    liquidezDiaria: 'DAILY LIQUIDITY',
    alavancagem: 'LEVERAGE (%)',
    concentracao: 'CONCENTRATION',
    dyHistorico12M: '12M DY (%)',
    dividendo12m: '12M DIVIDENDS (%)',
    dividendo24m: '24M DIVIDENDS (%)',
    div12m24m: '12M / 24M DIVIDENDS (%)',
    patrimonioReal: 'ASSET VALUE',
    taxaRentabilidade: 'RETURN RATE (%)',
    dataVencimento: 'MATURITY DATE',
    tresMosqueteirosFiis: 'Three Musketeers (REITs)',
    fiiPageTitle: 'Three Musketeers (REITs)',
    fiiPageDescription: 'Excellence analysis for Real Estate Investment Funds.',
    fiiNoAssets: 'No REIT registered yet.',
    fiiGreen: 'Green — Excellence',
    fiiYellow: 'Yellow — Attention',
    fiiRed: 'Red — Risk',
    fiiBastterTitle: 'BASTTER — Safety & Value',
    fiiBaragiolaTitle: 'BARAGIOLA — REIT Ceiling Price',
    fiiCaetanoTitle: 'CAETANO — Operational Efficiency',
    fiiAdjustedPvp: 'Adjusted P/VP',
    fiiRecurringYield: 'Recurring Dividend Yield',
    fiiRecurringYieldShort: 'Recurring DY',
    fiiVacancy: 'Vacancy',
    fiiCapRate: 'Cap Rate',
    fiiLeverage: 'Leverage',
    fiiConcentration: 'Concentration',
    fiiPatrimony: 'Patrimony',
    fiiDailyLiquidity: 'Daily Liquidity',
    fiiDividendPrefix: 'Div.',
    fiiCeiling: 'Ceiling price',
    fiiAttractionRate: 'Attraction rate',
    fiiBuyBelowCeiling: 'Buy / Below Ceiling',
    fiiNearCeiling: 'Near the Limit',
    fiiAboveCeiling: 'Above Ceiling / Expensive',
    fiiOperationalExcellence: 'Operational Excellence',
    fiiVacancyAttention: 'Vacancy Attention',
    fiiCriticalVacancy: 'Critical Vacancy',
    fiiStatusApproved: 'Asset Within Criteria',
    fiiStatusHealthy: 'Healthy Operation',
    fiiRiskAlert: 'Risk / Attention',
    fiiStatusAbaixoTeto: 'Below Ceiling',
    fiiStatusAcimaTeto: 'Above Ceiling',
    fiiMethodSubtitlePvp: 'P/VP',
    fiiMethodSubtitleTeto: 'Ceiling',
    fiiMethodSubtitleConcentration: 'Conc.',
    meta: 'TARGET %',
    ativosCadastrados: 'Registered Assets',
    exportarExcel: 'Export Excel',
    tipoProvento: 'INCOME TYPE',
    dividendos: 'Dividends',
    jcp: 'JCP',
    acoes: 'ACTIONS',
    lucroPrejuizo: 'PROFIT / LOSS',
    pctAtual: 'CURRENT %',
    novoAporte: 'New Available Capital',
    sugestaoAporte: 'Smart Rebalancing Calculator',
    lancarProventos: 'Log Dividends / Yields',
    valorRecebido: 'Amount Received',
    dataRecebimento: 'Payment Date',
    extratoEntradas: 'Income Statement',
    parametrosSimulacao: 'Simulation Parameters',
    investimentoInicial: 'Initial Investment',
    aporteMensal: 'Monthly Deposit',
    periodoAnos: 'Period (Years)',
    rendimentoMensal: 'Monthly Return (%)',
    inflacaoAnual: 'Expected Annual Inflation (%)',
    metaRendaPassiva: 'Target Monthly Passive Income',
    resultadoEm: 'Result in',
    anos: 'Years',
    jurosAcumulados: 'Accumulated Interest',
    rendaMensalEstimada: 'Estimated Monthly Income',
    poderCompraReal: 'Real Purchasing Power',
    composicaoMontante: 'Final Amount Composition',
    valorInvestido: 'Invested Amount',
    progressoEstimado: 'Estimated Progress',
    faltaMeta: 'Still needed to reach the goal',
    metaRendaAndamento: 'Passive Income Target Progress',
    evolucaoAnoAno: 'Yearly Portfolio Growth',
    ano: 'YEAR',
    jurosGanhos: 'INTEREST EARNED',
    rendaMensalExp: 'ESTIMATED MONTHLY INCOME',
    simular: 'Simulate',
    semInflacao: 'No inflation adjustment',
    modoPrivacidade: 'Privacy Mode',
    idioma: 'Language',
    modoEscuro: 'Dark Mode',
    modoClaro: 'Light Mode',
    atualizarCotas: 'Update Quotes',
    atualizando: 'Updating...',
    semDados: 'No items registered yet.',
    comprar: 'Buy / Deposit',
    metaAtingida: 'Target Reached',
    cotacoesAtualizadas: 'Quotes updated successfully!',
    cotacaoAtualizada: 'updated.',
    erroCotacoes: 'Error fetching quotes. Try again.',
    semTickersBR: 'No BR/FII assets found to update.',
    atualizadoParcial: 'assets updated via Brapi.',
  }
};
```

---

## Caminho: src/utils/formatters.js
```javascript
// Format values as Brazilian currency
export const formatMoney = (value, privacyMode = false) => {
  if (privacyMode) return 'R$ ••••••';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

// Format date to DD/MM/YYYY
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

// Parse CSV friendly format
export const parseCSVValue = (val) => {
  if (typeof val !== 'string') return val;
  return val.replace(',', '.');
};
```

---

## Caminho: src/utils/colors.js
```javascript
// Generate unique HSL colors using golden angle (infinite unique colors)
export const getChartColor = (index) => {
  const GOLDEN_ANGLE = 137.508;
  const hue = (index * GOLDEN_ANGLE) % 360;
  const saturation = 60 + (index % 4) * 8;   // 60 – 84 %
  const lightness  = 52 + (index % 3) * 8;   // 52 – 68 %
  return `hsl(${hue.toFixed(1)}, ${saturation}%, ${lightness}%)`;
};
```

---

## Caminho: src/utils/index.js
```javascript
export { getChartColor } from './colors';
export { formatMoney, formatDate, parseCSVValue } from './formatters';
```

---

## Estrutura de pastas

```
goescompracerta/
│
├── src/
│   ├── components/
│   │   ├── Common/
│   │   │   ├── KPICards.jsx
│   │   │   ├── MethodCard.jsx          ← Componente visual dos cards de método (Bastter, Baragiola, Caetano)
│   │   │   └── ...
│   │   ├── Dashboard/
│   │   │   ├── PortfolioChart.jsx
│   │   │   ├── PositionSummary.jsx
│   │   │   └── ...
│   │   ├── Forms/
│   │   │   ├── AssetForm.jsx
│   │   │   └── ...
│   │   ├── Layout/
│   │   │   ├── OpeningIntro.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ...
│   │   ├── Portfolio/
│   │   │   ├── AssetsTable.jsx
│   │   │   └── ...
│   │   └── TresMosqueteirosFII/
│   │       └── (empty)
│   │
│   ├── constants/
│   │   ├── config.js                  ← Configurações de tipos de ativos, storage keys, temas
│   │   ├── translations.js            ← Dicionário de traduções (PT-BR e EN) para rótulos de FII
│   │   └── ...
│   │
│   ├── hooks/
│   │   ├── useAssets.js
│   │   ├── useProventos.js
│   │   ├── useTheme.js
│   │   ├── useUpdateQuotes.js
│   │   └── ...
│   │
│   ├── pages/
│   │   ├── CompoundInterestPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── MasterMethodsPage.jsx
│   │   ├── PortfolioPage.jsx
│   │   ├── ProventosPage.jsx
│   │   ├── RebalancerPage.jsx
│   │   └── TresMosqueteirosFII/
│   │       └── TresMosqueteirosFIIPage.jsx ← Página principal de renderização dos 3 métodos FII
│   │
│   ├── services/
│   │   ├── brapiService.js
│   │   ├── calculationService.js      ← Lógica de cálculo: Bastter, Baragiola, Caetano
│   │   ├── storageService.js
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── colors.js                  ← Funções de geração de cores (HSL)
│   │   ├── formatters.js              ← Funções de formatação (moeda, data, CSV)
│   │   ├── index.js                   ← Exportações centralizadas de utils
│   │   └── ...
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
│
├── index.html
├── index.css
│
└── contexto-fiis.md                   ← ESTE ARQUIVO (documentação técnica)
```

---

## Resumo de Dependências e Fluxo de Dados

### Fluxo principal dos métodos FII:

1. **TresMosqueteirosFIIPage.jsx** (página)
   - Importa: `calculateFiiMethods`, `getFiiIndicators`, `getSelectedFiiDy` de `calculationService.js`
   - Importa: `MethodCard` de `components/Common/MethodCard.jsx`
   - Importa: `formatMoney` de `utils/formatters.js`

2. **calculationService.js** (serviço de cálculo)
   - Funções principais:
     - `getFiiIndicators(asset)` → lê dados brutos do ativo
     - `calculateFiiMethods(asset)` → calcula os 3 métodos
   - Funções auxiliares:
     - `readFiiNumber()` → converte valores numéricos (suporta "," e ".")
     - `readConcentration()` → converte concentração (texto/número)
     - `getSelectedFiiDy()` → seleciona período de dividend yield (12M ou 24M)

3. **MethodCard.jsx** (componente)
   - Props: `title`, `subtitle`, `approved`, `approvedText`, `rejectedText`, `insufficientText`
   - Estados visuais:
     - `approved === null` → CINZA (dados insuficientes)
     - `approved === true` → VERDE (critério aprovado)
     - `approved === false` → VERMELHO (critério não aprovado)

4. **translations.js** (constantes)
   - Fornece rótulos em PT-BR e EN para todos os textos da interface

5. **formatters.js** (utilitários)
   - `formatMoney()` → formata valores em BRL

---

**Arquivo gerado em:** 2026-08-31
