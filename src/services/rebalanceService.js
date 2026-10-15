import { isCrypto } from '../utils/cryptoUtils.js';

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const roundMoney = (value) => (
  Math.round((value + Number.EPSILON * Math.abs(value)) * 100) / 100
);

export const calculateStaticRebalance = ({
  ativos = [],
  novoAporte = 0,
  patrimonioAtual = null,
  patrimonioFuturo: patrimonioFuturoInformado = null
}) => {
  const aporte = Math.max(0, toNumber(novoAporte, 0));
  const patrimonio =
    patrimonioAtual !== null && patrimonioAtual !== undefined
      ? toNumber(patrimonioAtual, 0)
      : ativos.reduce((total, asset) => {
          const valorAtual = toNumber(asset.valorAtual ?? asset.valorTotal ?? 0, 0);
          return total + valorAtual;
        }, 0);
  const distribuicao = ativos.map((asset) => {
    const valorAtual = toNumber(asset.valorAtual ?? asset.valorTotal ?? 0, 0);
    const meta = toNumber(asset.meta ?? asset.metaPercent ?? 0, 0);
    const pctAtual = patrimonio > 0 ? (valorAtual / patrimonio) * 100 : 0;
    const alvo = roundMoney(patrimonio * (meta / 100));
    const metaAtingida = pctAtual >= meta - 0.1;
    const deficit = metaAtingida ? 0 : roundMoney(Math.max(0, alvo - valorAtual));

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
  const ratear = totalDeficit > aporte;

  const distribuicaoFinal = distribuicao.map((asset) => {
    if (asset.metaAtingida || asset.deficit <= 0 || aporte <= 0) {
      return { ...asset, aporteSugerido: 0, cotasSugeridas: 0 };
    }

    const aporteDisponivel = ratear
      ? aporte * (asset.deficit / totalDeficit)
      : asset.deficit;
    const precoAtual = toNumber(asset.precoAtual ?? asset.price, 0);
    let cotasSugeridas = 0;
    let aporteSugerido = 0;

    if (precoAtual <= 0) {
      return { ...asset, aporteSugerido, cotasSugeridas };
    }

    if (isCrypto(asset.type, asset.ticker)) {
      aporteSugerido = ratear
        ? Math.floor((aporteDisponivel + Number.EPSILON) * 100) / 100
        : asset.deficit;
      cotasSugeridas = aporteSugerido / precoAtual;
    } else {
      const lote = Math.max(1, toNumber(asset.loteMinimo ?? asset.lote, 1));
      cotasSugeridas = Math.floor(aporteDisponivel / precoAtual / lote) * lote;
      aporteSugerido = roundMoney(cotasSugeridas * precoAtual);
    }

    return {
      ...asset,
      aporteSugerido,
      cotasSugeridas
    };
  });

  const totalDistribuido = roundMoney(
    distribuicaoFinal.reduce((total, asset) => total + asset.aporteSugerido, 0)
  );
  const caixaRestante = roundMoney(Math.max(0, aporte - totalDistribuido));

  return {
    distribuicao: distribuicaoFinal,
    caixaRestante,
    totalDistribuido: Number(totalDistribuido.toFixed(2)),
    patrimonioAtual: patrimonio,
    totalDeficit
  };
};
