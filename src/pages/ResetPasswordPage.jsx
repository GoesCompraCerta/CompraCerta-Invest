import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Languages, LoaderCircle, Moon, Sun, TrendingUp } from 'lucide-react';
import { resetPassword } from '../services/authService';

const getPasswordStrength = (password) => {
  if (password.length < 8) return 0;
  return [/[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)]
    .filter(Boolean).length;
};

export default function ResetPasswordPage({ t, lang, setLang, isDarkMode, setIsDarkMode, navigate }) {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const strength = getPasswordStrength(password);
  const strengthLabel = strength < 2 ? t.authStrengthWeak : strength < 4 ? t.authStrengthMedium : t.authStrengthStrong;
  const strengthColor = strength < 2 ? 'bg-rose-500' : strength < 4 ? 'bg-amber-500' : 'bg-emerald-500';
  const fieldClass = `w-full rounded-lg border px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white placeholder:text-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'}`;

  useEffect(() => {
    if (!isSuccess) return undefined;
    const timeoutId = window.setTimeout(() => navigate('/login'), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [isSuccess, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!token) {
      setError(t.resetPasswordMissingToken);
      return;
    }
    if (password.length < 8) {
      setError(t.authPasswordShort);
      return;
    }
    if (password !== confirmation) {
      setError(t.authPasswordMismatch);
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setIsSuccess(true);
    } catch (requestError) {
      setError(requestError.status === 400 ? t.resetPasswordInvalidToken : t.authGenericError);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordField = (id, label, value, onChange, visible, setVisible, autoComplete) => (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-xs font-bold">{label}</span>
      <span className="relative block">
        <input id={id} className={`${fieldClass} pr-11`} type={visible ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} minLength={8} required disabled={isLoading} />
        <button type="button" onClick={() => setVisible((current) => !current)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-emerald-500" aria-label={visible ? t.authHidePassword : t.authShowPassword} title={visible ? t.authHidePassword : t.authShowPassword}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
      </span>
    </label>
  );

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

          <h1 className="text-2xl font-black">{t.resetPasswordTitle}</h1>
          <p className={`mt-2 text-sm leading-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.resetPasswordSubtitle}</p>

          {!token && !isSuccess && <p className="mt-5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-500" role="alert">{t.resetPasswordMissingToken}</p>}
          {isSuccess ? (
            <div className="mt-6 space-y-5">
              <p className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3 text-sm leading-6 text-emerald-500" role="status"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{t.resetPasswordSuccess}</p>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.resetPasswordRedirecting}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {renderPasswordField('new-password', t.resetPasswordNew, password, setPassword, showPassword, setShowPassword, 'new-password')}
              <div className="flex items-center gap-2" aria-live="polite">
                <span className={`h-1.5 flex-1 rounded-full ${password ? strengthColor : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{password ? strengthLabel : t.authPasswordStrength}</span>
              </div>
              {renderPasswordField('confirm-password', t.resetPasswordConfirm, confirmation, setConfirmation, showConfirmation, setShowConfirmation, 'new-password')}
              {error && <p role="alert" className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-500">{error}</p>}
              <button type="submit" disabled={isLoading || !token} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60">
                {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isLoading ? t.resetPasswordSaving : t.resetPasswordSubmit}
              </button>
            </form>
          )}

          <p className={`mt-6 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <button type="button" onClick={() => navigate('/login')} className="inline-flex items-center gap-2 font-bold text-emerald-600 hover:text-emerald-500"><ArrowLeft className="h-4 w-4" />{t.forgotPasswordBackToLogin}</button>
          </p>
        </section>
      </main>
    </div>
  );
}
