import { getToken } from './authService';

const request = async (path, options = {}) => {
  const token = getToken();
  if (!token) {
    const error = new Error('Sua sessão expirou. Entre novamente para acessar seus ativos.');
    error.status = 401;
    throw error;
  }

  const response = await fetch(path, {
    ...options,
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
