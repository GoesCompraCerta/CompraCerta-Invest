import { isCrypto } from './cryptoUtils.js';

export const calculateAssetInvested = ({ quantity, averageUnitPrice, type, ticker }) => {
  const qty = Number(quantity) || 0;
  const average = Number(averageUnitPrice) || 0;
  return isCrypto(type, ticker) ? average : qty * average;
};