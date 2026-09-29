// Asset types supported by Brapi (Brazilian market)
export const BRAPI_TYPES = new Set([
  'Ação BR', 'Ações (B3)', 'FII', 'FIIs (B3)', 'ETF', 'ETF (B3)', 'ETFs (B3)', 'ETF Nacional', 'BDR', 'BDRs (B3)', 'Renda Fixa'
]);

// Asset type options for the form
export const ASSET_TYPES = [
  'Ações (B3)',
  'FIIs (B3)',
  'ETFs (B3)',
  'BDRs (B3)',
  'Renda Fixa',
  'Cripto',
  'Ações (EUA / Globais)',
  'REITs (EUA / Globais)',
  'ETFs (EUA / Globais)'
];

const LEGACY_ASSET_TYPE_ALIASES = {
  'Ação BR': 'Ações (B3)',
  'Ação (BR)': 'Ações (B3)',
  'Ação B3': 'Ações (B3)',
  FII: 'FIIs (B3)',
  'Fundo Imobiliário': 'FIIs (B3)',
  ETF: 'ETFs (B3)',
  'ETF (B3)': 'ETFs (B3)',
  'ETF Nacional': 'ETFs (B3)',
  BDR: 'BDRs (B3)',
  'BDR (B3)': 'BDRs (B3)',
  'Renda Fixa (B3)': 'Renda Fixa',
  Stocks: 'Ações (EUA / Globais)',
  'Stocks EUA': 'Ações (EUA / Globais)',
  'Ação EUA': 'Ações (EUA / Globais)',
  'Ação (EUA)': 'Ações (EUA / Globais)',
  'Ações (EUA)': 'Ações (EUA / Globais)',
  'Ações Internacionais': 'Ações (EUA / Globais)',
  Internacional: 'Ações (EUA / Globais)',
  REIT: 'REITs (EUA / Globais)',
  'REIT (EUA)': 'REITs (EUA / Globais)',
  REITs: 'REITs (EUA / Globais)',
  'ETF Internacional': 'ETFs (EUA / Globais)',
  'ETF (EUA)': 'ETFs (EUA / Globais)'
};

export const normalizeAssetType = (type) => {
  const normalizedType = LEGACY_ASSET_TYPE_ALIASES[type] || type;

  if (normalizedType !== type) {
    console.warn('Tipo legado normalizado:', type, '->', normalizedType);
  }

  return normalizedType;
};

// Local storage keys
export const STORAGE_KEYS = {
  ASSETS: 'goes_compra_certa_assets',
  PROVENTOS: 'goes_compra_certa_proventos',
  BRAPI_API_KEY: 'goes_compra_certa_brapi_api_key',
  COINGECKO_API_KEY: 'goes_compra_certa_coingecko_api_key'
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
