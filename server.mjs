import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import YahooFinance from 'yahoo-finance2';
import {
  activateUserPlanFromWebhook,
  createAsset,
  createUser,
  deleteAssetById,
  getAssetById,
  getAssetsByUserId,
  getUserByEmail,
  getUserById,
  initDb,
  updateAssetById,
  updateUserPlan
} from './server/db.js';
import { assertJwtSecret, generateToken, hashPassword, requireAuth, verifyPassword } from './server/auth.js';
import { calculateAssetInvested } from './src/utils/assetValuation.js';

try {
  const envFile = readFileSync(new URL('./.env', import.meta.url), 'utf8');
  envFile.split(/\r?\n/).forEach((line) => {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match || match[1] in process.env) return;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

assertJwtSecret();

const PORT = Number(process.env.PORT || process.env.API_PORT || 3001);
const distDirectory = resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const isProduction = process.env.NODE_ENV === 'production'
  || (process.env.NODE_ENV !== 'development' && existsSync(distDirectory));
await initDb();
const BCB_BASE_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const ALLOWED_SERIES = new Set(['12', '196', '433', '4390', '4392']);
const MAX_CHUNK_YEARS = 5;
const QUOTE_CACHE_TTL = 60 * 1000;
const EVOLUTION_CACHE_TTL = 60 * 60 * 1000;
const evolutionCache = new Map();
const historicalQuoteCache = new Map();
const coinGeckoQuoteCache = new Map();
const brapiQuoteCache = new Map();
const exchangeRatesCache = new Map();
const COINGECKO_COINS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  XRP: 'ripple',
  LTC: 'litecoin',
  USDT: 'tether',
  BNB: 'binancecoin',
  DOT: 'polkadot',
  MATIC: 'polygon-ecosystem-token',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  XLM: 'stellar',
  ALGO: 'algorand',
  VET: 'vechain'
};
const COINGECKO_SYMBOLS = Object.fromEntries(
  Object.entries(COINGECKO_COINS).map(([symbol, coinId]) => [coinId, symbol])
);
const sendJson = (response, status, payload) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
};
const readCachedValue = (cache, key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};
const writeCachedValue = (cache, key, value) => {
  cache.set(key, { expiresAt: Date.now() + QUOTE_CACHE_TTL, value });
};

const serveProductionFile = async (request, response) => {
  let requestedPath;
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    requestedPath = resolve(distDirectory, `.${pathname}`);
  } catch {
    requestedPath = distDirectory;
  }

  const isInsideDist = requestedPath === distDirectory
    || requestedPath.startsWith(`${distDirectory}${sep}`);
  let filePath = isInsideDist ? requestedPath : resolve(distDirectory, 'index.html');
  let content;

  try {
    content = await readFile(filePath);
  } catch {
    filePath = resolve(distDirectory, 'index.html');
    try {
      content = await readFile(filePath);
    } catch (error) {
      console.error('Unable to serve production frontend:', error.message);
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Frontend build is unavailable.');
      return;
    }
  }

  const contentType = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mp4': 'video/mp4',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
  }[extname(filePath).toLowerCase()] || 'application/octet-stream';

  response.writeHead(200, { 'Content-Type': contentType });
  response.end(request.method === 'HEAD' ? undefined : content);
};

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  plan: user.plan,
  plan_expires_at: user.plan_expires_at
});

const handleAuthRegister = async (request, response) => {
  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    sendJson(response, 400, { error: error.message });
    return;
  }

  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload?.password === 'string' ? payload.password : '';
  if (name.length < 2) {
    sendJson(response, 400, { error: 'O nome deve ter pelo menos 2 caracteres.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    sendJson(response, 400, { error: 'E-mail inválido.' });
    return;
  }
  if (password.length < 8) {
    sendJson(response, 400, { error: 'A senha deve ter pelo menos 8 caracteres.' });
    return;
  }
  if (!process.env.JWT_SECRET) {
    sendJson(response, 500, { error: 'JWT_SECRET não está configurado no ambiente.' });
    return;
  }
  if (await getUserByEmail(email)) {
    sendJson(response, 400, { error: 'Este e-mail já está cadastrado.' });
    return;
  }

  const now = new Date();
  const trialStartedAt = now.toISOString();
  const planExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const user = await createUser({
      name,
      email,
      passwordHash: await hashPassword(password),
      trialStartedAt,
      plan: 'trial',
      planExpiresAt
    });
    sendJson(response, 201, { token: generateToken(user.id), user: toPublicUser(user) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      sendJson(response, 400, { error: 'Este e-mail já está cadastrado.' });
      return;
    }
    console.error('Auth register error:', error);
    sendJson(response, 500, { error: 'Não foi possível criar a conta.' });
  }
};

const handleAuthLogin = async (request, response) => {
  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    sendJson(response, 400, { error: error.message });
    return;
  }

  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload?.password === 'string' ? payload.password : '';
  const user = await getUserByEmail(email);
  if (!user || !await verifyPassword(password, user.password_hash)) {
    sendJson(response, 401, { error: 'E-mail ou senha incorretos.' });
    return;
  }
  if (!process.env.JWT_SECRET) {
    sendJson(response, 500, { error: 'JWT_SECRET não está configurado no ambiente.' });
    return;
  }

  sendJson(response, 200, { token: generateToken(user.id), user: toPublicUser(user) });
};

const handleAuthMe = async (request, response) => {
  const userId = requireAuth(request);
  if (!userId) {
    sendJson(response, 401, { error: 'Autenticação necessária.' });
    return;
  }

  const user = await getUserById(userId);
  if (!user) {
    sendJson(response, 401, { error: 'Usuário não encontrado.' });
    return;
  }
  sendJson(response, 200, { user: toPublicUser(user) });
};

const handlePlanStatus = async (request, response) => {
  const userId = requireAuth(request);
  if (!userId) {
    sendJson(response, 401, { error: 'Autenticação necessária.' });
    return;
  }

  const user = await getUserById(userId);
  if (!user) {
    sendJson(response, 401, { error: 'Usuário não encontrado.' });
    return;
  }

  const daysRemaining = user.plan === 'pro'
    ? null
    : Math.ceil((Date.parse(user.plan_expires_at || '') - Date.now()) / 86400000);
  sendJson(response, 200, {
    plan: user.plan,
    trialStartedAt: user.trial_started_at,
    planExpiresAt: user.plan_expires_at,
    daysRemaining
  });
};

const handleAuthLogout = (_request, response) => {
  sendJson(response, 200, { success: true });
};

const verifyMercadoPagoWebhookSignature = (request, requestUrl) => {
  const signatureHeader = request.headers['x-signature'];
  if (typeof signatureHeader !== 'string') return false;

  const signatureParts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const separator = part.indexOf('=');
      return separator < 0
        ? ['', '']
        : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
    })
  );
  const timestamp = signatureParts.ts;
  const suppliedHash = signatureParts.v1;
  if (!/^\d+$/.test(timestamp || '') || !/^[a-f\d]{64}$/i.test(suppliedHash || '')) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 600) return false;

  const manifestParts = [];
  const dataId = requestUrl.searchParams.get('data.id');
  const requestId = request.headers['x-request-id'];
  if (dataId) manifestParts.push(`id:${dataId}`);
  if (typeof requestId === 'string' && requestId.trim()) {
    manifestParts.push(`request-id:${requestId.trim()}`);
  }
  manifestParts.push(`ts:${timestamp}`);

  const manifest = `${manifestParts.join(';')};`;
  const expectedHash = createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest();
  const receivedHash = Buffer.from(suppliedHash, 'hex');
  return expectedHash.length === receivedHash.length
    && timingSafeEqual(expectedHash, receivedHash);
};

const fetchMercadoPagoResource = async (resourcePath, resourceId) => {
  const upstream = await fetch(
    `https://api.mercadopago.com/${resourcePath}/${encodeURIComponent(resourceId)}`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
      }
    }
  );
  if (!upstream.ok) throw new Error(`Mercado Pago respondeu HTTP ${upstream.status}.`);
  return upstream.json();
};

const getPlanDurationDays = (resource) => {
  const selectedPlan = String(resource?.metadata?.plan || '').toLowerCase();
  if (['annual', 'yearly', 'anual'].includes(selectedPlan)) return 365;
  if (['monthly', 'mensal'].includes(selectedPlan)) return 30;

  const recurring = resource?.auto_recurring;
  if (recurring) {
    const frequency = Number(recurring.frequency);
    const unit = String(recurring.frequency_type || '').toLowerCase();
    if (unit === 'years' || (unit === 'months' && frequency >= 12) || (unit === 'days' && frequency >= 365)) return 365;
    if (unit === 'months' || unit === 'days') return 30;
  }

  const amount = Number(resource?.transaction_amount ?? resource?.auto_recurring?.transaction_amount);
  if (Math.abs(amount - 191.88) < 0.01) return 365;
  if (Math.abs(amount - 19.99) < 0.01) return 30;
  return null;
};

const handleMercadoPagoWebhook = async (request, response) => {
  if (!process.env.MP_ACCESS_TOKEN || !process.env.MP_WEBHOOK_SECRET) {
    sendJson(response, 503, { error: 'Credenciais do Mercado Pago não configuradas.' });
    return;
  }

  let notification;
  try {
    notification = await readJsonBody(request);
  } catch (error) {
    sendJson(response, 400, { error: error.message });
    return;
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  if (!verifyMercadoPagoWebhookSignature(request, requestUrl)) {
    sendJson(response, 401, { error: 'Assinatura do webhook inválida.' });
    return;
  }

  const eventType = String(
    notification?.type
      || requestUrl.searchParams.get('type')
      || requestUrl.searchParams.get('topic')
      || ''
  ).toLowerCase();
  const resourceId = requestUrl.searchParams.get('data.id') || String(notification?.data?.id || '');
  if (!eventType || !resourceId) {
    sendJson(response, 200, { received: true, processed: false });
    return;
  }

  try {
    let userReference;
    let planResource;
    let isApproved = false;

    if (eventType === 'payment') {
      const payment = await fetchMercadoPagoResource('v1/payments', resourceId);
      isApproved = payment.status === 'approved';
      userReference = payment.external_reference;
      planResource = payment;
    } else if (['subscription', 'preapproval', 'subscription_preapproval'].includes(eventType)) {
      const subscription = await fetchMercadoPagoResource('preapproval', resourceId);
      isApproved = subscription.status === 'authorized';
      userReference = subscription.external_reference;
      planResource = subscription;
    } else if (eventType === 'subscription_authorized_payment') {
      const authorizedPayment = await fetchMercadoPagoResource('authorized_payments', resourceId);
      isApproved = ['processed', 'approved'].includes(authorizedPayment.status);
      if (isApproved && authorizedPayment.preapproval_id) {
        const subscription = await fetchMercadoPagoResource('preapproval', authorizedPayment.preapproval_id);
        userReference = subscription.external_reference;
        planResource = subscription;
      }
    } else {
      sendJson(response, 200, { received: true, processed: false });
      return;
    }

    if (!isApproved) {
      sendJson(response, 200, { received: true, processed: false });
      return;
    }

    const userId = Number(userReference);
    const durationDays = getPlanDurationDays(planResource);
    if (!Number.isSafeInteger(userId) || userId <= 0 || !durationDays) {
      console.warn('Mercado Pago approval missing a valid user reference or plan period.');
      sendJson(response, 200, { received: true, processed: false });
      return;
    }

    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const eventId = `${eventType}:${resourceId}`;
    const result = await activateUserPlanFromWebhook(eventId, userId, expiresAt);
    sendJson(response, 200, { received: true, processed: result.updated || result.duplicate });
  } catch (error) {
    console.error('Mercado Pago webhook error:', error);
    sendJson(response, 500, { error: 'Não foi possível processar a notificação do Mercado Pago.' });
  }
};

const handleActivatePro = async (request, response) => {
  if (process.env.NODE_ENV === 'production') {
    sendJson(response, 404, { error: 'Rota não encontrada.' });
    return;
  }

  const userId = requireAuth(request);
  if (!userId) {
    sendJson(response, 401, { error: 'Autenticação necessária.' });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    sendJson(response, 400, { error: error.message });
    return;
  }

  if (!['monthly', 'yearly'].includes(payload?.plan)) {
    sendJson(response, 400, { error: 'Plano inválido. Use monthly ou yearly.' });
    return;
  }

  const days = payload.plan === 'yearly' ? 365 : 30;
  const planExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  try {
    const updated = await updateUserPlan(userId, planExpiresAt);
    if (!updated) {
      sendJson(response, 404, { error: 'Usuário não encontrado.' });
      return;
    }
    sendJson(response, 200, { success: true, plan: 'pro', plan_expires_at: planExpiresAt });
  } catch (error) {
    console.error('Manual PRO activation error:', error);
    sendJson(response, 500, { error: 'Não foi possível ativar o plano de teste.' });
  }
};

const toPublicAsset = (asset) => ({
  id: asset.id,
  ticker: asset.ticker,
  type: asset.type,
  qty: asset.qty,
  buyPrice: asset.buy_price,
  buyDate: asset.buy_date
});

const requireActivePlan = async (request, response) => {
  const userId = requireAuth(request);
  if (!userId) {
    sendJson(response, 401, { error: 'Autenticação necessária.' });
    return null;
  }

  const user = await getUserById(userId);
  if (!user) {
    sendJson(response, 401, { error: 'Usuário não encontrado.' });
    return null;
  }
  if (user.plan === 'pro') return userId;

  const planExpiresAt = Date.parse(user.plan_expires_at || '');
  if (user.plan === 'trial' && Number.isFinite(planExpiresAt) && planExpiresAt > Date.now()) {
    return userId;
  }

  sendJson(response, 403, { error: 'Seu trial de 7 dias expirou.', code: 'TRIAL_EXPIRED' });
  return null;
};

const readAndValidateAsset = async (request, response) => {
  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    sendJson(response, 400, { error: error.message });
    return null;
  }

  const ticker = typeof payload?.ticker === 'string' ? payload.ticker.trim().toUpperCase() : '';
  const type = typeof payload?.type === 'string' ? payload.type.trim() : '';
  const qty = Number(payload?.qty);
  const buyPrice = Number(payload?.buyPrice);
  const buyDate = payload?.buyDate;

  if (!ticker || !Number.isFinite(qty) || qty <= 0
    || payload?.buyPrice === '' || payload?.buyPrice == null
    || !Number.isFinite(buyPrice) || buyPrice < 0
    || !isValidIsoDate(buyDate)) {
    sendJson(response, 400, { error: 'Informe ticker, quantidade positiva, preço médio válido e data YYYY-MM-DD.' });
    return null;
  }

  return { ticker, type: type || null, qty, buyPrice, buyDate };
};

const handleListAssets = async (request, response) => {
  const userId = await requireActivePlan(request, response);
  if (!userId) return;
  sendJson(response, 200, (await getAssetsByUserId(userId)).map(toPublicAsset));
};

const handleCreateAsset = async (request, response) => {
  const userId = await requireActivePlan(request, response);
  if (!userId) return;
  const assetData = await readAndValidateAsset(request, response);
  if (!assetData) return;

  const asset = await createAsset({ userId, ...assetData });
  sendJson(response, 201, toPublicAsset(asset));
};

const handleUpdateAssetRecord = async (request, response, assetId) => {
  const userId = await requireActivePlan(request, response);
  if (!userId) return;
  const assetData = await readAndValidateAsset(request, response);
  if (!assetData) return;

  const existing = await getAssetById(assetId);
  if (!existing) {
    sendJson(response, 404, { error: 'Ativo não encontrado.' });
    return;
  }
  if (existing.user_id !== userId) {
    sendJson(response, 403, { error: 'Este ativo não pertence ao usuário autenticado.' });
    return;
  }

  sendJson(response, 200, toPublicAsset(await updateAssetById(assetId, assetData)));
};

const handleDeleteAsset = async (request, response, assetId) => {
  const userId = await requireActivePlan(request, response);
  if (!userId) return;

  const existing = await getAssetById(assetId);
  if (!existing) {
    sendJson(response, 404, { error: 'Ativo não encontrado.' });
    return;
  }
  if (existing.user_id !== userId) {
    sendJson(response, 403, { error: 'Este ativo não pertence ao usuário autenticado.' });
    return;
  }

  await deleteAssetById(assetId);
  sendJson(response, 200, { success: true });
};

const parseDate = (value) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value || '')) return null;
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    ? date
    : null;
};

const formatDate = (date) => [
  String(date.getUTCDate()).padStart(2, '0'),
  String(date.getUTCMonth() + 1).padStart(2, '0'),
  date.getUTCFullYear()
].join('/');

const normalizeYahooSymbol = (value) => String(value || '')
  .trim()
  .toUpperCase()
  .replace(/\s+/g, '')
  .replace(/\./g, '-')
  .replace(/-+/g, '-');

const splitDateRange = (startDate, endDate) => {
  const chunks = [];
  let cursor = new Date(startDate);

  while (cursor <= endDate) {
    const chunkEnd = new Date(cursor);
    chunkEnd.setUTCFullYear(chunkEnd.getUTCFullYear() + MAX_CHUNK_YEARS);
    chunkEnd.setUTCDate(chunkEnd.getUTCDate() - 1);
    if (chunkEnd > endDate) chunkEnd.setTime(endDate.getTime());

    chunks.push({
      start: formatDate(cursor),
      end: formatDate(chunkEnd)
    });

    cursor = new Date(chunkEnd);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return chunks;
};

const fetchBcbChunk = async (series, start, end) => {
  const targetUrl = new URL(`${BCB_BASE_URL}.${series}/dados`);
  targetUrl.searchParams.set('formato', 'json');
  targetUrl.searchParams.set('dataInicial', start);
  targetUrl.searchParams.set('dataFinal', end);

  const upstream = await fetch(targetUrl, {
    headers: { Accept: 'application/json' }
  });

  if (!upstream.ok) {
    throw new Error(`Banco Central respondeu HTTP ${upstream.status}`);
  }

  const payload = await upstream.json();
  if (!Array.isArray(payload)) {
    throw new Error('Banco Central retornou JSON inválido');
  }

  return payload;
};

const fetchBcbSeries = async (series, startDate, endDate) => {
  const chunks = splitDateRange(startDate, endDate);
  const responses = await Promise.all(
    chunks.map(({ start, end }) => fetchBcbChunk(series, start, end))
  );
  const unique = new Map();

  responses.flat().forEach((item) => {
    if (item?.data && item?.valor != null) unique.set(item.data, item);
  });

  return [...unique.values()].sort((first, second) => {
    const firstDate = first.data.split('/').reverse().join('-');
    const secondDate = second.data.split('/').reverse().join('-');
    return firstDate.localeCompare(secondDate);
  });
};

const readJsonBody = (request, maxBytes = 1024 * 1024) => new Promise((resolve, reject) => {
  let body = '';
  let size = 0;

  request.setEncoding('utf8');
  request.on('data', (chunk) => {
    size += Buffer.byteLength(chunk);
    if (size > maxBytes) {
      reject(new Error('Corpo da requisição excede o limite permitido.'));
      request.destroy();
      return;
    }
    body += chunk;
  });
  request.on('end', () => {
    try {
      resolve(body ? JSON.parse(body) : null);
    } catch {
      reject(new Error('JSON inválido.'));
    }
  });
  request.on('error', reject);
});

const isValidIsoDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toISOString().slice(0, 10) === value;
};

const monthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

const monthStart = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const monthEnd = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

const listMonths = (start, end) => {
  const months = [];
  const cursor = monthStart(start);
  const lastMonth = monthStart(end);

  while (cursor <= lastMonth) {
    months.push({ key: monthKey(cursor), end: monthEnd(cursor) });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return months;
};

const round = (value, digits = 2) => Number(value.toFixed(digits));

const toYahooChartSymbol = (ticker) => {
  const normalized = String(ticker || '').trim().toUpperCase().replace(/\s+/g, '');
  return normalized.startsWith('^') || normalized.includes('.') ? normalized : normalized;
};

const fetchYahooMonthlyQuotes = async (ticker, startDate, endDate, market = 'auto') => {
  const symbol = toYahooChartSymbol(ticker);
  const candidates = symbol.startsWith('^') || symbol.includes('.')
    ? [symbol]
    : market === 'brazil' ? [`${symbol}.SA`]
      : market === 'international' ? [symbol]
        : [symbol, `${symbol}.SA`];
  const cacheKey = `${candidates.join(',')}|${startDate}|${endDate}`;
  const cached = historicalQuoteCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.quotes;
  historicalQuoteCache.delete(cacheKey);
  let lastError = null;

  for (const candidate of candidates) {
    try {
      const result = await yahooFinance.chart(candidate, {
        period1: startDate,
        period2: endDate,
        interval: '1mo'
      });
      const quotes = (result?.quotes || [])
        .filter((quote) => Number.isFinite(Number(quote?.close)) && quote?.date)
        .map((quote) => ({ date: new Date(quote.date), close: Number(quote.close) }))
        .filter((quote) => !Number.isNaN(quote.date.getTime()))
        .sort((first, second) => first.date - second.date);

      if (quotes.length > 0) {
        historicalQuoteCache.set(cacheKey, {
          quotes,
          expiresAt: Date.now() + EVOLUTION_CACHE_TTL
        });
        return quotes;
      }
      lastError = new Error(`Yahoo não retornou cotações para ${candidate}.`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`Falha ao consultar ${ticker}.`);
};

const quotesByMonth = (quotes) => new Map(quotes.map((quote) => [monthKey(quote.date), quote.close]));

const parseBcbMonthlyRates = (items, daily = false) => {
  const grouped = new Map();

  for (const item of items) {
    const [day, month, year] = String(item?.data || '').split('/').map(Number);
    const rate = Number(String(item?.valor ?? '').replace(',', '.'));
    if (!day || !month || !year || !Number.isFinite(rate)) continue;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(rate);
  }

  return new Map([...grouped.entries()].map(([key, rates]) => {
    const factor = rates.reduce((total, rate) => total * (1 + rate / 100), 1);
    return [key, daily ? (factor - 1) * 100 : (factor - 1) * 100];
  }));
};

const accumulateMonthlyRates = (monthlyRates, months) => {
  let accumulated = 1;
  const result = new Map();

  for (const month of months) {
    const rate = monthlyRates.get(month.key);
    if (rate == null) {
      result.set(month.key, null);
      continue;
    }
    accumulated *= 1 + rate / 100;
    result.set(month.key, round((accumulated - 1) * 100));
  }

  return result;
};

const rebaseSeriesToFirstPoint = (series, months) => {
  const firstValue = months
    .map(({ key }) => series.get(key))
    .find((value) => Number.isFinite(value));
  if (!Number.isFinite(firstValue)) return series;

  return new Map(months.map(({ key }) => {
    const value = series.get(key);
    return [key, Number.isFinite(value) ? round(value - firstValue) : null];
  }));
};

const buildYahooAccumulatedSeries = (quotes, months) => {
  const prices = quotesByMonth(quotes);
  let previousClose = null;
  let accumulated = 1;
  const result = new Map();

  for (const month of months) {
    const close = prices.get(month.key);
    if (!Number.isFinite(close)) {
      result.set(month.key, null);
      continue;
    }
    if (previousClose !== null && previousClose > 0) {
      accumulated *= close / previousClose;
    }
    result.set(month.key, round((accumulated - 1) * 100));
    previousClose = close;
  }

  return result;
};

const evolutionCacheKey = (payload) => createHash('md5')
  .update(JSON.stringify({ formulaVersion: 6, payload }))
  .digest('hex');

const validateEvolutionInput = (payload) => {
  if (!payload || !Array.isArray(payload.ativos) || payload.ativos.length === 0) {
    return 'ativos deve ser um array não vazio.';
  }
  if (!Number.isInteger(payload.meses) || payload.meses < 1 || payload.meses > 60) {
    return 'meses deve ser um número inteiro entre 1 e 60.';
  }
  for (const [index, asset] of payload.ativos.entries()) {
    if (!asset || typeof asset.ticker !== 'string' || !asset.ticker.trim()) {
      return `ativo ${index + 1}: ticker é obrigatório.`;
    }
    if (!Number.isFinite(Number(asset.quantity)) || Number(asset.quantity) <= 0) {
      return `ativo ${index + 1}: quantity deve ser maior que zero.`;
    }
    if (!Number.isFinite(Number(asset.buyPrice)) || Number(asset.buyPrice) < 0) {
      return `ativo ${index + 1}: buyPrice deve ser um número não negativo.`;
    }
    if (!Number.isFinite(Number(asset.currentPrice)) || Number(asset.currentPrice) < 0) {
      return `ativo ${index + 1}: currentPrice deve ser um número não negativo.`;
    }
    if (!isValidIsoDate(asset.buyDate)) {
      return `ativo ${index + 1}: buyDate deve estar no formato YYYY-MM-DD.`;
    }
  }
  return null;
};

const handlePortfolioEvolution = async (request, response) => {
  if (!requireActivePlan(request, response)) return;

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    sendJson(response, 400, { error: error.message });
    return;
  }

  const validationError = validateEvolutionInput(payload);
  if (validationError) {
    sendJson(response, 400, { error: validationError });
    return;
  }

  const cacheKey = evolutionCacheKey(payload);
  const cached = evolutionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    sendJson(response, 200, cached.value);
    return;
  }
  evolutionCache.delete(cacheKey);

  const now = new Date();
  const end = monthEnd(now);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - payload.meses, 1));
  const months = listMonths(start, end);
  const startIso = start.toISOString().slice(0, 10);
  const endIso = end.toISOString().slice(0, 10);

  const fetchMacro = async (series, label) => {
    try {
      return await fetchBcbSeries(series, start, end);
    } catch {
      return null;
    }
  };

  const [cdiItems, poupancaItems, ipcaItems, ibovespaQuotes] = await Promise.all([
    fetchMacro('12', 'CDI'),
    fetchMacro('196', 'Poupança'),
    fetchMacro('433', 'IPCA'),
    fetchYahooMonthlyQuotes('^BVSP', startIso, endIso).catch(() => null)
  ]);
  const cdi = cdiItems
    ? rebaseSeriesToFirstPoint(accumulateMonthlyRates(parseBcbMonthlyRates(cdiItems, true), months), months)
    : new Map();
  const poupanca = poupancaItems
    ? rebaseSeriesToFirstPoint(accumulateMonthlyRates(parseBcbMonthlyRates(poupancaItems), months), months)
    : new Map();
  const ipca = ipcaItems
    ? rebaseSeriesToFirstPoint(accumulateMonthlyRates(parseBcbMonthlyRates(ipcaItems), months), months)
    : new Map();
  const ibovespa = ibovespaQuotes ? buildYahooAccumulatedSeries(ibovespaQuotes, months) : new Map();

  const series = months.map((month) => {
    let valor = 0;
    let investido = 0;
    let ativosConsiderados = 0;

    for (const asset of payload.ativos) {
      const buyDate = new Date(`${asset.buyDate}T00:00:00.000Z`);
      if (buyDate > month.end) continue;
      const quantity = Number(asset.quantity) || 0;
      const currentPrice = Number(asset.currentPrice) || 0;
      valor += quantity * currentPrice;
      const assetInvested = calculateAssetInvested({
        quantity,
        averageUnitPrice: asset.buyPrice,
        type: asset.type,
        ticker: asset.ticker
      });
      investido += assetInvested;
      ativosConsiderados += 1;
    }

    return {
      mes: month.key,
      carteira: ativosConsiderados === 0 ? null : {
        valor: round(valor),
        investido: round(investido),
        rendimento: investido > 0 ? round(((valor - investido) / investido) * 100) : 0
      },
      cdi: cdi.get(month.key) ?? null,
      poupanca: poupanca.get(month.key) ?? null,
      ipca: ipca.get(month.key) ?? null,
      ibovespa: ibovespa.get(month.key) ?? null
    };
  });
  const result = {
    periodo: { inicio: startIso, fim: endIso },
    serie: series,
    avisos: []
  };

  evolutionCache.set(cacheKey, { expiresAt: Date.now() + EVOLUTION_CACHE_TTL, value: result });
  sendJson(response, 200, result);
};

const handleYahooRequest = async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const symbol = normalizeYahooSymbol(requestUrl.searchParams.get('symbol'));

  if (!symbol || !/^[A-Z0-9.^=-]+$/.test(symbol)) {
    sendJson(response, 400, { error: 'Ticker Yahoo Finance inválido.' });
    return;
  }

  try {
    const quote = await yahooFinance.quote(symbol);
    const price = Number(quote?.regularMarketPrice);

    if (!quote || !Number.isFinite(price) || price <= 0) {
      sendJson(response, 404, {
        error: `Ticker ${symbol} não encontrado no Yahoo Finance.`,
        code: 'TICKER_NOT_FOUND'
      });
      return;
    }

    sendJson(response, 200, { symbol, price, currency: quote?.currency || 'USD' });
  } catch (error) {
    const message = String(error?.message || 'Falha ao consultar o Yahoo Finance.');
    const notFound = /not found|invalid symbol|no data found|quote not found/i.test(message);
    sendJson(response, notFound ? 404 : 502, {
      error: notFound ? `Ticker ${symbol} não encontrado no Yahoo Finance.` : message,
      code: notFound ? 'TICKER_NOT_FOUND' : 'UPSTREAM_ERROR'
    });
  }
};

const handleBcbRequest = async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const series = requestUrl.searchParams.get('series');
  const start = requestUrl.searchParams.get('startDate');
  const end = requestUrl.searchParams.get('endDate');
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (!ALLOWED_SERIES.has(series)) {
    sendJson(response, 400, { error: 'Série do Banco Central não permitida.' });
    return;
  }

  if (!startDate || !endDate || startDate > endDate) {
    sendJson(response, 400, { error: 'Datas inválidas. Use o formato dd/MM/yyyy.' });
    return;
  }

  try {
    const data = await fetchBcbSeries(series, startDate, endDate);
    if (data.length === 0) {
      sendJson(response, 502, { error: 'Banco Central retornou dados vazios.' });
      return;
    }
    sendJson(response, 200, { series, startDate: start, endDate: end, data });
  } catch (error) {
    sendJson(response, 502, { error: error.message || 'Falha ao consultar o Banco Central.' });
  }
};

const handleCoinGeckoRequest = async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const requestedCoin = String(requestUrl.searchParams.get('coin') || '').trim();
    const normalizedTicker = requestedCoin
      .toUpperCase()
      .replace(/(?:\/BRL|-BRL)$/i, '')
      .replace(/[/-]/g, '');
    const coinId = COINGECKO_COINS[normalizedTicker]
      || COINGECKO_SYMBOLS[requestedCoin.toLowerCase()];
    const symbol = COINGECKO_SYMBOLS[coinId];

    if (!coinId) {
      sendJson(response, 400, { error: 'Criptomoeda não suportada.' });
      return;
    }

    const cached = readCachedValue(coinGeckoQuoteCache, coinId);
    if (cached) {
      sendJson(response, 200, cached);
      return;
    }

    try {
      const headers = { Accept: 'application/json' };
      const apiKey = request.headers['x-cg-demo-api-key'];
      if (typeof apiKey === 'string' && apiKey.trim()) {
        headers['x-cg-demo-api-key'] = apiKey.trim();
      }

      const upstream = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=brl`,
        { headers }
      );
      if (!upstream.ok) {
        sendJson(response, upstream.status === 429 ? 429 : 502, {
          error: `CoinGecko respondeu HTTP ${upstream.status}.`
        });
        return;
      }

      const payload = await upstream.json();
      const price = Number(payload?.[coinId]?.brl);
      if (!Number.isFinite(price) || price <= 0) {
        sendJson(response, 502, { error: 'CoinGecko não retornou uma cotação válida em BRL.' });
        return;
      }

      const quote = { symbol, price, currency: 'BRL' };
      writeCachedValue(coinGeckoQuoteCache, coinId, quote);
      sendJson(response, 200, quote);
    } catch (error) {
      sendJson(response, 502, { error: error.message || 'Falha ao consultar o CoinGecko.' });
    }
  };

  const handleBrapiRequest = async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const symbol = String(requestUrl.searchParams.get('symbol') || '').trim().toUpperCase();

    if (!symbol || symbol.length > 32 || !/^[A-Z0-9.-]+$/.test(symbol)) {
      sendJson(response, 400, { error: 'Ticker brapi inválido.' });
      return;
    }

    const cached = readCachedValue(brapiQuoteCache, symbol);
    if (cached) {
      sendJson(response, 200, cached);
      return;
    }

    try {
      const headers = { Accept: 'application/json' };
      const authorization = request.headers.authorization;
      if (typeof authorization === 'string' && /^Bearer\s+\S+$/i.test(authorization)) {
        headers.Authorization = authorization;
      }

      const upstream = await fetch(
        `https://brapi.dev/api/quote/${encodeURIComponent(symbol)}`,
        { headers }
      );
      if (!upstream.ok) {
        sendJson(response, upstream.status === 429 ? 429 : 502, {
          error: `brapi respondeu HTTP ${upstream.status}.`
        });
        return;
      }

      const payload = await upstream.json();
      const results = Array.isArray(payload?.results) ? payload.results : [];
      const quote = results.find((item) => item?.symbol?.toUpperCase() === symbol) || results[0];
      const price = Number(quote?.regularMarketPrice);
      if (!quote || !Number.isFinite(price) || price <= 0) {
        sendJson(response, 502, { error: 'brapi não retornou uma cotação válida.' });
        return;
      }

      const result = {
        ...quote,
        symbol: quote.symbol || symbol,
        price,
        currency: quote.currency || 'BRL'
      };
      writeCachedValue(brapiQuoteCache, symbol, result);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 502, { error: error.message || 'Falha ao consultar a brapi.' });
    }
  };

  const handleExchangeRatesRequest = async (_request, response) => {
    const cached = readCachedValue(exchangeRatesCache, 'rates');
    if (cached) {
      sendJson(response, 200, cached);
      return;
    }

    try {
      const upstream = await fetch(
        'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL,CAD-BRL',
        { headers: { Accept: 'application/json' } }
      );
      if (!upstream.ok) {
        sendJson(response, 502, { error: `AwesomeAPI respondeu HTTP ${upstream.status}.` });
        return;
      }

      const rates = await upstream.json();
      if (!rates?.USDBRL || !rates?.EURBRL) {
        sendJson(response, 502, { error: 'AwesomeAPI retornou dados de câmbio inválidos.' });
        return;
      }

      writeCachedValue(exchangeRatesCache, 'rates', rates);
      sendJson(response, 200, rates);
    } catch (error) {
      sendJson(response, 502, { error: error.message || 'Falha ao consultar a AwesomeAPI.' });
    }
  };

  const server = createServer((request, response) => {
  if (isProduction && !request.url?.startsWith('/api')) {
    serveProductionFile(request, response);
    return;
  }

  if (request.method === 'GET' && /^\/api\/coingecko(?:\?|$)/.test(request.url || '')) {
    handleCoinGeckoRequest(request, response);
    return;
  }

  if (request.method === 'GET' && /^\/api\/brapi(?:\?|$)/.test(request.url || '')) {
    handleBrapiRequest(request, response);
    return;
  }

  if (request.method === 'GET' && request.url === '/api/exchange-rates') {
    handleExchangeRatesRequest(request, response);
    return;
  }

  if (request.method === 'GET' && request.url === '/api/assets') {
    handleListAssets(request, response);
    return;
  }

  if (request.method === 'POST' && request.url === '/api/assets') {
    handleCreateAsset(request, response);
    return;
  }

  if (request.method === 'POST' && request.url?.split('?')[0] === '/api/webhook/mercadopago') {
    handleMercadoPagoWebhook(request, response);
    return;
  }

  if (request.method === 'POST' && request.url === '/api/auth/activate-pro') {
    handleActivatePro(request, response);
    return;
  }

  const assetRoute = /^\/api\/assets\/(\d+)$/.exec(request.url || '');
  if (assetRoute && request.method === 'PUT') {
    handleUpdateAssetRecord(request, response, Number(assetRoute[1]));
    return;
  }

  if (assetRoute && request.method === 'DELETE') {
    handleDeleteAsset(request, response, Number(assetRoute[1]));
    return;
  }

  if (request.method === 'POST' && request.url === '/api/auth/register') {
    handleAuthRegister(request, response);
    return;
  }

  if (request.method === 'POST' && request.url === '/api/auth/login') {
    handleAuthLogin(request, response);
    return;
  }

  if (request.method === 'GET' && request.url === '/api/auth/plan-status') {
    handlePlanStatus(request, response);
    return;
  }

  if (request.method === 'GET' && request.url === '/api/auth/me') {
    handleAuthMe(request, response);
    return;
  }

  if (request.method === 'POST' && request.url === '/api/auth/logout') {
    handleAuthLogout(request, response);
    return;
  }

  if (request.method === 'POST' && request.url === '/api/portfolio/evolution') {
    handlePortfolioEvolution(request, response);
    return;
  }

  if (request.method === 'GET' && request.url?.startsWith('/api/yahoo')) {
    handleYahooRequest(request, response);
    return;
  }

  if (request.method === 'GET' && request.url?.startsWith('/api/bcb')) {
    handleBcbRequest(request, response);
    return;
  }

  if (request.method === 'GET' && request.url === '/api/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  sendJson(response, 404, { error: 'Rota não encontrada.' });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso.`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`API disponível na porta ${PORT}`);

  if (!isProduction && process.env.API_ONLY !== '1') {
    const vitePath = fileURLToPath(new URL('./node_modules/vite/bin/vite.js', import.meta.url));
    const vite = spawn(process.execPath, [vitePath, '--host', '0.0.0.0'], {
      stdio: 'inherit',
      env: process.env
    });

    const stop = () => {
      if (!vite.killed) vite.kill();
      server.close(() => process.exit());
    };

    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  }
});
