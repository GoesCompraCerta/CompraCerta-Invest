import { useState, useEffect, useCallback } from 'react';
import { assetsStorage, assetDetailsStorage } from '../services/storageService';
import { fetchAssetData } from '../services/assetService';
import {
  createAsset,
  deleteAsset,
  listAssets,
  updateAsset,
  updateAssetPrices
} from '../services/assetsService';

const getToday = () => new Date().toISOString().split('T')[0];
const normalizeAssetList = (value) => Array.isArray(value) ? value : [];
const CORE_FIELDS = new Set([
  'id', 'user_id', 'ticker', 'type', 'qty', 'buyPrice', 'buy_price',
  'buyDate', 'buy_date', 'created_at', 'meta', 'price_updated_at'
]);
let initialAssetsRequest = null;
const PRICE_MAX_AGE_MS = 15 * 60 * 1000;

const getLegacyBuyDate = (asset) => {
  const date = String(asset?.buyDate || asset?.createdAt || getToday()).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : getToday();
};

const toApiAsset = (asset) => ({
  ticker: String(asset?.ticker || '').trim().toUpperCase(),
  type: String(asset?.type || asset?.tipo || '').trim() || null,
  qty: Number(asset?.qty),
  buyPrice: Number(asset?.pm ?? asset?.buyPrice),
  buyDate: getLegacyBuyDate(asset),
  meta: asset?.meta == null || asset.meta === '' ? null : Number(asset.meta)
});

const getAssetSignature = (asset) => {
  const apiAsset = toApiAsset(asset);
  return JSON.stringify([
    apiAsset.ticker,
    apiAsset.type || '',
    apiAsset.qty,
    apiAsset.buyPrice,
    apiAsset.buyDate
  ]);
};

const getSupplementaryDetails = (asset) => Object.fromEntries(
  Object.entries(asset || {}).filter(([key]) => !CORE_FIELDS.has(key))
);

const needsPriceRefresh = (asset) => {
  const price = Number(asset.price);
  const updatedAt = Date.parse(asset.price_updated_at || '');
  return !Number.isFinite(price) || price <= 0
    || !Number.isFinite(updatedAt)
    || Date.now() - updatedAt > PRICE_MAX_AGE_MS;
};

const refreshStaleAssetPrices = async (assets) => {
  const updates = (await Promise.all(assets.map(async (asset) => {
    if (!needsPriceRefresh(asset)) return null;
    try {
      const quote = await fetchAssetData(asset);
      const price = Number(quote.price);
      return Number.isFinite(price) && price > 0
        ? { id: Number(asset.id), price }
        : null;
    } catch {
      return null;
    }
  }))).filter(Boolean);

  if (updates.length === 0) return assets;
  const updatesById = new Map(updates.map((item) => [String(item.id), item]));
  const refreshed = assets.map((asset) => {
    const quote = updatesById.get(String(asset.id));
    return quote ? { ...asset, price: quote.price } : asset;
  });

  try {
    const savedAssets = await updateAssetPrices(updates);
    const savedById = new Map(savedAssets.map((asset) => [String(asset.id), asset]));
    return refreshed.map((asset) => {
      const saved = savedById.get(String(asset.id));
      return saved
        ? { ...asset, price: Number(saved.price), price_updated_at: saved.price_updated_at }
        : asset;
    });
  } catch {
    return refreshed;
  }
};

const mergeBackendAssets = (remoteAssets, details) => normalizeAssetList(remoteAssets).map((asset) => {
  const id = String(asset.id);
  const extra = details[id] && typeof details[id] === 'object' ? details[id] : {};
  const supplementaryDetails = Object.fromEntries(
    Object.entries(extra).filter(([key]) => key !== 'meta')
  );
  return {
    ...supplementaryDetails,
    ...asset,
    id,
    qty: Number(asset.qty) || 0,
    pm: Number(asset.buyPrice) || 0,
    price: asset.price == null ? (Number(extra.price) || 0) : Number(asset.price),
    buyDate: String(asset.buyDate || ''),
    meta: asset.meta == null ? null : Number(asset.meta),
    price_updated_at: asset.price_updated_at || null
  };
});

const importLegacyAssets = async (remoteAssets, legacyAssets, details) => {
  const importedAssets = [...normalizeAssetList(remoteAssets)];
  const matchedIds = new Set();

  for (const legacyAsset of normalizeAssetList(legacyAssets)) {
    const signature = getAssetSignature(legacyAsset);
    let backendAsset = importedAssets.find((asset) =>
      !matchedIds.has(String(asset.id)) && getAssetSignature(asset) === signature
    );

    if (!backendAsset) {
      backendAsset = await createAsset(toApiAsset(legacyAsset));
      importedAssets.push(backendAsset);
    } else if (backendAsset.meta == null && legacyAsset.meta != null) {
      backendAsset = await updateAsset(backendAsset.id, toApiAsset(legacyAsset));
      const importedIndex = importedAssets.findIndex(
        (asset) => String(asset.id) === String(backendAsset.id)
      );
      if (importedIndex >= 0) importedAssets[importedIndex] = backendAsset;
    }

    const backendId = String(backendAsset.id);
    matchedIds.add(backendId);
    details[backendId] = getSupplementaryDetails(legacyAsset);
  }

  if (!assetDetailsStorage.set(details)) {
    throw new Error('Não foi possível preservar os dados complementares locais dos ativos.');
  }
  if (!assetsStorage.clear()) {
    throw new Error('Os ativos foram migrados, mas não foi possível limpar a cópia local antiga.');
  }

  return importedAssets;
};

const loadBackendAssets = async () => {
  if (!initialAssetsRequest) {
    initialAssetsRequest = (async () => {
      let remoteAssets = await listAssets();
      const legacyAssets = assetsStorage.get();
      const details = assetDetailsStorage.get();

      if (legacyAssets.length > 0) {
        remoteAssets = await importLegacyAssets(remoteAssets, legacyAssets, details);
      }

      const pricedAssets = await refreshStaleAssetPrices(remoteAssets);
      return mergeBackendAssets(pricedAssets, details);
    })().finally(() => {
      initialAssetsRequest = null;
    });
  }
  return initialAssetsRequest;
};

export const useAssets = () => {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshAssets = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const loadedAssets = await loadBackendAssets();
      setAssets(loadedAssets);
      return loadedAssets;
    } catch (loadError) {
      const localFallback = assetsStorage.get();
      if (localFallback.length > 0) {
        setAssets(localFallback);
      }
      setError(loadError?.status === 401 ? 'assetsLoginError' : 'assetsLoadingError');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAssets();
  }, [refreshAssets]);

  const addAsset = useCallback(async (newAsset) => {
    setError('');
    try {
      const created = await createAsset(toApiAsset(newAsset));
      const id = String(created.id);
      const details = assetDetailsStorage.get();
      details[id] = getSupplementaryDetails(newAsset);
      const savedDetails = assetDetailsStorage.set(details);
      setAssets((current) => [...normalizeAssetList(current), ...mergeBackendAssets([created], details)]);
      if (!savedDetails) setError('assetDetailsSaveError');
      return created;
    } catch (saveError) {
      setError(saveError?.status === 401 ? 'assetsLoginError' : 'assetCreateError');
      return null;
    }
  }, []);

  const updateAssetRecord = useCallback(async (assetId, updates) => {
    const currentAsset = normalizeAssetList(assets).find((asset) => String(asset.id) === String(assetId));
    if (!currentAsset) {
      setError('assetNotFoundError');
      return null;
    }

    setError('');
    const updatedAsset = { ...currentAsset, ...updates };
    try {
      const saved = await updateAsset(assetId, toApiAsset(updatedAsset));
      const details = assetDetailsStorage.get();
      details[String(saved.id)] = getSupplementaryDetails(updatedAsset);
      const savedDetails = assetDetailsStorage.set(details);
      let savedWithPrice = saved;
      const price = Number(updatedAsset.price);
      if (Number.isFinite(price) && price > 0) {
        try {
          const pricedAssets = await updateAssetPrices([
            { id: Number(saved.id), price }
          ]);
          savedWithPrice = pricedAssets.find(
            (asset) => String(asset.id) === String(saved.id)
          ) || { ...saved, price };
        } catch {
          savedWithPrice = { ...saved, price };
        }
      }
      const merged = mergeBackendAssets([savedWithPrice], details)[0];
      setAssets((current) => normalizeAssetList(current).map((asset) =>
        String(asset.id) === String(assetId) ? merged : asset
      ));
      if (!savedDetails) setError('assetDetailsSaveError');
      return merged;
    } catch (saveError) {
      setError(saveError?.status === 401 ? 'assetsLoginError' : 'assetUpdateError');
      return null;
    }
  }, [assets]);

  const removeAsset = useCallback(async (assetId) => {
    setError('');
    try {
      await deleteAsset(assetId);
      const details = assetDetailsStorage.get();
      delete details[String(assetId)];
      assetDetailsStorage.set(details);
      setAssets((current) => normalizeAssetList(current).filter((asset) => String(asset.id) !== String(assetId)));
      return true;
    } catch (deleteError) {
      setError(deleteError?.status === 401 ? 'assetsLoginError' : 'assetDeleteError');
      return false;
    }
  }, []);

  const clearAssets = useCallback(() => setAssets([]), []);

  return {
    assets,
    setAssets,
    isLoading,
    error,
    refreshAssets,
    clearAssets,
    addAsset,
    updateAsset: updateAssetRecord,
    deleteAsset: removeAsset
  };
};