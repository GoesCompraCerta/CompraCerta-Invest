import React, { useState } from 'react';
import { ArrowLeft, Languages, LoaderCircle, Mail, Moon, Sun, TrendingUp } from 'lucide-react';
import { requestPasswordReset } from '../services/authService';

export default function ForgotPasswordPage({ t, lang, setLang, isDarkMode, setIsDarkMode, navigate }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const fieldClass = `w-full rounded-lg border py-3 pl-10 pr-3.5 text-sm outline-none transition focus:border-emerald-500 ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white placeholder:text-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setIsSubmitted(true);
    } catch {
      setError(t.authNetworkError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isDarkMode ? 'dark-theme' : 'light-theme'}>
      <main className={`flex min-h-screen items-center justify-center px-4 py-8 ${isDarkMode ? 'bg-[#0b0f17] text-slate-100' : 'bg-[#f4f7f5] text-slate-900'}`}>
        <section className={`w-full max-w-md border p-6 sm:p-8 ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-slate-200 bg-white shadow-sm'}`}>
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-slate-950"><TrendingUp className="h-5 w-5" aria-hidden="true" /></span>
              <div><p className="text-sm font-black">COMPRACERTA</p><p className="text-[10px] font-bold text-emerald-500">INVEST</p></div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')} className="rounded-md p-2 text-slate-500 hover:bg-slate-500/10" aria-label={t.authChangeLanguage} title={t.authChangeLanguage}><Languages className="h-4 w-4" /></button>
              <button type="button" onClick={() => setIsDarkMode((current) => !current)} className="rounded-md p-2 text-slate-500 hover:bg-slate-500/10" aria-label={isDarkMode ? t.lightTheme : t.darkTheme} title={isDarkMode ? t.lightTheme : t.darkTheme}>{isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
            </div>
          </div>

          <h1 className="text-2xl font-black">{t.forgotPasswordTitle}</h1>
          <p className={`mt-2 text-sm leading-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.forgotPasswordSubtitle}</p>

          {isSubmitted ? (
            <div className="mt-6 space-y-5">
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3 text-sm leading-6 text-emerald-500" role="status">{t.forgotPasswordSuccess}</p>
              <button type="button" onClick={() => navigate('/login')} className="inline-flex items-center gap-2 text-sm font-bold text-emerald-500 hover:text-emerald-400"><ArrowLeft className="h-4 w-4" />{t.forgotPasswordBackToLogin}</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">{t.email}</span>
                <span className="relative block">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  <input className={fieldClass} type="email" autoComplete="email" placeholder="nome@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </span>
              </label>
              {error && <p role="alert" className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-500">{error}</p>}
              <button type="submit" disabled={isLoading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60">
                {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isLoading ? t.forgotPasswordSending : t.forgotPasswordSendLink}
              </button>
            </form>
          )}

          <p className={`mt-6 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {t.forgotPasswordRemember}{' '}
            <button type="button" onClick={() => navigate('/login')} className="font-bold text-emerald-600 hover:text-emerald-500">{t.forgotPasswordBackToLogin}</button>
          </p>
        </section>
      </main>
    </div>
  );
}
