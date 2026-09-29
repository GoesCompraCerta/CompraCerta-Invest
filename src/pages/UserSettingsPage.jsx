import React, { useState } from 'react';
import { Check, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { brapiApiKeyStorage, coinGeckoApiKeyStorage } from '../services/storageService';

export default function UserSettingsPage({
  t,
  lang,
  setLang,
  isDarkMode,
  setIsDarkMode,
  privacyMode,
  setPrivacyMode,
  themeStyle,
  cardClass
}) {
  const [activeTab, setActiveTab] = useState('account');
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showBrapiApiKey, setShowBrapiApiKey] = useState(false);
  const [showCoinGeckoApiKey, setShowCoinGeckoApiKey] = useState(false);
  const [brapiApiKey, setBrapiApiKey] = useState(() => brapiApiKeyStorage.get());
  const [coinGeckoApiKey, setCoinGeckoApiKey] = useState(() => coinGeckoApiKeyStorage.get());
  const [userData, setUserData] = useState({
    nomeCompleto: '',
    email: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    senha: '',
    statusPlano: 'free'
  });

  const formatDate = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;

    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }

    return formatted;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'dataNascimento') {
      setUserData((current) => ({ ...current, [name]: formatDate(value) }));
      setSaved(false);
      return;
    }

    setUserData((current) => ({ ...current, [name]: value }));
    setSaved(false);
  };

  const handleSave = (event) => {
    event.preventDefault();
    setIsEditing(false);
    setSaved(true);
  };

  const handleSaveApiKey = (event) => {
    event.preventDefault();
    brapiApiKeyStorage.set(brapiApiKey);
    coinGeckoApiKeyStorage.set(coinGeckoApiKey);
    setBrapiApiKey(brapiApiKeyStorage.get());
    setCoinGeckoApiKey(coinGeckoApiKeyStorage.get());
    setApiKeySaved(true);
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
                {userData.statusPlano === 'free' ? t.freePlan : t.proPlan}
              </p>
            </div>
            {userData.statusPlano === 'free' && (
              <button
                type="button"
                onClick={() => setUserData((current) => ({ ...current, statusPlano: 'pro' }))}
                className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition ${themeStyle.btn}`}
              >
                {t.upgradeBtn}
              </button>
            )}
          </div>

          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ['nomeCompleto', t.name, 'text'],
                ['email', t.email, 'email'],
                ['cpf', t.cpf, 'text'],
                ['telefone', t.phone, 'tel']
              ].map(([name, label, type]) => (
                <label key={name} className={name === 'nomeCompleto' ? 'md:col-span-2' : ''}>
                  <span className="mb-1.5 block text-xs font-bold">{label}</span>
                  <input
                    type={type}
                    name={name}
                    value={userData[name]}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={inputClass}
                  />
                </label>
              ))}

              <label>
                <span className="mb-1.5 block text-xs font-bold">{t.birthdate}</span>
                <input
                  type="text"
                  name="dataNascimento"
                  value={userData.dataNascimento}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                  placeholder=" "
                  aria-label={t.birthdate}
                  inputMode="numeric"
                  maxLength={10}
                />
              </label>

              <label className="md:col-span-2">
                <span className="mb-1.5 block text-xs font-bold">{t.password}</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="senha"
                    value={userData.senha}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {saved && <span className={`mr-auto flex items-center gap-1.5 text-sm font-bold ${themeStyle.text}`}><Check className="h-4 w-4" />{t.successMsg}</span>}
              {isEditing ? (
                <>
                  <button type="button" onClick={() => setIsEditing(false)} className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-600">{t.cancelBtn}</button>
                  <button type="submit" className={`rounded-xl px-4 py-2 text-sm ${themeStyle.btn}`}>{t.saveBtn}</button>
                </>
              ) : (
                <button type="button" onClick={() => { setIsEditing(true); setSaved(false); }} className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-600">{t.editBtn}</button>
              )}
            </div>
          </form>
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
    </section>
  );
}
