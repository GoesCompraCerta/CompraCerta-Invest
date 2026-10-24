const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const CLASS_DEFINITIONS = [
  {
    key: 'actions',
    translationKey: 'positionClassActions',
    types: ['Ação (B3)', 'Ações (B3)', 'Ação BR', 'Ação (BR)', 'Ação B3']
  },
  {
    key: 'realEstate',
    translationKey: 'positionClassRealEstate',
    types: ['FII', 'FII B3', 'FII (B3)', 'FIIs', 'FIIs (B3)', 'Fundo Imobiliário']
  },
  {
    key: 'international',
    translationKey: 'positionClassInternational',
    types: [
      'ETF', 'ETF B3', 'ETF (B3)', 'ETFs (B3)', 'BDR', 'BDR B3', 'BDR (B3)', 'BDRs (B3)',
      'Ação (EUA)', 'Ação EUA', 'Ação Internacional (EUA)', 'Ações EUA', 'Ações Internacionais', 'Ações (EUA / Globais)',
      'Stocks', 'Stocks EUA', 'REIT', 'REIT (EUA)', 'REITs', 'REITs (EUA / Globais)',
      'ETF Internacional', 'ETFs (EUA / Globais)'
    ]
  },
  {
    key: 'fixedIncome',
    translationKey: 'positionClassFixedIncome',
    types: ['Renda Fixa', 'Renda Fixa (B3)']
  },
  {
    key: 'crypto',
    translationKey: 'positionClassCrypto',
    types: ['Cripto', 'Crypto']
  }
];

const classByType = new Map(
  CLASS_DEFINITIONS.flatMap(({ key, types }) =>
    types.map((type) => [type, key])
  )
);

export const groupAssetsByClass = (assets = []) => {
  const groups = new Map(CLASS_DEFINITIONS.map((definition) => [
    definition.key,
    { ...definition, assets: [], invested: 0, currentValue: 0, profit: 0 }
  ]));

  (Array.isArray(assets) ? assets : []).forEach((asset) => {
    const type = asset.type ?? asset.tipo;
    const classKey = classByType.get(type);
    const quantity = toFiniteNumber(asset.qty);
    const buyPrice = toFiniteNumber(asset.pm ?? asset.buyPrice ?? asset.buy_price);
    const currentPrice = toFiniteNumber(asset.price);
    const invested = quantity * buyPrice;
    const currentValue = quantity * currentPrice;

    console.log('[asset-classification] asset', {
      ticker: asset.ticker,
      type: asset.type,
      classKey: classKey || null,
      qty: asset.qty,
      buyPrice: asset.pm ?? asset.buyPrice ?? asset.buy_price,
      price: asset.price,
      numericQuantity: quantity,
      numericBuyPrice: buyPrice,
      numericCurrentPrice: currentPrice,
      invested,
      currentValue,
      profit: currentValue - invested
    });

    const group = groups.get(classKey);
    if (!group) return;

    group.assets.push(asset);
    group.invested += invested;
    group.currentValue += currentValue;
  });

  const portfolioValue = [...groups.values()].reduce((total, group) => total + group.currentValue, 0);
  const result = [...groups.values()]
    .filter((group) => group.assets.length > 0)
    .map((group) => ({
      ...group,
      profit: group.currentValue - group.invested,
      percentage: portfolioValue > 0 ? (group.currentValue / portfolioValue) * 100 : 0
    }));

  console.log('[asset-classification] groups', result.map(({ key, invested, currentValue, profit, percentage, assets: groupAssets }) => ({
    assetCount: groupAssets.length,
    invested,
    currentValue,
    profit,
    percentage
  })));

  return result;
};