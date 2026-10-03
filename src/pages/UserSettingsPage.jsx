import React, { useState } from 'react';
import { Check, Download, ExternalLink, Eye, EyeOff, Moon, Sun, Trash2 } from 'lucide-react';
import { activateProForTest } from '../services/authService';
import { deleteAccount, exportData } from '../services/lgpdService';
import { brapiApiKeyStorage, coinGeckoApiKeyStorage } from '../services/storageService';
import DeleteAccountModal from '../components/Common/DeleteAccountModal';

const PLAN_LINKS = {
  monthly: 'https://mpago.la/2WfrFAf',
  annual: 'https://mpago.la/2N8oay5'
};

export default function UserSettingsPage({
  t,
  planStatus,
  setPlanStatus,
  lang,
  setLang,
  isDarkMode,
  setIsDarkMode,
  privacyMode,
  setPrivacyMode,
  themeStyle,
  cardClass,
  onAccountDeleted
}) {
  const [activeTab, setActiveTab] = useState('account');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [testActivationMessage, setTestActivationMessage] = useState('');
  const [isActivatingTestPlan, setIsActivatingTestPlan] = useState(false);
  const [showBrapiApiKey, setShowBrapiApiKey] = useState(false);
  const [showCoinGeckoApiKey, setShowCoinGeckoApiKey] = useState(false);
  const [isDownloadingData, setIsDownloadingData] = useState(false);
  const [dataExportError, setDataExportError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [brapiApiKey, setBrapiApiKey] = useState(() => brapiApiKeyStorage.get());
  const [coinGeckoApiKey, setCoinGeckoApiKey] = useState(() => coinGeckoApiKeyStorage.get());

  const handleSaveApiKey = (event) => {
    event.preventDefault();
    brapiApiKeyStorage.set(brapiApiKey);
    coinGeckoApiKeyStorage.set(coinGeckoApiKey);
    setBrapiApiKey(brapiApiKeyStorage.get());
    setCoinGeckoApiKey(coinGeckoApiKeyStorage.get());
    setApiKeySaved(true);
  };

  const handleActivateProTest = async () => {
    setIsActivatingTestPlan(true);
    setTestActivationMessage('');
    try {
      const result = await activateProForTest('monthly');
      setPlanStatus({ plan: result.plan, planExpiresAt: result.plan_expires_at, daysRemaining: null });
      setTestActivationMessage(t.testProActivated);
    } catch {
      setTestActivationMessage(t.testProActivationFailed);
    } finally {
      setIsActivatingTestPlan(false);
    }
  };

  const handleExportData = async () => {
    setIsDownloadingData(true);
    setDataExportError('');
    try {
      const payload = await exportData();
      const file = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      setDataExportError(t.dataDownloadError);
    } finally {
      setIsDownloadingData(false);
    }
  };

  const handleDeleteAccount = async (password) => {
    setIsDeletingAccount(true);
    setDeleteAccountError('');
    try {
      await deleteAccount(password);
      await onAccountDeleted();
    } catch (error) {
      setDeleteAccountError(error.status === 401 ? error.message : t.deleteAccountError);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const openDeleteAccountModal = () => {
    setDeleteAccountError('');
    setIsDeleteModalOpen(true);
  };

  const inputClass = `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 ${
    isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const mutedClass = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className={`text-xs font-black uppercase tracking-[0.18em] ${themeStyle.text}`}>{t.configuracoes}</p>
        <h2 className="mt-1 text-2xl font-black">{t.settingsTitle}</h2>
      </header>

      <div className={`rounded-2xl border p-2 ${cardClass}`} role="tablist" aria-label={t.settingsTitle}>
        {[
          ['account', t.tabAccount],
          ['preferences', t.tabPreferences]
        ].map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === tab ? themeStyle.btn : mutedClass}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'account' && (
        <div className={`rounded-2xl border p-5 md:p-6 ${cardClass}`}>
          <div className="mb-6">
            <h3 className="text-xl font-black">{t.accountTitle}</h3>
            <p className={`mt-1 text-sm ${mutedClass}`}>{t.accountSubtitle}</p>
          </div>

          <div className={`mb-6 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${isDarkMode ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
            <div>
              <p className={`text-xs font-bold ${mutedClass}`}>{t.planLabel}</p>
              <p className={`mt-1 text-lg font-black ${themeStyle.text}`}>
                {planStatus?.plan === 'pro'
                  ? t.proUnlimited
                  : planStatus?.plan === 'trial'
                    ? t.trialDaysRemaining.replace('{days}', String(Math.max(0, planStatus.daysRemaining || 0)))
                    : t.planUnavailable}
              </p>
            </div>
          </div>

          {planStatus?.plan !== 'pro' && (
            <div className={`rounded-xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
              <p className="font-bold">{t.paymentTitle}</p>
              <p className={`mt-1 text-sm ${mutedClass}`}>{t.paymentCheckoutNote}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <a
                  href={PLAN_LINKS.monthly}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition ${themeStyle.btn}`}
                >
                  {t.trialExpiredMonthly}
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
                <a
                  href={PLAN_LINKS.annual}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition ${
                    isDarkMode ? 'border-slate-700 text-slate-100 hover:bg-slate-800' : 'border-slate-300 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {t.trialExpiredAnnual}
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
              </div>
            </div>
          )}

          {import.meta.env.DEV && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* TODO: remover quando webhook estiver funcionando */}
              <button
                type="button"
                disabled={isActivatingTestPlan}
                onClick={handleActivateProTest}
                className={`rounded-lg px-4 py-2.5 text-sm font-bold text-white transition disabled:cursor-wait disabled:opacity-60 ${themeStyle.btn}`}
              >
                {isActivatingTestPlan ? t.testProActivating : t.activateProTest}
              </button>
              {testActivationMessage && (
                <span className={`text-sm font-semibold ${testActivationMessage === t.testProActivated ? themeStyle.text : 'text-rose-500'}`} role="status">
                  {testActivationMessage}
                </span>
              )}
            </div>
          )}

          <div className={`mt-4 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${isDarkMode ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
            <div>
              <p className="font-bold">{t.myDataTitle}</p>
              <p className={`mt-1 text-sm ${mutedClass}`}>{t.myDataSubtitle}</p>
              {dataExportError && <p className="mt-2 text-sm text-rose-500" role="alert">{dataExportError}</p>}
            </div>
            <button
              type="button"
              onClick={handleExportData}
              disabled={isDownloadingData}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-wait disabled:opacity-60 ${themeStyle.btn}`}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isDownloadingData ? t.dataDownloading : t.downloadMyData}
            </button>
          </div>

          <div className={`mt-4 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${isDarkMode ? 'border-rose-900/60 bg-rose-950/20' : 'border-rose-200 bg-rose-50'}`}>
            <div>
              <p className="font-bold text-rose-500">{t.deleteAccountSectionTitle}</p>
              <p className={`mt-1 text-sm ${mutedClass}`}>{t.deleteAccountWarning}</p>
            </div>
            <button
              type="button"
              onClick={openDeleteAccountModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t.deleteAccountButton}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className={`space-y-4 rounded-2xl border p-5 md:p-6 ${cardClass}`}>
          <h3 className="text-xl font-black">{t.prefTitle}</h3>
          <form onSubmit={handleSaveApiKey} className={`rounded-xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
            <div className="mb-3">
              <p className="font-bold">{t.brapiIntegrationTitle}</p>
              <p className={`text-sm ${mutedClass}`}>{t.dataIntegrationSubtitle}</p>
            </div>
            <div className="space-y-4">
              {[
                ['brapi', t.brapiApiKeyLabel, t.brapiApiKeyHint, brapiApiKey, setBrapiApiKey, showBrapiApiKey, setShowBrapiApiKey],
                ['coinGecko', t.coinGeckoApiKeyLabel, t.coinGeckoApiKeyHint, coinGeckoApiKey, setCoinGeckoApiKey, showCoinGeckoApiKey, setShowCoinGeckoApiKey]
              ].map(([provider, label, hint, value, setValue, isVisible, setIsVisible]) => (
                <label key={provider} className="block">
                  <span className="mb-1.5 block text-xs font-bold">{label} <span className={`font-normal ${mutedClass}`}>({hint})</span></span>
                <div className="relative">
                  <input
                    type={isVisible ? 'text' : 'password'}
                    value={value}
                    onChange={(event) => {
                      setValue(event.target.value);
                      setApiKeySaved(false);
                    }}
                    className={`${inputClass} pr-10`}
                    autoComplete="off"
                    placeholder={t.apiKeyPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setIsVisible((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                    aria-label={isVisible ? t.hideApiKey : t.showApiKey}
                    title={isVisible ? t.hideApiKey : t.showApiKey}
                  >
                    {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                </label>
              ))}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                {apiKeySaved && <span className={`mr-auto flex items-center gap-1.5 text-sm font-bold ${themeStyle.text}`}><Check className="h-4 w-4" />{t.apiKeysSaved}</span>}
                <button type="submit" className={`rounded-xl px-4 py-2.5 text-sm ${themeStyle.btn}`}>{t.saveBtn}</button>
              </div>
            </div>
          </form>
          <div className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${isDarkMode ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
            <div>
              <p className="font-bold">{t.languageLabel}</p>
              <p className={`text-sm ${mutedClass}`}>{lang === 'pt' ? 'Português (Brasil)' : 'English'}</p>
            </div>
            <div className="flex gap-1 rounded-lg bg-slate-800 p-1">
              {['pt', 'en'].map((option) => <button key={option} type="button" onClick={() => setLang(option)} className={`rounded-md px-3 py-1 text-xs font-black ${lang === option ? themeStyle.btn : 'text-slate-400'}`}>{option.toUpperCase()}</button>)}
            </div>
          </div>
          <div className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${isDarkMode ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
            <div><p className="font-bold">{t.themeLabel}</p><p className={`text-sm ${mutedClass}`}>{isDarkMode ? t.darkTheme : t.lightTheme}</p></div>
            <button type="button" onClick={() => setIsDarkMode((current) => !current)} className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white"><span aria-hidden="true">{isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</span>{isDarkMode ? t.lightTheme : t.darkTheme}</button>
          </div>
          <div className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${isDarkMode ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
            <div><p className="font-bold">{t.privacyLabel}</p><p className={`text-sm ${mutedClass}`}>{privacyMode ? t.active : t.inactive}</p></div>
            <button type="button" onClick={() => setPrivacyMode((current) => !current)} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${privacyMode ? themeStyle.btn : 'bg-slate-700 text-white'}`}><span aria-hidden="true">{privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</span>{privacyMode ? t.active : t.inactive}</button>
          </div>
        </div>
      )}

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        isDarkMode={isDarkMode}
        t={t}
        isLoading={isDeletingAccount}
        error={deleteAccountError}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </section>
  );
}
