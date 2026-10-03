import { getToken } from './authService';

const request = async (path, options = {}) => {
  const token = getToken();
  if (!token) throw new Error('Sessão não encontrada.');

  const response = await fetch(path, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error || 'Não foi possível concluir a solicitação.');
    error.status = response.status;
    throw error;
  }
  return payload;
};

export const exportData = () => request('/api/auth/export-data');

export const deleteAccount = (password) => request('/api/auth/delete-account', {
  method: 'DELETE',
  body: JSON.stringify({ password })
});
