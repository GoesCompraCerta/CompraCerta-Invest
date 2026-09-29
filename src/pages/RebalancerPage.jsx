import React, { useEffect, useMemo, useState } from 'react';
import { calculateStaticRebalance } from '../services/rebalanceService.js';
import { isCrypto } from '../utils/cryptoUtils.js';

const readStoredAssets = () => {
  try {
    const saved = localStorage.getItem('minha-carteira');
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erro ao ler o localStorage:', error);
    return [];
  }
};

const getAssetValue = (asset) => {
  const rawValue = Number(asset.valorAtual ?? asset.valorTotal ?? 0);
  if (rawValue > 0) return rawValue;

  const shares = Number(asset.cotas ?? asset.qty ?? 0);
  const price = Number(asset.precoAtual ?? asset.price ?? 0);
  return shares * price || 0;
};

const getAssetPrice = (asset) => Number(asset.precoAtual ?? asset.price ?? 0) || 0;
const getAssetTarget = (asset) => Number(asset.meta ?? asset.metaPercent ?? 0) || 0;
const isTraditionalAsset = (asset) => !isCrypto(asset.type, asset.ticker);
const calculateSuggestedQuantity = (asset, value) => {
  const price = getAssetPrice(asset);
  if (value <= 0 || price <= 0) return { quantity: 0, value: 0 };

  if (!isTraditionalAsset(asset)) {
    return { quantity: value / price, value };
  }

  const lote = Number(asset.loteMinimo ?? asset.lote ?? 1) || 1;
  const rawQuantity = value / price;
  const adjustedQuantity = lote > 1 ? Math.floor(rawQuantity / lote) * lote : Math.floor(rawQuantity);
  const roundedValue = adjustedQuantity * price;

  return {
    quantity: adjustedQuantity,
    value: roundedValue
  };
};
const formatSuggestedQuantity = (value) => {
  if (!Number.isFinite(value)) return '0';
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
};

export default function RebalancerPage({
  totals,
  cardClass,
  t,
  modoPrivacidade,
  novoAporte,
  setNovoAporte
}) {
  const [storedAssets, setStoredAssets] = useState(() => readStoredAssets());
  const oculto = Boolean(modoPrivacidade);

  useEffect(() => {
    setStoredAssets(readStoredAssets());
  }, [totals.list]);

  const assets = storedAssets.length > 0 ? storedAssets : (totals.list || []);
  const aporte = Number(novoAporte) || 0;
  const aporteValido = Number.isFinite(aporte) && aporte > 0;
  const patrimonioTotal = assets.reduce((total, asset) => total + getAssetValue(asset), 0);
  const patrimonioFuturo = aporteValido ? patrimonioTotal + aporte : 0;

  const resultadoAporte = useMemo(() => {
    if (!aporteValido) {
      const items = assets.map((asset, index) => ({
        ...asset,
        index,
        valAtual: getAssetValue(asset),
        meta: getAssetTarget(asset),
        pctAtual: patrimonioTotal > 0 ? ((getAssetValue(asset) / patrimonioTotal) * 100) : 0,
        metaAtingida: patrimonioTotal > 0 ? ((getAssetValue(asset) / patrimonioTotal) * 100) >= getAssetTarget(asset) : false,
        aporteSugerido: 0,
        cotasSugeridas: 0
      }));

      return {
        items,
        totalAlocado: 0,
        sobraCaixa: 0
      };
    }

    const base = calculateStaticRebalance({
      ativos: assets.map((asset) => ({
        ...asset,
        valorAtual: getAssetValue(asset),
        meta: getAssetTarget(asset)
      })),
      novoAporte: aporte,
      patrimonioAtual: patrimonioTotal
    });

    const items = base.distribuicao.map((item, index) => {
      const ajustes = calculateSuggestedQuantity(item, item.aporteSugerido || 0);
      const isCryptoAsset = !isTraditionalAsset(item);

      return {
        ...item,
        index,
        valAtual: Number(item.valorAtual || 0),
        aporteSugerido: isCryptoAsset ? Number(item.aporteSugerido || 0) : Number(ajustes.value || 0),
        cotasSugeridas: Number(ajustes.quantity || 0)
      };
    });

    const totalAlocado = items.reduce((total, item) => total + (Number(item.aporteSugerido) || 0), 0);
    const sobraCaixa = Math.max(0, Number(aporte) - totalAlocado);

    return {
      items,
      totalAlocado,
      sobraCaixa
    };
  }, [assets, aporte, aporteValido, patrimonioTotal]);

  const formatarMoeda = (value) => oculto
    ? 'R$ ••••••'
    : `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className={`w-full space-y-6 rounded-2xl border p-6 ${cardClass}`}>
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{t.sugestaoAporte}</h2>
            <p className="mt-1 text-sm text-slate-400">{t.novoAporte}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={`rounded-xl border p-4 ${cardClass}`}>
          <span className="text-xs font-bold uppercase text-slate-400">{t.patrimonioAtual}</span>
          <div className="mt-1 text-lg font-semibold">{formatarMoeda(patrimonioTotal)}</div>
        </div>
        <label className={`rounded-xl border p-4 ${cardClass}`}>
          <span className="mb-1 block text-xs font-bold uppercase text-slate-400">{t.novoAporte}</span>
          {oculto ? <div className="mt-2 text-base font-medium">R$ ••••••</div> : (
            <input
              type="number"
              min="0"
              value={novoAporte}
              onChange={(event) => setNovoAporte(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-medium text-white"
            />
          )}
        </label>
        <div className={`rounded-xl border p-4 ${cardClass}`}>
          <span className="text-xs font-bold uppercase text-slate-400">{t.patrimonioFuturo}</span>
          <div className="mt-1 text-lg font-semibold text-emerald-400">{formatarMoeda(patrimonioFuturo)}</div>
        </div>
        <div className={`rounded-xl border p-4 ${cardClass}`}>
          <span className="text-xs font-bold uppercase text-slate-400">{t.totalAlocado}</span>
          <div className="mt-1 text-lg font-semibold text-emerald-400">{formatarMoeda(resultadoAporte.totalAlocado)}</div>
        </div>
        <div className={`rounded-xl border p-4 ${cardClass}`}>
          <span className="text-xs font-bold uppercase text-slate-400">{t.caixaRestante}</span>
          <div className="mt-1 text-lg font-semibold text-amber-400">{formatarMoeda(resultadoAporte.sobraCaixa)}</div>
        </div>
      </div>

      <div className={`overflow-x-auto rounded-xl border ${cardClass}`}>
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-900/60 uppercase text-slate-400">
            <tr>
              <th className="p-4">{t.ativo}</th>
              <th className="p-4">{t.precoAtual}</th>
              <th className="p-4">{t.valorTotalLabel}</th>
              <th className="p-4">{t.percentualAtual}</th>
              <th className="p-4">{t.metaPercentual}</th>
              <th className="p-4">{t.aporteSugerido}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {resultadoAporte.items.length > 0 ? resultadoAporte.items.map((item, index) => {
              const percentual = patrimonioTotal > 0 ? (item.valAtual / patrimonioTotal) * 100 : 0;
              const atingiuMeta = Boolean(item.metaAtingida);
              const aporteExibido = atingiuMeta ? 0 : item.aporteSugerido;
              const label = atingiuMeta ? t.metaAtingida : t.comprar;
              const aporteFormatado = oculto
                ? (atingiuMeta ? 'R$ ••••••' : '+ R$ ••••••')
                : (atingiuMeta ? formatarMoeda(0) : `+ ${formatarMoeda(aporteExibido)}`);

              return (
                <tr key={item.id || item.ticker || index}>
                  <td className="p-4 font-bold">{item.ticker || t.ativo}</td>
                  <td className="p-4">{formatarMoeda(getAssetPrice(item))}</td>
                  <td className="p-4">{formatarMoeda(item.valAtual)}</td>
                  <td className="p-4">{percentual.toFixed(1)}%</td>
                  <td className="p-4">{item.meta}%</td>
                  <td className="p-4">
                    <span className={atingiuMeta ? 'text-emerald-400' : 'text-amber-400'}>{label}</span>
                    <strong className="ml-3 text-emerald-400">{aporteFormatado}</strong>
                    {!atingiuMeta && item.cotasSugeridas > 0 && (
                      <span className="ml-1 text-slate-400">
                        {isCrypto(item.type, item.ticker)
                          ? `(${formatSuggestedQuantity(item.cotasSugeridas)} ${item.ticker})`
                          : `(${item.cotasSugeridas} lote(s))`}
                      </span>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan="6" className="p-8 text-center text-slate-500">{t.semDados}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
