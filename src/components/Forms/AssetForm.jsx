import React from 'react';
import { Calendar, Plus } from 'lucide-react';
import { ASSET_TYPES } from '../../constants/config';
import { isCrypto } from '../../utils/cryptoUtils';

const TYPE_LABELS = {
  'Ações (B3)': 'tipoAcoesB3', 'FIIs (B3)': 'tipoFiisB3', 'ETFs (B3)': 'tipoEtfsB3', 'BDRs (B3)': 'tipoBdrsB3', 'Renda Fixa': 'tipoRendaFixa',
  Cripto: 'tipoCripto', 'Ações (EUA / Globais)': 'tipoAcoesEuaGlobais',
  'REITs (EUA / Globais)': 'tipoReitsEuaGlobais', 'ETFs (EUA / Globais)': 'tipoEtfsEuaGlobais'
};
const LAST_ASSET_TYPE_KEY = 'goes_compra_certa_last_asset_type';

const getLastAssetType = () => {
  try {
    const lastAssetType = localStorage.getItem(LAST_ASSET_TYPE_KEY);
    return ASSET_TYPES.includes(lastAssetType) ? lastAssetType : '';
  } catch {
    return '';
  }
};

const saveLastAssetType = (type) => {
  try {
    localStorage.setItem(LAST_ASSET_TYPE_KEY, type);
  } catch {
    // Keep the form usable when browser storage is unavailable.
  }
};

const CONDITIONAL_FIELDS = {
  'Ações (B3)': [
    ['dividendYield', 'dividendYield', ''], ['pL', 'pl', ''], ['pVp', 'pvp', ''],
    ['roe', 'roe', ''], ['lpa', 'lpa', ''], ['vpa', 'vpa', ''],
    ['growthRate', 'txCrescimento', ''], ['roic', 'roic', ''], ['divEbitda', 'divEbitda', '']
  ],
  'FIIs (B3)': [
    ['dividendYieldRecorrente', 'dividendYieldRecorrente', ''], ['pVpAjustado', 'pvpAjustado', ''],
    ['vacancia', 'vacancia', ''], ['capRate', 'capRate', ''],
    ['liquidezDiaria', 'liquidezDiaria', '', 'text'], ['alavancagem', 'alavancagem', ''],
    ['concentracao', 'concentracao', '', 'text'], ['dyHistorico12M', 'dyHistorico12M', ''],
    ['patrimonioReal', 'patrimonioReal', '', 'text']
  ],
  'Renda Fixa': [
    ['taxaRentabilidade', 'taxaRentabilidade', ''], ['dataVencimento', 'dataVencimento', '', 'date']
  ]
};

CONDITIONAL_FIELDS['Ações (EUA / Globais)'] = CONDITIONAL_FIELDS['Ações (B3)'];
CONDITIONAL_FIELDS['REITs (EUA / Globais)'] = CONDITIONAL_FIELDS['FIIs (B3)'];

const COMMON_FIELDS = [
  ['ticker', 'ticker', '', 'text'], ['qty', 'quantidade', '', 'number'], ['pm', 'precoMedio', '', 'number'],
  ['price', 'cotacao', '', 'number'], ['meta', 'meta', '', 'number']
];

const isForeignAsset = (type) => [
  'Internacional', 'REIT', 'ETF Internacional',
  'Ações (EUA / Globais)', 'REITs (EUA / Globais)', 'ETFs (EUA / Globais)'
].includes(type);

export default function AssetForm({ onSubmit, editingId, onCancel, formData, onFormChange, onTypeChange, pmAlreadyInBrl, priceAlreadyInBrl, themeStyle, t }) {
  React.useEffect(() => {
    if (editingId) return;
    const lastAssetType = getLastAssetType();
    if (lastAssetType && formData.type !== lastAssetType) {
      onFormChange({ ...formData, type: lastAssetType });
    }
  }, [editingId, formData.type, onFormChange]);

  const handleChange = (field, value) => onFormChange({ ...formData, [field]: value });
  const cryptoAsset = isCrypto(formData.type, formData.ticker);
  const internationalAsset = isForeignAsset(formData.type);
  const displayCurrency = (formData.moeda || 'USD').toUpperCase();
  const averagePriceCurrency = pmAlreadyInBrl ? 'BRL' : displayCurrency;
  const currentPriceCurrency = priceAlreadyInBrl ? 'BRL' : displayCurrency;

  const handleDateChange = (event) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 8);
    let value = digits;

    if (digits.length > 4) {
      value = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      value = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    handleChange('dataVencimento', value);
  };

  const handleBuyDateChange = (event) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 8);
    let value = digits;

    if (digits.length > 4) {
      value = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      value = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    handleChange('buyDate', value);
  };

  const handleTypeChange = (type) => {
    saveLastAssetType(type);
    const clearedFields = Object.keys(formData).reduce((result, field) => ({ ...result, [field]: '' }), {});
    onFormChange({
      ...formData,
      ...clearedFields,
      type,
      moeda: isForeignAsset(type) ? formData.moeda || 'USD' : '',
      dyPeriod: '12M'
    });
    onTypeChange?.();
  };

  const renderField = ([field, labelKey, , inputType = 'number']) => (
    <div key={field}>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
        {field === 'qty' && cryptoAsset
          ? 'Quantidade'
          : field === 'pm' && cryptoAsset
            ? 'Preço Médio (R$)'
            : field === 'pm' && internationalAsset
              ? `Preço Médio (${averagePriceCurrency})`
              : field === 'price' && internationalAsset
                ? `Cotação Atual (${currentPriceCurrency})`
                : (t[labelKey] || labelKey)}
      </label>
      <input
        type={inputType}
        step={inputType === 'number' && ['qty', 'pm', 'price'].includes(field) ? 'any' : undefined}
        autoComplete={field === 'ticker' ? 'off' : undefined}
        spellCheck={field === 'ticker' ? false : undefined}
        value={formData[field] ?? ''}
        onChange={(event) => handleChange(field, field === 'ticker' ? event.target.value.toUpperCase() : event.target.value)}
        className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
      />
    </div>
  );

  const renderFiiRecurringYieldField = () => (
    <div key="dividendYieldRecorrente">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">DY Recorrente (%)</label>
      <input
        type="number"
        step="0.01"
        value={formData.dividendYieldRecorrente ?? ''}
        onChange={(event) => handleChange('dividendYieldRecorrente', event.target.value)}
        className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
      />
    </div>
  );

  const renderDividendPeriodField = () => {
    const field = 'dyHistorico12M';
    const selectedPeriod = formData.dyPeriod || '12M';

    return (
      <div key={field} className="flex flex-col gap-1 min-w-0 w-full">
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">Dividendos</label>
          <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950 p-0.5 shrink-0 self-center -mt-1">
            {['12M', '24M'].map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => onFormChange({ ...formData, dyPeriod: period })}
                className={`min-w-[2.1rem] px-1.5 py-0.5 rounded text-[8px] font-black leading-none transition-all ${
                  selectedPeriod === period ? themeStyle.btn : 'text-slate-500'
                }`}
                title={period}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <input
          type="number"
          step="0.01"
          value={formData[field] ?? ''}
          onChange={(event) => handleChange(field, event.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="font-bold text-sm flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-400" />{editingId ? t.editarAtivo : t.cadastrarAtivo}</h3>
        {editingId && <button onClick={onCancel} className="text-xs text-rose-400 hover:underline">{t.cancelar}</button>}
      </div>
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 [&>div]:min-w-0"
      >
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t.tipo}</label>
          <select value={formData.type} onChange={(event) => handleTypeChange(event.target.value)} className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
            {ASSET_TYPES.map((type) => <option key={type} value={type}>{t[TYPE_LABELS[type]]}</option>)}
          </select>
        </div>
        {isForeignAsset(formData.type) && (
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t.moedaEstrangeira}</label>
            <select
              value={formData.moeda || 'USD'}
              onChange={(event) => handleChange('moeda', event.target.value)}
              className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="USD">{t.moedaUsd}</option>
              <option value="EUR">{t.moedaEur}</option>
              <option value="GBP">{t.moedaGbp}</option>
              <option value="CAD">{t.moedaCad}</option>
            </select>
          </div>
        )}
        {COMMON_FIELDS.slice(0, 3).map(renderField)}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Data da Compra</label>
          <input
            type="text"
            value={formData.buyDate ?? ''}
            inputMode="numeric"
            maxLength={10}
            required
            onChange={handleBuyDateChange}
            className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>
        {COMMON_FIELDS.slice(3).map(renderField)}
        {(CONDITIONAL_FIELDS[formData.type] || []).map((fieldConfig) => {
          if (['FIIs (B3)', 'REITs (EUA / Globais)'].includes(formData.type) && fieldConfig[0] === 'dividendYieldRecorrente') {
            return renderFiiRecurringYieldField();
          }
          if (['FIIs (B3)', 'REITs (EUA / Globais)'].includes(formData.type) && fieldConfig[0] === 'dyHistorico12M') {
            return renderDividendPeriodField();
          }
          if (fieldConfig[0] === 'dataVencimento') {
            return (
              <div key="dataVencimento" className="relative">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {t.dataVencimento}
                </label>
                <input
                  type="text"
                  value={formData.dataVencimento || ''}
                  onChange={handleDateChange}
                  maxLength={10}
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 pr-9 text-xs text-white outline-none transition focus:border-emerald-500"
                />
                <Calendar className="pointer-events-none absolute right-3 top-7 h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              </div>
            );
          }
          return renderField(fieldConfig);
        })}
        <div className="self-end xl:col-start-5">
          <button
            type="submit"
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold ${themeStyle.btn}`}
          >
            {editingId ? t.salvar : t.adicionar}
          </button>
        </div>
      </form>
    </div>
  );
}
