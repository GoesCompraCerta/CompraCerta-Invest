import React, { useState } from 'react';
import { Eye, EyeOff, Languages, Moon, Sun, TrendingUp } from 'lucide-react';
import { register } from '../services/authService';

const getPasswordStrength = (password) => {
  if (password.length < 8) return 0;
  return [/[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)]
    .filter(Boolean).length;
};

const friendlyError = (error, t) => {
  if (error.status === 400 && /cadastrad|already exists|already registered/i.test(error.message)) return t.authEmailTaken;
  if (error.status === 0 || error instanceof TypeError) return t.authNetworkError;
  return error.message || t.authGenericError;
};

export default function RegisterPage({ t, lang, setLang, isDarkMode, setIsDarkMode, onAuthenticated, navigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const strength = getPasswordStrength(password);
  const strengthLabel = strength < 2 ? t.authStrengthWeak : strength < 4 ? t.authStrengthMedium : t.authStrengthStrong;
  const strengthColor = strength < 2 ? 'bg-rose-500' : strength < 4 ? 'bg-amber-500' : 'bg-emerald-500';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError(t.authNameShort);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.authInvalidEmail);
      return;
    }
    if (password.length < 8) {
      setError(t.authPasswordShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.authPasswordMismatch);
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
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
        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-slate-950"><TrendingUp className="h-5 w-5" /></span>
            <div><p className="text-sm font-black tracking-wide">COMPRACERTA</p><p className="text-[10px] font-bold text-emerald-500">INVEST</p></div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')} className="rounded-md p-2 text-slate-500 hover:bg-slate-500/10" aria-label={t.authChangeLanguage} title={t.authChangeLanguage}><Languages className="h-4 w-4" /><span className="sr-only">{lang.toUpperCase()}</span></button>
            <button type="button" onClick={() => setIsDarkMode((current) => !current)} className="rounded-md p-2 text-slate-500 hover:bg-slate-500/10" aria-label={isDarkMode ? t.lightTheme : t.darkTheme} title={isDarkMode ? t.lightTheme : t.darkTheme}>{isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          </div>
        </div>

        <h1 className="text-2xl font-black">{t.authRegisterTitle}</h1>
        <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.authRegisterSubtitle}</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">{t.authFullName}</span>
            <input className={fieldClass} type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">{t.email}</span>
            <input className={fieldClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">{t.password}</span>
            <span className="relative block">
              <input className={`${fieldClass} pr-11`} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-emerald-500" aria-label={showPassword ? t.authHidePassword : t.authShowPassword}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </span>
            <span className="mt-2 flex items-center gap-2" aria-live="polite">
              <span className={`h-1.5 flex-1 rounded-full ${password ? strengthColor : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
              <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{password ? strengthLabel : t.authPasswordStrength}</span>
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">{t.authConfirmPassword}</span>
            <span className="relative block">
              <input className={`${fieldClass} pr-11`} type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required />
              <button type="button" onClick={() => setShowConfirmation((current) => !current)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-emerald-500" aria-label={showConfirmation ? t.authHidePassword : t.authShowPassword}>{showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </span>
          </label>
          {error && <p role="alert" className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-500">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60">{isLoading ? t.authCreatingAccount : t.authCreateAccount}</button>
        </form>
        <p className={`mt-5 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.authHaveAccount}{' '}<button type="button" onClick={() => navigate('/login')} className="font-bold text-emerald-600 hover:text-emerald-500">{t.authLoginLink}</button></p>
      </section>
    </main>
    </div>
  );
}
