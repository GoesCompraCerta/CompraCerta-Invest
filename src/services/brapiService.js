import { BRAPI_TYPES } from '../constants/config';
import { brapiApiKeyStorage } from './storageService';

const fetchBrapiQuote = async (ticker) => {
  const symbol = String(ticker || '').trim().toUpperCase();
  if (!symbol) throw new Error('Ticker brapi inválido.');

  const headers = { Accept: 'application/json' };
  const apiKey = brapiApiKeyStorage.get();
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(`/api/brapi?symbol=${encodeURIComponent(symbol)}`, { headers });
  if (!response.ok) {
    let details = null;
    try {
      details = await response.json();
    } catch {
      // Ignore empty or non-JSON proxy error responses.
    }
    throw new Error(details?.error || `brapi HTTP ${response.status}`);
  }

  return response.json();
};

// ── Fetch quotes from Brapi API ──────────────────────────────────────────────
export const fetchBrapiQuotes = async (tickers) => {
  try {
    if (!Array.isArray(tickers) || tickers.length === 0) {
      throw new Error('No tickers provided');
    }

    const results = await Promise.all(tickers.map(fetchBrapiQuote));

    const priceMap = {};
    results.forEach((result) => {
      const price = result?.regularMarketPrice ?? result?.price;
      if (result?.symbol && price != null) {
        priceMap[result.symbol.toUpperCase()] = price;
      }
    });

    return priceMap;
  } catch (error) {
    console.error('Brapi fetch error:', error);
    throw error;
  }
};

export const fetchBrapiFundamentals = async (tickers) => {
  try {
    if (!Array.isArray(tickers) || tickers.length === 0) {
      throw new Error('No tickers provided');
    }

    return Promise.all(tickers.map(fetchBrapiQuote));
  } catch (error) {
    console.error('Brapi fundamentals error:', error);
    throw error;
  }
};

export const fetchBrapiAssetData = async (ticker) => {
  const results = await fetchBrapiFundamentals([ticker]);
  const result = results.find((item) => item?.symbol?.toUpperCase() === ticker.toUpperCase()) || results[0];

  if (!result?.symbol || result.regularMarketPrice == null) {
    throw new Error('No asset data from Brapi');
  }

  const firstNumber = (...values) => {
    for (const candidate of values) {
      if (candidate == null || candidate === '') continue;
      const number = Number(candidate);
      if (Number.isFinite(number)) return number;
    }
    return null;
  };

  return {
    price: Number(result.regularMarketPrice),
    dividendYield: firstNumber(result.dividendYield),
    pL: firstNumber(result.priceEarnings, result.trailingPE),
    pVp: firstNumber(result.priceToBook),
    roe: firstNumber(result.returnOnEquity),
    lpa: firstNumber(result.earningsPerShare),
    vpa: firstNumber(result.bookValuePerShare),
    growthRate: firstNumber(result.earningsGrowth),
    roic: firstNumber(result.returnOnInvestedCapital),
    divEbitda: firstNumber(result.enterpriseValueEbitda)
  };
};

// ── Update asset prices from Brapi ───────────────────────────────────────────
export const updateAssetPrices = async (assets) => {
  const assetList = Array.isArray(assets) ? assets : [];
  const brapiAssets = assetList.filter((a) => BRAPI_TYPES.has(a.type));
  
  if (brapiAssets.length === 0) {
    return { updated: 0, message: 'No Brapi-compatible assets found' };
  }

  const tickers = brapiAssets.map((a) => a.ticker);
  const priceMap = await fetchBrapiQuotes(tickers);

  let updated = 0;
  const updatedAssets = assetList.map((asset) => {
    const newPrice = priceMap[asset.ticker.toUpperCase()];
    if (newPrice != null) {
      updated++;
      return { ...asset, price: newPrice };
    }
    return asset;
  });

  return {
    updated,
    assets: updatedAssets,
    message: `${updated} assets updated via Brapi`
  };
};
