const CORE_FIELDS = new Set([
  'id', 'user_id', 'ticker', 'type', 'qty', 'buyPrice', 'buy_price',
  'buyDate', 'buy_date', 'created_at', 'meta', 'metaPercent', 'price_updated_at'
]);

const getToday = () => new Date().toISOString().split('T')[0];

const getLegacyBuyDate = (asset) => {
  const date = String(asset?.buyDate || asset?.createdAt || getToday()).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : getToday();
};

export const toApiAsset = (asset) => {
  const meta = asset?.metaPercent == null || asset.metaPercent === ''
    ? asset?.meta
    : asset.metaPercent;
  const price = Number(asset?.price);

  return {
    ticker: String(asset?.ticker || '').trim().toUpperCase(),
    type: String(asset?.type || asset?.tipo || '').trim() || null,
    qty: Number(asset?.qty),
    buyPrice: Number(asset?.pm ?? asset?.buyPrice),
    buyDate: getLegacyBuyDate(asset),
    meta: meta == null || meta === '' ? null : Number(meta),
    price: Number.isFinite(price) && price > 0 ? price : null
  };
};

export const getSupplementaryDetails = (asset) => Object.fromEntries(
  Object.entries(asset || {}).filter(([key]) => !CORE_FIELDS.has(key))
);

export const mergeBackendAssets = (remoteAssets, details = {}) => (
  (Array.isArray(remoteAssets) ? remoteAssets : []).map((asset) => {
    const id = String(asset.id);
    const extra = details[id] && typeof details[id] === 'object' ? details[id] : {};
    const meta = asset.meta ?? extra.meta ?? extra.metaPercent;
    const supplementaryDetails = Object.fromEntries(
      Object.entries(extra).filter(([key]) => key !== 'meta' && key !== 'metaPercent')
    );

    return {
      ...supplementaryDetails,
      ...asset,
      id,
      qty: Number(asset.qty) || 0,
      pm: Number(asset.buyPrice) || 0,
      price: asset.price == null ? (Number(extra.price) || 0) : Number(asset.price),
      buyDate: String(asset.buyDate || ''),
      meta: meta == null ? null : Number(meta),
      metaPercent: meta == null ? null : Number(meta),
      price_updated_at: asset.price_updated_at || null
    };
  })
);