import { STORAGE_KEYS } from '../constants/config';

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

export const brapiApiKeyStorage = {
  get: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.BRAPI_API_KEY) || '';
    } catch (error) {
      console.error('Error reading Brapi API key from storage:', error);
      return '';
    }
  },

  set: (apiKey) => {
    try {
      const normalizedApiKey = String(apiKey || '').trim();
      if (normalizedApiKey) {
        localStorage.setItem(STORAGE_KEYS.BRAPI_API_KEY, normalizedApiKey);
      } else {
        localStorage.removeItem(STORAGE_KEYS.BRAPI_API_KEY);
      }
    } catch (error) {
      console.error('Error saving Brapi API key to storage:', error);
    }
  }
};

const createApiKeyStorage = (storageKey, providerName) => ({
  get: () => {
    try {
      return localStorage.getItem(storageKey) || '';
    } catch (error) {
      console.error(`Error reading ${providerName} API key from storage:`, error);
      return '';
    }
  },

  set: (apiKey) => {
    try {
      const normalizedApiKey = String(apiKey || '').trim();
      if (normalizedApiKey) {
        localStorage.setItem(storageKey, normalizedApiKey);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error(`Error saving ${providerName} API key to storage:`, error);
    }
  }
});

export const coinGeckoApiKeyStorage = createApiKeyStorage(STORAGE_KEYS.COINGECKO_API_KEY, 'CoinGecko');

// ── Clear all data ──────────────────────────────────────────────────────────
export const clearAllStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ASSETS);
    localStorage.removeItem(STORAGE_KEYS.PROVENTOS);
    localStorage.removeItem(STORAGE_KEYS.BRAPI_API_KEY);
    localStorage.removeItem(STORAGE_KEYS.COINGECKO_API_KEY);
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};
