import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteAccountModal({
  isOpen,
  isDarkMode,
  t,
  isLoading,
  error,
  onClose,
  onConfirm
}) {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isOpen) setPassword('');
  }, [isOpen]);

  if (!isOpen) return null;

  const panelClass = isDarkMode
    ? 'border-slate-700 bg-[#111827] text-slate-100'
    : 'border-slate-200 bg-white text-slate-900 shadow-xl';
  const inputClass = isDarkMode
    ? 'border-slate-700 bg-slate-900 text-white placeholder:text-slate-500'
    : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400';

  const handleSubmit = (event) => {
    event.preventDefault();
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="presentation">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 ${panelClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="delete-account-title" className="text-xl font-black">{t.deleteAccountTitle}</h2>
              <p className="mt-2 text-sm leading-6 opacity-80">{t.deleteAccountWarning}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-white"
            aria-label={t.close}
            title={t.close}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">{t.deleteAccountPasswordPrompt}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-rose-500 ${inputClass}`}
              autoComplete="current-password"
              autoFocus
              required
              disabled={isLoading}
            />
          </label>
          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-500" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={isLoading || !password}
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
            >
              {isLoading ? t.deleteAccountDeleting : t.deleteAccountConfirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
