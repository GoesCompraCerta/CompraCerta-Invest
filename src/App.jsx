import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Wallet,
  Scale,
  PiggyBank,
  Calculator,
  BarChart3,
  Building2,
  Settings
} from 'lucide-react';

// Imports
import Sidebar from './components/Layout/Sidebar';
import OpeningIntro from './components/Layout/OpeningIntro';
import KPICards from './components/Common/KPICards';
import DashboardPage from './pages/DashboardPage';
import PortfolioPage from './pages/PortfolioPage';
import RebalancerPage from './pages/RebalancerPage';
import ProventosPage from './pages/ProventosPage';
import CompoundInterestPage from './pages/CompoundInterestPage';
import MasterMethodsPage from './pages/MasterMethodsPage';
import TresMosqueteirosFIIPage from './pages/TresMosqueteirosFII/TresMosqueteirosFIIPage';
import UserSettingsPage from './pages/UserSettingsPage';
import TrialExpiredPage from './pages/TrialExpiredPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/Common/ProtectedRoute';

// Hooks
import { useAssets } from './hooks/useAssets';
import { useProventos } from './hooks/useProventos';
import { useTheme } from './hooks/useTheme';
import { useUpdateQuotes } from './hooks/useUpdateQuotes';

// Services
import { calculatePortfolioTotals } from './services/calculationService';

// Constants & Utils
import { TRANSLATIONS } from './constants/translations';
import * as authService from './services/authService';

// ═════════════════════════════════════════════════════════════════════════════
// Main App Component
// ═════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [showOpeningIntro, setShowOpeningIntro] = useState(true);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());
  const [isAuthChecking, setIsAuthChecking] = useState(() => authService.isAuthenticated());
  const [planStatus, setPlanStatus] = useState(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  const navigateTo = useCallback((path) => {
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setPathname(path);
  }, []);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!authService.isAuthenticated()) {
      setIsAuthenticated(false);
      setPlanStatus(null);
      setIsTrialExpired(false);
      setIsAuthChecking(false);
      return () => { isMounted = false; };
    }

    authService.getMe()
      .then(async () => {
        let status = null;
        try {
          status = await authService.getPlanStatus();
        } catch (error) {
          if (error.status === 401) throw error;
        }
        if (isMounted) {
          setPlanStatus(status);
          const trialExpired = status?.plan === 'trial' && status.daysRemaining <= 0;
          setIsTrialExpired(trialExpired);
          setIsAuthenticated(true);
          if (trialExpired) navigateTo('/trial-expired');
          else if (pathname === '/trial-expired') navigateTo('/');
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAuthenticated(false);
          setIsTrialExpired(false);
        }
      })
      .finally(() => { if (isMounted) setIsAuthChecking(false); });

    return () => { isMounted = false; };
  }, [navigateTo, pathname]);

  // ── State management with hooks ──
  const {
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
    isLoading: assetsLoading,
    error: assetsError,
    refreshAssets,
    clearAssets
  } = useAssets();
  const { proventos, setProventos, addProvento, updateProvento, deleteProvento } = useProventos();
  const {
    lang,
    setLang,
    isDarkMode,
    setIsDarkMode,
    privacyMode,
    setPrivacyMode,
    themeColor,
    setThemeColor,
    formatMoney,
    themeStyle,
    cardClass
  } = useTheme();
  const { updatingAssetId, updateMsg, handleUpdateAsset } = useUpdateQuotes();

  // ── UI State ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pieRadiusLevel, setPieRadiusLevel] = useState(1);
  const [novoAporte, setNovoAporte] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Compound interest state ──────────────────────────────────────────────
  const [jcInicial, setJcInicial] = useState('1000');
  const [jcAporte, setJcAporte] = useState('1000');
  const [jcTempoAnos, setJcTempoAnos] = useState('10');
  const [jcTaxaMensal, setJcTaxaMensal] = useState('0.85');
  const [jcMetaRenda, setJcMetaRenda] = useState('5000');
  const [jcInflacaoAnual, setJcInflacaoAnual] = useState('4.5');

  // ── Translations ─────────────────────────────────────────────────────────
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (!isAuthChecking && isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      navigateTo('/');
    }
  }, [isAuthChecking, isAuthenticated, pathname, navigateTo]);

  const handleAuthenticated = async () => {
    setIsAuthChecking(true);
    setIsAuthenticated(true);
    setShowOpeningIntro(true);
    refreshAssets();
    let trialExpired = false;
    try {
      const status = await authService.getPlanStatus();
      setPlanStatus(status);
      trialExpired = status?.plan === 'trial' && status.daysRemaining <= 0;
      setIsTrialExpired(trialExpired);
      setShowOpeningIntro(!trialExpired);
    } catch {
      setPlanStatus(null);
      setIsTrialExpired(false);
    } finally {
      setIsAuthChecking(false);
      navigateTo(isTrialExpired ? '/trial-expired' : '/');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      authService.removeToken();
    }
    setIsAuthenticated(false);
    setPlanStatus(null);
    setIsTrialExpired(false);
    clearAssets();
    setShowOpeningIntro(false);
    navigateTo('/login');
  };

  // ── Memoized calculations ────────────────────────────────────────────────
  const totals = useMemo(
    () => calculatePortfolioTotals(assets, proventos),
    [assets, proventos]
  );

  // ── Navigation items ────────────────────────────────────────────────────
  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'carteira', label: t.carteira, icon: Wallet },
    { id: 'rebalanceador', label: t.rebalanceador, icon: Scale },
    { id: 'proventos', label: t.proventos, icon: PiggyBank },
    { id: 'jurosCompostos', label: t.jurosCompostos, icon: Calculator },
    { id: 'metodos', label: t.metodosMestres, icon: BarChart3 },
    { id: 'tresMosqueteirosFiis', label: t.tresMosqueteirosFiis, icon: Building2 }
  ];

  if (isAuthChecking) {
    return (
      <div className={`flex min-h-screen items-center justify-center text-sm ${isDarkMode ? 'bg-[#0b0f17] text-slate-300' : 'bg-[#f4f7f5] text-slate-600'}`}>
        {t.authLoadingSession}
      </div>
    );
  }

  if (isAuthenticated && isTrialExpired) {
    return (
      <TrialExpiredPage
        t={t}
        lang={lang}
        setLang={setLang}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onLogout={handleLogout}
      />
    );
  }

  if (!isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    const AuthPage = pathname === '/register' ? RegisterPage : LoginPage;
    return (
      <AuthPage
        t={t}
        lang={lang}
        setLang={setLang}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onAuthenticated={handleAuthenticated}
        navigate={navigateTo}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <>
      {showOpeningIntro && <OpeningIntro onFinish={() => setShowOpeningIntro(false)} />}
      <ProtectedRoute
        isAuthenticated={isAuthenticated}
        isLoading={isAuthChecking}
        onRedirect={() => navigateTo('/login')}
      >
      <div
        className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-200 ${
          isDarkMode ? 'dark-theme bg-[#0b0f17] text-slate-100' : 'light-theme bg-[#f7f8fa] text-slate-900'
        }`}
      >
      {/* ── Sidebar ── */}
      <Sidebar
        t={t}
        navItems={navItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        themeStyle={themeStyle}
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
        lang={lang}
        setLang={setLang}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onLogout={handleLogout}
        planStatus={planStatus}
      />

      {/* ── Main content ── */}
      <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto">
        {activeTab !== 'configuracoes' && (
          <KPICards
            totals={totals}
            formatMoney={formatMoney}
            themeStyle={themeStyle}
            cardClass={cardClass}
            t={t}
            privacyMode={privacyMode}
            setPrivacyMode={setPrivacyMode}
          />
        )}

        {/* ── Dashboard ── */}
        {activeTab === 'dashboard' && (
          <DashboardPage
            totals={totals}
            formatMoney={formatMoney}
            themeStyle={themeStyle}
            cardClass={cardClass}
            isDarkMode={isDarkMode}
            pieRadiusLevel={pieRadiusLevel}
            setPieRadiusLevel={setPieRadiusLevel}
            privacyMode={privacyMode}
            setPrivacyMode={setPrivacyMode}
            t={t}
          />
        )}

        {/* ── Carteira ── */}
        {activeTab === 'carteira' && (
          <PortfolioPage
            totals={totals}
            formatMoney={formatMoney}
            themeStyle={themeStyle}
            cardClass={cardClass}
            t={t}
            proventos={proventos}
            onAddAsset={addAsset}
            onUpdateAsset={updateAsset}
            onDeleteAsset={deleteAsset}
            assetsLoading={assetsLoading}
            assetsError={assetsError}
            onUpdateQuote={(asset, onSuccess) => handleUpdateAsset(asset, t, onSuccess)}
            updatingAssetId={updatingAssetId}
            updateMsg={updateMsg}
          />
        )}

        {/* ── Rebalanceador ── */}
        {activeTab === 'rebalanceador' && (
          <RebalancerPage
            totals={totals}
            formatMoney={formatMoney}
            themeStyle={themeStyle}
            cardClass={cardClass}
            t={t}
            modoPrivacidade={privacyMode}
            novoAporte={novoAporte}
            setNovoAporte={setNovoAporte}
          />
        )}

        {/* ── Proventos ── */}
        {activeTab === 'proventos' && (
          <ProventosPage
            proventos={proventos}
            formatMoney={formatMoney}
            themeStyle={themeStyle}
            cardClass={cardClass}
            t={t}
            onAddProvento={addProvento}
            onUpdateProvento={updateProvento}
            onDeleteProvento={deleteProvento}
          />
        )}

        {/* ── Simulador da Liberdade ── */}
        {activeTab === 'jurosCompostos' && (
          <CompoundInterestPage
            formatMoney={formatMoney}
            themeStyle={themeStyle}
            cardClass={cardClass}
            isDarkMode={isDarkMode}
            t={t}
            jcInicial={jcInicial}
            setJcInicial={setJcInicial}
            jcAporte={jcAporte}
            setJcAporte={setJcAporte}
            jcTempoAnos={jcTempoAnos}
            setJcTempoAnos={setJcTempoAnos}
            jcTaxaMensal={jcTaxaMensal}
            setJcTaxaMensal={setJcTaxaMensal}
            jcMetaRenda={jcMetaRenda}
            setJcMetaRenda={setJcMetaRenda}
            jcInflacaoAnual={jcInflacaoAnual}
            setJcInflacaoAnual={setJcInflacaoAnual}
          />
        )}

        {/* ── Métodos Mestres ── */}
        {activeTab === 'metodos' && (
          <MasterMethodsPage
            assets={assets}
            formatMoney={formatMoney}
            themeStyle={themeStyle}
            cardClass={cardClass}
            isDarkMode={isDarkMode}
            t={t}
          />
        )}

        {activeTab === 'tresMosqueteirosFiis' && (
          <TresMosqueteirosFIIPage
            assets={assets}
            formatMoney={formatMoney}
            themeStyle={themeStyle}
            cardClass={cardClass}
            isDarkMode={isDarkMode}
            t={t}
          />
        )}

        {activeTab === 'configuracoes' && (
          <UserSettingsPage
            t={t}
            planStatus={planStatus}
            setPlanStatus={setPlanStatus}
            lang={lang}
            setLang={setLang}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            privacyMode={privacyMode}
            setPrivacyMode={setPrivacyMode}
            themeStyle={themeStyle}
            cardClass={cardClass}
          />
        )}

      </main>
      </div>
      </ProtectedRoute>
    </>
  );
}
