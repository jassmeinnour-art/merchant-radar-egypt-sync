import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Camera, 
  Store, 
  TrendingDown, 
  TrendingUp,
  Send, 
  Layers, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Building2, 
  Image as ImageIcon, 
  Bookmark, 
  FileText, 
  Bell, 
  Smartphone, 
  Hash, 
  Users, 
  SlidersHorizontal, 
  FileSpreadsheet, 
  BarChart3,
  Truck,
  ShieldCheck,
  Compass,
  Key,
  LineChart,
  Calendar,
  Calculator,
  Archive,
  AlertTriangle,
  Clock,
  Package,
  UserCheck,
  LogOut,
  LogIn,
  Cloud,
  Database,
  Settings,
  Palette,
  User as UserIcon,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Volume2,
  VolumeX,
  Rocket,
  ShieldAlert,
  Factory,
  Heart,
  Globe,
  Flame,
  Crown
} from 'lucide-react';
import { ConnectedMerchantPlatform } from '../types';
import { isExportOverdue24h, getHoursSinceLastExport } from '../utils/csvProductManager';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAsyncOperations } from '../context/AsyncOperationsContext';
import { useAudioNotifications } from '../context/AudioNotificationContext';
import { LiveUpdateNotification } from './LiveUpdateNotification';
import { AppUpdateState } from '../hooks/useAppUpdate';
import { subscribeToApiSyncErrors, loadLocalCachedErrors } from '../services/apiErrorLoggingService';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenScanner: () => void;
  onOpenPublishModal: () => void;
  onOpenExportModal?: () => void;
  onOpenAiExcelModal?: () => void;
  onOpenBestSellersModal?: () => void;
  onShowToast?: (message: string) => void;
  connectedPlatforms: ConnectedMerchantPlatform[];
  productCount: number;
  watchlistCount?: number;
  activeAlertsCount?: number;
  remoteMerchantsCount?: number;
  archivedCount?: number;
  reorderAlertsCount?: number;
  updateState?: AppUpdateState;
  onOpenSmartGmailModal?: () => void;
  language?: 'ar' | 'en';
  onToggleLanguage?: () => void;
  onOpenPushNotificationModal?: () => void;
  onOpenAndroidModal?: () => void;
  onOpenManageApisModal?: () => void;
  onOpenSubscriptionModal?: () => void;
  subscriptionBadgeLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenScanner,
  onOpenPublishModal,
  onOpenExportModal,
  onOpenAiExcelModal,
  onOpenBestSellersModal,
  onShowToast,
  connectedPlatforms,
  productCount,
  watchlistCount = 2,
  activeAlertsCount = 3,
  remoteMerchantsCount = 4,
  archivedCount = 0,
  reorderAlertsCount = 0,
  updateState,
  onOpenSmartGmailModal,
  language = 'ar',
  onToggleLanguage,
  onOpenPushNotificationModal,
  onOpenAndroidModal,
  onOpenManageApisModal,
  onOpenSubscriptionModal,
  subscriptionBadgeLabel,
}) => {
  const { isPlatformSyncing, isCsvExporting, isDatabaseBusy } = useAsyncOperations();
  const { settings: audioSettings, setActiveGlobalSettingsTab } = useAudioNotifications();
  const [isExportOverdue, setIsExportOverdue] = useState<boolean>(false);
  const [hoursSinceExport, setHoursSinceExport] = useState<number | null>(null);
  const [showExportTooltip, setShowExportTooltip] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const [editStoreName, setEditStoreName] = useState<string>('');
  const [editCity, setEditCity] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [unresolvedApiErrorsCount, setUnresolvedApiErrorsCount] = useState<number>(() => {
    return loadLocalCachedErrors().filter(e => e.status === 'unresolved').length;
  });

  useEffect(() => {
    const unsub = subscribeToApiSyncErrors((errs) => {
      const unres = errs.filter(e => e.status === 'unresolved').length;
      setUnresolvedApiErrorsCount(unres);
    });
    return () => unsub();
  }, []);

  const { 
    user, 
    profile, 
    sessionData,
    isLoading: isAuthLoading, 
    isDbConnected, 
    isOwner,
    signInWithGoogle, 
    signInAsGuest,
    signInAsOwner,
    signInDemoMerchant,
    signOut, 
    updateStoreProfile, 
    loginError, 
    clearLoginError 
  } = useAuth();

  const { 
    currentTheme, 
    allThemes, 
    setPrimaryTheme, 
    setIsThemeModalOpen 
  } = useTheme();

  useEffect(() => {
    if (profile) {
      setEditStoreName(profile.storeName || 'متجر التاجر المصري');
      setEditCity(profile.city || 'القاهرة');
    }
  }, [profile]);

  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    try {
      await updateStoreProfile({
        storeName: editStoreName.trim(),
        city: editCity.trim(),
      });
      setIsEditProfileModalOpen(false);
    } catch {
      // safe fallback
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    const checkExport = () => {
      setIsExportOverdue(isExportOverdue24h());
      setHoursSinceExport(getHoursSinceLastExport());
    };

    checkExport();

    const handleExportCompleted = () => {
      checkExport();
    };

    window.addEventListener('merchant_export_completed', handleExportCompleted);
    return () => {
      window.removeEventListener('merchant_export_completed', handleExportCompleted);
    };
  }, []);

  const activePlatformsCount = connectedPlatforms.filter(p => p.isConnected).length;

  const [selectedNavCategory, setSelectedNavCategory] = useState<'all' | 'pricing' | 'stock' | 'ai' | 'reports'>('all');
  const navTabsContainerRef = useRef<HTMLDivElement>(null);

  const scrollNavTabs = (direction: 'left' | 'right') => {
    if (navTabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      navTabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const navCategories = [
    { id: 'all' as const, label: 'جميع الشاشات (25)' },
    { id: 'pricing' as const, label: '⚡ التسعير والرادار (6)' },
    { id: 'stock' as const, label: '📦 المخزون والتوريد (6)' },
    { id: 'ai' as const, label: '🎯 الذكاء والمتابعة (7)' },
    { id: 'reports' as const, label: '📊 التقارير والإدارة (6)' },
  ];

  const navItems = useMemo(() => [
    { id: 'radar', label: 'رادار المنافسين والتسعير', icon: TrendingDown, badge: 'مباشر ⚡', category: 'pricing' },
    { 
      id: 'order_fulfillment', 
      label: 'جدولة وتتبع أوامر الشحن (Fulfillment)', 
      icon: Truck, 
      badge: 'ربط البوالص والمخزون 📦🚚', 
      category: 'stock' 
    },
    { 
      id: 'admin_error_logs', 
      label: 'لوحة المدير وسجل أخطاء API', 
      icon: ShieldAlert, 
      badge: unresolvedApiErrorsCount > 0 ? `${unresolvedApiErrorsCount} عطل نشط 🚨` : 'سجل الأعطال 🚨', 
      category: 'reports' 
    },
    { 
      id: 'user_logs', 
      label: 'سجل نشاط وحركات المستخدمين', 
      icon: FileText, 
      badge: 'سجل النشاط 📜', 
      category: 'reports' 
    },
    { id: 'remote_merchants', label: 'متابعة التجار وتقاريرهم', icon: Users, badge: `${remoteMerchantsCount} تجار وإيميلات 👥`, category: 'pricing' },
    { id: 'sales_dashboard', label: 'لوحة أداء المبيعات والتسعير', icon: LineChart, badge: 'تحليلات بيعية 📈', category: 'pricing' },
    { id: 'archived_products', label: 'أرشيف المنتجات غير النشطة', icon: Archive, badge: `${archivedCount} مؤرشف 🗄️`, category: 'stock' },
    { id: 'platform_commissions', label: 'حاسبة عمولات المنصات', icon: Calculator, badge: 'أمازون ونون وكنز 🧮', category: 'pricing' },
    { id: 'seasonal_forecast', label: 'توقع الطلب الموسمي والذروة', icon: Calendar, badge: 'تنبؤ بالمخزون 📦⚡', category: 'stock' },
    { id: 'market_trends', label: 'رادار اتجاهات السوق والطلب', icon: Compass, badge: 'رائج بمصر 📈', category: 'ai' },
    { id: 'order_scheduling', label: 'جدولة الطلبات وبوالص الشحن', icon: Truck, badge: 'بوالص منفصلة 🚚', category: 'stock' },
    { id: 'pricing_guardrails', label: 'حدود حماية التسعير والمنصات', icon: ShieldCheck, badge: 'أمان الأرباح 🛡️', category: 'pricing' },
    { id: 'marketer_hub', label: 'صلاحيات المسوق والرقابة', icon: Key, badge: 'تحكم وصلاحيات 👑', category: 'reports' },
    { id: 'profit_simulator', label: 'محاكي الربح المستقبلي', icon: TrendingUp, badge: 'نمذجة تنبؤية 💎', category: 'pricing' },
    { id: 'periodic_reports', label: 'تقارير الأداء والرسوم البيانية', icon: BarChart3, badge: 'مخططات دورية 📊', category: 'reports' },
    { id: 'bulk_repricing', label: 'التحديث الجماعي للأسعار وCSV', icon: SlidersHorizontal, badge: 'استراتيجيات CSV 🚀', category: 'pricing' },
    { id: 'watchlist', label: 'قائمة المتابعة والرصد', icon: Bookmark, badge: `${watchlistCount} محفوظ`, category: 'ai' },
    { id: 'wishlist', label: 'قائمة أمنيات التاجر والصفقات', icon: Heart, badge: 'أمنيات 🎯', category: 'ai' },
    { id: 'seo_keywords', label: 'توليد الكلمات وقوة المنافسة', icon: Hash, badge: 'جديد AI 🚀', category: 'ai' },
    { id: 'seo_listing', label: 'نصوص السيو الجاهزة', icon: Layers, badge: 'SEO 📑', category: 'ai' },
    { id: 'image_studio', label: 'استوديو تصوير وزوايا المنتج', icon: ImageIcon, badge: 'كاميرا وزوايا 📸', category: 'ai' },
    { 
      id: 'inventory', 
      label: 'تتبع مستويات المخزون ونقاط الطلب', 
      icon: Package, 
      badge: reorderAlertsCount > 0 ? `${reorderAlertsCount} بحاجة لتوريد ⚠️` : 'مخزون ذكي 📦',
      category: 'stock'
    },
    { 
      id: 'suppliers_hub', 
      label: 'دليل وشبكة موردي ومصانع الأثاث', 
      icon: Factory, 
      badge: 'دمياط ومصر 🏭', 
      category: 'stock' 
    },
    { id: 'wholesale', label: 'أسواق ومراكز خامات الأثاث', icon: Building2, badge: 'دمياط ومراكز مصر', category: 'stock' },
    { id: 'price_alerts', label: 'تنبيهات هبوط الأسعار', icon: Bell, badge: 'واتساب 📲', category: 'ai' },
    { id: 'platforms_guide', label: 'دليل المنصات والاشتراك والأوراق', icon: FileText, badge: 'شروط وأوراق 📑', category: 'reports' },
  ], [archivedCount, remoteMerchantsCount, watchlistCount, reorderAlertsCount, unresolvedApiErrorsCount]);

  const displayedNavItems = useMemo(() => {
    if (selectedNavCategory === 'all') return navItems;
    return navItems.filter(item => item.category === selectedNavCategory);
  }, [selectedNavCategory, navItems]);



  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      {/* Top Merchant Intelligence Bar */}
      <div className="bg-slate-950 text-slate-200 text-xs py-1.5 px-4 sm:px-8 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-300">
              السوق المصري (EGP ج.م) — متصل بمحركات أمازون مصر، نون، جوميا، وأسواق الجملة
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">{activePlatformsCount}/{connectedPlatforms.length}</span>
              <span>منصات متصلة بالتاجر</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-1.5">
              {isPlatformSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span className="text-amber-300 font-bold">جاري مزامنة قنوات البيع...</span>
                </>
              ) : isDatabaseBusy ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
                  <span className="text-indigo-200 font-bold">جاري حفظ وتحديث السحابة...</span>
                </>
              ) : isCsvExporting ? (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300 animate-bounce" />
                  <span className="text-emerald-300 font-bold">جاري معالجة وتصدير CSV...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">مزامنة المخزون والأسعار مفعلة</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('radar')}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-950 via-indigo-950 to-emerald-900 p-1 flex items-center justify-center text-white shadow-md shadow-emerald-950/50 border border-emerald-500/30 shrink-0 group-hover:scale-105 transition-transform">
              <img 
                src="/icon.svg" 
                alt="شعار رادار التاجر الذكي مصر" 
                className="w-9 h-9 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-tight font-['Alexandria']">
                  رادار التاجر الذكي
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  مصر 🇪🇬
                </span>
                <span className="hidden md:inline-flex px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  PWA ⚡
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                رصد المنافسين • تسعير تلقائي • إدراج ونشر متعدد المنصات
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Subscription Plans & 3-Day Free Trial Status Button */}
            {onOpenSubscriptionModal && (
              <button
                id="btn-header-subscription-plans"
                type="button"
                onClick={onOpenSubscriptionModal}
                className="h-10 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-black font-['Alexandria'] flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/50 border border-amber-300/60 transition-all cursor-pointer active:scale-95 shrink-0"
                title="إدارة باقات الاشتراك وفترة التجربة المجانية (3 أيام)"
              >
                <Crown className="w-4 h-4 text-slate-950 fill-amber-200" />
                <span className="hidden sm:inline">باقات الاشتراك</span>
                <span className="sm:hidden">الاشتراك</span>
                {subscriptionBadgeLabel && (
                  <span className="hidden lg:inline-flex px-1.5 py-0.5 rounded bg-slate-950/85 text-amber-300 text-[10px] font-bold">
                    {subscriptionBadgeLabel}
                  </span>
                )}
              </button>
            )}

            {/* Android App & Google Play Button */}
            {onOpenAndroidModal && (
              <button
                id="btn-header-android-google-play"
                type="button"
                onClick={onOpenAndroidModal}
                className="h-10 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black font-['Alexandria'] flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/60 border border-emerald-400/50 transition-all cursor-pointer active:scale-95 shrink-0"
                title="تطبيق أندرويد و Google Play (تحميل مباشر وتثبيت للهاتف)"
                aria-label="تطبيق أندرويد و Google Play"
              >
                <div className="relative flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-emerald-100" />
                  <span className="w-2 h-2 rounded-full bg-emerald-300 absolute -top-1 -right-1 ring-1 ring-slate-900 animate-pulse" />
                </div>
                <span className="hidden sm:inline">تطبيق أندرويد 🤖</span>
                <span className="sm:hidden">أندرويد 🤖</span>
                <span className="hidden md:inline-flex px-1.5 py-0.2 rounded bg-slate-950/50 text-[9px] font-bold text-emerald-200 border border-emerald-400/30">
                  Play
                </span>
              </button>
            )}

            {/* Language Switcher Button (Arabic / English) */}
            {onToggleLanguage && (
              <button
                id="btn-toggle-app-language"
                type="button"
                onClick={onToggleLanguage}
                className="h-10 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0"
                title={language === 'en' ? 'Switch to Arabic Interface 🇪🇬' : 'Switch to English Interface 🌐'}
                aria-label="تبديل لغة التطبيق"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">{language === 'en' ? 'العربية 🇪🇬' : 'English 🌐'}</span>
              </button>
            )}

            {/* Browser Push Notifications (FCM) Manager Button */}
            {onOpenPushNotificationModal && (
              <button
                id="btn-header-push-notifications"
                type="button"
                onClick={onOpenPushNotificationModal}
                className="h-10 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0 relative"
                title={language === 'en' ? 'Browser Push Notifications (FCM) 🔔' : 'تنبيهات المتصفح الفورية (FCM) 🔔'}
                aria-label="تنبيهات المتصفح الفورية"
              >
                <div className="relative flex items-center justify-center">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-1 -end-1 ring-1 ring-slate-900 animate-pulse" />
                </div>
                <span className="hidden sm:inline font-bold">
                  {language === 'en' ? 'Push Alerts 🔔' : 'إشعارات FCM 🔔'}
                </span>
              </button>
            )}

            {/* Live App / PWA Update Available Badge */}
            {updateState && (
              <LiveUpdateNotification 
                variant="header-button" 
                updateState={updateState} 
                onShowToast={onShowToast} 
              />
            )}

            {/* Global Settings (Audio Alerts & Theme Colors) Button */}
            <button
              onClick={() => {
                setActiveGlobalSettingsTab('audio');
                setIsThemeModalOpen(true);
              }}
              id="btn-header-global-settings"
              className="h-10 px-3 sm:px-3.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-['Alexandria'] flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0 select-none"
              title="الإعدادات العامة: تخصيص الإشعارات الصوتية لأسعار المنافسين وألوان المنظومة"
            >
              <span 
                className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0 shadow-2xs" 
                style={{ backgroundColor: currentTheme.primaryHex }}
              />
              {audioSettings.isMasterEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <span className="hidden xl:inline">الإعدادات والصوت</span>
              <span className="xl:hidden">الإعدادات</span>
            </button>

            {/* Cloud Database & Authentication Widget */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  id="btn-header-user-profile"
                  className="h-10 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-2xs"
                  title="إعدادات الحساب التجاري وقاعدة البيانات السحابية"
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Avatar" 
                      className="w-6 h-6 rounded-full border border-slate-300 object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                      {profile?.displayName ? profile.displayName.charAt(0) : 'ت'}
                    </div>
                  )}
                  <div className="text-right hidden sm:block">
                    <div className="text-[11px] font-black text-slate-800 leading-tight truncate max-w-[90px]">
                      {profile?.displayName || 'التاجر'}
                    </div>
                    {isDatabaseBusy ? (
                      <div className="text-[9px] font-bold text-amber-600 flex items-center gap-1 mt-0.5 animate-pulse">
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-600" />
                        <span>حفظ السحابة...</span>
                      </div>
                    ) : isPlatformSyncing ? (
                      <div className="text-[9px] font-bold text-indigo-600 flex items-center gap-1 mt-0.5 animate-pulse">
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-600" />
                        <span>مزامنة المنصات...</span>
                      </div>
                    ) : isCsvExporting ? (
                      <div className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5 animate-pulse">
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-600" />
                        <span>تصدير CSV...</span>
                      </div>
                    ) : (
                      <div className="text-[9px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>سحابي متصل</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* User Profile & Store Settings Dropdown */}
                {showUserMenu && (
                  <div className="absolute top-full mt-2 left-0 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 z-50 animate-fadeIn text-right">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="Avatar" 
                          className="w-10 h-10 rounded-full border border-slate-300 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-base font-bold">
                          {profile?.displayName ? profile.displayName.charAt(0) : 'ت'}
                        </div>
                      )}
                      <div className="truncate">
                        <div className="text-xs font-black text-slate-900 truncate">{profile?.displayName || user.displayName}</div>
                        <div className="text-[10px] text-slate-500 truncate" dir="ltr">{profile?.email || user.email}</div>
                        <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                          {profile?.storeName || 'متجر التاجر المصري'} • {profile?.city || 'القاهرة'}
                        </div>
                      </div>
                    </div>

                    <div className="py-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px]">
                        <span className="font-bold flex items-center gap-1">
                          <Database className="w-3.5 h-3.5 text-emerald-600" />
                          قاعدة بيانات Firestore
                        </span>
                        <span className="font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[10px]">
                          متصل ومحمي 🔒
                        </span>
                      </div>

                      {/* Active Session Linked Data */}
                      {sessionData && (
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-medium">رقم الجلسة:</span>
                            <span className="font-bold text-indigo-700">#{sessionData.sessionCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500 text-[10px]">
                            <span>آخر تسجيل دخول:</span>
                            <span className="font-semibold">{sessionData.lastLoginAt}</span>
                          </div>
                        </div>
                      )}

                      {/* Smart Gmail Auto-Link & Direct Launchpad */}
                      {onOpenSmartGmailModal && (
                        <button
                          type="button"
                          id="btn-usermenu-smart-gmail"
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenSmartGmailModal();
                          }}
                          className="w-full text-right px-2.5 py-2 rounded-xl bg-linear-to-r from-indigo-50/70 to-sky-50/70 hover:from-indigo-100/70 hover:to-sky-100/70 text-indigo-950 flex items-center justify-between cursor-pointer font-bold text-xs border border-indigo-100"
                        >
                          <span className="flex items-center gap-2">
                            <Rocket className="w-3.5 h-3.5 text-indigo-600" />
                            <span>ربط المنصات بـ Gmail ومراكز البائعين</span>
                          </span>
                          <span className="text-[10px] text-white font-bold bg-indigo-600 px-1.5 py-0.5 rounded-full shadow-2xs">
                            ⚡ Direct
                          </span>
                        </button>
                      )}

                      {/* Subscription Plans & Trial Status Menu Item */}
                      {onOpenSubscriptionModal && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenSubscriptionModal();
                          }}
                          id="btn-usermenu-subscription-plans"
                          className="w-full text-right px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 flex items-center justify-between cursor-pointer font-bold text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Crown className="w-3.5 h-3.5 text-amber-600" />
                            <span>باقات الاشتراك والتجربة (3 أيام)</span>
                          </span>
                          <span className="text-[10px] text-amber-900 font-black bg-amber-200/80 px-1.5 py-0.5 rounded">
                            {subscriptionBadgeLabel || '3 أيام مجاناً'}
                          </span>
                        </button>
                      )}

                      {/* Manage Merchant APIs Button */}
                      {onOpenManageApisModal && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenManageApisModal();
                          }}
                          id="btn-usermenu-manage-merchant-apis"
                          className="w-full text-right px-2.5 py-2 rounded-xl hover:bg-indigo-50 text-indigo-900 flex items-center justify-between cursor-pointer font-bold text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Key className="w-3.5 h-3.5 text-indigo-600" />
                            <span>إدارة مفاتيح ربط التجار (APIs)</span>
                          </span>
                          <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                            متعدد التجار 🏬
                          </span>
                        </button>
                      )}

                      {/* Custom Audio Notifications Settings Button */}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveGlobalSettingsTab('audio');
                          setIsThemeModalOpen(true);
                        }}
                        id="btn-usermenu-audio-settings"
                        className="w-full text-right px-2.5 py-2 rounded-xl hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer font-bold text-xs"
                      >
                        <span className="flex items-center gap-2">
                          <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>إشعارات الصوت (أسعار ومنافسين)</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          {audioSettings.isMasterEnabled ? (
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              مفعل 🔊
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.5 rounded">
                              مكتوم 🔇
                            </span>
                          )}
                        </span>
                      </button>

                      {/* Primary Color Customizer Button */}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveGlobalSettingsTab('theme');
                          setIsThemeModalOpen(true);
                        }}
                        id="btn-usermenu-theme-settings"
                        className="w-full text-right px-2.5 py-2 rounded-xl hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer font-bold text-xs"
                      >
                        <span className="flex items-center gap-2">
                          <Palette className="w-3.5 h-3.5 text-slate-500" />
                          <span>ألوان لوحة التحكم (Primary Colors)</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span 
                            className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block"
                            style={{ backgroundColor: currentTheme.primaryHex }}
                          />
                          <span className="text-[10px] text-slate-400 font-normal">{currentTheme.name}</span>
                        </span>
                      </button>

                      {/* Quick Wishlist & User Logs links in user dropdown */}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('wishlist');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full text-right px-2.5 py-2 rounded-xl hover:bg-rose-50/80 text-rose-800 flex items-center justify-between cursor-pointer font-bold text-xs transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-500" />
                          <span>قائمة أمنياتي والصفقات</span>
                        </span>
                        <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded-full">
                          أمنيات 🎯
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('user_logs');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full text-right px-2.5 py-2 rounded-xl hover:bg-indigo-50/80 text-indigo-900 flex items-center justify-between cursor-pointer font-bold text-xs transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>سجل حركات وعمليات الحساب</span>
                        </span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">
                          Audit 📜
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setIsEditProfileModalOpen(true);
                        }}
                        className="w-full text-right px-2.5 py-2 rounded-xl hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer font-bold"
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="w-3.5 h-3.5 text-slate-500" />
                          إعدادات المتجر والموقع
                        </span>
                        <span className="text-[10px] text-slate-400">تعديل</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      {isOwner ? (
                        <button
                          type="button"
                          id="btn-usermenu-switch-to-merchant"
                          onClick={async () => {
                            setShowUserMenu(false);
                            await signInDemoMerchant();
                            onShowToast?.('تم التبديل لمنظور تاجر عادي (تم إخفاء زر مناقشة Google AI Studio من الـ DOM) 👤');
                          }}
                          className="w-full py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="معاينة المنظومة كتاجر عادي للتحقق من اختفاء زر الأونر تماماً من شجرة الـ DOM"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-600" />
                          <span>معاينة منظور تاجر آخر (إخفاء زر الأونر)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          id="btn-usermenu-switch-to-owner"
                          onClick={async () => {
                            setShowUserMenu(false);
                            await signInAsOwner();
                            onShowToast?.('تم الدخول بحساب مالكة التطبيق (jassmeinnour@gmail.com) وتفعيل زر مناقشة Google AI Studio 🛠️👑');
                          }}
                          className="w-full py-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="تفعيل جلسة مالكة التطبيق (jassmeinnour@gmail.com)"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-600" />
                          <span>تفعيل حساب المالكة (jassmeinnour@gmail.com) 🛠️</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut();
                        }}
                        className="w-full py-2 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => signInWithGoogle()}
                  disabled={isAuthLoading}
                  id="btn-header-google-login"
                  className="h-10 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold font-['Alexandria'] flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-60 select-none shrink-0"
                  title="تسجيل الدخول وربط قاعدة البيانات السحابية لحفظ بيانات المتجر والتسعير"
                >
                  <Cloud className="w-4 h-4 text-blue-100 shrink-0" />
                  <span className="hidden sm:inline">تسجيل الدخول</span>
                  <span className="sm:hidden">دخول</span>
                </button>

                <button
                  onClick={() => signInAsGuest()}
                  disabled={isAuthLoading}
                  id="btn-header-guest-login"
                  className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-['Alexandria'] flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-60 select-none shrink-0 border border-slate-200"
                  title="دخول سريع كتاجر ضيف بدون حساب Google لتجربة المنظومة"
                >
                  <span>ضيف</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Top Control Toolbar (شريط أدوات العمليات الرئيسي) */}
        <div 
          id="header-operations-toolbar" 
          className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/90 shadow-inner"
        >
          {/* 5 Primary Control Buttons with gap-4 and flex-wrap */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* 1. مسح منتج جديد */}
            <button
              type="button"
              id="btn-header-toolbar-scan-product"
              onClick={onOpenScanner}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black font-['Alexandria'] flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 border border-emerald-500/50 transition-all cursor-pointer select-none shrink-0"
              title="مسح باركود منتج جديد بالكاميرا أو إدخاله يدوياً"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>مسح منتج جديد</span>
            </button>

            {/* 2. رفع شيت إكسيل */}
            {onOpenAiExcelModal && (
              <button
                type="button"
                id="btn-header-toolbar-ai-excel"
                onClick={onOpenAiExcelModal}
                className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-indigo-300 hover:text-indigo-200 border border-indigo-500/40 text-xs font-bold font-['Alexandria'] flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer select-none shrink-0"
                title="رفع شيت إكسيل بأسماء المنتجات وأبعادها وإثرائها بالذكاء الاصطناعي"
              >
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>رفع شيت إكسيل (AI)</span>
              </button>
            )}

            {/* 3. تصدير CSV / Excel */}
            {onOpenExportModal && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={onOpenExportModal}
                  onMouseEnter={() => setShowExportTooltip(true)}
                  onMouseLeave={() => setShowExportTooltip(false)}
                  id="btn-header-toolbar-export-csv"
                  className={`h-10 px-4 rounded-xl border text-xs font-bold font-['Alexandria'] flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-95 select-none shrink-0 ${
                    isExportOverdue
                      ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/70 shadow-amber-500/10 ring-2 ring-amber-400/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border-emerald-500/40'
                  }`}
                  title="تصدير قائمة المنتجات والأسعار وتاريخ التغييرات إلى ملف Excel أو CSV"
                >
                  <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isExportOverdue ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <span>تصدير CSV / Excel</span>

                  {isExportOverdue && (
                    <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] px-1.5 py-0.5 rounded-md font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span>تذكير 24h</span>
                    </span>
                  )}
                </button>

                {/* Smart Tooltip for 24h Overdue Reminder */}
                {isExportOverdue && showExportTooltip && (
                  <div className="absolute top-full mt-2 left-0 sm:right-0 sm:left-auto w-72 bg-slate-900 text-white rounded-2xl p-3 border border-amber-400/60 shadow-xl z-50 animate-fadeIn text-right text-xs">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>تذكير نهاية اليوم (أكثر من 24 ساعة)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                      لم يتم تصدير أي تقرير للأسعار أو التقييم المحاسبي خلال الـ 24 ساعة الأخيرة ({hoursSinceExport !== null ? `آخر تصدير: منذ ${hoursSinceExport} ساعة` : 'لم يتم التصدير بعد'}).
                    </p>
                    <div className="text-[10px] text-emerald-300 font-semibold flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>اضغط لفتح مركز التصدير الفوري</span>
                      <span>Excel / CSV 📑</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. متابعة التجار */}
            <button
              type="button"
              id="btn-header-toolbar-remote-merchants"
              onClick={() => {
                setActiveTab('remote_merchants');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="h-9 px-3.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 active:scale-95 text-purple-200 hover:text-white border border-purple-500/40 hover:border-purple-400 text-xs font-semibold font-['Alexandria'] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer select-none shrink-0"
              title="متابعة التجار وتقاريرهم الأسبوعية وربط حسابات المنصات"
            >
              <Users className="w-4 h-4 text-purple-400 shrink-0" />
              <span>متابعة التجار</span>
              <span className="bg-purple-950/80 text-purple-300 border border-purple-500/30 text-[10px] px-1.5 py-0.5 rounded-md font-mono font-medium">
                {remoteMerchantsCount}
              </span>
            </button>

            {/* 5. إرسال للمنصات */}
            <button
              type="button"
              id="btn-header-toolbar-publish-platforms"
              onClick={onOpenPublishModal}
              className="h-9 px-3.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 active:scale-95 text-white text-xs font-semibold font-['Alexandria'] flex items-center justify-center gap-2 shadow-xs border border-emerald-500/50 transition-all cursor-pointer select-none shrink-0"
              title="نشر وتعديل الأسعار على أمازون ونون وجوميا وشوبيفاي بضغطة زر"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>إرسال للمنصات</span>
            </button>

            {/* 6. ترشيحات الأكثر مبيعاً (تلقائي في كل الفئات) */}
            {onOpenBestSellersModal && (
              <button
                type="button"
                id="btn-header-toolbar-bestsellers-alert"
                onClick={onOpenBestSellersModal}
                className="h-9 px-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-300 hover:text-amber-200 border border-amber-500/50 text-xs font-bold font-['Alexandria'] flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer select-none shrink-0"
                title="إنذار وترشيح تلقائي للمنتجات الأكثر مبيعاً في جميع الفئات على أمازون ونون وجوميا وهومزمارت"
              >
                <Flame className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span>ترشيحات الأكثر مبيعاً</span>
                <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-md font-black font-mono">
                  #1
                </span>
              </button>
            )}
          </div>

          {/* Quick Active Products Counter Chip */}
          <div className="flex items-center gap-2.5 text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-bold">المنتجات المسجلة:</span>
              <span className="font-mono font-black text-emerald-400 text-sm">{productCount}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Header & Categories */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2.5">
          {/* Categories Filter & Scroll Controls */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 shrink-0">
              {navCategories.map((cat) => (
                <button
                  key={cat.id}
                  id={`btn-nav-category-${cat.id}`}
                  type="button"
                  onClick={() => setSelectedNavCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    selectedNavCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-500 font-black'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Quick Scroll Left/Right for Tabs */}
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => scrollNavTabs('right')}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer border border-slate-700"
                title="تمرير لليمين"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollNavTabs('left')}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer border border-slate-700"
                title="تمرير لليسار"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tab Buttons Row */}
          <div 
            ref={navTabsContainerRef}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1"
          >
            {displayedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isOrderFulfillment = item.id === 'order_fulfillment';

              return (
                <button
                  key={item.id}
                  id={`btn-nav-tab-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-500/60 ring-2 ring-emerald-400/40 font-black'
                      : isOrderFulfillment
                      ? 'bg-slate-800/95 hover:bg-slate-700/90 text-emerald-300 hover:text-emerald-100 border border-emerald-500/50 hover:border-emerald-400 shadow-sm shadow-emerald-950/20'
                      : 'bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600'
                  }`}
                  title={item.label}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : isOrderFulfillment ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                  <span className={isOrderFulfillment ? 'font-black tracking-wide text-emerald-200' : ''}>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium ${
                      isActive ? 'bg-white/20 text-white' : isOrderFulfillment ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 font-bold' : 'bg-slate-900/90 text-slate-300 border border-slate-700/50'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Error Notification Banner */}
        {loginError && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{loginError}</span>
            </div>
            <button
              onClick={clearLoginError}
              className="text-rose-600 hover:text-rose-900 font-bold px-2 py-0.5 text-xs cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* Edit Store Profile Modal */}
        {isEditProfileModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <button 
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer p-1"
                >
                  ✕
                </button>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-indigo-600" />
                  إعدادات المتجر وقاعدة البيانات
                </h3>
              </div>

              <form onSubmit={handleSaveStoreProfile} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المتجر التجاري</label>
                  <input
                    type="text"
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800 font-medium"
                    placeholder="مثال: متجر التقنية المصرية الحديثة"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدينة / المقر الرئيسي</label>
                  <select
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800 font-medium cursor-pointer"
                  >
                    <option value="القاهرة">القاهرة (وسط البلد / العتبة / مدينة نصر)</option>
                    <option value="الجيزة">الجيزة (الدقي / المهندسين / الهرم)</option>
                    <option value="الإسكندرية">الإسكندرية (المنشية / سموحة)</option>
                    <option value="طنطا">طنطا والغربية</option>
                    <option value="المنصورة">المنصورة والدقهلية</option>
                    <option value="بورسعيد">بورسعيد (المنطقة الحرة)</option>
                    <option value="أسيوط">أسيوط والصعيد</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                    المزامنة السحابية الفورية
                  </div>
                  <p>
                    يتم حفظ قوائم المراقبة والأسعار المحدثة وتصاميم الاستوديو في قاعدة بيانات Firestore السحابية المرتبطة بحسابك بشكل فوري.
                  </p>
                </div>

                {/* Primary Colors Customization in Store Settings */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Palette className="w-3.5 h-3.5" style={{ color: currentTheme.primaryHex }} />
                      <span>ألوان لوحة التحكم (Primary Colors)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditProfileModalOpen(false);
                        setIsThemeModalOpen(true);
                      }}
                      id="btn-settings-open-full-theme-modal"
                      className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>تخصيص كامل</span>
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    النسق الحالي: <strong className="text-slate-800">{currentTheme.name}</strong>. انقر لاختيار لون رئيسي جديد فوراً (يُحفظ تلقائياً في localStorage):
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
                    {allThemes.map((t) => {
                      const isSelected = currentTheme.id === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setPrimaryTheme(t.id);
                            if (onShowToast) {
                              onShowToast(`تم تغيير اللون الرئيسي إلى: ${t.name} (حُفظ في localStorage) 🎨`);
                            }
                          }}
                          className={`h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                            isSelected
                              ? 'ring-2 ring-offset-2 ring-slate-800 scale-105'
                              : 'hover:scale-105 border-slate-200 opacity-85 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: t.primaryHex }}
                          title={`${t.name} (${t.nameEn})`}
                        >
                          {isSelected && <span className="text-white text-xs font-black">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditProfileModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
