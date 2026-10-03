import React, { useState } from 'react';
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function Sidebar({
  t,
  navItems,
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  themeStyle,
  privacyMode,
  setPrivacyMode,
  lang,
  setLang,
  planStatus,
  onLogout
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const showSidebarLabels = isExpanded;

  return (
    <aside
      className={`sidebar relative transition-all duration-300 shrink-0 border-r p-3 md:p-4 flex flex-col justify-between ${
        isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-[#fdfefc] border-[#bbf7d0]'
      } ${isExpanded ? 'w-full md:w-64' : 'collapsed w-full md:w-[90px]'}`}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-3 ${!isExpanded ? 'justify-center w-full' : ''}`}>
            <div className={`p-2.5 rounded-xl ${themeStyle.btn}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            {showSidebarLabels && (
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-white text-sm shadow-sm">
                    G
                  </div>
                  <h1 className="font-black text-base tracking-tight leading-none">
                    {t.appName}
                  </h1>
                </div>
                <span className={`text-xs font-bold ${themeStyle.text}`}>{t.appSub}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`sidebar-toggle btn-recolher absolute right-0 top-0 z-10 flex h-6 w-6 shrink-0 items-center justify-center border-0 bg-transparent p-0 shadow-none ${
              isDarkMode
                ? 'text-slate-300 hover:text-slate-100'
                : 'text-slate-700 hover:text-slate-900'
            }`}
            aria-label={isExpanded ? 'Recolher sidebar' : 'Expandir sidebar'}
          >
            {isExpanded ? (
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={3.25} />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={3.25} />
            )}
          </button>
        </div>

        {planStatus && (
          <div className={`rounded-lg border px-3 py-2 text-xs font-bold ${
            isDarkMode
              ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}>
            {planStatus.plan === 'pro'
              ? t.planProBadge
              : t.trialDaysRemaining.replace('{days}', String(planStatus.daysRemaining))}
          </div>
        )}

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? themeStyle.btn
                    : isDarkMode
                      ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      : 'text-slate-600 hover:bg-slate-100'
                } ${!isExpanded ? 'justify-center px-2' : ''}`}
                title={!isExpanded ? item.label : ''}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {showSidebarLabels && <span className="span-texto-menu">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('configuracoes')}
            className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'configuracoes'
                ? themeStyle.btn
                : isDarkMode
                  ? 'text-slate-300 hover:bg-slate-800/60'
                  : 'text-slate-700 hover:bg-slate-100'
            } ${!isExpanded ? 'justify-center px-2' : ''}`}
            title={!isExpanded ? t.configuracoes : ''}
            aria-label={t.configuracoes}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {showSidebarLabels && <span>{t.configuracoes}</span>}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className={`mt-1 w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-xs font-bold transition-all ${
              isDarkMode
                ? 'text-slate-300 hover:bg-rose-500/10 hover:text-rose-300'
                : 'text-slate-700 hover:bg-rose-50 hover:text-rose-700'
            } ${!isExpanded ? 'justify-center px-2' : ''}`}
            title={!isExpanded ? t.authLogout : ''}
            aria-label={t.authLogout}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {showSidebarLabels && <span>{t.authLogout}</span>}
          </button>
          <div className={`mt-3 space-y-1 border-t pt-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <a
              href="/privacy"
              title={!isExpanded ? (lang === 'pt' ? 'Política de Privacidade' : 'Privacy Policy') : undefined}
              aria-label={lang === 'pt' ? 'Política de Privacidade' : 'Privacy Policy'}
              className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-[11px] font-semibold ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              {showSidebarLabels && <span>{lang === 'pt' ? 'Política de Privacidade' : 'Privacy Policy'}</span>}
            </a>
            <a
              href="/terms"
              title={!isExpanded ? (lang === 'pt' ? 'Termos de Uso' : 'Terms of Use') : undefined}
              aria-label={lang === 'pt' ? 'Termos de Uso' : 'Terms of Use'}
              className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-[11px] font-semibold ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
              {showSidebarLabels && <span>{lang === 'pt' ? 'Termos de Uso' : 'Terms of Use'}</span>}
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
