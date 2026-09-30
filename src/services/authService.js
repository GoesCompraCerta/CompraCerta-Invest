const TOKEN_KEY = 'goes_compra_certa_auth_token';

const request = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
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

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    throw new Error('Não foi possível salvar a sessão neste navegador.');
  }
};

export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // A sessão local já pode estar indisponível ou removida.
  }
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload) return false;
    const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
    return Number.isFinite(payload.exp) && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const register = async (name, email, password) => {
  const payload = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
  setToken(payload.token);
  return payload;
};

export const login = async (email, password) => {
  const payload = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  setToken(payload.token);
  return payload;
};

export const logout = async () => {
  const token = getToken();
  try {
    if (token) {
      await request('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } finally {
    removeToken();
  }
};

export const getMe = async () => {
  const token = getToken();
  if (!token) throw new Error('Sessão não encontrada.');

  try {
    return await request('/api/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    if (error.status === 401) removeToken();
    throw error;
  }
};

export const getPlanStatus = async () => {
  const token = getToken();
  if (!token) throw new Error('Sessão não encontrada.');

  try {
    return await request('/api/auth/plan-status', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    if (error.status === 401) removeToken();
    throw error;
  }
};

export const activateProForTest = async (plan) => {
  const token = getToken();
  if (!token) throw new Error('Sessão não encontrada.');

  return request('/api/auth/activate-pro', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan })
  });
};
