import React, { useState } from 'react';
import { Eye, EyeOff, Languages, Moon, Sun, TrendingUp } from 'lucide-react';
import { login } from '../services/authService';

const friendlyError = (error, t) => {
  if (error.status === 401) return t.authInvalidCredentials;
  if (error.status === 0 || error instanceof TypeError) return t.authNetworkError;
  return error.message || t.authGenericError;
};

export default function LoginPage({ t, lang, setLang, isDarkMode, setIsDarkMode, onAuthenticated, navigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.authInvalidEmail);
      return;
    }
    if (password.length < 8) {
      setError(t.authPasswordShort);
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      onAuthenticated();
    } catch (requestError) {
      setError(friendlyError(requestError, t));
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = `w-full rounded-lg border px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white placeholder:text-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'}`;

  return (
    <div className={isDarkMode ? 'dark-theme' : 'light-theme'}>
    <main className={`min-h-screen flex items-center justify-center px-4 py-8 ${isDarkMode ? 'bg-[#0b0f17] text-slate-100' : 'bg-[#f4f7f5] text-slate-900'}`}>
      <section className={`w-full max-w-md border p-6 sm:p-8 ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-slate-200 bg-white shadow-sm'}`}>
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-slate-950"><TrendingUp className="h-5 w-5" /></span>
            <div><p className="text-sm font-black tracking-wide">COMPRACERTA</p><p className="text-[10px] font-bold text-emerald-500">INVEST</p></div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')} className="rounded-md p-2 text-slate-500 hover:bg-slate-500/10" aria-label={t.authChangeLanguage} title={t.authChangeLanguage}><Languages className="h-4 w-4" /><span className="sr-only">{lang.toUpperCase()}</span></button>
            <button type="button" onClick={() => setIsDarkMode((current) => !current)} className="rounded-md p-2 text-slate-500 hover:bg-slate-500/10" aria-label={isDarkMode ? t.lightTheme : t.darkTheme} title={isDarkMode ? t.lightTheme : t.darkTheme}>{isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          </div>
        </div>

        <h1 className="text-2xl font-black">{t.authLoginTitle}</h1>
        <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.authLoginSubtitle}</p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">{t.email}</span>
            <input className={fieldClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">{t.password}</span>
            <span className="relative block">
              <input className={`${fieldClass} pr-11`} type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-emerald-500" aria-label={showPassword ? t.authHidePassword : t.authShowPassword}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </span>
            <span className="mt-2 flex justify-end">
              <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs font-semibold text-emerald-500 hover:text-emerald-400">{t.forgotPasswordLink}</button>
            </span>
          </label>
          {error && <p role="alert" className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-500">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60">{isLoading ? t.authSigningIn : t.authSignIn}</button>
        </form>
        <p className={`mt-6 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.authNoAccount}{' '}<button type="button" onClick={() => navigate('/register')} className="font-bold text-emerald-600 hover:text-emerald-500">{t.authRegisterLink}</button></p>
      </section>
    </main>
    </div>
  );
}
