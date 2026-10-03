import React from 'react';
import { Moon, Sun } from 'lucide-react';

export default function LegalDocumentLayout({
  children,
  isDarkMode = true,
  setIsDarkMode = () => {},
  lang = 'pt',
  setLang = () => {}
}) {
  return (
    <main className={`min-h-screen px-5 py-10 ${isDarkMode ? 'bg-[#0b0f17] text-slate-100' : 'bg-[#f7f8fa] text-slate-900'}`}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex justify-end">
          <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-slate-500/30 p-0.5" role="group" aria-label={lang === 'pt' ? 'Idioma' : 'Language'}>
            {['pt', 'en'].map((language) => (
              <button
                key={language}
                type="button"
                aria-pressed={lang === language}
                onClick={() => setLang(language)}
                className={`rounded px-2 py-1 text-xs font-bold ${lang === language ? 'bg-emerald-500 text-slate-950' : 'opacity-70'}`}
              >
                {language.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIsDarkMode((current) => !current)}
            aria-label={isDarkMode ? (lang === 'pt' ? 'Modo Claro' : 'Light mode') : (lang === 'pt' ? 'Modo Escuro' : 'Dark mode')}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-500/30"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          </div>
        </div>
        <article className="space-y-6">
          {children}
        </article>
      </div>
    </main>
  );
}
