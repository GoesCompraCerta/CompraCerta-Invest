import { getToken } from './authService.js';

const request = async (path, options = {}) => {
  const token = getToken();
  if (!token) {
    const error = new Error('Sua sessão expirou. Entre novamente para acessar seus ativos.');
    error.status = 401;
    throw error;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(path, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(payload.error || 'Não foi possível acessar seus ativos.');
      error.status = response.status;
      throw error;
    }
    return payload;
  } catch (cause) {
    if (controller.signal.aborted) {
      const error = new Error('assetRequestTimeoutError');
      error.code = 'ASSET_REQUEST_TIMEOUT';
      throw error;
    }
    throw cause;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const listAssets = async () => {
  const assets = await request('/api/assets');
  if (!Array.isArray(assets)) {
    throw new Error('O servidor retornou uma lista de ativos inválida.');
  }
  return assets;
};

export const createAsset = (data) => request('/api/assets', {
  method: 'POST',
  body: JSON.stringify(data)
});

export const updateAsset = (id, data) => request(`/api/assets/${encodeURIComponent(id)}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const deleteAsset = (id) => request(`/api/assets/${encodeURIComponent(id)}`, {
  method: 'DELETE'
});

export const updateAssetPrices = (assets) => request('/api/assets/update-prices', {
  method: 'POST',
  body: JSON.stringify({ assets })
});
