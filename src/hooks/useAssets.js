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
import { getSupplementaryDetails, mergeBackendAssets, toApiAsset } from '../utils/assetSync.js';

const normalizeAssetList = (value) => Array.isArray(value) ? value : [];
const getAssetErrorKey = (error, fallback) => {
  if (error?.status === 401) return 'assetsLoginError';
  if (error?.code === 'ASSET_REQUEST_TIMEOUT') return 'assetRequestTimeoutError';
  return fallback;
};
let initialAssetsRequest = null;
const PRICE_MAX_AGE_MS = 8 * 60 * 60 * 1000;

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

const needsPriceRefresh = (asset) => {
  const price = Number(asset.price);
  const timestamp = String(asset.price_updated_at || '');
  const updatedAt = Date.parse(
    timestamp.includes('T') ? timestamp : `${timestamp.replace(' ', 'T')}Z`
  );
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
    } else if (backendAsset.meta == null && (legacyAsset.meta ?? legacyAsset.metaPercent) != null) {
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

const migrateLocalAssetDetails = async (assets, localDetails) => {
  const migratedAssets = [...assets];

  for (let index = 0; index < migratedAssets.length; index += 1) {
    const asset = migratedAssets[index];
    const local = localDetails[String(asset.id)];
    if (!local || typeof local !== 'object' || Array.isArray(local)) continue;

    const backendAsset = mergeBackendAssets([asset])[0];
    const backendDetails = getSupplementaryDetails(backendAsset);
    const missingLocalFields = Object.fromEntries(
      Object.entries(local).filter(([key]) => !(key in backendDetails))
    );
    if (Object.keys(missingLocalFields).length === 0) continue;

    const details = { ...local, ...backendDetails };
    const updated = await updateAsset(asset.id, toApiAsset({ ...backendAsset, ...details }));
    migratedAssets[index] = updated;
  }

  return migratedAssets;
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

      let pricedAssets = await refreshStaleAssetPrices(remoteAssets);
      const localPriceUpdates = pricedAssets
        .filter((asset) => {
          const cachedPrice = Number(details[String(asset.id)]?.price);
          return !(Number(asset.price) > 0) && Number.isFinite(cachedPrice) && cachedPrice > 0;
        })
        .map((asset) => ({
          id: Number(asset.id),
          price: Number(details[String(asset.id)].price)
        }));

      if (localPriceUpdates.length > 0) {
        const localPricesById = new Map(localPriceUpdates.map(({ id, price }) => [String(id), price]));
        try {
          const savedAssets = await updateAssetPrices(localPriceUpdates);
          const savedById = new Map(savedAssets.map((asset) => [String(asset.id), asset]));
          pricedAssets = pricedAssets.map((asset) => savedById.get(String(asset.id)) || asset);
        } catch {
          pricedAssets = pricedAssets.map((asset) => {
            const price = localPricesById.get(String(asset.id));
            return price ? { ...asset, price } : asset;
          });
        }
      }
      const assetsWithDetails = await migrateLocalAssetDetails(pricedAssets, details);
      if (Object.keys(details).length > 0 && !assetDetailsStorage.clear()) {
        throw new Error('Os detalhes dos ativos foram sincronizados, mas não foi possível limpar a cópia local.');
      }
      return mergeBackendAssets(assetsWithDetails);
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
      setError(getAssetErrorKey(loadError, 'assetsLoadingError'));
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
      setAssets((current) => [...normalizeAssetList(current), ...mergeBackendAssets([created])]);
      return created;
    } catch (saveError) {
      setError(getAssetErrorKey(saveError, 'assetCreateError'));
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
    const { forcePriceUpdate, ...assetUpdates } = updates;
    const updatedAsset = { ...currentAsset, ...assetUpdates };
    try {
      const saved = await updateAsset(assetId, toApiAsset(updatedAsset));
      let savedWithPrice = saved;
      const price = Number(updatedAsset.price);
      if (forcePriceUpdate && Number.isFinite(price) && price > 0) {
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
      const merged = mergeBackendAssets([savedWithPrice])[0];
      setAssets((current) => normalizeAssetList(current).map((asset) =>
        String(asset.id) === String(assetId) ? merged : asset
      ));
      return merged;
    } catch (saveError) {
      setError(getAssetErrorKey(saveError, 'assetUpdateError'));
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
      setError(getAssetErrorKey(deleteError, 'assetDeleteError'));
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