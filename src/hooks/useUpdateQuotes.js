import { useState, useCallback } from 'react';
import { fetchAssetData } from '../services/assetService';

const preserveExistingValue = (incomingValue, currentValue) => {
  if (incomingValue === undefined || incomingValue === null || Number.isNaN(Number(incomingValue))) {
    return currentValue;
  }

  return incomingValue;
};

export const useUpdateQuotes = () => {
  const [updatingAssetId, setUpdatingAssetId] = useState(null);
  const [updateMsg, setUpdateMsg] = useState('');

  const handleUpdateAsset = useCallback(
    async (asset, t, onSuccess) => {
      if (!asset?.ticker || updatingAssetId) return;

      setUpdatingAssetId(asset.id);
      setUpdateMsg('');

      try {
        const incoming = await fetchAssetData(asset);
        const mergedUpdates = {
          price: incoming.price ?? asset.price,
          priceOriginal: incoming.priceOriginal ?? asset.priceOriginal ?? null,
          priceCurrency: incoming.priceCurrency ?? asset.priceCurrency ?? 'BRL',
          dividendYield: preserveExistingValue(incoming.dividendYield, asset.dividendYield),
          pL: preserveExistingValue(incoming.pL, asset.pL),
          pVp: preserveExistingValue(incoming.pVp, asset.pVp),
          roe: preserveExistingValue(incoming.roe, asset.roe),
          lpa: preserveExistingValue(incoming.lpa, asset.lpa),
          vpa: preserveExistingValue(incoming.vpa, asset.vpa),
          growthRate: preserveExistingValue(incoming.growthRate, asset.growthRate),
          roic: preserveExistingValue(incoming.roic, asset.roic),
          divEbitda: preserveExistingValue(incoming.divEbitda, asset.divEbitda)
        };

        const savedAsset = await onSuccess(asset.id, mergedUpdates);
        if (!savedAsset) throw new Error('A cotação foi consultada, mas não pôde ser salva no servidor.');
        setUpdateMsg(`✓ ${asset.ticker} ${t.cotacaoAtualizada}`);
      } catch (err) {
        console.error('Update quotes error:', err);
        setUpdateMsg(err?.message || t.erroCotacoes);
      } finally {
        setUpdatingAssetId(null);
        setTimeout(() => setUpdateMsg(''), 4000);
      }
    },
    [updatingAssetId]
  );

  return {
    updatingAssetId,
    updateMsg,
    handleUpdateAsset
  };
};
