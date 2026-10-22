import { getToken } from './authService.js';

const request = async (path, options = {}) => {
  const token = getToken();
  if (!token) {
    const error = new Error('Sua sessão expirou. Entre novamente para acessar seus proventos.');
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
    const error = new Error(payload.error || 'Não foi possível acessar seus proventos.');
    error.status = response.status;
    throw error;
  }
  return payload;
};

export const listProventos = async () => {
  const proventos = await request('/api/proventos');
  if (!Array.isArray(proventos)) {
    throw new Error('O servidor retornou uma lista de proventos inválida.');
  }
  return proventos;
};

export const getProventosSummary = async () => {
  const summary = await request('/api/proventos/resumo');
  if (!Array.isArray(summary?.evolucaoMensal) || !Array.isArray(summary?.resumoAtivos)) {
    throw new Error('O servidor retornou um resumo de proventos inválido.');
  }
  return summary;
};

export const createProvento = (data) => request('/api/proventos', {
  method: 'POST',
  body: JSON.stringify(data)
});

export const updateProvento = (id, data) => request(`/api/proventos/${encodeURIComponent(id)}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const deleteProvento = (id) => request(`/api/proventos/${encodeURIComponent(id)}`, {
  method: 'DELETE'
});