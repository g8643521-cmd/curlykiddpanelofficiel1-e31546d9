import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import UnifiedSearch from "@/components/UnifiedSearch";
import DashboardHero from "@/components/DashboardHero";
import SearchHistory from "@/components/SearchHistory";
import CheaterSearchHistory from "@/components/CheaterSearchHistory";

import MaintenanceBanner from "@/components/MaintenanceBanner";
import Footer from "@/components/Footer";
import { useCfxApi } from "@/hooks/useCfxApi";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useNotifications } from "@/hooks/useNotifications";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { usePresence } from "@/hooks/usePresence";
import { useAuthReady } from "@/hooks/useAuthReady";
import { ErrorCard } from "@/components/feedback/ErrorCard";

import { usePageMeta } from "@/hooks/usePageMeta";

// Lazy-load heavy components
const CosmicNebulaBackground = lazy(() => import("@/components/CosmicNebulaBackground"));
const ServerDetails = lazy(() => import("@/components/ServerDetails"));
const ServerDetailsSkeleton = lazy(() => import("@/components/ServerDetailsSkeleton"));
const ServerComparison = lazy(() => import("@/components/ServerComparison"));
const FeaturedModsCarousel = lazy(() => import("@/components/FeaturedModsCarousel"));
const FeatureCards = lazy(() => import("@/components/FeatureCards"));

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const { serverCode: urlServerCode } = useParams<{ serverCode: string }>();
  const { isLoading, serverData, error: lookupError, errorDetails: lookupErrorDetails, lastSearchedCode, fetchServerData, clearData } = useCfxApi();
  const { history, isLoading: historyLoading, refetch: refetchHistory, clearHistory, removeHistoryItem } = useSearchHistory();
  const {
    settings: notificationSettings, 
    permissionGranted, 
    requestPermission, 
    addNotification, 
    removeNotification, 
    hasNotification,
    getNotificationSettings,
    showNotification 
  } = useNotifications();
  const { isOwner, isAdmin, isModerator } = useAdminStatus();
  const { isReady, isAuthenticated } = useAuthReady();
  
  usePresence();
  
  const [showComparison, setShowComparison] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [currentServerLastUpdate, setCurrentServerLastUpdate] = useState<Date | null>(null);
  const [isRefreshingCurrent, setIsRefreshingCurrent] = useState(false);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const hasFetchedFromUrl = useRef(false);

  const scrollToSearch = useCallback(() => {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);


  const handleServerSelect = useCallback(async (serverCode: string) => {
    await fetchServerData(serverCode);
    await refetchHistory();
    navigate(`/server-details/${serverCode}`, { replace: true });
  }, [fetchServerData, refetchHistory, navigate]);

  const refreshCurrentServer = useCallback(async () => {
    if (!lastSearchedCode) return;
    setIsRefreshingCurrent(true);
    await fetchServerData(lastSearchedCode);
    setCurrentServerLastUpdate(new Date());
    setIsRefreshingCurrent(false);
  }, [lastSearchedCode, fetchServerData]);

  const handleLogoReset = useCallback(() => {
    if (serverData) {
      clearData();
      setCurrentServerLastUpdate(null);
    }
    if (showComparison) {
      setShowComparison(false);
    }
    navigate('/dashboard', { replace: true });
  }, [clearData, navigate, serverData, showComparison]);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isReady, isAuthenticated, navigate]);

  useEffect(() => {
    if (!serverData || !autoRefreshEnabled || !isReady || !isAuthenticated) return;
    setCurrentServerLastUpdate(prev => prev || new Date());
    const intervalId = setInterval(refreshCurrentServer, 30000);
    return () => clearInterval(intervalId);
  }, [serverData?.hostname, autoRefreshEnabled, refreshCurrentServer, isReady, isAuthenticated]);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;

    const queryServerCode = searchParams.get('server');
    const showTour = searchParams.get('tour');
    
    if (queryServerCode) {
      fetchServerData(queryServerCode);
      navigate(`/dashboard/${queryServerCode}`, { replace: true });
    } else if (showTour) {
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, fetchServerData, navigate, isReady, isAuthenticated]);

  // Auto-fetch server from URL param on direct navigation
  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    if (!urlServerCode || hasFetchedFromUrl.current) return;
    if (serverData || isLoading) return;
    hasFetchedFromUrl.current = true;
    fetchServerData(urlServerCode);
  }, [urlServerCode, fetchServerData, isReady, isAuthenticated, serverData, isLoading]);

  // Reset fetch flag when URL param changes
  useEffect(() => {
    hasFetchedFromUrl.current = false;
  }, [urlServerCode]);

  // Dynamic page meta when a server is loaded
  const cleanHostname = serverData?.hostname
    ? serverData.hostname.replace(/\^[0-9]/g, '').replace(/~[a-zA-Z]~/g, '').trim()
    : null;
  const pageTitle = serverData && lastSearchedCode && cleanHostname
    ? `${cleanHostname} — cfx.re/join/${lastSearchedCode}`
    : 'Dashboard — CurlyKiddPanel';
  const pageDesc = serverData && lastSearchedCode
    ? `${serverData.playerCount ?? serverData.players?.length ?? 0}/${serverData.maxPlayers} players · ${serverData.gametype || 'FiveM'} · cfx.re/join/${lastSearchedCode}`
    : 'Your CurlyKiddPanel dashboard with FiveM server lookup, favorites, recent searches and the latest community mods.';
  const pagePath = lastSearchedCode ? `/dashboard/${lastSearchedCode}` : '/dashboard';

  usePageMeta({
    title: pageTitle,
    description: pageDesc,
    path: pagePath,
  });

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" style={{ willChange: 'transform' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <MaintenanceBanner />
      <Suspense fallback={<div className="fixed inset-0 -z-10" style={{ background: 'hsl(230, 25%, 4%)' }} />}>
        <CosmicNebulaBackground />
      </Suspense>
      
      <AppHeader onLogoClick={handleLogoReset} />

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {showComparison ? (
          <Suspense fallback={<div className="animate-pulse h-96 bg-muted/10 rounded-xl" />}>
            <ServerComparison onClose={() => setShowComparison(false)} />
          </Suspense>
        ) : serverData ? (
          <div className="mt-4">
            <Suspense fallback={<div className="animate-pulse h-96 bg-muted/10 rounded-xl" />}>
              <ServerDetails 
                data={serverData}
                serverCode={lastSearchedCode}
                onClose={clearData}
                isFavorite={false}
                onToggleFavorite={async () => {}}
                notificationProps={lastSearchedCode ? {
                  hasNotification: hasNotification(lastSearchedCode),
                  currentSettings: getNotificationSettings(lastSearchedCode),
                  permissionGranted,
                  onRequestPermission: requestPermission,
                  onSave: async (options) => {
                    return addNotification(lastSearchedCode, serverData.hostname, options);
                  },
                  onRemove: async () => {
                    return removeNotification(lastSearchedCode);
                  },
                } : undefined}
                lastUpdate={currentServerLastUpdate}
                isPolling={isRefreshingCurrent}
                onRefresh={refreshCurrentServer}
              />
            </Suspense>
          </div>
        ) : isLoading ? (
          <div className="mt-4">
            <Suspense fallback={<div className="animate-pulse h-96 bg-muted/10 rounded-xl" />}>
              <ServerDetailsSkeleton />
            </Suspense>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <DashboardHero onGetStarted={scrollToSearch} />

            {/* Unified Search Section */}
            <div ref={searchSectionRef} className="scroll-mt-24">
              <UnifiedSearch onServerSearch={handleServerSelect} isServerLoading={isLoading} />
              {lookupError && !isLoading && (
                <div className="max-w-2xl mx-auto mt-3">
                  <ErrorCard
                    title={t("lookup.failed")}
                    message={/not found/i.test(lookupError) ? t("lookup.not_found") : lookupError}
                    details={lookupErrorDetails}
                    onRetry={lastSearchedCode ? () => fetchServerData(lastSearchedCode, true) : undefined}
                    isRetrying={isLoading}
                    onDismiss={clearData}
                    dismissLabel={t("lookup.dismiss")}
                  />
                </div>
              )}
            </div>

            {/* Search History */}
            <div className="max-w-7xl mx-auto mt-8 grid gap-6 lg:grid-cols-2">
              <SearchHistory
                history={history}
                isLoading={historyLoading}
                onSelect={handleServerSelect}
                onClear={clearHistory}
                onRemove={removeHistoryItem}
              />
              <CheaterSearchHistory />
            </div>

            {/* Featured Mods Carousel */}
            <Suspense fallback={null}>
              <FeaturedModsCarousel />
            </Suspense>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
