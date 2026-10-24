import {
  calculatePortfolioTotals,
  calculateMasterMethods,
  calculateFiiMethods,
  getSelectedFiiDy
} from './src/services/calculationService.js';
import { mergeBackendAssets, toApiAsset } from './src/utils/assetSync.js';
import { groupAssetsByClass } from './src/utils/assetClassification.js';
import { calculateStaticRebalance } from './src/services/rebalanceService.js';
import {
  createAsset,
  listAssets,
  updateAsset,
  updateAssetPrices
} from './src/services/assetsService.js';
import {
  createProvento as createProventoRequest,
  deleteProvento as deleteProventoRequest,
  getProventosSummary,
  listProventos,
  updateProvento as updateProventoRequest
} from './src/services/proventosService.js';

const tests = [];

const addTest = (name, input, expected, check) => {
  tests.push({ name, input, expected, check });
};

const approximately = (actual, expected, tolerance = 1e-9) => (
  typeof actual === 'number'
  && Math.abs(actual - expected) <= tolerance
);

const hasStatus = (result, color, score, total) => (
  result !== null
  && result.color === color
  && result.score === score
  && result.total === total
);

addTest(
  'Graham puro com preco medio acima do valor',
  { price: 10, pm: 20, lpa: 1, vpa: 10 },
  'valor 15, verde, score 1/1',
  () => {
    const result = calculateMasterMethods({ price: 10, pm: 20, lpa: 1, vpa: 10 }).graham;
    return result
      && approximately(result.value, 15)
      && result.approved === true
      && hasStatus(result, 'green', 1, 1);
  }
);

addTest(
  'Graham puro sem preco medio',
  { price: 10, lpa: 1, vpa: 10 },
  'resultado disponivel e verde',
  () => {
    const result = calculateMasterMethods({ price: 10, lpa: 1, vpa: 10 }).graham;
    return result !== null && result.approved === true && hasStatus(result, 'green', 1, 1);
  }
);

addTest(
  'Bazin com DY percentual',
  { price: 10, dividendYield: 12 },
  'DPA 1.2 e preco teto 20',
  () => {
    const result = calculateMasterMethods({ price: 10, dividendYield: 12 }).bazin;
    return result
      && approximately(result.dpa, 1.2)
      && approximately(result.value, 20)
      && result.approved === true;
  }
);

addTest(
  'Bazin com DY decimal',
  { price: 10, dividendYield: 0.12 },
  'DPA 1.2 e preco teto 20',
  () => {
    const result = calculateMasterMethods({ price: 10, dividendYield: 0.12 }).bazin;
    return result
      && approximately(result.dpa, 1.2)
      && approximately(result.value, 20)
      && result.approved === true;
  }
);

addTest(
  'Lynch com crescimento percentual',
  { price: 10, lpa: 1, growthRate: 15 },
  'valor justo 15 e aprovado',
  () => {
    const result = calculateMasterMethods({ price: 10, lpa: 1, growthRate: 15 }).lynch;
    return result && approximately(result.value, 15) && result.approved === true;
  }
);

addTest(
  'Lynch com crescimento decimal',
  { price: 10, lpa: 1, growthRate: 0.15 },
  'valor justo 15 e aprovado',
  () => {
    const result = calculateMasterMethods({ price: 10, lpa: 1, growthRate: 0.15 }).lynch;
    return result && approximately(result.value, 15) && result.approved === true;
  }
);

addTest(
  'Buffett com ROIC decimal abaixo do limite',
  { roic: 0.0613, divEbitda: 2 },
  'ROIC 6.13%, reprovado, semaforo amarelo',
  () => {
    const result = calculateMasterMethods({ roic: 0.0613, divEbitda: 2 }).buffett;
    return result
      && approximately(result.roic, 6.13)
      && result.approved === false
      && hasStatus(result, 'yellow', 1, 2);
  }
);

addTest(
  'Buffett com ROIC ausente',
  { roic: null, divEbitda: 2 },
  'null, dados insuficientes',
  () => calculateMasterMethods({ roic: null, divEbitda: 2 }).buffett === null
);

addTest(
  'Basttter aprovado',
  { pVpAjustado: 0.95, alavancagem: 8 },
  'verde, score 2/2',
  () => hasStatus(
    calculateFiiMethods({ pVpAjustado: 0.95, alavancagem: 8 }).bastter,
    'green',
    2,
    2
  )
);

addTest(
  'Basttter com P/VP acima do limite',
  { pVpAjustado: 1.05, alavancagem: 8 },
  'amarelo, score 1/2',
  () => hasStatus(
    calculateFiiMethods({ pVpAjustado: 1.05, alavancagem: 8 }).bastter,
    'yellow',
    1,
    2
  )
);

addTest(
  'Baragiola com Cap Rate valido',
  { price: 100, dividendo12m: 8, capRate: 8, dyPeriod: '12M' },
  'preco teto 100 e verde',
  () => {
    const result = calculateFiiMethods({
      price: 100,
      dividendo12m: 8,
      capRate: 8,
      dyPeriod: '12M'
    }).baragiola;
    return result && approximately(result.value, 100) && hasStatus(result, 'green', 1, 1);
  }
);

addTest(
  'Baragiola sem Cap Rate',
  { price: 100, dividendo12m: 8, capRate: null, dyPeriod: '12M' },
  'null, dados insuficientes',
  () => calculateFiiMethods({
    price: 100,
    dividendo12m: 8,
    capRate: null,
    dyPeriod: '12M'
  }).baragiola === null
);

addTest(
  'Baragiola com Cap Rate zero',
  { price: 100, dividendo12m: 8, capRate: 0, dyPeriod: '12M' },
  'null, dados insuficientes',
  () => calculateFiiMethods({
    price: 100,
    dividendo12m: 8,
    capRate: 0,
    dyPeriod: '12M'
  }).baragiola === null
);

addTest(
  'Caetano aprovado',
  { vacancia: 5, capRate: 8, concentracao: 'baixa', liquidezDiaria: 100000 },
  'verde, score 4/4',
  () => hasStatus(
    calculateFiiMethods({
      vacancia: 5,
      capRate: 8,
      concentracao: 'baixa',
      liquidezDiaria: 100000
    }).caetano,
    'green',
    4,
    4
  )
);

addTest(
  'Caetano com vacancia acima do limite',
  { vacancia: 15, capRate: 8, concentracao: 'baixa', liquidezDiaria: 100000 },
  'amarelo, score 3/4',
  () => hasStatus(
    calculateFiiMethods({
      vacancia: 15,
      capRate: 8,
      concentracao: 'baixa',
      liquidezDiaria: 100000
    }).caetano,
    'yellow',
    3,
    4
  )
);

addTest(
  'Periodo 12M nao usa somente 24M',
  { dyPeriod: '12M', dividendo12m: null, dividendo24m: 24, dyHistorico12M: null },
  'valor null',
  () => getSelectedFiiDy({
    dyPeriod: '12M',
    dividendo12m: null,
    dividendo24m: 24,
    dyHistorico12M: null
  }).value === null
);

addTest(
  'Periodo 24M nao usa somente 12M',
  { dyPeriod: '24M', dividendo12m: 12, dividendo24m: null, dyHistorico12M: null },
  'valor null',
  () => getSelectedFiiDy({
    dyPeriod: '24M',
    dividendo12m: 12,
    dividendo24m: null,
    dyHistorico12M: null
  }).value === null
);

addTest(
  'Graham com LPA ausente',
  { price: 10, vpa: 10 },
  'null, dados insuficientes',
  () => calculateMasterMethods({ price: 10, vpa: 10 }).graham === null
);

addTest(
  'Bazin com DY ausente',
  { price: 10 },
  'null, dados insuficientes',
  () => calculateMasterMethods({ price: 10 }).bazin === null
);

addTest(
  'Lynch com crescimento ausente',
  { price: 10, lpa: 1 },
  'null, dados insuficientes',
  () => calculateMasterMethods({ price: 10, lpa: 1 }).lynch === null
);

addTest(
  'Basttter com alavancagem ausente',
  { pVpAjustado: 0.95 },
  'null, dados insuficientes',
  () => calculateFiiMethods({ pVpAjustado: 0.95 }).bastter === null
);

addTest(
  'Caetano com indicador ausente',
  { vacancia: 5, capRate: 8, concentracao: 'baixa' },
  'null, dados insuficientes',
  () => calculateFiiMethods({
    vacancia: 5,
    capRate: 8,
    concentracao: 'baixa'
  }).caetano === null
);

addTest(
  'Ativo EUA com duas cotas calcula custo e lucro corretamente',
  { type: 'Ações (EUA / Globais)', qty: 2, pm: 100, price: 120 },
  'custo 200, valor atual 240, lucro 40',
  () => {
    const result = calculatePortfolioTotals([
      { type: 'Ações (EUA / Globais)', ticker: 'TEST', qty: 2, pm: 100, price: 120 }
    ], []);
    const asset = result.list[0];

    return asset
      && approximately(asset.valorInvestido, 200)
      && approximately(asset.valorTotal, 240)
      && approximately(asset.lucro, 40);
  }
);

addTest(
  'Ativo EUA com duas cotas preserva prejuizo negativo',
  { type: 'REITs (EUA / Globais)', qty: 2, pm: 100, price: 80 },
  'custo 200, valor atual 160, prejuizo -40',
  () => {
    const result = calculatePortfolioTotals([
      { type: 'REITs (EUA / Globais)', ticker: 'TEST', qty: 2, pm: 100, price: 80 }
    ], []);
    const asset = result.list[0];

    return asset
      && approximately(asset.valorInvestido, 200)
      && approximately(asset.valorTotal, 160)
      && approximately(asset.lucro, -40);
  }
);

addTest(
  'Visão por Classe classifica tipos e agrega valores da carteira',
  {},
  'FIIs ficam isolados e o lucro agregado deriva dos valores investidos e atuais',
  () => {
    const groups = groupAssetsByClass([
      { type: 'Ação (B3)', qty: '10', buy_price: '10', price: '15', valorInvestido: 1, valorTotal: 1 },
      { type: 'Ações', qty: 100, pm: 100, price: 200 },
      { type: 'FII', qty: 5, buy_price: 10, price: 8 },
      { type: 'FII B3', qty: 5, buy_price: 10, price: 9 },
      { type: 'FIIs', qty: 5, buy_price: 10, price: 9 },
      { type: 'FIIs (B3)', qty: 0, buy_price: 10, price: 9 },
      { type: 'Fundo Imobiliário', qty: 5, buy_price: 10, price: 10 },
      { type: 'ETF B3', qty: 5, buy_price: 10, price: 14 },
      { type: 'BDR B3', qty: 10, pm: 10, price: 10 },
      { type: 'Ação Internacional (EUA)', qty: 10, buyPrice: 10, price: 10 },
      { type: 'REIT', qty: 10, buy_price: 10, price: 9 },
      { type: 'ETF Internacional', qty: 10, pm: 10, price: 11 },
      { type: 'Renda Fixa', qty: 50, buy_price: 10, price: 10.2 },
      { type: 'Cripto', qty: 50, pm: 50, price: 1.2 }
    ]);
    const actions = groups.find((group) => group.key === 'actions');
    const realEstate = groups.find((group) => group.key === 'realEstate');
    const international = groups.find((group) => group.key === 'international');
    const fixedIncome = groups.find((group) => group.key === 'fixedIncome');
    const crypto = groups.find((group) => group.key === 'crypto');

    return groups.length === 5
      && actions.assets.length === 1
      && actions.invested === 100
      && actions.currentValue === 150
      && actions.profit === 50
      && approximately(actions.percentage, (150 / 1370) * 100)
      && realEstate.assets.length === 5
      && realEstate.invested === 200
      && realEstate.currentValue === 180
      && realEstate.profit === -20
      && international.assets.length === 5
      && international.invested === 450
      && international.currentValue === 470
      && international.profit === 20
      && fixedIncome.invested === 500
      && approximately(fixedIncome.currentValue, 510)
      && crypto.invested === 2500
      && crypto.currentValue === 60;
  }
);

addTest(
  'Carteira real classifica Ações, FIIs, ETF e Renda Fixa pelo tipo exato',
  {},
  'ticker não altera classe; KLBN11 e TAEE11 ficam em Ações e IVVB11 em Internacional',
  () => {
    const makeAssets = (type, tickers, invested, profits) => tickers.map((ticker, index) => ({
      ticker,
      type,
      qty: 1,
      buy_price: invested[index],
      price: invested[index] + profits[index]
    }));
    const groups = groupAssetsByClass([
      ...makeAssets('Ação (B3)', ['PETR4', 'BBSE3', 'TAEE11', 'KLBN11', 'ITSA4'],
        [1000, 900, 800, 700, 416.80], [100, 100, 100, 100, 104.90]),
      ...makeAssets('FII (B3)', ['BRCO11', 'RBRR11', 'RBRY11', 'XPML11', 'TRXF11', 'GARE11', 'GGRC11'],
        [600, 550, 525, 500, 550, 600, 550.41], [-10, -10, -10, -10, -10, -10, -14.04]),
      ...makeAssets('ETF (B3)', ['IVVB11'], [500], [50]),
      ...makeAssets('Renda Fixa', ['M.PAGO'], [4400], [0])
    ]);
    const tipoFallbackGroup = groupAssetsByClass([
      { ticker: 'TIPO-FALLBACK', tipo: 'Ação (B3)', qty: 1, buy_price: 10, price: 12 }
    ]).find(({ key }) => key === 'actions');
    const actions = groups.find(({ key }) => key === 'actions');
    const realEstate = groups.find(({ key }) => key === 'realEstate');
    const international = groups.find(({ key }) => key === 'international');
    const fixedIncome = groups.find(({ key }) => key === 'fixedIncome');

    return actions.invested === 3816.80
      && actions.currentValue === 4321.70
      && approximately(actions.profit, 504.90)
      && ['KLBN11', 'TAEE11'].every((ticker) => actions.assets.some((asset) => asset.ticker === ticker))
      && !realEstate.assets.some((asset) => ['KLBN11', 'TAEE11'].includes(asset.ticker))
      && realEstate.invested === 3875.41
      && realEstate.currentValue === 3801.37
      && approximately(realEstate.profit, -74.04)
      && fixedIncome.invested === 4400
      && international.assets.some((asset) => asset.ticker === 'IVVB11')
      && !actions.assets.some((asset) => asset.ticker === 'IVVB11')
      && tipoFallbackGroup?.assets[0]?.ticker === 'TIPO-FALLBACK';
  }
);

addTest(
  'Ativo hidratado da API preserva meta, preço e totais da carteira',
  {},
  'metaPercent e preço persistem no payload e alimentam os cálculos da carteira',
  () => {
    const apiPayload = toApiAsset({
      ticker: 'TEST3',
      type: 'Ações (B3)',
      qty: 3,
      pm: 20,
      buyDate: '2026-10-19',
      metaPercent: 25,
      price: 30
    });
    const hydratedAsset = mergeBackendAssets([{
      id: 17,
      ticker: apiPayload.ticker,
      type: apiPayload.type,
      qty: apiPayload.qty,
      buyPrice: apiPayload.buyPrice,
      buyDate: apiPayload.buyDate,
      meta: apiPayload.meta,
      price: apiPayload.price
    }], {})[0];
    const totals = calculatePortfolioTotals([hydratedAsset], []);
    const asset = totals.list[0];
    const recoveredAsset = mergeBackendAssets([{
      id: 18,
      ticker: 'TEST3',
      type: 'Ações (B3)',
      qty: 3,
      buyPrice: 20,
      buyDate: '2026-10-19',
      meta: null,
      price: null
    }], { 18: { metaPercent: 25, price: 30 } })[0];

    return apiPayload.meta === 25
      && apiPayload.price === 30
      && hydratedAsset.meta === 25
      && hydratedAsset.metaPercent === 25
      && asset.qty === 3
      && asset.pm === 20
      && asset.price === 30
      && asset.valorTotal === 90
      && asset.valorInvestido === 60
      && asset.lucro === 30
      && recoveredAsset.meta === 25
      && recoveredAsset.metaPercent === 25
      && recoveredAsset.price === 30;
  }
);

addTest(
  'Rebalance: alvo usa patrimônio atual e arredonda cotas no serviço',
  {},
  'IVVB11 usa o alvo atual; déficit menor que uma cota fica no caixa',
  () => {
    const result = calculateStaticRebalance({
      ativos: [{
        ticker: 'IVVB11',
        type: 'Ações',
        valorAtual: 878.50,
        precoAtual: 439.25,
        meta: 15
      }],
      novoAporte: 50006,
      patrimonioAtual: 6771.70,
      patrimonioFuturo: 56777.7
    });
    const ivvb = result.distribuicao[0];

    return ivvb.metaAtingida === false
      && approximately(ivvb.alvo, 1015.76)
      && approximately(ivvb.deficit, 137.26)
      && ivvb.aporteSugerido === 0
      && ivvb.cotasSugeridas === 0
      && result.totalDistribuido === 0
      && result.caixaRestante === 50006;
  }
);

addTest(
  'Rebalance: tolerância e cotas inteiras mantêm o caixa nos três aportes',
  {},
  'meta atingida não recebe aporte e IVVB11 não compra cota com déficit de R$ 137,26',
  () => {
    const patrimonioAtual = 6771.70;
    const ativos = [
      { ticker: 'IVVB11', type: 'Ações', valorAtual: 878.50, precoAtual: 439.25, meta: 15 },
      { ticker: 'RBRR11', type: 'FII', valorAtual: 676.80, precoAtual: 75.20, meta: 10 },
      { ticker: 'BBSE3', type: 'Ações', valorAtual: 819.38, precoAtual: 40.82, meta: 10 },
      { ticker: 'M.PAGO', type: 'Ações', valorAtual: 4401.61, precoAtual: 4400, meta: 30 }
    ];
    const cenarios = [1000, 50006, 1000000000];

    return cenarios.every((novoAporte) => {
      const result = calculateStaticRebalance({
        ativos,
        novoAporte,
        patrimonioAtual,
        patrimonioFuturo: patrimonioAtual + novoAporte
      });
      const [ivvb, rbrr, bbse, mpago] = result.distribuicao;

      return approximately(ivvb.deficit, 137.26)
        && ivvb.metaAtingida === false
        && ivvb.aporteSugerido === 0
        && [rbrr, bbse, mpago].every((asset) => (
          asset.metaAtingida && asset.aporteSugerido === 0
        ))
        && result.totalDistribuido === 0
        && result.caixaRestante === novoAporte
        && result.totalDistribuido <= novoAporte
        && result.caixaRestante >= 0;
    });
  }
);

addTest(
  'Rebalance: ativo abaixo da tolerância recebe o déficit em cotas inteiras',
  {},
  'ativo a 9,8% com meta de 10% recebe duas cotas de R$ 10,00',
  () => {
    const result = calculateStaticRebalance({
      ativos: [{
        ticker: 'TESTE',
        type: 'Ações',
        valorAtual: 980,
        precoAtual: 10,
        meta: 10
      }],
      novoAporte: 20,
      patrimonioAtual: 10000
    });
    const asset = result.distribuicao[0];

    return asset.metaAtingida === false
      && asset.deficit === 20
      && asset.aporteSugerido === 20
      && asset.cotasSugeridas === 2
      && result.caixaRestante === 0;
  }
);

addTest(
  'Rebalance static: ativos acima da meta recebem zero',
  {
    ativos: [
      { id: 'A', ticker: 'A', meta: 15, valorAtual: 5000 },
      { id: 'B', ticker: 'B', meta: 85, valorAtual: 3000, precoAtual: 100 }
    ],
    novoAporte: 5000,
    patrimonioAtual: 10000
  },
  'ativo A e B acima/abaixo conforme meta, sem inflar aporte para saturados',
  () => {
    const result = calculateStaticRebalance({
      ativos: [
        { id: 'A', ticker: 'A', meta: 15, valorAtual: 5000 },
        { id: 'B', ticker: 'B', meta: 85, valorAtual: 3000, precoAtual: 100 }
      ],
      novoAporte: 5000,
      patrimonioAtual: 10000
    });

    const a = result.distribuicao.find((item) => item.id === 'A');
    const b = result.distribuicao.find((item) => item.id === 'B');

    return a.aporteSugerido === 0 && b.aporteSugerido > 0 && result.caixaRestante >= 0;
  }
);

addTest(
  'Rebalance static: aporte zero ou vazio desativa simulação',
  {
    ativos: [
      { id: 'A', ticker: 'A', meta: 50, valorAtual: 1000 },
      { id: 'B', ticker: 'B', meta: 50, valorAtual: 1000 }
    ],
    novoAporte: 0,
    patrimonioAtual: 2000
  },
  'sem aporte válido, patrimônio futuro zero e alocação desativada',
  () => {
    const result = calculateStaticRebalance({
      ativos: [
        { id: 'A', ticker: 'A', meta: 50, valorAtual: 1000 },
        { id: 'B', ticker: 'B', meta: 50, valorAtual: 1000 }
      ],
      novoAporte: 0,
      patrimonioAtual: 2000
    });

    return result.caixaRestante === 0
      && result.totalDistribuido === 0
      && result.distribuicao.every((item) => item.aporteSugerido === 0);
  }
);

addTest(
  'Rebalance static: sem aporte mantém status real por % atual x meta',
  {
    ativos: [
      { id: 'A', ticker: 'A', meta: 50, valorAtual: 1000 },
      { id: 'B', ticker: 'B', meta: 50, valorAtual: 1500 }
    ],
    novoAporte: 0,
    patrimonioAtual: 2500
  },
  'sem novo aporte, meta continua calculada pela composição atual e não pela presença de dinheiro',
  () => {
    const result = calculateStaticRebalance({
      ativos: [
        { id: 'A', ticker: 'A', meta: 50, valorAtual: 1000 },
        { id: 'B', ticker: 'B', meta: 50, valorAtual: 1500 }
      ],
      novoAporte: 0,
      patrimonioAtual: 2500
    });

    const a = result.distribuicao.find((item) => item.id === 'A');
    const b = result.distribuicao.find((item) => item.id === 'B');

    return a.metaAtingida === false
      && b.metaAtingida === true
      && a.aporteSugerido === 0
      && b.aporteSugerido === 0;
  }
);

addTest(
  'Rebalance static: base atual e sobra para caixa',
  {
    ativos: [
      { id: 'A', ticker: 'A', meta: 50, valorAtual: 2000 },
      { id: 'B', ticker: 'B', meta: 50, valorAtual: 2000 }
    ],
    novoAporte: 1000,
    patrimonioAtual: 4000
  },
  'metas iguais, aporte alocado apenas por déficit restante e caixa restante correto',
  () => {
    const result = calculateStaticRebalance({
      ativos: [
        { id: 'A', ticker: 'A', meta: 50, valorAtual: 2000 },
        { id: 'B', ticker: 'B', meta: 50, valorAtual: 2000 }
      ],
      novoAporte: 1000,
      patrimonioAtual: 4000
    });

    const totalAportes = result.distribuicao.reduce((sum, item) => sum + item.aporteSugerido, 0);
    return totalAportes + result.caixaRestante === 1000;
  }
);

addTest(
  'Rebalance static: ativos tradicionais arredondam para cotas inteiras e respeitam valor financeiro',
  {
    ativos: [
      { id: 'A', ticker: 'PETR4', type: 'Ações', meta: 40, valorAtual: 100, precoAtual: 10 },
      { id: 'B', ticker: 'BTC', type: 'Cripto', meta: 40, valorAtual: 100, precoAtual: 75 },
      { id: 'C', ticker: 'CASH', type: 'Ações', meta: 20, valorAtual: 200 }
    ],
    novoAporte: 500,
    patrimonioAtual: 400
  },
  'acao usa quantidade inteira e valor arredondado, cripto mantem fração',
  () => {
    const result = calculateStaticRebalance({
      ativos: [
        { id: 'A', ticker: 'PETR4', type: 'Ações', meta: 40, valorAtual: 100, precoAtual: 10 },
        { id: 'B', ticker: 'BTC', type: 'Cripto', meta: 40, valorAtual: 100, precoAtual: 75 },
        { id: 'C', ticker: 'CASH', type: 'Ações', meta: 20, valorAtual: 200 }
      ],
      novoAporte: 500,
      patrimonioAtual: 400,
      patrimonioFuturo: 900
    });

    const acao = result.distribuicao.find((item) => item.id === 'A');
    const bitcoin = result.distribuicao.find((item) => item.id === 'B');

    const priceAcao = 10;
    const priceBtc = 75;
    const acaoQty = Math.floor((acao.aporteSugerido || 0) / priceAcao);
    const btcQty = (bitcoin.aporteSugerido || 0) / priceBtc;

    return acaoQty >= 0
      && Number.isInteger(acaoQty)
      && btcQty > 0
      && btcQty % 1 !== 0;
  }
);

addTest(
  'Meta do ativo e enviada, atualizada e lida pela API',
  {},
  'POST, PUT e GET preservam o percentual da meta',
  async () => {
    const originalFetch = globalThis.fetch;
    const originalLocalStorage = globalThis.localStorage;
    let storedAssets = [];

    globalThis.localStorage = { getItem: () => 'test-token' };
    globalThis.fetch = async (_path, options = {}) => {
      const method = options.method || 'GET';
      if (method === 'POST') {
        storedAssets = [{ id: 1, ...JSON.parse(options.body) }];
      } else if (method === 'PUT') {
        storedAssets = [{ id: 1, ...JSON.parse(options.body) }];
      }
      const payload = method === 'GET' ? storedAssets : storedAssets[0];
      return { ok: true, json: async () => payload };
    };

    try {
      const asset = {
        ticker: 'TEST3',
        type: 'Ações',
        qty: 1,
        buyPrice: 10,
        buyDate: '2026-10-19',
        meta: 12.5,
        price: 15
      };
      const created = await createAsset(asset);
      const firstRead = await listAssets();
      const updated = await updateAsset(1, { ...asset, meta: 22.75, price: 18 });
      const secondRead = await listAssets();

      return created.meta === 12.5
        && created.price === 15
        && firstRead[0].meta === 12.5
        && firstRead[0].price === 15
        && updated.meta === 22.75
        && updated.price === 18
        && secondRead[0].meta === 22.75;
    } finally {
      globalThis.fetch = originalFetch;
      if (originalLocalStorage === undefined) {
        delete globalThis.localStorage;
      } else {
        globalThis.localStorage = originalLocalStorage;
      }
    }
  }
);

addTest(
  'Preço do ativo pode ser lido e atualizado pela API',
  {},
  'GET devolve o preço persistido e POST atualiza preço e timestamp',
  async () => {
    const originalFetch = globalThis.fetch;
    const originalLocalStorage = globalThis.localStorage;
    const storedAssets = [{
      id: 17,
      ticker: 'TEST3',
      price: 10,
      price_updated_at: '2026-10-19 10:00:00'
    }];
    const jsonResponse = (payload) => ({
      ok: true,
      json: async () => JSON.parse(JSON.stringify(payload))
    });

    globalThis.localStorage = { getItem: () => 'test-token' };
    globalThis.fetch = async (path, options = {}) => {
      if (options.headers?.Authorization !== 'Bearer test-token') {
        return { ok: false, json: async () => ({ error: 'Autenticação necessária.' }) };
      }
      if (path === '/api/assets' && !options.method) {
        return jsonResponse(storedAssets);
      }
      if (path === '/api/assets/update-prices' && options.method === 'POST') {
        const updates = JSON.parse(options.body).assets;
        for (const update of updates) {
          const asset = storedAssets.find((item) => item.id === update.id);
          if (asset) {
            asset.price = update.price;
            asset.price_updated_at = '2026-10-19 10:10:00';
          }
        }
        return jsonResponse(storedAssets);
      }
      return { ok: false, json: async () => ({}) };
    };

    try {
      const initialAssets = await listAssets();
      const updatedAssets = await updateAssetPrices([{ id: 17, price: 12.345678 }]);
      const reloadedAssets = await listAssets();

      return initialAssets[0].price === 10
        && Boolean(initialAssets[0].price_updated_at)
        && updatedAssets[0].price === 12.345678
        && reloadedAssets[0].price === 12.345678
        && reloadedAssets[0].price_updated_at === '2026-10-19 10:10:00';
    } finally {
      globalThis.fetch = originalFetch;
      if (originalLocalStorage === undefined) {
        delete globalThis.localStorage;
      } else {
        globalThis.localStorage = originalLocalStorage;
      }
    }
  }
);

addTest(
  'Proventos podem ser criados, lidos, atualizados e deletados pela API',
  {},
  'POST, GET, PUT e DELETE preservam e removem o provento',
  async () => {
    const originalFetch = globalThis.fetch;
    const originalLocalStorage = globalThis.localStorage;
    let storedProventos = [];
    let nextId = 1;
    const jsonResponse = (payload) => ({
      ok: true,
      json: async () => JSON.parse(JSON.stringify(payload))
    });

    globalThis.localStorage = { getItem: () => 'test-token' };
    globalThis.fetch = async (path, options = {}) => {
      const method = options.method || 'GET';
      if (options.headers?.Authorization !== 'Bearer test-token') {
        return {
          ok: false,
          json: async () => ({ error: 'Autenticação necessária.' })
        };
      }

      if (method === 'GET') {
        return jsonResponse(storedProventos);
      }
      if (method === 'POST') {
        const created = { id: nextId++, ...JSON.parse(options.body) };
        storedProventos.push(created);
        return jsonResponse(created);
      }

      const id = Number(path.split('/').pop());
      const index = storedProventos.findIndex((item) => item.id === id);
      if (index < 0) return { ok: false, json: async () => ({}) };

      if (method === 'PUT') {
        storedProventos[index] = { id, ...JSON.parse(options.body) };
        return jsonResponse(storedProventos[index]);
      }
      if (method === 'DELETE') {
        storedProventos.splice(index, 1);
        return jsonResponse({ success: true });
      }
      return { ok: false, json: async () => ({}) };
    };

    try {
      const entry = {
        ticker: 'TEST3',
        value: 12.5,
        type: 'Rendimento',
        date: '2026-10-19'
      };
      const created = await createProventoRequest(entry);
      const firstRead = await listProventos();
      const updated = await updateProventoRequest(created.id, { ...entry, value: 22.75 });
      const secondRead = await listProventos();
      await deleteProventoRequest(created.id);
      const finalRead = await listProventos();

      return created.type === 'Rendimento'
        && created.value === 12.5
        && firstRead.length === 1
        && firstRead[0].type === 'Rendimento'
        && firstRead[0].value === 12.5
        && updated.type === 'Rendimento'
        && updated.value === 22.75
        && secondRead[0].type === 'Rendimento'
        && secondRead[0].value === 22.75
        && finalRead.length === 0;
    } finally {
      globalThis.fetch = originalFetch;
      if (originalLocalStorage === undefined) {
        delete globalThis.localStorage;
      } else {
        globalThis.localStorage = originalLocalStorage;
      }
    }
  }
);

addTest(
  'Resumo de proventos retorna evolução mensal e Yield on Cost',
  {},
  'GET /api/proventos/resumo devolve os dois arrays com autenticação',
  async () => {
    const originalFetch = globalThis.fetch;
    const originalLocalStorage = globalThis.localStorage;
    const expected = {
      evolucaoMensal: [{ mes: '2026-08', total: 6.37 }],
      resumoAtivos: [{ ticker: 'BROO11', total_recebido: 6.37, yield_on_cost: 15.2 }]
    };

    globalThis.localStorage = { getItem: () => 'test-token' };
    globalThis.fetch = async (path, options = {}) => ({
      ok: path === '/api/proventos/resumo'
        && options.headers?.Authorization === 'Bearer test-token',
      json: async () => expected
    });

    try {
      const summary = await getProventosSummary();
      return summary.evolucaoMensal[0]?.total === 6.37
        && summary.resumoAtivos[0]?.yield_on_cost === 15.2;
    } finally {
      globalThis.fetch = originalFetch;
      if (originalLocalStorage === undefined) {
        delete globalThis.localStorage;
      } else {
        globalThis.localStorage = originalLocalStorage;
      }
    }
  }
);

let passed = 0;
const failures = [];

for (const test of tests) {
  try {
    if (await test.check()) {
      passed += 1;
      console.log(`PASSOU | ${test.name}`);
    } else {
      failures.push({ ...test, error: 'Resultado diferente do esperado' });
      console.log(`FALHOU | ${test.name}`);
    }
  } catch (error) {
    failures.push({ ...test, error: error.message });
    console.log(`FALHOU | ${test.name} | ${error.message}`);
  }
}

console.log(`\nCobertura: ${passed}/${tests.length} testes passaram.`);

if (failures.length > 0) {
  process.exitCode = 1;
}
