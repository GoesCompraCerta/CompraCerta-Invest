import { STORAGE_KEYS } from '../constants/config.js';

// ── Assets Storage Service ────────────────────────────────────────────────────
export const assetsStorage = {
  get: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ASSETS);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error reading assets from storage:', error);
      return [];
    }
  },
  
  set: (assets) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    } catch (error) {
      console.error('Error saving assets to storage:', error);
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ASSETS);
      return true;
    } catch (error) {
      console.error('Error clearing legacy assets from storage:', error);
      return false;
    }
  }
};

const ASSET_DETAILS_KEY = 'goes_compra_certa_asset_details_v1';

export const assetDetailsStorage = {
  get: () => {
    try {
      const saved = localStorage.getItem(ASSET_DETAILS_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      console.error('Error reading supplementary asset details:', error);
      return {};
    }
  },

  set: (details) => {
    try {
      localStorage.setItem(ASSET_DETAILS_KEY, JSON.stringify(details));
      return true;
    } catch (error) {
      console.error('Error saving supplementary asset details:', error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(ASSET_DETAILS_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing migrated supplementary asset details:', error);
      return false;
    }
  }
};

// ── Proventos Storage Service ────────────────────────────────────────────────
export const proventosStorage = {
  get: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROVENTOS);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error reading proventos from storage:', error);
      return [];
    }
  },
  
  set: (proventos) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROVENTOS, JSON.stringify(proventos));
    } catch (error) {
      console.error('Error saving proventos to storage:', error);
    }
  }
};

let serverApiKeys = null;
let allowLegacyApiKeyFallback = true;

export const hasServerApiKeys = () => serverApiKeys !== null;

const getLegacyApiKey = (storageKey) => {
  try {
    return localStorage.getItem(storageKey) || '';
  } catch (error) {
    console.error('Error reading a legacy API key from storage:', error);
    return '';
  }
};

export const getLegacyApiKeys = () => ({
  brapi_api_key: getLegacyApiKey(STORAGE_KEYS.BRAPI_API_KEY),
  coingecko_api_key: getLegacyApiKey(STORAGE_KEYS.COINGECKO_API_KEY)
});

export const setServerApiKeys = (
  { brapi_api_key, coingecko_api_key } = {},
  { allowLegacyFallback = true } = {}
) => {
  serverApiKeys = {
    brapi_api_key: String(brapi_api_key || ''),
    coingecko_api_key: String(coingecko_api_key || '')
  };
  allowLegacyApiKeyFallback = allowLegacyFallback;
};

export const clearLegacyApiKeys = (fields = ['brapi_api_key', 'coingecko_api_key']) => {
  const storageKeys = {
    brapi_api_key: STORAGE_KEYS.BRAPI_API_KEY,
    coingecko_api_key: STORAGE_KEYS.COINGECKO_API_KEY
  };
  for (const field of fields) {
    try {
      localStorage.removeItem(storageKeys[field]);
    } catch (error) {
      console.error(`Error clearing the legacy ${field} key:`, error);
    }
  }
};

export const brapiApiKeyStorage = {
  get: () => {
    if (serverApiKeys && (!allowLegacyApiKeyFallback || serverApiKeys.brapi_api_key)) {
      return serverApiKeys.brapi_api_key;
    }
    return getLegacyApiKey(STORAGE_KEYS.BRAPI_API_KEY);
  }
};

export const coinGeckoApiKeyStorage = {
  get: () => {
    if (serverApiKeys && (!allowLegacyApiKeyFallback || serverApiKeys.coingecko_api_key)) {
      return serverApiKeys.coingecko_api_key;
    }
    return getLegacyApiKey(STORAGE_KEYS.COINGECKO_API_KEY);
  }
};

// ── Clear all data ──────────────────────────────────────────────────────────
export const clearAllStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ASSETS);
    localStorage.removeItem(STORAGE_KEYS.PROVENTOS);
    localStorage.removeItem(STORAGE_KEYS.BRAPI_API_KEY);
    localStorage.removeItem(STORAGE_KEYS.COINGECKO_API_KEY);
    setServerApiKeys({}, { allowLegacyFallback: false });
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};
