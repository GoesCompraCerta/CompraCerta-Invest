import { isCrypto } from '../utils/cryptoUtils.js';

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const calculateStaticRebalance = ({
  ativos = [],
  novoAporte = 0,
  patrimonioAtual = null,
  patrimonioFuturo: patrimonioFuturoInformado = null
}) => {
  const aporte = toNumber(novoAporte, 0);
  const patrimonio =
    patrimonioAtual !== null && patrimonioAtual !== undefined
      ? toNumber(patrimonioAtual, 0)
      : ativos.reduce((total, asset) => {
          const valorAtual = toNumber(asset.valorAtual ?? asset.valorTotal ?? 0, 0);
          return total + valorAtual;
        }, 0);
  const patrimonioFuturo = patrimonioFuturoInformado !== null && patrimonioFuturoInformado !== undefined
    ? toNumber(patrimonioFuturoInformado, patrimonio + aporte)
    : patrimonio + aporte;

  if (!Array.isArray(ativos) || ativos.length === 0 || aporte <= 0) {
    return {
      distribuicao: ativos.map((asset) => {
        const valorAtual = toNumber(asset.valorAtual ?? asset.valorTotal ?? 0, 0);
        const meta = toNumber(asset.meta ?? asset.metaPercent ?? 0, 0);
        const pctAtual = patrimonio > 0 ? (valorAtual / patrimonio) * 100 : 0;

        return {
          ...asset,
          valorAtual,
          pctAtual,
          meta,
          alvo: 0,
          deficit: 0,
          metaAtingida: pctAtual >= meta,
          aporteSugerido: 0
        };
      }),
      caixaRestante: aporte,
      totalDistribuido: 0,
      patrimonioAtual: patrimonio,
      totalDeficit: 0
    };
  }

  const distribuicao = ativos.map((asset) => {
    const valorAtual = toNumber(asset.valorAtual ?? asset.valorTotal ?? 0, 0);
    const meta = toNumber(asset.meta ?? asset.metaPercent ?? 0, 0);
    const pctAtual = patrimonio > 0 ? (valorAtual / patrimonio) * 100 : 0;
    const alvo = patrimonioFuturo * (meta / 100);
    const deficit = Math.max(0, alvo - valorAtual);
    const metaAtingida = pctAtual >= meta;

    return {
      ...asset,
      valorAtual,
      pctAtual,
      meta,
      alvo,
      deficit,
      metaAtingida,
      aporteSugerido: 0
    };
  });

  const elegiveis = distribuicao.filter((asset) => !asset.metaAtingida && asset.deficit > 0);
  const totalDeficit = elegiveis.reduce((total, asset) => total + asset.deficit, 0);

  let totalDistribuido = 0;

  const distribuicaoFinal = distribuicao.map((asset) => {
    if (asset.metaAtingida) {
      return { ...asset, aporteSugerido: 0 };
    }

    if (totalDeficit <= 0 || asset.deficit <= 0) {
      return { ...asset, aporteSugerido: 0 };
    }

    const proporcao = asset.deficit / totalDeficit;
    let aporteSugerido = aporte * proporcao;

    if (aporteSugerido > asset.deficit) {
      aporteSugerido = asset.deficit;
    }

    const precoAtual = toNumber(asset.precoAtual ?? asset.price, 0);
    let cotasSugeridas = 0;

    if (precoAtual > 0) {
      if (isCrypto(asset.type, asset.ticker)) {
        cotasSugeridas = aporteSugerido / precoAtual;
      } else {
        const lote = Math.max(1, toNumber(asset.loteMinimo ?? asset.lote, 1));
        cotasSugeridas = Math.floor(aporteSugerido / precoAtual / lote) * lote;
        aporteSugerido = cotasSugeridas * precoAtual;
      }
    }

    aporteSugerido = Number(aporteSugerido.toFixed(2));
    totalDistribuido += aporteSugerido;

    return {
      ...asset,
      aporteSugerido,
      cotasSugeridas
    };
  });

  const caixaRestante = Number(Math.max(0, aporte - totalDistribuido).toFixed(2));

  return {
    distribuicao: distribuicaoFinal,
    caixaRestante,
    totalDistribuido: Number(totalDistribuido.toFixed(2)),
    patrimonioAtual: patrimonio,
    totalDeficit
  };
};
