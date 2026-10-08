import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  Share2, 
  PlusSquare, 
  X, 
  CheckCircle, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink, 
  Monitor, 
  ArrowUpRight, 
  Check, 
  Info,
  Layers,
  AlertCircle,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePWAInstall } from '../hooks/usePWAInstall';

export interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'settings' | 'menu-item' | 'compact' | 'ribbon' | 'floating';
  onShowToast?: (message: string) => void;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'header',
  onShowToast,
  className = ''
}) => {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isAndroid,
    isMobile,
    browser,
    browserName,
    isInAppBrowser,
    isInIframe, 
    install, 
    openInNewWindow 
  } = usePWAInstall();

  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'chrome' | 'ios' | 'samsung'>(
    browser === 'safari' ? 'ios' : browser === 'samsung' ? 'samsung' : 'chrome'
  );

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      const success = await install();
      setIsInstalling(false);
      if (success) {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
        onShowToast?.('تم تثبيت رادار التاجر الذكي بنجاح على جهازك! 🎉');
        return;
      }
    }
    // Open detailed step-by-step installation guide
    setShowInstallGuide(true);
  };

  // If already installed and running standalone
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div id="pwa-settings-installed-status" className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-right">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-emerald-900">التطبيق مثبت كبرنامج مستقل (PWA)</div>
              <div className="text-[11px] text-emerald-700">يعمل التطبيق الآن مثل تطبيقات فيسبوك وواتساب دون الحاجة للمتصفح.</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shrink-0">
            نشط ومثبت ✓
          </span>
        </div>
      );
    }

    if (variant === 'menu-item') {
      return (
        <div className="w-full px-2.5 py-2 rounded-xl bg-emerald-50/60 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>مثبت على الجهاز (PWA)</span>
          </span>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black">✓ نشط</span>
        </div>
      );
    }

    if (variant === 'compact') {
      return (
        <span 
          id="pwa-installed-badge"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs"
          title="التطبيق مثبت ويعمل كبرنامج هاتف مستقل (Installed PWA)"
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>مثبت على الهاتف ✓</span>
        </span>
      );
    }

    return null;
  }

  return (
    <>
      {/* 1. Header Variant */}
      {variant === 'header' && (
        <button
          type="button"
          id="btn-pwa-install-header"
          onClick={handleInstallClick}
          className={`h-10 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white text-xs font-bold font-['Alexandria'] flex items-center justify-center gap-2 shadow-sm hover:shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer border border-indigo-400/30 shrink-0 select-none whitespace-nowrap ${className}`}
          title="تثبيت تطبيق رادار التاجر الذكي على هاتفك أو حاسوبك ليعمل كبرنامج مستقل"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <Smartphone className="w-3.5 h-3.5 text-white shrink-0" />
          <span className="hidden sm:inline">تثبيت التطبيق 📱</span>
          <span className="sm:hidden">تثبيت 📱</span>
        </button>
      )}

      {/* 2. Banner Variant (Main Screen / Top View) */}
      {variant === 'banner' && (
        <div 
          id="pwa-install-banner"
          className={`bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-4 my-3 text-right ${className}`}
        >
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1 flex items-center justify-center shrink-0 shadow-md border border-white/20">
              <img 
                src="/icon.svg" 
                alt="شعار رادار التاجر الذكي" 
                className="w-9 h-9 object-contain drop-shadow"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                  <span>تثبيت رادار التاجر الذكي على هاتفك أو حاسوبك (PWA)</span>
                  <span className="hidden sm:inline-block">📲</span>
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-extrabold">
                  يعمل مثل فيسبوك وواتساب ⚡
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 mt-1 leading-relaxed">
                ثبت التطبيق كبرنامج مستقل على شاشتك الرئيسية للوصول فوري لرصد أسعار السوق المصري بدون شريط المتصفح، مع إشعارات فورية ودعم كامل للعمل دون اتصال بالإنترنت.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0 flex-wrap">
            <button
              type="button"
              id="btn-pwa-install-banner-action"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-indigo-700" />
              <span>{isInstalling ? 'جاري التثبيت...' : 'تثبيت التطبيق الآن 📱'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowInstallGuide(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="عرض طريقة التثبيت عبر قائمة المتصفح (نقاط كروم الثلاث أو سفاري)"
            >
              <Info className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">طريقة التثبيت</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Settings Variant (Inside Settings Modal / Tab) */}
      {variant === 'settings' && (
        <div id="pwa-settings-install-card" className={`p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-200/80 text-right space-y-3 ${className}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-slate-900">تثبيت التطبيق كبرنامج مستقل (PWA App)</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                    هاتف وكمبيوتر
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  يعمل التطبيق على هاتفك أو حاسوبك تماماً مثل تطبيقات فيسبوك وواتساب الأصلية، بشاشة كاملة وسرعة فائقة بدون شريط المتصفح، مع حفظ البيانات والتسعير دون اتصال.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              id="btn-pwa-settings-install"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalling ? 'جاري فتح نافذة التثبيت...' : 'تثبيت التطبيق مباشرة الآن 📱'}</span>
            </button>

            {isInIframe && (
              <button
                type="button"
                onClick={openInNewWindow}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="فتح في نافذة كاملة لتشغيل ميزة التثبيت التلقائي بنقرة واحدة من جوجل كروم"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">نافذة كاملة</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Menu Item Variant (Inside Profile / Header Dropdown) */}
      {variant === 'menu-item' && (
        <button
          type="button"
          id="btn-pwa-menu-item-install"
          onClick={handleInstallClick}
          className={`w-full text-right px-2.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-900 flex items-center justify-between cursor-pointer font-bold border border-indigo-100 transition-colors ${className}`}
        >
          <span className="flex items-center gap-2 text-xs">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>تثبيت التطبيق على جهازك</span>
          </span>
          <span className="text-[10px] bg-indigo-600 text-white font-black px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
            <Download className="w-3 h-3" />
            <span>PWA 📲</span>
          </span>
        </button>
      )}

      {/* 5. Compact Variant (Ribbon / Bar) */}
      {variant === 'compact' && (
        <button
          type="button"
          id="btn-pwa-install-compact"
          onClick={handleInstallClick}
          className={`h-9 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white text-xs font-bold font-['Alexandria'] flex items-center justify-center gap-2 shadow-2xs hover:shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer border border-indigo-400/30 shrink-0 select-none whitespace-nowrap ${className}`}
          title="تثبيت التطبيق على هاتفك أو حاسوبك ليعمل كبرنامج مستقل (PWA)"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <Smartphone className="w-3.5 h-3.5 text-white shrink-0" />
          <span>تثبيت التطبيق 📱</span>
        </button>
      )}

      {/* 6. Ribbon Variant */}
      {variant === 'ribbon' && (
        <div 
          id="pwa-install-ribbon"
          onClick={handleInstallClick}
          className={`cursor-pointer group p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all text-xs font-bold ${className}`}
        >
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-white/20 text-white">
              <Smartphone className="w-4 h-4" />
            </span>
            <span>ثبّت التطبيق كبرنامج مستقل على هاتفك (يعمل كفيسبوك وواتساب)</span>
          </div>
          <span className="px-3 py-1 rounded-lg bg-white text-indigo-950 font-black text-[11px] flex items-center gap-1 group-hover:bg-indigo-50 transition-colors">
            <Download className="w-3 h-3" />
            <span>تثبيت الآن 📱</span>
          </span>
        </div>
      )}

      {/* 7. Interactive Install Guide Modal (Chrome, Edge, Android, iOS & Desktop) */}
      {showInstallGuide && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/75 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn text-right"
          onClick={() => setShowInstallGuide(false)}
        >
          <div 
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-6 overflow-hidden relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3 sm:hidden" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                  <img src="/icon.svg" alt="رادار التاجر الذكي" className="w-9 h-9 object-contain drop-shadow" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
                    <span>تثبيت رادار التاجر الذكي</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                      PWA App
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">ليعمل التطبيق على الهاتف والكمبيوتر تماماً مثل تطبيقات فيسبوك وواتساب</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pe-1">
              {/* Detected Browser Info Badge */}
              <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 font-bold">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">المتصفح المكتشف حالياً:</span>
                    <span className="text-xs font-black text-indigo-950">{browserName}</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700 font-bold shrink-0">
                  {isIOS ? 'نظام iOS' : isAndroid ? 'نظام أندرويد' : 'كمبيوتر / جهاز لوحي'}
                </span>
              </div>

              {/* If browser supports direct prompt */}
              {isInstallable && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-300 text-center space-y-2.5">
                  <div className="flex items-center justify-center gap-2 text-emerald-800 font-black text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>متصفحك جاهز لتثبيت التطبيق بنقرة واحدة الآن!</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleInstallClick();
                      setShowInstallGuide(false);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>تفعيل نافذة التثبيت التلقائي للمتصفح الآن ⚡</span>
                  </button>
                </div>
              )}

              {/* In-App Browser Warning (Facebook, Instagram, WhatsApp) */}
              {isInAppBrowser && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-black text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>تنبيه: متصفح التطبيقات المدمج (فيسبوك / إنستغرام)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    تمنع متصفحات التطبيقات الداخلية إضافة التطبيقات إلى الشاشة الرئيسية. اضغط على أيقونة (⋮ أو ⋯) في زاوية الشاشة ثم اختر <strong>"فتح في Chrome"</strong> أو <strong>"فتح في Safari"</strong> لتتمكن من تثبيته فوراً.
                  </p>
                </div>
              )}

              {/* Notice if running inside iframe */}
              {isInIframe && !isInstallable && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>التثبيت من نافذة مستقلة:</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    تقيد المتصفحات الحديثة نافذة التثبيت التلقائية داخل المعاينة المدمجة. اضغط الزر أدناه لفتح التطبيق في نافذة مستقلة كاملة، وسيظهر لك خيار التثبيت المباشر من جوجل كروم بنقرة واحدة!
                  </p>
                  <button
                    type="button"
                    onClick={openInNewWindow}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>فتح التطبيق في نافذة مستقلة للتثبيت التلقائي ↗</span>
                  </button>
                </div>
              )}

              {/* Platform Selector Tabs */}
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('chrome')}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeGuideTab === 'chrome'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>كروم وأندرويد</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGuideTab('ios')}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeGuideTab === 'ios'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>آيفون وسفاري</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGuideTab('samsung')}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeGuideTab === 'samsung'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>سامسونج وغيرها</span>
                </button>
              </div>

              {/* Instructions: Chrome / Android / PC */}
              {activeGuideTab === 'chrome' && (
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 font-black text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-black">1</span>
                      <span>خطوات التثبيت من متصفح Google Chrome أو Edge:</span>
                    </div>

                    <div className="space-y-2 ps-2 text-[11px] text-slate-700 leading-relaxed">
                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="w-5 h-5 rounded-md bg-slate-900 text-white font-black text-center shrink-0 flex items-center justify-center">⋮</span>
                        <div>
                          <strong className="text-slate-900 font-bold block">الخطوة الأولى:</strong>
                          اضغط على قائمة المتصفح (زر الثلاث نقاط العمودية <strong>⋮</strong>) في الزاوية العلوية أو السفلية للمتصفح.
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-black text-center shrink-0 flex items-center justify-center">
                          <Download className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <strong className="text-slate-900 font-bold block">الخطوة الثانية:</strong>
                          اختر من القائمة: <strong>"تثبيت رادار التاجر" (Install app)</strong> أو <strong>"الإضافة إلى الشاشة الرئيسية"</strong>.
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="w-5 h-5 rounded-md bg-emerald-600 text-white font-black text-center shrink-0 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <strong className="text-slate-900 font-bold block">الخطوة الثالثة:</strong>
                          اضغط <strong>"تثبيت" (Install)</strong>. سيتم إنشاء أيقونة التطبيق على شاشة هاتفك أو سطح المكتب ليعمل كأي تطبيق أصلي مستقل!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions: iOS Safari */}
              {activeGuideTab === 'ios' && (
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 font-black text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-black">1</span>
                      <span>خطوات التثبيت على الآيفون والآيباد (متصفح Safari):</span>
                    </div>

                    <div className="space-y-2 ps-2 text-[11px] text-slate-700 leading-relaxed">
                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-black text-center shrink-0 flex items-center justify-center">
                          <Share2 className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <strong className="text-slate-900 font-bold block">الخطوة الأولى:</strong>
                          اضغط على زر <strong>المشاركة (Share ⎋)</strong> في الشريط السفلي لمتصفح سفاري.
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-black text-center shrink-0 flex items-center justify-center">
                          <PlusSquare className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <strong className="text-slate-900 font-bold block">الخطوة الثانية:</strong>
                          مرر لأسفل القائمة واضغط على <strong>"إضافة إلى الصفحة الرئيسية" (Add to Home Screen ⊞)</strong>.
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="w-5 h-5 rounded-md bg-emerald-600 text-white font-black text-center shrink-0 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <strong className="text-slate-900 font-bold block">الخطوة الثالثة:</strong>
                          اضغط على كلمة <strong>"إضافة" (Add)</strong> في أعلى الزاوية. ستظهر أيقونة رادار التاجر فوراً على شاشة هاتفك!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions: Samsung Internet & Others */}
              {activeGuideTab === 'samsung' && (
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 font-black text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] flex items-center justify-center font-black">1</span>
                      <span>خطوات متصفح سامسونج (Samsung Internet):</span>
                    </div>

                    <div className="space-y-2 ps-2 text-[11px] text-slate-700 leading-relaxed">
                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="w-5 h-5 rounded-md bg-purple-600 text-white font-black text-center shrink-0 flex items-center justify-center">
                          ☰
                        </span>
                        <div>
                          <strong className="text-slate-900 font-bold block">متصفح سامسونج:</strong>
                          اضغط على زر القائمة (☰) بالأسفل ⟵ اضغط <strong>"إضافة صفحة إلى"</strong> ⟵ اختر <strong>"الشاشة الرئيسية"</strong>.
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-white font-black text-center shrink-0 flex items-center justify-center">
                          ⊕
                        </span>
                        <div>
                          <strong className="text-slate-900 font-bold block">متصفحات الكمبيوتر (Edge / Chrome Desktop):</strong>
                          اضغط على أيقونة التثبيت (شاشة مع سهم ⊕) الموجودة في أقصى يسار شريط العنوان بالأعلى.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Native App Comparison / Advantages */}
              <div className="p-3 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>مميزات تجربة التطبيق بعد التثبيت (مثل واتساب وفيسبوك):</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>شاشة كاملة بدون شريط متصفح</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>فتح سريع بلمسة واحدة من شاشتك</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>حفظ بيانات التسعير دون إنترنت</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>إشعارات وتنبيهات فورية للمنافسين</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black cursor-pointer transition-colors"
              >
                حسناً، فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
