import React from 'react';
import { Clock3, ExternalLink, LogOut, Moon, Sun } from 'lucide-react';

const PLAN_LINKS = {
  monthly: 'https://mpago.la/2WfrFAf',
  annual: 'https://mpago.la/2N8oay5'
};

export default function TrialExpiredPage({ t, lang, setLang, isDarkMode, setIsDarkMode, onLogout }) {
  const foreground = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-600';

  return (
    <main className={`min-h-screen px-5 py-6 ${foreground} ${isDarkMode ? 'bg-[#0b0f17]' : 'bg-[#f7f8fa]'}`}>
      <header className="mx-auto flex max-w-5xl items-center justify-end gap-2">
        <div className={`flex items-center rounded-md border p-0.5 ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`} role="group" aria-label={t.authChangeLanguage}>
          {['pt', 'en'].map((language) => (
            <button
              key={language}
              type="button"
              aria-pressed={lang === language}
              onClick={() => setLang(language)}
              className={`rounded px-2 py-1 text-xs font-bold ${lang === language ? 'bg-emerald-500 text-slate-950' : muted}`}
            >
              {language.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIsDarkMode((current) => !current)}
          aria-label={isDarkMode ? t.lightTheme : t.darkTheme}
          title={isDarkMode ? t.lightTheme : t.darkTheme}
          className={`flex h-8 w-8 items-center justify-center rounded-md border ${isDarkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'}`}
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-500">
          <Clock3 className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-black sm:text-3xl">{t.trialExpiredTitle}</h1>
        <p className={`mt-3 max-w-md text-sm leading-6 ${muted}`}>{t.trialExpiredMessage}</p>

        <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
          <a
            href={PLAN_LINKS.monthly}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            {t.trialExpiredMonthly}
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          </a>
          <a
            href={PLAN_LINKS.annual}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex min-h-12 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition ${
              isDarkMode ? 'border-slate-700 text-slate-100 hover:bg-slate-800' : 'border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            {t.trialExpiredAnnual}
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className={`mt-6 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${muted} hover:text-rose-500`}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t.authLogout}
        </button>
      </section>
    </main>
  );
}
