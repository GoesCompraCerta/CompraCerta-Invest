import React, { useState } from 'react';
import AssetForm from '../components/Forms/AssetForm';
import AssetsTable from '../components/Portfolio/AssetsTable';
import { exportPortfolioToExcel } from '../services/calculationService';
import { isCrypto } from '../utils/cryptoUtils';
import { fetchExchangeRates } from '../services/assetService';
import { normalizeAssetType } from '../constants/config';

const getToday = () => new Date().toISOString().split('T')[0];

const formatDateForInput = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
};

const parseDateInput = (value) => {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const isValidDate = date.getFullYear() === Number(year)
    && date.getMonth() === Number(month) - 1
    && date.getDate() === Number(day);

  if (!isValidDate) return null;

  const isoDate = `${year}-${month}-${day}`;
  return isoDate <= getToday() ? isoDate : null;
};

const isForeignAsset = (type) => [
  'Internacional', 'REIT', 'ETF Internacional',
  'Ações (EUA / Globais)', 'REITs (EUA / Globais)', 'ETFs (EUA / Globais)'
].includes(type);

export default function PortfolioPage({
  totals,
  formatMoney,
  themeStyle,
  cardClass,
  t,
  proventos,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
  assetsLoading = false,
  assetsError = '',
  onUpdateQuote,
  updatingAssetId,
  updateMsg
}) {
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [pmAlreadyInBrl, setPmAlreadyInBrl] = useState(false);
  const [priceAlreadyInBrl, setPriceAlreadyInBrl] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Ações (B3)',
    moeda: '',
    ticker: '',
    qty: '',
    pm: '',
    buyDate: '',
    price: '',
    dividendYield: '',
    pL: '',
    pVp: '',
    roe: '',
    lpa: '',
    vpa: '',
    growthRate: '',
    roic: '',
    divEbitda: '',
    dividendYieldRecorrente: '',
    pVpAjustado: '',
    vacancia: '',
    capRate: '',
    liquidezDiaria: '',
    alavancagem: '',
    concentracao: '',
    dyHistorico12M: '',
    patrimonioReal: '',
    div12m24m: '',
    dyPeriod: '12M',
    dividendo12m: '',
    dividendo24m: '',
    taxaRentabilidade: '',
    dataVencimento: '',
    meta: ''
  });

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    const parseNumericInput = (value) => {
      if (value === undefined || value === null || String(value).trim() === '') return null;
      const normalized = String(value).trim().replace(/\s/g, '').replace(/%$/, '');
      const brazilianNumber = normalized.includes(',')
        ? normalized.replace(/\./g, '').replace(',', '.')
        : /^0\.\d+$/.test(normalized)
          ? normalized
          : /^\d{1,3}(\.\d{3})+$/.test(normalized)
          ? normalized.replace(/\./g, '')
          : normalized;
      const number = Number(brazilianNumber);
      return Number.isFinite(number) ? number : null;
    };
    const parseOptionalNumber = (value) => parseNumericInput(value);
    const quantity = parseNumericInput(formData.qty);
    const enteredPrice = parseNumericInput(formData.price);
    const enteredAveragePrice = parseOptionalNumber(formData.pm);
    const enteredMeta = parseOptionalNumber(formData.meta);
    const buyDate = parseDateInput(formData.buyDate);
    const crypto = isCrypto(formData.type, formData.ticker);
    const international = isForeignAsset(formData.type);
    const previousAsset = editingAssetId ? totals.list.find((item) => item.id === editingAssetId) : null;

    if (!formData.ticker || quantity === null || quantity <= 0 || enteredPrice === null || enteredPrice <= 0 || enteredAveragePrice === null || enteredAveragePrice <= 0 || !buyDate || (enteredMeta !== null && (enteredMeta < 0 || enteredMeta > 100))) {
      return;
    }

    let finalPm = enteredAveragePrice;
    let finalPrice = enteredPrice;
    const originalCurrency = international ? (formData.moeda || 'USD').toUpperCase() : 'BRL';
    let exchangeRate = 1;

    if (international && originalCurrency !== 'BRL') {
      try {
        const rates = await fetchExchangeRates();
        exchangeRate = rates[originalCurrency.toLowerCase()];
        if (!exchangeRate) throw new Error(`Cotação ${originalCurrency}BRL indisponível`);
      } catch (error) {
        console.error('Erro ao converter valores para BRL:', error);
        window.alert('Não foi possível converter os valores para R$. Verifique sua conexão e tente novamente.');
        return;
      }
    }

    if (crypto) {
      finalPm = enteredAveragePrice;
    } else if (international && finalPm !== null && !pmAlreadyInBrl) {
      finalPm *= exchangeRate;
    }

    if (international && finalPrice !== null && !priceAlreadyInBrl) {
      finalPrice *= exchangeRate;
    }

    const selectedDyPeriod = formData.dyPeriod || '12M';
    const dyValue = parseNumericInput(formData.dyHistorico12M);
    const updated = {
      ticker: formData.ticker.toUpperCase(),
      type: formData.type,
      moeda: formData.moeda || null,
      qty: quantity,
      pm: finalPm,
      buyDate,
      pmOriginal: international && !pmAlreadyInBrl ? enteredAveragePrice : null,
      pmCurrency: international && pmAlreadyInBrl ? 'BRL' : originalCurrency,
      moedaOriginal: international && !pmAlreadyInBrl ? originalCurrency : null,
      price: finalPrice,
      priceOriginal: international && !priceAlreadyInBrl ? enteredPrice : null,
      priceCurrency: international && priceAlreadyInBrl ? 'BRL' : originalCurrency,
      dividendYield: parseOptionalNumber(formData.dividendYield),
      pL: parseOptionalNumber(formData.pL),
      pVp: parseOptionalNumber(formData.pVp),
      roe: parseOptionalNumber(formData.roe),
      lpa: parseOptionalNumber(formData.lpa),
      vpa: parseOptionalNumber(formData.vpa),
      growthRate: parseOptionalNumber(formData.growthRate),
      roic: parseOptionalNumber(formData.roic),
      divEbitda: parseOptionalNumber(formData.divEbitda),
      dividendYieldRecorrente: parseOptionalNumber(formData.dividendYieldRecorrente),
      pVpAjustado: parseOptionalNumber(formData.pVpAjustado),
      vacancia: parseOptionalNumber(formData.vacancia),
      capRate: parseOptionalNumber(formData.capRate),
      liquidezDiaria: parseNumericInput(formData.liquidezDiaria),
      alavancagem: parseNumericInput(formData.alavancagem),
      concentracao: formData.concentracao || null,
      dyHistorico12M: dyValue,
      patrimonioReal: parseNumericInput(formData.patrimonioReal),
      dividendo12m: selectedDyPeriod === '12M' ? dyValue : previousAsset?.dividendo12m ?? null,
      dividendo24m: selectedDyPeriod === '24M' ? dyValue : previousAsset?.dividendo24m ?? null,
      dyPeriod: selectedDyPeriod,
      taxaRentabilidade: formData.taxaRentabilidade === '' ? null : Number(formData.taxaRentabilidade),
      dataVencimento: formData.dataVencimento || null,
      metaPercent: enteredMeta ?? 10
    };

    if (editingAssetId) {
      const savedAsset = await onUpdateAsset(editingAssetId, updated);
      if (!savedAsset) return;
      setEditingAssetId(null);
    } else {
      const createdAsset = await onAddAsset(updated);
      if (!createdAsset) return;
    }

    setPriceAlreadyInBrl(false);
    setPmAlreadyInBrl(false);

    setFormData({
      type: 'Ações (B3)',
      moeda: '',
      ticker: '',
      qty: '',
      pm: '',
      buyDate: '',
      price: '',
      dividendYield: '',
      pL: '',
      pVp: '',
      roe: '',
      lpa: '',
      vpa: '',
      growthRate: '',
      roic: '',
      divEbitda: '',
      dividendYieldRecorrente: '',
      pVpAjustado: '',
      vacancia: '',
      capRate: '',
      liquidezDiaria: '',
      alavancagem: '',
      concentracao: '',
      dyHistorico12M: '',
      patrimonioReal: '',
      div12m24m: '',
      dyPeriod: '12M',
      dividendo12m: '',
      dividendo24m: '',
      taxaRentabilidade: '',
      dataVencimento: '',
      meta: '10'
    });
  };

  const handleEditAsset = async (item) => {
    const normalizedType = normalizeAssetType(item.type);
    const international = isForeignAsset(normalizedType);
    let editPm = item.pm;
    let editPrice = item.price;
    const editCurrency = (item.moeda || item.pmCurrency || item.priceCurrency || 'USD').toUpperCase();

    if (international) {
      try {
        const rates = await fetchExchangeRates();
        const exchangeRate = rates[editCurrency.toLowerCase()];
        if (!exchangeRate) throw new Error(`Cotação ${editCurrency}BRL indisponível`);

        editPm = Number(item.pm) / exchangeRate;
        editPrice = Number(item.price) / exchangeRate;
      } catch (error) {
        console.error('Erro ao converter valores para a moeda original:', error);
        window.alert('Não foi possível carregar os valores em moeda estrangeira. Verifique sua conexão e tente novamente.');
        return;
      }
    }

    setEditingAssetId(item.id);
    setPmAlreadyInBrl(!international && !item.pmOriginal && (item.pmCurrency || item.moedaOriginal) === 'BRL');
    setPriceAlreadyInBrl(!international && !item.priceOriginal && item.priceCurrency === 'BRL');
    setFormData({
      type: normalizedType,
      moeda: international ? editCurrency : item.moeda || '',
      ticker: item.ticker,
      qty: String(item.qty),
      pm: String(isCrypto(item.type, item.ticker)
        ? item.pm
        : international
          ? editPm
          : item.pmOriginal ?? item.pm),
          buyDate: formatDateForInput(item.buyDate),
      price: String(international ? editPrice : item.priceOriginal ?? item.price),
      dividendYield: String(item.dividendYield ?? ''),
      pL: String(item.pL ?? ''),
      pVp: String(item.pVp ?? ''),
      roe: String(item.roe ?? ''),
      lpa: String(item.lpa ?? ''),
      vpa: String(item.vpa ?? ''),
      growthRate: String(item.growthRate ?? ''),
      roic: String(item.roic ?? ''),
      divEbitda: String(item.divEbitda ?? ''),
      dividendYieldRecorrente: String(item.dividendYieldRecorrente ?? ''),
      pVpAjustado: String(item.pVpAjustado ?? ''),
      vacancia: String(item.vacancia ?? ''),
      capRate: String(item.capRate ?? ''),
      liquidezDiaria: String(item.liquidezDiaria ?? ''),
      alavancagem: String(item.alavancagem ?? ''),
      concentracao: item.concentracao ?? '',
      dyHistorico12M: String(item.dyHistorico12M ?? item.dividendo12m ?? item.dividendo24m ?? ''),
      patrimonioReal: String(item.patrimonioReal ?? ''),
      div12m24m: [item.dividendo12m, item.dividendo24m]
        .filter((value) => value !== undefined && value !== null && value !== '')
        .join(' / '),
      dyPeriod: item.dyPeriod || ((item.dividendo24m !== undefined && item.dividendo24m !== null && item.dividendo24m !== '') ? '24M' : '12M'),
      dividendo12m: String(item.dividendo12m ?? ''),
      dividendo24m: String(item.dividendo24m ?? ''),
      taxaRentabilidade: String(item.taxaRentabilidade ?? ''),
      dataVencimento: item.dataVencimento ?? '',
      meta: String(item.metaPercent)
    });
  };

  const handleAssetTypeChange = () => {
    setPmAlreadyInBrl(false);
    setPriceAlreadyInBrl(false);
  };

  const handleCancel = () => {
    setEditingAssetId(null);
    setPmAlreadyInBrl(false);
    setPriceAlreadyInBrl(false);
    setFormData({
      type: 'Ações (B3)',
      moeda: '',
      ticker: '',
      qty: '',
      pm: '',
      buyDate: '',
      price: '',
      dividendYield: '',
      pL: '',
      pVp: '',
      roe: '',
      lpa: '',
      vpa: '',
      growthRate: '',
      roic: '',
      divEbitda: '',
      dividendYieldRecorrente: '',
      pVpAjustado: '',
      vacancia: '',
      capRate: '',
      liquidezDiaria: '',
      alavancagem: '',
      concentracao: '',
      dyHistorico12M: '',
      patrimonioReal: '',
      div12m24m: '',
      dyPeriod: '12M',
      dividendo12m: '',
      dividendo24m: '',
      taxaRentabilidade: '',
      dataVencimento: '',
      meta: '10'
    });
  };

  const handleExportExcel = async () => {
    if (totals.list.length === 0 && (!proventos || proventos.length === 0)) return;
    await exportPortfolioToExcel(totals.list, proventos);
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border space-y-4 ${cardClass}`}>
        <AssetForm
          onSubmit={handleSaveAsset}
          editingId={editingAssetId}
          onCancel={handleCancel}
          formData={formData}
          onFormChange={setFormData}
          onTypeChange={handleAssetTypeChange}
          pmAlreadyInBrl={pmAlreadyInBrl}
          priceAlreadyInBrl={priceAlreadyInBrl}
          themeStyle={themeStyle}
          t={t}
        />
      </div>

      {assetsLoading && <p role="status" className="text-xs text-slate-400">Carregando ativos salvos...</p>}
      {assetsError && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{assetsError}</p>}

      <AssetsTable
        assets={totals.list}
        formatMoney={formatMoney}
        cardClass={cardClass}
        t={t}
        onEdit={handleEditAsset}
        onDelete={onDeleteAsset}
        onUpdateQuote={(item) => onUpdateQuote(item, onUpdateAsset)}
        updatingAssetId={updatingAssetId}
        onExport={handleExportExcel}
      />
      {updateMsg && (
        <p className={`text-xs font-bold ${updateMsg.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>
          {updateMsg}
        </p>
      )}
    </div>
  );
}
