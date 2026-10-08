import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingDown, 
  RefreshCw, 
  Check, 
  Copy, 
  Sparkles, 
  X, 
  Volume2, 
  Package, 
  CheckCircle2, 
  Radio, 
  Laptop, 
  Smartphone,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { 
  getBrowserNotificationPermission, 
  getPushSettings, 
  savePushSettings, 
  getStoredFcmToken, 
  requestPushNotificationPermission, 
  sendTestPushNotification, 
  getPushNotificationHistory, 
  clearPushNotificationHistory,
  FcmPushSettings,
  PushNotificationRecord 
} from '../services/fcmNotificationService';
import confetti from 'canvas-confetti';

interface PushNotificationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onPlayAlertSound?: () => void;
  language?: 'ar' | 'en';
}

export const PushNotificationManagerModal: React.FC<PushNotificationManagerModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onPlayAlertSound,
  language = 'ar'
}) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [settings, setSettings] = useState<FcmPushSettings>(getPushSettings());
  const [fcmToken, setFcmToken] = useState<string | null>(getStoredFcmToken());
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<PushNotificationRecord[]>([]);
  const [testingType, setTestingType] = useState<string | null>(null);

  const isAr = language === 'ar';

  useEffect(() => {
    if (isOpen) {
      setPermission(getBrowserNotificationPermission());
      setSettings(getPushSettings());
      setFcmToken(getStoredFcmToken());
      setHistory(getPushNotificationHistory());
    }
  }, [isOpen]);

  useEffect(() => {
    const handlePushReceived = (e: any) => {
      const record = e.detail;
      if (record) {
        setHistory(prev => [record, ...prev].slice(0, 50));
      }
    };
    window.addEventListener('merchant-radar-push-received', handlePushReceived);
    return () => {
      window.removeEventListener('merchant-radar-push-received', handlePushReceived);
    };
  }, []);

  if (!isOpen) return null;

  const handleToggleSetting = (key: keyof FcmPushSettings) => {
    const nextVal = !settings[key];
    const updated = savePushSettings({ [key]: nextVal });
    setSettings(updated);
    onShowToast(isAr ? 'تم تحديث تفضيلات التنبيهات بنجاح ✅' : 'Push notification settings updated ✅');
  };

  const handleEnablePush = async () => {
    setIsRequesting(true);
    try {
      const res = await requestPushNotificationPermission();
      setPermission(res.permission);
      if (res.success && res.token) {
        setFcmToken(res.token);
        setSettings(getPushSettings());
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.3 } });
        onShowToast(
          isAr
            ? 'تم تفعيل تنبيهات المتصفح الفورية (FCM) بنجاح 🔔 ستصلك الإشعارات حتى عند إغلاق التطبيق!'
            : 'FCM Push Notifications enabled successfully 🔔'
        );
      } else if (res.error) {
        onShowToast(res.error);
      }
    } catch (err: any) {
      onShowToast(err?.message || (isAr ? 'تعذر تفعيل الإشعارات' : 'Failed to enable notifications'));
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCopyToken = () => {
    if (!fcmToken) return;
    navigator.clipboard.writeText(fcmToken);
    setIsCopied(true);
    onShowToast(isAr ? 'تم نسخ رمز الجهاز (FCM Token) إلى الحافظة 📋' : 'FCM Token copied to clipboard 📋');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSendTest = async (type: 'competitor_price' | 'sync_error' | 'inventory_reorder') => {
    setTestingType(type);
    if (onPlayAlertSound && settings.notifySoundEnabled) {
      onPlayAlertSound();
    }
    const success = await sendTestPushNotification(type);
    if (success) {
      onShowToast(
        isAr 
          ? 'تم إرسال الإشعار التجريبي الفوري بنجاح 🚀 تحقق من نافذة المتصفح/الشاشة' 
          : 'Test push notification sent successfully 🚀'
      );
      setHistory(getPushNotificationHistory());
    } else {
      onShowToast(
        isAr 
          ? 'يرجى تفعيل صلاحية الإشعارات أولاً لتتمكن من استقبال التنبيهات التجريبية' 
          : 'Please grant notification permission first'
      );
    }
    setTimeout(() => setTestingType(null), 800);
  };

  const handleClearHistory = () => {
    clearPushNotificationHistory();
    setHistory([]);
    onShowToast(isAr ? 'تم إفراغ سجل الإشعارات 🗑️' : 'Notification history cleared 🗑️');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 shadow-inner">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black font-['Alexandria'] text-white">
                  {isAr ? 'نظام تنبيهات المتصفح الفورية' : 'Browser Push Notifications (FCM)'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  Firebase Cloud Messaging
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {isAr
                  ? 'إشعارات لحظية لأسعار المنافسين وأعطال الـ API حتى عند إغلاق التطبيق'
                  : 'Real-time alerts for competitor pricing & API outages even when the app is closed'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">

          {/* Status Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            permission === 'granted'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : permission === 'denied'
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                permission === 'granted'
                  ? 'bg-emerald-500 text-white'
                  : permission === 'denied'
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}>
                {permission === 'granted' ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : permission === 'denied' ? (
                  <BellOff className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm">
                    {permission === 'granted'
                      ? (isAr ? 'الإشعارات مفعلة ومصرح بها 🟢' : 'Push Notifications Active 🟢')
                      : permission === 'denied'
                      ? (isAr ? 'الإشعارات محظورة في إعدادات المتصفح 🔴' : 'Notifications Blocked 🔴')
                      : (isAr ? 'بانتظار منح إذن المتصفح 🟡' : 'Permission Required 🟡')}
                  </span>
                </div>
                <p className="text-xs opacity-90 mt-0.5">
                  {permission === 'granted'
                    ? (isAr ? 'المتصفح متصل بـ Firebase Service Worker وجاهز لاستقبال التنبيهات في الخلفية.' : 'Browser connected to Firebase Service Worker and ready.')
                    : permission === 'denied'
                    ? (isAr ? 'يرجى النقر على أيقونة القفل بجانب رابط الموقع في المتصفح وتفعيل "الإشعارات".' : 'Please enable notifications from your browser site settings.')
                    : (isAr ? 'انقر على الزر بالأسفل لمنح إذن الإشعارات واستقبال التنبيهات اللحظية.' : 'Click below to grant notification permission.')}
                </p>
              </div>
            </div>

            {permission !== 'granted' && (
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={isRequesting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                {isRequesting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <BellRing className="w-4 h-4" />
                )}
                <span>{isAr ? 'تفعيل تنبيهات المتصفح ⚡' : 'Enable Push Notifications ⚡'}</span>
              </button>
            )}
          </div>

          {/* FCM Device Token & Cloud Sync Box */}
          {fcmToken && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200">
                    {isAr ? 'معرّف جهاز التاجر في FCM (Registration Token)' : 'FCM Device Token'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرمز' : 'Copy')}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 break-all select-all border border-slate-800/80">
                {fcmToken}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {isAr 
                    ? 'يتم مزامنة هذا الرمز سحابياً مع ملف التاجر في Firestore لإرسال إشعارات مخصصة عبر السحابة.' 
                    : 'This token is synchronized to your Firestore profile for targeted cloud messaging.'}
                </span>
              </p>
            </div>
          )}

          {/* Notification Categories Toggles */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'فئات الإشعارات المستهدفة' : 'Alert Trigger Categories'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Competitor Price Alerts */}
              <div 
                onClick={() => handleToggleSetting('notifyOnCompetitorPriceChange')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  settings.notifyOnCompetitorPriceChange
                    ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                    : 'bg-slate-50 border-slate-200 text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">
                      {isAr ? 'هبوط وتغير أسعار المنافسين' : 'Competitor Price Shifts'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isAr ? 'أمازون، نون، جوميا، والأسواق' : 'Amazon, Noon, Jumia alerts'}
                    </span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.notifyOnCompetitorPriceChange} 
                  readOnly 
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" 
                />
              </div>

              {/* API Sync Outage Alerts */}
              <div 
                onClick={() => handleToggleSetting('notifyOnPlatformSyncError')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  settings.notifyOnPlatformSyncError
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : 'bg-slate-50 border-slate-200 text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">
                      {isAr ? 'أعطال وانقطاع مزامنة الـ API' : 'API Sync Outages'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isAr ? 'انتهاء التوكنز وأخطاء HTTP' : 'Token expiration & HTTP errors'}
                    </span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.notifyOnPlatformSyncError} 
                  readOnly 
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4" 
                />
              </div>

              {/* Low Stock & Reorder Alerts */}
              <div 
                onClick={() => handleToggleSetting('notifyOnInventoryReorder')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  settings.notifyOnInventoryReorder
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">
                      {isAr ? 'انخفاض المخزون ونقاط الطلب' : 'Low Stock & Reorder Points'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isAr ? 'تنبيه وصول المنتجات للحد الأدنى' : 'Alert when reaching threshold'}
                    </span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.notifyOnInventoryReorder} 
                  readOnly 
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4" 
                />
              </div>

              {/* Sound Synchronization */}
              <div 
                onClick={() => handleToggleSetting('notifySoundEnabled')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  settings.notifySoundEnabled
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">
                      {isAr ? 'تزامن التنبيه الصوتي الحصري' : 'Audio Notification Sync'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isAr ? 'نغمات رنين مميزة مع كل إشعار' : 'Synthesized audio chime'}
                    </span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.notifySoundEnabled} 
                  readOnly 
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4" 
                />
              </div>
            </div>
          </div>

          {/* Test Push Notifications Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  {isAr ? 'اختبار الإرسال الفوري لمتصفحك' : 'Live Push Simulation Test'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {isAr 
                    ? 'أرسل إشعاراً حقيقياً فورياً لاختبار صوت واهتزاز الإشعارات على جهازك أو هاتفك' 
                    : 'Send a simulated native notification to test audio and vibration'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleSendTest('competitor_price')}
                disabled={Boolean(testingType)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <TrendingDown className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isAr ? 'تجربة إشعار هبوط سعر منافس 📉' : 'Test Competitor Drop Alert 📉'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendTest('sync_error')}
                disabled={Boolean(testingType)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>{isAr ? 'تجربة إشعار عطل مزامنة API 🚨' : 'Test API Outage Alert 🚨'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendTest('inventory_reorder')}
                disabled={Boolean(testingType)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span>{isAr ? 'تجربة إشعار مخزون حرج 📦' : 'Test Low Stock Alert 📦'}</span>
              </button>
            </div>
          </div>

          {/* Background Work / Service Worker Info Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
            <Laptop className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-black block">
                {isAr ? 'كيف تعمل الإشعارات والتطبيق مغلق؟' : 'How Background Push Works'}
              </span>
              <p className="text-[11.5px] text-slate-600 leading-relaxed">
                {isAr
                  ? 'بمجرد منح الإذن، يقوم التطبيق بتسجيل Service Worker مخصص (/firebase-messaging-sw.js) يتصل بسيرفرات Firebase Cloud Messaging. عندما يقوم راصد الأسعار برصد هبوط سعر في السوق أو تعثر توكن البائع، يتم إيقاظ المتصفح وعرض التنبيه فوراً حتى لو كان الموقع مغلقاً.'
                  : 'Once permission is granted, Firebase Service Worker listens in the background. When prices shift or an API disconnects, native push notifications are immediately dispatched to your operating system.'}
              </p>
            </div>
          </div>

          {/* Recent Push Notifications Audit Log */}
          {history.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">
                  {isAr ? `سجل الإشعارات المستلمة مؤخراً (${history.length})` : `Recent Notification History (${history.length})`}
                </span>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{isAr ? 'مسح السجل' : 'Clear log'}</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 truncate">{item.title}</span>
                        {item.platform && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold shrink-0">
                            {item.platform}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{item.body}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>FCM Ready • Web Push 2.0</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            {isAr ? 'تم وحفظ الإعدادات' : 'Done & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
