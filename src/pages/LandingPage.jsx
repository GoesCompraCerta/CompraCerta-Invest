import React from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Building2,
  Languages,
  Moon,
  PiggyBank,
  Scale,
  Sun,
  TrendingUp,
  Wallet
} from 'lucide-react';

const COPY = {
  pt: {
    signIn: 'Entrar',
    startFree: 'Começar grátis',
    eyebrow: 'INVESTIR COM MAIS CLAREZA',
    title: 'Acompanhe seus investimentos com clareza',
    subtitle: 'Uma visão organizada da sua carteira, comparativos de mercado e ferramentas para apoiar suas próprias decisões.',
    trialCta: 'Começar grátis (7 dias)',
    explore: 'Conheça os recursos',
    preview: 'VISÃO DE DEMONSTRAÇÃO',
    portfolio: 'Carteira acompanhada',
    invested: 'Investido',
    returnLabel: 'Variação no período',
    benchmark: 'Comparativo no período',
    featuresEyebrow: 'FERRAMENTAS PARA SUA ROTINA',
    featuresTitle: 'Do acompanhamento à análise, no seu ritmo.',
    features: [
      { title: 'Benchmark da Carteira', description: 'Compare a evolução da carteira com CDI, Poupança, IPCA e Ibovespa.', icon: BarChart3, color: 'text-sky-500', bg: 'bg-sky-500/10' },
      { title: 'Rebalanceamento', description: 'Visualize a alocação e saiba onde direcionar seus próximos aportes.', icon: Scale, color: 'text-amber-500', bg: 'bg-amber-500/10' },
      { title: 'Proventos', description: 'Acompanhe dividendos e rendimentos recebidos em um só lugar.', icon: PiggyBank, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { title: 'Métodos de Triagem', description: 'Explore critérios inspirados em Bazin, Lynch, Graham e Buffett.', icon: Building2, color: 'text-rose-500', bg: 'bg-rose-500/10' }
    ],
    pricingEyebrow: 'PLANOS SIMPLES',
    pricingTitle: 'Comece grátis. Continue no seu tempo.',
    pricingNote: '7 dias para conhecer as ferramentas. Depois, escolha seu plano PRO.',
    monthly: 'Mensal',
    annual: 'Anual',
    perMonth: '/mês',
    perYear: '/ano',
    save: 'Economize 20%',
    monthlyCta: 'Escolher plano mensal',
    annualCta: 'Escolher plano anual',
    footerNote: 'Ferramentas de acompanhamento para decisões mais conscientes.',
    terms: 'Termos de Uso',
    privacy: 'Política de Privacidade',
    contact: 'Contato',
    lightMode: 'Modo claro',
    darkMode: 'Modo escuro',
    chartLabel: 'Evolução ilustrativa da carteira'
  },
  en: {
    signIn: 'Sign in',
    startFree: 'Get started free',
    eyebrow: 'INVEST WITH MORE CLARITY',
    title: 'Track your investments with clarity',
    subtitle: 'An organized portfolio view, market comparisons, and tools to support your own decisions.',
    trialCta: 'Start free (7 days)',
    explore: 'Explore features',
    preview: 'SAMPLE OVERVIEW',
    portfolio: 'Portfolio overview',
    invested: 'Invested',
    returnLabel: 'Change over period',
    benchmark: 'Period comparison',
    featuresEyebrow: 'TOOLS FOR YOUR ROUTINE',
    featuresTitle: 'From tracking to analysis, at your pace.',
    features: [
      { title: 'Portfolio Benchmark', description: 'Compare portfolio performance with CDI, Savings, IPCA, and Ibovespa.', icon: BarChart3, color: 'text-sky-500', bg: 'bg-sky-500/10' },
      { title: 'Rebalancing', description: 'Review your allocation and decide where to direct your next contributions.', icon: Scale, color: 'text-amber-500', bg: 'bg-amber-500/10' },
      { title: 'Dividends', description: 'Track dividends and income received in one place.', icon: PiggyBank, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { title: 'Screening Methods', description: 'Explore criteria inspired by Bazin, Lynch, Graham, and Buffett.', icon: Building2, color: 'text-rose-500', bg: 'bg-rose-500/10' }
    ],
    pricingEyebrow: 'STRAIGHTFORWARD PLANS',
    pricingTitle: 'Start free. Continue at your own pace.',
    pricingNote: 'Seven days to explore the tools. Then choose your PRO plan.',
    monthly: 'Monthly',
    annual: 'Annual',
    perMonth: '/month',
    perYear: '/year',
    save: 'Save 20%',
    monthlyCta: 'Choose monthly plan',
    annualCta: 'Choose annual plan',
    footerNote: 'Tracking tools for more informed decisions.',
    terms: 'Terms of Use',
    privacy: 'Privacy Policy',
    contact: 'Contact',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    chartLabel: 'Illustrative portfolio performance'
  }
};

const CHART_BARS = [35, 44, 40, 51, 47, 57, 53, 68, 62, 73, 69, 84];

export default function LandingPage({ lang, setLang, isDarkMode, setIsDarkMode }) {
  const copy = COPY[lang] || COPY.pt;
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-600';
  const panelClass = isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-slate-200 bg-white';
  const background = isDarkMode ? 'bg-[#0b0f17] text-slate-100' : 'bg-[#f5f8f6] text-slate-900';

  return (
    <div className={`min-h-screen ${background}`}>
      <header className={`border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <nav className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8" aria-label="Main navigation">
          <a href="/" className="flex items-center gap-2.5" aria-label="CompraCerta-Invest home">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-slate-950"><TrendingUp className="h-5 w-5" aria-hidden="true" /></span>
            <span className="leading-tight"><span className="block text-sm font-black tracking-wide">COMPRACERTA</span><span className="text-[10px] font-bold text-emerald-500">INVEST</span></span>
          </a>
          <div className="flex items-center gap-1 sm:gap-2">
            <button type="button" onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')} className={`flex h-9 items-center gap-1.5 rounded-md px-2 text-xs font-bold ${textMuted} hover:bg-slate-500/10`} aria-label={lang === 'pt' ? 'Change language' : 'Alterar idioma'} title={lang === 'pt' ? 'Change language' : 'Alterar idioma'}><Languages className="h-4 w-4" />{lang.toUpperCase()}</button>
            <button type="button" onClick={() => setIsDarkMode((current) => !current)} className={`flex h-9 w-9 items-center justify-center rounded-md ${textMuted} hover:bg-slate-500/10`} aria-label={isDarkMode ? copy.lightMode : copy.darkMode} title={isDarkMode ? copy.lightMode : copy.darkMode}>{isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
            <a href="/login" className={`hidden rounded-md px-3 py-2 text-sm font-bold sm:inline-flex ${textMuted} hover:text-emerald-500`}>{copy.signIn}</a>
            <a href="/register" className="rounded-md bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-400 sm:px-4 sm:text-sm">{copy.startFree}</a>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 text-center sm:px-8 sm:pb-20 sm:pt-20">
          <p className="inline-flex items-center gap-2 text-xs font-black text-emerald-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{copy.eyebrow}</p>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-5xl md:text-6xl">{copy.title}</h1>
          <p className={`mx-auto mt-5 max-w-2xl text-base leading-7 sm:text-lg ${textMuted}`}>{copy.subtitle}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/register" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 sm:w-auto">{copy.trialCta}<ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
            <a href="#recursos" className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border px-6 py-3 text-sm font-bold transition sm:w-auto ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-white'}`}>{copy.explore}<ArrowDownRight className="h-4 w-4" aria-hidden="true" /></a>
          </div>

          <div className={`mx-auto mt-14 max-w-5xl overflow-hidden rounded-xl border text-left shadow-2xl ${panelClass}`}>
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 ${isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center gap-2 text-sm font-bold"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500"><Wallet className="h-4 w-4" aria-hidden="true" /></span>{copy.portfolio}</div>
              <span className={`text-[10px] font-black tracking-[0.14em] ${textMuted}`}>{copy.preview}</span>
            </div>
            <div className="grid gap-0 md:grid-cols-[1fr_1.4fr]">
              <div className={`grid grid-cols-2 gap-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div className={isDarkMode ? 'bg-[#111827] p-5 sm:p-6' : 'bg-white p-5 sm:p-6'}>
                  <p className={`text-xs ${textMuted}`}>{copy.invested}</p><p className="mt-2 text-2xl font-black">R$ 48.250</p><p className="mt-2 text-xs font-bold text-emerald-500">12 ativos</p>
                </div>
                <div className={isDarkMode ? 'bg-[#111827] p-5 sm:p-6' : 'bg-white p-5 sm:p-6'}>
                  <p className={`text-xs ${textMuted}`}>{copy.returnLabel}</p><p className="mt-2 text-2xl font-black text-emerald-500">+8,42%</p><p className={`mt-2 text-xs ${textMuted}`}>12 meses</p>
                </div>
                <div className={`col-span-2 p-5 sm:p-6 ${isDarkMode ? 'bg-[#111827]' : 'bg-white'}`}>
                  <div className="flex items-center justify-between gap-2"><p className="text-sm font-bold">{copy.chartLabel}</p><span className="rounded-sm bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-500">+8,42%</span></div>
                  <div className="mt-5 flex h-20 items-end gap-1.5" aria-hidden="true">
                    {CHART_BARS.map((height, index) => <span key={index} className={`flex-1 rounded-t-sm ${index === CHART_BARS.length - 1 ? 'bg-emerald-400' : 'bg-emerald-500/35'}`} style={{ height: `${height}%` }} />)}
                  </div>
                </div>
              </div>
              <div className={`p-5 sm:p-6 ${isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-2"><p className="text-sm font-bold">{copy.benchmark}</p><span className={`text-[10px] ${textMuted}`}>12M</span></div>
                <div className="mt-5 space-y-4">
                  {[
                    ['Sua carteira', '8,42%', 'bg-emerald-500', 'w-[84%]'],
                    ['Ibovespa', '6,18%', 'bg-sky-500', 'w-[62%]'],
                    ['CDI', '5,42%', 'bg-amber-500', 'w-[54%]'],
                    ['IPCA', '2,11%', 'bg-rose-400', 'w-[22%]']
                  ].map(([label, value, color, width]) => (
                    <div key={label}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className={textMuted}>{label}</span><span className="font-bold">{value}</span></div>
                      <div className={`h-1.5 overflow-hidden rounded-sm ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}><div className={`h-full rounded-sm ${color} ${width}`} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="recursos" className={`border-y py-16 sm:py-20 ${isDarkMode ? 'border-slate-800 bg-[#0e141e]' : 'border-slate-200 bg-white'}`}>
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="text-xs font-black tracking-[0.14em] text-emerald-500">{copy.featuresEyebrow}</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">{copy.featuresTitle}</h2>
            <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {copy.features.map(({ title, description, icon: Icon, color, bg }) => (
                <article key={title} className={`rounded-lg border p-5 ${panelClass}`}>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-md ${color} ${bg}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <h3 className="mt-5 text-base font-black">{title}</h3>
                  <p className={`mt-2 text-sm leading-6 ${textMuted}`}>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-xs font-black tracking-[0.14em] text-emerald-500">{copy.pricingEyebrow}</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">{copy.pricingTitle}</h2></div>
            <p className={`max-w-md text-sm leading-6 ${textMuted}`}>{copy.pricingNote}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className={`rounded-lg border p-6 sm:p-7 ${panelClass}`}>
              <h3 className="text-sm font-bold">{copy.monthly}</h3>
              <p className="mt-5 text-4xl font-black">R$ 19,99<span className={`ml-1 text-sm font-semibold ${textMuted}`}>{copy.perMonth}</span></p>
              <a href="/register" className={`mt-6 flex min-h-11 items-center justify-center rounded-md border px-4 py-2.5 text-sm font-bold transition ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-50'}`}>{copy.monthlyCta}</a>
            </article>
            <article className="relative rounded-lg border border-emerald-500/50 bg-emerald-500/[0.06] p-6 sm:p-7">
              <span className="absolute right-5 top-5 rounded-sm bg-emerald-500 px-2 py-1 text-[10px] font-black text-slate-950">{copy.save}</span>
              <h3 className="text-sm font-bold">{copy.annual}</h3>
              <p className="mt-5 text-4xl font-black">R$ 191,88<span className={`ml-1 text-sm font-semibold ${textMuted}`}>{copy.perYear}</span></p>
              <a href="/register" className="mt-6 flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-emerald-400">{copy.annualCta}<ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
            </article>
          </div>
        </section>
      </main>

      <footer className={`border-t ${isDarkMode ? 'border-slate-800 bg-[#090d14]' : 'border-slate-200 bg-white'}`}>
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div><p className="text-sm font-black">COMPRACERTA<span className="text-emerald-500">-INVEST</span></p><p className={`mt-1 text-xs ${textMuted}`}>{copy.footerNote}</p></div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold">
            <a href="/terms" className={`${textMuted} hover:text-emerald-500`}>{copy.terms}</a>
            <a href="/privacy" className={`${textMuted} hover:text-emerald-500`}>{copy.privacy}</a>
            <a href="mailto:goescompracerta@hotmail.com" className={`${textMuted} hover:text-emerald-500`}>{copy.contact}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
