import { useState, useEffect, useCallback } from 'react';
import { assetsStorage, assetDetailsStorage } from '../services/storageService';
import { createAsset, deleteAsset, listAssets, updateAsset } from '../services/assetsService';

const getToday = () => new Date().toISOString().split('T')[0];
const normalizeAssetList = (value) => Array.isArray(value) ? value : [];
const CORE_FIELDS = new Set([
  'id', 'user_id', 'ticker', 'type', 'qty', 'buyPrice', 'buy_price',
  'buyDate', 'buy_date', 'created_at'
]);
let initialAssetsRequest = null;

const getLegacyBuyDate = (asset) => {
  const date = String(asset?.buyDate || asset?.createdAt || getToday()).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : getToday();
};

const toApiAsset = (asset) => ({
  ticker: String(asset?.ticker || '').trim().toUpperCase(),
  type: String(asset?.type || asset?.tipo || '').trim() || null,
  qty: Number(asset?.qty),
  buyPrice: Number(asset?.pm ?? asset?.buyPrice),
  buyDate: getLegacyBuyDate(asset)
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

const mergeBackendAssets = (remoteAssets, details) => normalizeAssetList(remoteAssets).map((asset) => {
  const id = String(asset.id);
  const extra = details[id] && typeof details[id] === 'object' ? details[id] : {};
  return {
    ...extra,
    ...asset,
    id,
    qty: Number(asset.qty) || 0,
    pm: Number(asset.buyPrice) || 0,
    price: Number(extra.price) || 0,
    buyDate: String(asset.buyDate || '')
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

      return mergeBackendAssets(remoteAssets, details);
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
      setError(loadError?.status === 401
        ? 'Entre novamente para carregar seus ativos salvos.'
        : loadError?.message || 'Não foi possível carregar os ativos. Tente novamente.');
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
      if (!savedDetails) setError('Ativo salvo no servidor, mas alguns detalhes locais não puderam ser guardados.');
      return created;
    } catch (saveError) {
      setError(saveError?.status === 401
        ? 'Sua sessão expirou. Entre novamente para cadastrar o ativo.'
        : saveError?.message || 'Não foi possível cadastrar o ativo. Tente novamente.');
      return null;
    }
  }, []);

  const updateAssetRecord = useCallback(async (assetId, updates) => {
    const currentAsset = normalizeAssetList(assets).find((asset) => String(asset.id) === String(assetId));
    if (!currentAsset) {
      setError('Não foi possível localizar o ativo para atualizar.');
      return null;
    }

    setError('');
    const updatedAsset = { ...currentAsset, ...updates };
    try {
      const saved = await updateAsset(assetId, toApiAsset(updatedAsset));
      const details = assetDetailsStorage.get();
      details[String(saved.id)] = getSupplementaryDetails(updatedAsset);
      const savedDetails = assetDetailsStorage.set(details);
      const merged = mergeBackendAssets([saved], details)[0];
      setAssets((current) => normalizeAssetList(current).map((asset) =>
        String(asset.id) === String(assetId) ? merged : asset
      ));
      if (!savedDetails) setError('Ativo atualizado no servidor, mas alguns detalhes locais não puderam ser guardados.');
      return merged;
    } catch (saveError) {
      setError(saveError?.status === 401
        ? 'Sua sessão expirou. Entre novamente para atualizar o ativo.'
        : saveError?.message || 'Não foi possível atualizar o ativo. Tente novamente.');
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
      setError(deleteError?.status === 401
        ? 'Sua sessão expirou. Entre novamente para remover o ativo.'
        : deleteError?.message || 'Não foi possível remover o ativo. Tente novamente.');
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