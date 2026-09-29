import {
  calculatePortfolioTotals,
  calculateMasterMethods,
  calculateFiiMethods,
  getSelectedFiiDy
} from './src/services/calculationService.js';
import { calculateStaticRebalance } from './src/services/rebalanceService.js';

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
  'Rebalance static: ativos acima da meta recebem zero',
  {
    ativos: [
      { id: 'A', ticker: 'A', meta: 15, valorAtual: 5000 },
      { id: 'B', ticker: 'B', meta: 85, valorAtual: 3000 }
    ],
    novoAporte: 5000,
    patrimonioAtual: 10000
  },
  'ativo A e B acima/abaixo conforme meta, sem inflar aporte para saturados',
  () => {
    const result = calculateStaticRebalance({
      ativos: [
        { id: 'A', ticker: 'A', meta: 15, valorAtual: 5000 },
        { id: 'B', ticker: 'B', meta: 85, valorAtual: 3000 }
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
      { id: 'A', ticker: 'PETR4', type: 'Ações', meta: 50, valorAtual: 400 },
      { id: 'B', ticker: 'BTC', type: 'Cripto', meta: 50, valorAtual: 0 }
    ],
    novoAporte: 500,
    patrimonioAtual: 400
  },
  'acao usa quantidade inteira e valor arredondado, cripto mantem fração',
  () => {
    const result = calculateStaticRebalance({
      ativos: [
        { id: 'A', ticker: 'PETR4', type: 'Ações', meta: 50, valorAtual: 400 },
        { id: 'B', ticker: 'BTC', type: 'Cripto', meta: 50, valorAtual: 0 }
      ],
      novoAporte: 500,
      patrimonioAtual: 400
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

let passed = 0;
const failures = [];

for (const test of tests) {
  try {
    if (test.check()) {
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
