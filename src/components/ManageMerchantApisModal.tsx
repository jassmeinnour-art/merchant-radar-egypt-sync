import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Store,
  Globe,
  Server,
  Truck,
  Plus,
  ExternalLink,
  Sparkles,
  Save,
  Radio,
  SlidersHorizontal,
  Check,
  Building
} from 'lucide-react';
import { RemoteMerchantClient, MerchantApiCredentials } from '../types';
import { 
  loadAllRegisteredMerchants, 
  saveAllRegisteredMerchants, 
  updateMerchantCredentials 
} from '../utils/platformLaunchHelper';

interface ManageMerchantApisModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMerchantId?: string;
  onMerchantUpdated?: (merchant: RemoteMerchantClient) => void;
  onShowToast?: (message: string) => void;
  onTriggerOrderSync?: (merchant: RemoteMerchantClient) => void;
}

export const ManageMerchantApisModal: React.FC<ManageMerchantApisModalProps> = ({
  isOpen,
  onClose,
  activeMerchantId,
  onMerchantUpdated,
  onShowToast,
  onTriggerOrderSync
}) => {
  const [merchants, setMerchants] = useState<RemoteMerchantClient[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [activePlatformTab, setActivePlatformTab] = useState<'amazon' | 'noon' | 'bosta' | 'general'>('amazon');
  
  // Merchant Info Form
  const [storeName, setStoreName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [dataMode, setDataMode] = useState<'live' | 'demo'>('live');

  // Amazon SP-API Form
  const [amazonClientId, setAmazonClientId] = useState('');
  const [amazonClientSecret, setAmazonClientSecret] = useState('');
  const [amazonRefreshToken, setAmazonRefreshToken] = useState('');
  const [amazonRegion, setAmazonRegion] = useState('eu-west-1');
  const [amazonMarketplaceId, setAmazonMarketplaceId] = useState('ARBP9OOSHTCHU');
  const [showAmazonSecret, setShowAmazonSecret] = useState(false);
  const [showAmazonToken, setShowAmazonToken] = useState(false);

  // Noon API Form
  const [noonAuthKey, setNoonAuthKey] = useState('');
  const [noonAppId, setNoonAppId] = useState('');
  const [noonSecretKey, setNoonSecretKey] = useState('');
  const [noonWarehouseId, setNoonWarehouseId] = useState('');
  const [showNoonSecret, setShowNoonSecret] = useState(false);

  // Bosta Form
  const [bostaApiKey, setBostaApiKey] = useState('');
  const [showBostaKey, setShowBostaKey] = useState(false);

  // Test Connection State
  const [isTestingAmazon, setIsTestingAmazon] = useState(false);
  const [amazonTestResult, setAmazonTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Add New Merchant Modal Toggle
  const [isAddingNewMerchant, setIsAddingNewMerchant] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('القاهرة');

  // Load merchants on open
  useEffect(() => {
    if (isOpen) {
      const allMerchants = loadAllRegisteredMerchants();
      setMerchants(allMerchants);
      const targetId = activeMerchantId || (allMerchants[0]?.id || '');
      setSelectedMerchantId(targetId);
      populateForm(targetId, allMerchants);
      setAmazonTestResult(null);
    }
  }, [isOpen, activeMerchantId]);

  const populateForm = (merchantId: string, currentList?: RemoteMerchantClient[]) => {
    const list = currentList || merchants;
    const target = list.find(m => m.id === merchantId) || list[0];
    if (!target) return;

    setStoreName(target.storeName || '');
    setContactPerson(target.contactPerson || '');
    setPrimaryEmail(target.primaryEmail || '');
    setPhone(target.phone || '');
    setCity(target.city || '');
    setDataMode(target.dataMode || 'live');

    const creds = target.apiCredentials || {
      amazonClientId: '',
      amazonClientSecret: '',
      amazonRefreshToken: '',
      amazonRegion: 'eu-west-1',
      amazonMarketplaceId: 'ARBP9OOSHTCHU',
      noonAuthKey: '',
      noonAppId: '',
      noonSecretKey: '',
      noonWarehouseId: '',
      bostaApiKey: '',
      dataMode: target.dataMode || 'live'
    };

    setAmazonClientId(creds.amazonClientId || '');
    setAmazonClientSecret(creds.amazonClientSecret || '');
    setAmazonRefreshToken(creds.amazonRefreshToken || '');
    setAmazonRegion(creds.amazonRegion || 'eu-west-1');
    setAmazonMarketplaceId(creds.amazonMarketplaceId || 'ARBP9OOSHTCHU');

    setNoonAuthKey(creds.noonAuthKey || '');
    setNoonAppId(creds.noonAppId || '');
    setNoonSecretKey(creds.noonSecretKey || '');
    setNoonWarehouseId(creds.noonWarehouseId || '');

    setBostaApiKey(creds.bostaApiKey || '');
    setAmazonTestResult(null);
  };

  const handleSelectMerchant = (id: string) => {
    setSelectedMerchantId(id);
    populateForm(id);
  };

  // Test Amazon SP-API connection live
  const handleTestAmazonConnection = async () => {
    if (!amazonClientId.trim() || !amazonClientSecret.trim() || !amazonRefreshToken.trim()) {
      setAmazonTestResult({
        success: false,
        message: 'يرجى إدخال LWA Client ID و Client Secret و Refresh Token أولاً'
      });
      return;
    }

    setIsTestingAmazon(true);
    setAmazonTestResult(null);

    try {
      const res = await fetch('/api/amazon/sp-api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: amazonClientId.trim(),
          clientSecret: amazonClientSecret.trim(),
          refreshToken: amazonRefreshToken.trim(),
          region: amazonRegion
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAmazonTestResult({
          success: true,
          message: data.message || 'تم فحص بيانات الاعتماد بنجاح والاتصال بـ Amazon SP-API يعمل بشكل سليم! 🚀'
        });
        if (onShowToast) onShowToast('✅ تم بنجاح فحص اتصال Amazon SP-API وتأكيد صلاحية المفاتيح!');
      } else {
        setAmazonTestResult({
          success: false,
          message: data.message || 'فشل الاتصال: يرجى التحقق من صحة المفاتيح وصلاحيات التطبيق في أمازون سيلر سنترال'
        });
      }
    } catch (err: any) {
      setAmazonTestResult({
        success: false,
        message: err?.message || 'تعذر الاتصال بخادم الفحص. يرجى التأكد من تشغيل الخادم'
      });
    } finally {
      setIsTestingAmazon(false);
    }
  };

  // Save changes
  const handleSaveCredentials = () => {
    if (!selectedMerchantId) return;

    const list = loadAllRegisteredMerchants();
    const index = list.findIndex(m => m.id === selectedMerchantId);
    if (index === -1) return;

    const current = list[index];
    const updatedCreds: MerchantApiCredentials = {
      amazonClientId: amazonClientId.trim(),
      amazonClientSecret: amazonClientSecret.trim(),
      amazonRefreshToken: amazonRefreshToken.trim(),
      amazonRegion: amazonRegion.trim(),
      amazonMarketplaceId: amazonMarketplaceId.trim() || 'ARBP9OOSHTCHU',
      noonAuthKey: noonAuthKey.trim(),
      noonAppId: noonAppId.trim(),
      noonSecretKey: noonSecretKey.trim(),
      noonWarehouseId: noonWarehouseId.trim(),
      bostaApiKey: bostaApiKey.trim(),
      dataMode,
      isConfigured: Boolean(
        amazonClientId.trim() &&
        amazonClientSecret.trim() &&
        amazonRefreshToken.trim()
      ),
      lastTestedAt: amazonTestResult?.success ? new Date().toISOString() : current.apiCredentials?.lastTestedAt,
      lastTestStatus: amazonTestResult ? (amazonTestResult.success ? 'success' : 'failed') : current.apiCredentials?.lastTestStatus,
      lastTestMessage: amazonTestResult?.message || current.apiCredentials?.lastTestMessage
    };

    const updatedMerchant: RemoteMerchantClient = {
      ...current,
      storeName: storeName.trim() || current.storeName,
      contactPerson: contactPerson.trim() || current.contactPerson,
      primaryEmail: primaryEmail.trim() || current.primaryEmail,
      phone: phone.trim() || current.phone,
      city: city.trim() || current.city,
      dataMode,
      apiCredentials: updatedCreds
    };

    list[index] = updatedMerchant;
    saveAllRegisteredMerchants(list);
    setMerchants(list);

    if (onMerchantUpdated) {
      onMerchantUpdated(updatedMerchant);
    }

    if (onShowToast) {
      onShowToast(`💾 تم بنجاح حفظ إعدادات ومفاتيح الربط للتاجر "${updatedMerchant.storeName}" (${dataMode === 'live' ? 'بيانات حقيقية Live' : 'معاينة تجريبية Demo'})!`);
    }

    // Trigger storage event for cross-component sync
    window.dispatchEvent(new CustomEvent('merchant_credentials_changed', {
      detail: { merchantId: updatedMerchant.id, dataMode, timestamp: Date.now() }
    }));

    onClose();
  };

  // Add new merchant
  const handleAddNewMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      if (onShowToast) onShowToast('⚠️ يرجى كتابة اسم المتجر الجديد');
      return;
    }

    const newId = `merchant-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newMerchant: RemoteMerchantClient = {
      id: newId,
      storeName: newStoreName.trim(),
      contactPerson: newContactPerson.trim() || 'مدير الحساب',
      primaryEmail: newEmail.trim() || `sales@${newStoreName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'store'}.com`,
      additionalEmails: [],
      phone: newPhone.trim() || '+20 10 0000 0000',
      city: newCity.trim() || 'القاهرة',
      platformsSubscribed: ['amazon_eg', 'noon_eg', 'homzmart_eg'],
      assignedProductIds: [],
      weeklySalesTargetEGP: 150000,
      currentWeeklySalesEGP: 0,
      currentWeeklyOrdersCount: 0,
      averageProfitMarginPercent: 25.0,
      buyBoxWinRatePercent: 80,
      reportDayOfWeek: 'thursday',
      autoSendWeeklyReport: true,
      sendWhatsAppReport: true,
      status: 'active',
      dataMode: 'live',
      apiCredentials: {
        amazonClientId: '',
        amazonClientSecret: '',
        amazonRefreshToken: '',
        amazonRegion: 'eu-west-1',
        amazonMarketplaceId: 'ARBP9OOSHTCHU',
        noonAuthKey: '',
        noonAppId: '',
        noonSecretKey: '',
        noonWarehouseId: '',
        bostaApiKey: '',
        dataMode: 'live',
        isConfigured: false
      }
    };

    const currentList = loadAllRegisteredMerchants();
    const updatedList = [newMerchant, ...currentList];
    saveAllRegisteredMerchants(updatedList);
    setMerchants(updatedList);
    setSelectedMerchantId(newId);
    populateForm(newId, updatedList);
    setIsAddingNewMerchant(false);
    setNewStoreName('');
    setNewContactPerson('');
    setNewEmail('');
    setNewPhone('');

    if (onShowToast) {
      onShowToast(`🎉 تم بنجاح تسجيل التاجر الجديد "${newMerchant.storeName}". يمكنك الآن ضبط مفاتيح الربط الخاصة به.`);
    }
  };

  if (!isOpen) return null;

  const currentMerchant = merchants.find(m => m.id === selectedMerchantId);
  const isAmazonConfigured = Boolean(amazonClientId.trim() && amazonClientSecret.trim() && amazonRefreshToken.trim());
  const isNoonConfigured = Boolean(noonAuthKey.trim() && noonAppId.trim());

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white flex items-start justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Key className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black">
                  إدارة حسابات ومفاتيح ربط التجار (Manage Merchant APIs)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  نظام متعدد التجار Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                إدارة مفاتيح واجهات برمجة التطبيقات (Amazon SP-API / Noon API / Bosta) لكل تاجر في المنظومة بشكل مستقل، والتحكم في وضع البيانات الحية مقابل التجريبية.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Merchant Selector Ribbon */}
        <div className="bg-slate-100/90 border-b border-slate-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Store className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700 shrink-0">التاجر المطلوب ضبطه:</span>
            <select
              value={selectedMerchantId}
              onChange={(e) => handleSelectMerchant(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-[200px]"
            >
              {merchants.map((m) => {
                const isLive = m.dataMode === 'live';
                const hasKeys = Boolean(m.apiCredentials?.amazonClientId && m.apiCredentials?.amazonRefreshToken);
                return (
                  <option key={m.id} value={m.id}>
                    🏬 {m.storeName} — ({isLive ? (hasKeys ? '🟢 حقيقي ومضبوط' : '🟡 حقيقي يحتاج مفاتيح') : '🧪 وضع تجريبي Sandbox'})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingNewMerchant(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة متجر تاجر جديد</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* Add New Merchant Modal Overlay inside if triggered */}
          {isAddingNewMerchant && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 sm:p-5 space-y-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800">إضافة متجر تاجر جديد للنظام</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingNewMerchant(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNewMerchant} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم المتجر / العلامة التجارية *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: رويال دمياط للأثاث"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم التاجر / المسؤول</label>
                  <input
                    type="text"
                    placeholder="م. طارق رضوان"
                    value={newContactPerson}
                    onChange={(e) => setNewContactPerson(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني للتاجر</label>
                  <input
                    type="email"
                    placeholder="tarek@royalfurniture.eg"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الواتساب / الهاتف</label>
                  <input
                    type="text"
                    placeholder="01012345678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewMerchant(false)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl font-bold text-slate-700 transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs"
                  >
                    حفظ وإضافة التاجر
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* REQUIREMENT 4: Mock vs Real Data Control Toggle */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    وضع البيانات للتاجر الحالي: <span className="text-indigo-600 font-black font-mono">{storeName || currentMerchant?.storeName}</span>
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  اختر ما إذا كان هذا التاجر يعمل بالسحب الحي للطلبات الحقيقية عبر الـ API أم بوضع المعاينة والتجربة (Sandbox).
                </p>
              </div>

              {/* Mode Badges */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDataMode('live')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border ${
                    dataMode === 'live'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${dataMode === 'live' ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
                  <span>البيانات الحقيقية (Live API Data)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDataMode('demo')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border ${
                    dataMode === 'demo'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${dataMode === 'demo' ? 'bg-white' : 'bg-amber-500'}`} />
                  <span>وضع المعاينة التجريبية (Demo Data)</span>
                </button>
              </div>
            </div>

            {/* Mode Explanatory Notice */}
            {dataMode === 'live' ? (
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">وضع البيانات الحقيقية نشط (Live API Mode): </span>
                  يتم جلب واستيراد الطلبات وحالات الشحن الحقيقية لهذا التاجر حصرياً عبر بيانات اعتماده المدخلة بالأسفل مباشرة من خوادم Amazon SP-API ونون، ولن يتم إظهار أي بيانات عشوائية أو وهمية.
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">وضع المعاينة التجريبية نشط (Demo Sandbox Mode): </span>
                  يتيح هذا الوضع استعراض طلبات أثاث تجريبية ومحاكاة عمليات توليد بوالص الشحن واختبار النظام لهذا التاجر دون الحاجة لمفاتيح سيلر سنترال حية.
                </div>
              </div>
            )}
          </div>

          {/* Platform Tabs Navigation */}
          <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-px">
            <button
              type="button"
              onClick={() => setActivePlatformTab('amazon')}
              className={`pb-3 px-3.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
                activePlatformTab === 'amazon'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>أمازون مصر (Amazon SP-API)</span>
              {isAmazonConfigured ? (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-700 font-bold">مضبوط</span>
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-500">غير مكتمل</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActivePlatformTab('noon')}
              className={`pb-3 px-3.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
                activePlatformTab === 'noon'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>نون مصر (Noon Partner API)</span>
              {isNoonConfigured ? (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-700 font-bold">مضبوط</span>
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-500">اختياري</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActivePlatformTab('bosta')}
              className={`pb-3 px-3.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
                activePlatformTab === 'bosta'
                  ? 'border-rose-600 text-rose-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>شركة الشحن (Bosta Egypt)</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlatformTab('general')}
              className={`pb-3 px-3.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
                activePlatformTab === 'general'
                  ? 'border-slate-800 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>بيانات المتجر والتاجر</span>
            </button>
          </div>

          {/* TAB 1: Amazon SP-API Credentials */}
          {activePlatformTab === 'amazon' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-800">بيانات ربط تطبيق Amazon SP-API الخاص بالتاجر</span>
                  </div>
                  <a
                    href="https://sellercentral.amazon.eg/apps/manage"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 font-semibold"
                  >
                    <span>Amazon Seller Central App Console</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  تُستخدم هذه المفاتيح لجلب الطلبات وحالات الشحن وتحديث أسعار منتجات الأثاث للتاجر المختار ({storeName}) مباشرة عبر بروتوكول OAuth الرسمي لأمازون سيلر سنترال.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* LWA Client ID */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">LWA Client ID (معرف تطبيق أمازون) *</label>
                    <span className="text-[11px] text-slate-400">يبدأ بـ amzn1.application-oa2-client...</span>
                  </div>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="amzn1.application-oa2-client.xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={amazonClientId}
                    onChange={(e) => setAmazonClientId(e.target.value)}
                    className="w-full font-mono text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                  />
                </div>

                {/* Client Secret */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">LWA Client Secret (المفتاح السري للتطبيق) *</label>
                    <button
                      type="button"
                      onClick={() => setShowAmazonSecret(!showAmazonSecret)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      {showAmazonSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showAmazonSecret ? 'إخفاء' : 'إظهار'}</span>
                    </button>
                  </div>
                  <input
                    type={showAmazonSecret ? 'text' : 'password'}
                    dir="ltr"
                    placeholder="amzn1.oa2-cs.v1.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={amazonClientSecret}
                    onChange={(e) => setAmazonClientSecret(e.target.value)}
                    className="w-full font-mono text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                  />
                </div>

                {/* Refresh Token */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">LWA Refresh Token (رمز التجديد الممنوح من التاجر) *</label>
                    <button
                      type="button"
                      onClick={() => setShowAmazonToken(!showAmazonToken)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      {showAmazonToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showAmazonToken ? 'إخفاء' : 'إظهار'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    dir="ltr"
                    placeholder="Atzr|IwEBIBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={amazonRefreshToken}
                    onChange={(e) => setAmazonRefreshToken(e.target.value)}
                    className="w-full font-mono text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                  />
                </div>

                {/* Region */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">سيرفر ونطاق الربط (Region Endpoint)</label>
                  <select
                    value={amazonRegion}
                    onChange={(e) => setAmazonRegion(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-semibold"
                  >
                    <option value="eu-west-1">أوروبا ومصر والشرق الأوسط (eu-west-1) [الافتراضي لمصر]</option>
                    <option value="us-east-1">أمريكا الشمالية (us-east-1)</option>
                    <option value="us-west-2">الشرق الأقصى وآسيا (us-west-2)</option>
                  </select>
                </div>

                {/* Marketplace ID */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">معرف سوق أمازون مصر (Marketplace ID)</label>
                  <input
                    type="text"
                    dir="ltr"
                    disabled
                    value={amazonMarketplaceId}
                    className="w-full font-mono text-xs bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-600 cursor-not-allowed"
                  />
                </div>

              </div>

              {/* Test Amazon Connection Button & Result Panel */}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestAmazonConnection}
                  disabled={isTestingAmazon}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${isTestingAmazon ? 'animate-spin' : ''}`} />
                  <span>{isTestingAmazon ? 'جارٍ فحص الاتصال بسيلر سنترال...' : '⚡ فحص الاتصال الحي بـ Amazon SP-API'}</span>
                </button>

                {amazonTestResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 flex-1 ${
                    amazonTestResult.success 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {amazonTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-medium">{amazonTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Noon Partner API Credentials */}
          {activePlatformTab === 'noon' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-800">بيانات ربط منصة نون مصر (Noon Partner Portal API)</span>
                  </div>
                  <a
                    href="https://login.noon.partners"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 font-semibold"
                  >
                    <span>بوابة شركاء نون</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  تتيح مزامنة طلبات ومخزون الأثاث المعروض على نون مصر، وتحديث كروت المنتجات وتأكيد استلام وتجهيز الشحنات.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-700">Noon Auth Key / API Key</label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={noonAuthKey}
                    onChange={(e) => setNoonAuthKey(e.target.value)}
                    className="w-full font-mono text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Noon App ID</label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="noon_partner_app_eg_..."
                    value={noonAppId}
                    onChange={(e) => setNoonAppId(e.target.value)}
                    className="w-full font-mono text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Noon Warehouse / Fulfillment Center ID</label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="WH-CAI-FURN-01"
                    value={noonWarehouseId}
                    onChange={(e) => setNoonWarehouseId(e.target.value)}
                    className="w-full font-mono text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Noon Secret Key (المفتاح السري)</label>
                    <button
                      type="button"
                      onClick={() => setShowNoonSecret(!showNoonSecret)}
                      className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                    >
                      {showNoonSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showNoonSecret ? 'إخفاء' : 'إظهار'}</span>
                    </button>
                  </div>
                  <input
                    type={showNoonSecret ? 'text' : 'password'}
                    dir="ltr"
                    placeholder="sec_noon_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={noonSecretKey}
                    onChange={(e) => setNoonSecretKey(e.target.value)}
                    className="w-full font-mono text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Bosta Courier API */}
          {activePlatformTab === 'bosta' && (
            <div className="space-y-4">
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-rose-600" />
                    <span className="text-base font-bold text-slate-800">بيانات ربط شركة بوسطة مصر (Bosta Egypt API)</span>
                  </div>
                  <a
                    href="https://business.bosta.co"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 font-semibold"
                  >
                    <span>لوحة تحكم بوسطة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  تُستخدم لإنشاء شحنات بوسطة تلقائياً، وتوليد أرقام التتبع وبوالص الشحن لكل طرد، ومتابعة حالة التسليم لحظة بلحظة.
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Bosta Business API Key</label>
                  <button
                    type="button"
                    onClick={() => setShowBostaKey(!showBostaKey)}
                    className="text-xs text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                  >
                    {showBostaKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showBostaKey ? 'إخفاء' : 'إظهار'}</span>
                  </button>
                </div>
                <input
                  type={showBostaKey ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="bosta_live_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={bostaApiKey}
                  onChange={(e) => setBostaApiKey(e.target.value)}
                  className="w-full font-mono text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-rose-500 outline-none text-slate-800"
                />
              </div>
            </div>
          )}

          {/* TAB 4: General Merchant Store Info */}
          {activePlatformTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم المتجر / الشركة</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">المسؤول / التاجر</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني للتاجر</label>
                  <input
                    type="email"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الهاتف / الواتساب</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">المدينة / المقر الرئيسي للمعارض</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>يتم تخزين المفاتيح محلياً بشكل مشفر وآمن لكل تاجر على حدة دون تداخل.</span>
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 rounded-xl font-bold text-xs text-slate-700 transition cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSaveCredentials}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات ومفاتيح التاجر</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
