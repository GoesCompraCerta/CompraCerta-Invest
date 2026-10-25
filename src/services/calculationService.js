import { calculateAssetInvested } from '../utils/assetValuation.js';
import { ASSET_TYPE_TRANSLATION_KEYS, TRANSLATIONS } from '../constants/translations.js';

// ── Calculate portfolio totals ───────────────────────────────────────────────
export const calculatePortfolioTotals = (assets, proventos) => {
  let patrimonio = 0;
  let investido = 0;
  const assetList = Array.isArray(assets) ? assets : [];
  const incomeList = Array.isArray(proventos) ? proventos : [];

  const list = assetList.map((item) => {
    const quantity = Number(item.qty) || 0;
    const currentUnitPrice = Number(item.price) || 0;
    const rawAverageUnitPrice = Number(item.pm) || 0;
    const valorTotal = quantity * currentUnitPrice;
    const valorInvestido = calculateAssetInvested({
      quantity,
      averageUnitPrice: rawAverageUnitPrice,
      type: item.type,
      ticker: item.ticker
    });
    const lucro = valorTotal - valorInvestido;
    const rentabilidade = valorInvestido > 0 ? (lucro / valorInvestido) * 100 : 0;
    
    patrimonio += valorTotal;
    investido += valorInvestido;
    
    return { ...item, valorTotal, valorInvestido, lucro, rentabilidade };
  });

  const lucroTotal = patrimonio - investido;
  const rentabilidadeTotal = investido > 0 ? (lucroTotal / investido) * 100 : 0;
  const totalProventos = incomeList.reduce(
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
  const roicPercent = readOptionalNumber(asset?.roic);
  const roicNormalized = roicPercent !== null && roicPercent <= 1
    ? roicPercent * 100
    : roicPercent;
  const dividendYield = readOptionalNumber(asset?.dividendYield);
  const normalizedDividendYield = dividendYield !== null && dividendYield > 1
    ? dividendYield / 100
    : dividendYield;
  const divEbitda = readOptionalNumber(asset?.divEbitda);
  const debtSafety = divEbitda !== null
    ? { value: divEbitda, approved: divEbitda <= 3.0 }
    : null;

  const bazinDpa = currentPrice !== null && normalizedDividendYield !== null
    ? currentPrice * normalizedDividendYield
    : null;
  const bazinValue = bazinDpa !== null ? bazinDpa / 0.06 : null;
  const bazin = bazinValue !== null && currentPrice !== null
    ? {
        dpa: bazinDpa,
        value: bazinValue,
        ...evaluateCriteria([currentPrice <= bazinValue]),
        approved: currentPrice <= bazinValue
      }
    : null;

  const lynchValue = lpa !== null && growthMultiplier !== null ? lpa * growthMultiplier : null;
  const lynch = lynchValue !== null && currentPrice !== null
    ? {
        value: lynchValue,
        ...evaluateCriteria([currentPrice < lynchValue]),
        approved: currentPrice < lynchValue
      }
    : null;

  const grahamValue = lpa !== null && vpa !== null ? Math.sqrt(22.5 * lpa * vpa) : null;
  const graham = grahamValue !== null && currentPrice !== null
    ? {
        value: grahamValue,
        ...evaluateCriteria([currentPrice <= grahamValue]),
        approved: currentPrice <= grahamValue
      }
    : null;

  const buffett = roicNormalized !== null && debtSafety !== null
    ? {
        roic: roicNormalized,
        debt: debtSafety,
        ...evaluateCriteria([
          roicNormalized >= 8,
          debtSafety.approved
        ]),
        approved: roicNormalized >= 8 && debtSafety.approved
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
    ? readFiiNumber(asset?.dividendo24m, asset?.dyHistorico12M)
    : readFiiNumber(asset?.dividendo12m, asset?.dyHistorico12M);

  return {
    period: selectedPeriod,
    value
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SEMÁFORO DE 3 ESTADOS (NOVO)
//
// Recebe um array de critérios booleanos e devolve a pontuação e a
// classificação do "semáforo":
//
//   • Verde   (green):  score === total        → 100% dos critérios ok
//   • Amarelo (yellow): falhou em exatamente 1 critério, E o card tem 2+
//                        critérios no total (ver observação abaixo)
//   • Vermelho(rose):   falhou em 2 ou mais critérios
//
// Observação importante: métodos com um ÚNICO critério (ex.: Baragiola, que
// só verifica "preço ≤ preço-teto") matematicamente não têm "meio termo" —
// ou passam no único critério, ou não passam. Por isso a condição
// `total >= 2` garante que esses casos continuem Verde/Vermelho (nunca
// Amarelo), preservando o comportamento binário que já é correto para eles,
// sem precisar de nenhum tratamento especial no código de cada método.
// ─────────────────────────────────────────────────────────────────────────────
export const evaluateCriteria = (conditions, labels = {}) => {
  const total = conditions.length;
  const score = conditions.filter(Boolean).length;
  const failures = total - score;

  const {
    approvedStatus = 'Aprovado',
    attentionStatus = 'Atenção',
    rejectedStatus = 'Reprovado'
  } = labels;

  let status;
  let color;

  if (failures === 0) {
    status = approvedStatus;
    color = 'green';
  } else if (failures === 1 && total >= 2) {
    status = attentionStatus;
    color = 'yellow';
  } else {
    status = rejectedStatus;
    color = 'rose';
  }

  return { score, total, status, color };
};

export const getFiiIndicators = (asset) => {
  const selectedDy = getSelectedFiiDy(asset);

  return {
    fiiCategory: asset?.fiiCategory === 'Papel' ? 'Papel' : 'Tijolo',
    rating: asset?.rating || null,
    ltv: readFiiNumber(asset?.ltv),
    indexador: asset?.indexador || null,
    spread: asset?.spread || null,
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

export const calculatePaperReferenceRates = (cdiItems, ipcaItems) => {
  const parseSeries = (items) => (Array.isArray(items) ? items : [])
    .map((item) => ({
      date: String(item?.data || '').split('/').reverse().join('-'),
      value: readFiiNumber(item?.valor)
    }))
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.date) && item.value !== null)
    .sort((first, second) => first.date.localeCompare(second.date));

  const cdiSeries = parseSeries(cdiItems);
  const ipcaSeries = parseSeries(ipcaItems);
  const latestCdiDailyRate = cdiSeries.length > 0
    ? cdiSeries[cdiSeries.length - 1].value
    : null;
  const lastTwelveIpcaRates = ipcaSeries.slice(-12);

  return {
    CDI: latestCdiDailyRate === null
      ? null
      : (Math.pow(1 + latestCdiDailyRate / 100, 252) - 1) * 100,
    IPCA: lastTwelveIpcaRates.length !== 12
      ? null
      : (lastTwelveIpcaRates.reduce(
        (total, item) => total * (1 + item.value / 100),
        1
      ) - 1) * 100
  };
};

const readSpreadPercent = (value) => {
  const match = String(value ?? '').match(/-?\d+(?:[.,]\d+)?/);
  return match ? readFiiNumber(match[0]) : null;
};

const calculatePaperFiiMethods = (indicators, referenceRates) => {
  const rating = String(indicators.rating || '').trim().toUpperCase();
  const ratingScore = rating === 'HIGH GRADE' || /^(AAA|AA|A|BBB)[+-]?$/.test(rating)
    ? 10
    : rating === 'HIGH YIELD' || /^(BB|B|CCC|CC|C|D)[+-]?$/.test(rating)
      ? 5
      : null;
  const ltvAdjustment = indicators.ltv === null
    ? null
    : indicators.ltv < 50 ? 1 : indicators.ltv > 80 ? -1 : 0;
  const securityScore = ratingScore === null || ltvAdjustment === null
    ? null
    : Math.max(0, Math.min(10, ratingScore + ltvAdjustment));
  const bastter = securityScore === null ? null : {
    score: securityScore,
    color: securityScore >= 8 ? 'green' : securityScore >= 5 ? 'yellow' : 'rose',
    statusKey: securityScore >= 8 ? 'fiiPaperSafe' : securityScore >= 5 ? 'fiiPaperAttention' : 'fiiPaperRisk',
    approved: securityScore >= 8
  };

  const indexador = String(indicators.indexador || '').trim().toUpperCase();
  const spread = readSpreadPercent(indicators.spread);
  const referenceRate = indexador === 'PREFIXADO'
    ? 0
    : referenceRates?.[indexador];
  const targetYield = spread === null
    || (indexador !== 'PREFIXADO' && !Number.isFinite(referenceRate))
    ? null
    : referenceRate + spread;
  const recurringYield = indicators.recurringYield;
  const normalizedYield = recurringYield === null
    ? null
    : recurringYield > 1 ? recurringYield / 100 : recurringYield;
  const annualDividend = indicators.currentPrice !== null && normalizedYield !== null
    ? indicators.currentPrice * normalizedYield
    : null;
  const ceiling = annualDividend !== null && targetYield > 0
    ? annualDividend / (targetYield / 100)
    : null;
  const baragiola = ceiling === null || indicators.currentPrice === null
    ? null
    : {
        value: ceiling,
        targetYield,
        color: indicators.currentPrice <= ceiling ? 'green' : 'rose',
        statusKey: indicators.currentPrice <= ceiling ? 'fiiStatusAbaixoTeto' : 'fiiStatusAcimaTeto',
        approved: indicators.currentPrice <= ceiling
      };

  const meetsLiquidity = indicators.dailyLiquidity !== null
    && indicators.dailyLiquidity > 500000;
  const meetsPatrimony = indicators.realPatrimony !== null
    && indicators.realPatrimony > 1_000_000_000;
  const caetano = indicators.dailyLiquidity === null || indicators.realPatrimony === null
    ? null
    : {
        color: meetsLiquidity && meetsPatrimony ? 'green' : 'yellow',
      statusKey: meetsLiquidity && meetsPatrimony ? 'fiiPaperEfficient' : 'fiiPaperAttention',
        approved: meetsLiquidity && meetsPatrimony
      };

  return { bastter, baragiola, caetano };
};

export const calculateFiiMethods = (asset, referenceRates = {}) => {
  const indicators = getFiiIndicators(asset);
  if (indicators.fiiCategory === 'Papel') {
    return calculatePaperFiiMethods(indicators, referenceRates);
  }

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
  } = indicators;
  const referenceRate = capRate !== null && capRate > 0 ? capRate / 100 : null;
  const yieldValue = selectedDyValue ?? recurringYield ?? null;
  const normalizedYield = yieldValue !== null
    ? (yieldValue > 1 ? yieldValue / 100 : yieldValue)
    : null;
  const annualDividend = currentPrice !== null && normalizedYield !== null
    ? currentPrice * normalizedYield
    : null;
  const ceilingValue = annualDividend !== null && referenceRate !== null
    ? annualDividend / referenceRate
    : null;

  // ── BASTTER — Segurança & Valor (2 critérios: P/VP e Alavancagem) ──
  // Antes: um único boolean `approved = adjustedPvp <= 1 && leverage < 10`.
  // Agora: cada condição vira um critério independente, então dá pra saber
  // se falhou 1 (Amarelo) ou os 2 (Vermelho).
  const bastter = adjustedPvp !== null && leverage !== null
    ? (() => {
        const evaluation = evaluateCriteria(
          [adjustedPvp <= 1, leverage < 10],
          {
            approvedStatus: 'Aprovado',
            attentionStatus: 'Atenção',
            rejectedStatus: 'Reprovado'
          }
        );
        return {
          pvp: adjustedPvp.toFixed(2),
          leverage: leverage.toFixed(2),
          ...evaluation,
          approved: evaluation.score === evaluation.total // compat com código legado
        };
      })()
    : null;

  // ── BARAGIOLA — Preço-Teto (1 critério único: preço ≤ teto) ──
  // Método de critério único por natureza (Preço-Teto vs. Cotação Atual).
  // Não recebe critérios extras de DY/Cap Rate porque esses valores já são
  // os INGREDIENTES usados para calcular o próprio preço-teto (ceilingValue)
  // — reavaliá-los separadamente seria contar a mesma informação duas vezes.
  // Por isso, com evaluateCriteria(), o resultado permanece Verde/Vermelho
  // (nunca Amarelo), que é o comportamento correto pra esse método.
  const baragiola = ceilingValue === null || currentPrice === null ? null : (() => {
    const evaluation = evaluateCriteria(
      [currentPrice <= ceilingValue],
      {
        approvedStatus: 'Abaixo do Teto',
        attentionStatus: 'Atenção',
        rejectedStatus: 'Acima do Teto'
      }
    );
    return {
      value: ceilingValue,
      ...evaluation,
      approved: evaluation.score === evaluation.total // compat com código legado
    };
  })();

  // ── CAETANO — Eficiência Operacional (4 critérios) ──
  const caetano = vacancy !== null && capRate !== null && concentrationRate !== null && dailyLiquidity !== null
    ? (() => {
        const evaluation = evaluateCriteria(
          [vacancy < 10, capRate >= 7, concentrationRate < 25, dailyLiquidity > 50000],
          {
            approvedStatus: 'Saudável',
            attentionStatus: 'Atenção Operacional',
            rejectedStatus: 'Reprovado'
          }
        );
        return {
          ...evaluation,
          approved: evaluation.score === evaluation.total // compat com código legado
        };
      })()
    : null;

  return { bastter, baragiola, caetano };
};

// ── Export portfolio and proventos as one tax-focused Excel workbook ────────
export const exportPortfolioToExcel = async (assets = [], proventos = [], t = TRANSLATIONS.pt) => {
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

  const getAssetTypeLabel = (asset) => t[ASSET_TYPE_TRANSLATION_KEYS[asset.type]] || asset.type || '';
  const assetHeaders = [
    t.exportTickerHeader,
    t.exportTypeHeader,
    t.exportQuantityHeader,
    t.exportAveragePriceHeader,
    t.exportTotalCostHeader,
    t.exportCurrentQuoteHeader,
    t.exportCurrentValueHeader,
    t.exportProfitLossValueHeader,
    t.exportProfitLossPercentHeader,
    t.exportTargetHeader
  ];
  const incomeHeaders = [t.exportDateHeader, t.exportAssetHeader, t.exportTypeHeader, t.exportReceivedAmountHeader];

  const assetRows = portfolioAssets.map((asset) => {
    const quantity = Number(asset.qty) || 0;
    const averagePrice = Number(asset.pm) || 0;
    const costTotal = quantity * averagePrice;
    const currentPrice = Number(asset.price) || 0;
    const currentTotal = quantity * currentPrice;
    const profit = currentTotal - costTotal;
    const profitPercent = costTotal > 0 ? (profit / costTotal) * 100 : 0;
    return [
      asset.ticker || '',
      getAssetTypeLabel(asset),
      quantity,
      averagePrice,
      costTotal,
      currentPrice,
      currentTotal,
      profit,
      profitPercent,
      Number(asset.metaPercent) || 0
    ];
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
        type.includes('jcp') || type.includes('juros') ? t.jcp : t.dividendos,
        Number(income.value ?? income.amount ?? income.valor) || 0
      ];
    });

  const complete = XLSX.utils.aoa_to_sheet([
    [t.exportPortfolioTitle],
    assetHeaders,
    ...assetRows,
    [],
    [t.exportIncomeTitle],
    incomeHeaders,
    ...incomeRows
  ]);
  applySheetFormatting(complete, [18, 18, 14, 20, 20, 22, 24, 24, 22, 12], [3, 4, 5, 6, 7]);
  XLSX.utils.book_append_sheet(workbook, complete, t.exportCompleteSheet);

  const summary = XLSX.utils.aoa_to_sheet([
    assetHeaders,
    ...assetRows
  ]);
  applySheetFormatting(summary, [18, 18, 14, 20, 20, 22, 24, 24, 22, 12], [3, 4, 5, 6, 7]);
  XLSX.utils.book_append_sheet(workbook, summary, t.exportAssetsSheet);

  const bens = XLSX.utils.aoa_to_sheet([
    [t.exportTaxCodeHeader, t.exportTaxTypeHeader, t.exportTaxQuantityHeader, t.exportTaxAverageCostHeader, t.exportTaxCostHeader, t.exportTaxDescriptionHeader],
    ...portfolioAssets.map((asset) => {
      const type = getAssetTypeLabel(asset);
      const description = t.exportTaxDescription
        .replace('{quantity}', String(asset.qty))
        .replace('{ticker}', asset.ticker || '')
        .replace('{type}', type);
      return [asset.ticker || '', type, Number(asset.qty) || 0, Number(asset.pm) || 0, (Number(asset.qty) || 0) * (Number(asset.pm) || 0), description];
    })
  ]);
  applySheetFormatting(bens, [20, 18, 20, 30, 25, 72], [3, 4]);
  XLSX.utils.book_append_sheet(workbook, bens, t.exportTaxSheet);

  const income = XLSX.utils.aoa_to_sheet([
    incomeHeaders,
    ...incomeRows
  ]);
  applySheetFormatting(income, [14, 16, 18, 24], [3], [0]);
  XLSX.utils.book_append_sheet(workbook, income, t.exportIncomeSheet);

  XLSX.writeFile(workbook, `${t.exportFilenamePrefix}_${new Date().getFullYear()}.xlsx`);
};
