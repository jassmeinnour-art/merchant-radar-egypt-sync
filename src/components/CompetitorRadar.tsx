import React, { useState } from 'react';
import { 
  TrendingDown, 
  TrendingUp,
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Sparkles,
  ShoppingBag,
  Percent,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Tag,
  Bookmark,
  Bell,
  Camera,
  Image as ImageIcon,
  BarChart3,
  Archive,
  FileSpreadsheet,
  Clock,
  Palette,
  Upload,
  Volume2,
  Truck,
  Flame
} from 'lucide-react';
import { ProductData, MerchantOffer } from '../types';
import { isFurnitureOrBedding } from '../utils/competitorCSVManager';
import { ProfitMarginCalculator } from './ProfitMarginCalculator';
import { CompetitorPriceHistoryChart } from './CompetitorPriceHistoryChart';
import { SmartDynamicPricingPanel } from './SmartDynamicPricingPanel';
import {
  getOrCreatePricingPlan,
  evaluateSmartDynamicPrice,
  applySmartDynamicPricingToPlan,
  recordSmartDynamicPricingLog,
  getDynamicPricingRuleLabel,
} from '../data/pricingGuardrailsData';
import { exportSingleProductFullAuditCSV } from '../utils/csvProductManager';
import { useTheme } from '../context/ThemeContext';
import { useAudioNotifications } from '../context/AudioNotificationContext';

interface CompetitorRadarProps {
  product: ProductData | null | undefined;
  allProducts?: ProductData[];
  currency: string;
  selectedDiscount: number;
  setSelectedDiscount: (discount: number) => void;
  onApplyWinningPrice: (calculatedWinningPrice: number, discountValue: number) => void;
  onAutoAdjustProductPrice?: (
    productId: string,
    newMerchantPrice: number,
    updatedCompetitorPrice?: number,
    competitorName?: string,
    reasonLabel?: string
  ) => void;
  onBulkAutoAdjustAllProducts?: (
    adjustments: { productId: string; newPrice: number; guardrailStatus: string }[]
  ) => void;
  onNavigateToGuardrails?: () => void;
  onOpenRepriceModal: () => void;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (product: ProductData) => void;
  onOpenAlertModal?: (product: ProductData) => void;
  onArchiveProduct?: (product: ProductData) => void;
  onOpenStudio?: () => void;
  onOpenBulkReprice?: () => void;
  onOpenPeriodicReports?: () => void;
  onOpenProfitSimulator?: () => void;
  onOpenSalesDashboard?: () => void;
  onShowToast?: (msg: string) => void;
  onOpenChannelCompetitorImport?: (platformCode?: string) => void;
  onOpenGenerateWaybillModal?: (product: ProductData) => void;
  onOpenBestSellersModal?: () => void;
}

// Safe Badge for displaying merchant/store logo or emoji
const MerchantLogoBadge: React.FC<{
  logo?: string;
  merchantName?: string;
  platformName?: string;
}> = ({ logo, merchantName, platformName }) => {
  const isUrl =
    Boolean(logo) &&
    (logo!.startsWith('http://') ||
      logo!.startsWith('https://') ||
      logo!.startsWith('/') ||
      logo!.startsWith('data:image/'));

  if (isUrl) {
    return (
      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
        <img
          src={logo}
          alt={merchantName || 'شعار المتجر'}
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Determine fallback emoji/icon
  const getFallbackIcon = () => {
    if (logo && logo.length <= 4) return logo;
    const name = `${merchantName || ''} ${platformName || ''}`.toLowerCase();
    if (name.includes('amazon') || name.includes('أمازون')) return '🛒';
    if (name.includes('noon') || name.includes('نون')) return '🟡';
    if (name.includes('jumia') || name.includes('جوميا')) return '🟠';
    if (name.includes('btech') || name.includes('بي تك') || name.includes('b.tech')) return '🔵';
    if (name.includes('2b') || name.includes('كمبيوتر')) return '💻';
    if (name.includes('knz') || name.includes('كنز')) return '🏷️';
    if (name.includes('homzmart') || name.includes('هومزمارت')) return '🛋️';
    if (name.includes('elaraby') || name.includes('العربي')) return '🏭';
    return '🏬';
  };

  return (
    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs text-base select-none">
      {getFallbackIcon()}
    </div>
  );
};

export const CompetitorRadar: React.FC<CompetitorRadarProps> = ({
  product,
  allProducts = [],
  currency,
  selectedDiscount,
  setSelectedDiscount,
  onApplyWinningPrice,
  onAutoAdjustProductPrice,
  onBulkAutoAdjustAllProducts,
  onNavigateToGuardrails,
  onOpenRepriceModal,
  isWatchlisted = false,
  onToggleWatchlist,
  onOpenAlertModal,
  onArchiveProduct,
  onOpenStudio,
  onOpenBulkReprice,
  onOpenPeriodicReports,
  onOpenProfitSimulator,
  onOpenSalesDashboard,
  onShowToast,
  onOpenChannelCompetitorImport,
  onOpenGenerateWaybillModal,
  onOpenBestSellersModal
}) => {
  const { currentTheme, setIsThemeModalOpen } = useTheme();
  const { playCompetitorStatusSound, setActiveGlobalSettingsTab } = useAudioNotifications();
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  // Track out-of-stock simulation overrides per offer
  const [stockOverrides, setStockOverrides] = useState<Record<string, boolean>>({});

  const handleToggleCompetitorStock = (offer: MerchantOffer) => {
    const currentStatus = stockOverrides[offer.id] !== undefined ? stockOverrides[offer.id] : true;
    const nextStatus = !currentStatus;
    
    setStockOverrides(prev => ({ ...prev, [offer.id]: nextStatus }));

    if (!nextStatus) {
      // Competitor is now OUT OF STOCK -> trigger custom competitor alert sound & Smart Dynamic Pricing if enabled!
      playCompetitorStatusSound();
      if (product) {
        const plan = getOrCreatePricingPlan(product);
        if (plan.autoRepriceWithinBounds && plan.autoRaiseOnStockoutOrSurge !== false) {
          const evalRes = evaluateSmartDynamicPrice(
            product,
            plan,
            offer.price,
            offer.merchantName,
            offer.platformName,
            true
          );
          applySmartDynamicPricingToPlan(plan, evalRes, `تعديل تلقائي عند نفاد مخزون المنافس (${offer.merchantName})`);
          recordSmartDynamicPricingLog({
            id: `sdp-stockout-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            productId: product.id,
            productTitle: product.title,
            triggerReasonAr: `نفاد مخزون المنافس (${offer.merchantName}) — رفع السعر للسقف الأعلى`,
            competitorName: offer.merchantName,
            competitorPlatform: offer.platformName || 'منصة منافسة',
            previousCompetitorPrice: offer.price,
            newCompetitorPrice: offer.price,
            previousMerchantPrice: evalRes.previousSellingPrice,
            rawTargetPrice: evalRes.rawCalculatedPrice,
            newMerchantPrice: evalRes.finalApprovedPrice,
            floorPriceGuardrail: evalRes.effectiveFloorPrice,
            ceilingPriceGuardrail: evalRes.effectiveCeilingPrice,
            netProfitEGP: evalRes.netProfitEGP,
            netMarginPercent: evalRes.netMarginPercent,
            guardrailStatus: evalRes.guardrailStatus,
            ruleAppliedLabel: getDynamicPricingRuleLabel(plan.repriceRuleType, plan.undercutMode, plan.undercutValue, plan.targetNetMarginPercent),
            platformsUpdatedCount: plan.platformGuardrails.length,
          });
          if (onAutoAdjustProductPrice) {
            onAutoAdjustProductPrice(product.id, evalRes.finalApprovedPrice, undefined, offer.merchantName, 'رفع تلقائي للسقف عند نفاد مخزون المنافس');
          } else {
            onApplyWinningPrice(evalRes.finalApprovedPrice, selectedDiscount);
          }
        }
      }
      if (onShowToast) {
        onShowToast(`⚠️ نفاد مخزون المنافس [${offer.merchantName}]! قام التسعير الديناميكي الذكي برفع سعرك تلقائياً نحو السقف الأعلى لتعظيم الربح 🏆`);
      }
    } else {
      // Returned in stock
      playCompetitorStatusSound();
      if (onShowToast) {
        onShowToast(`تمت استعادة حالة توفر منتج المنافس [${offer.merchantName}] بالمخزن وإعادة موازنة السعر الديناميكي 📦`);
      }
    }
  };

  if (!product) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
          <Zap className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 font-['Alexandria']">لا توجد منتجات مسجلة حالياً، يرجى المزامنة</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          لم يتم ربط أو مزامنة أي منتجات فعلية من متجرك على منصات التجارة الإلكترونية بعد. قم بالمزامنة الحية أو استعرض قائمة أفضل المنتجات مبيعاً على المنصات لإضافتها لقائمة المتابعة بضغطة زر.
        </p>
        {onOpenBestSellersModal && (
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              id="btn-radar-empty-open-bestsellers"
              onClick={onOpenBestSellersModal}
              className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-black font-['Alexandria'] flex items-center gap-2 shadow-lg shadow-amber-500/20 border border-amber-400 transition-all cursor-pointer active:scale-95"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>عرض أفضل المنتجات مبيعاً (Best Sellers) وإضافتها للمتابعة 🔥</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  const isFurniture = isFurnitureOrBedding(product);
  const rawOffers = product.merchantOffers || [];
  
  // Strict Category Filter: Reject any dummy headphone or audio offers on furniture products
  const merchantOffers = isFurniture
    ? rawOffers.filter(offer => {
        const lower = ((offer.merchantName || '') + ' ' + (offer.warranty || '')).toLowerCase();
        return !lower.includes('سماع') && !lower.includes('headphone') && 
               !lower.includes('soundcore') && !lower.includes('أنكر') && !lower.includes('q30');
      })
    : rawOffers;

  const specs = product.specs || [];

  // Find lowest competitor offer
  const lowestOffer = merchantOffers.length > 0 
    ? merchantOffers.reduce((prev, curr) => curr.price < prev.price ? curr : prev, merchantOffers[0])
    : null;

  const lowestPrice = lowestOffer?.price || product.currentLowestPrice || 2500;
  const wholesaleCost = product.estimatedWholesaleCost || 2000;

  // Calculate winning price based on selected discount
  const winningPrice = Math.round(lowestPrice * (1 - selectedDiscount / 100));
  const profitMargin = winningPrice - wholesaleCost;
  const profitMarginPercent = winningPrice > 0 ? Math.round((profitMargin / winningPrice) * 100) : 0;
  const discountSavingsAmount = lowestPrice - winningPrice;

  const filteredOffers = merchantOffers.filter(offer => {
    if (filterPlatform === 'all') return true;
    return offer.platform === filterPlatform;
  });

  const discountPresets = [
    { value: 2, label: '-2%', desc: 'أقل بفارق بسيط' },
    { value: 5, label: '-5%', desc: 'الخيار الذهبي (Buy Box)' },
    { value: 10, label: '-10%', desc: 'خصم هجومي قوي' },
    { value: 15, label: '-15%', desc: 'تصفية سريعة' },
  ];

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      
      {/* Spotlight: 1-Click Lowest Price Winning Box (البوكس الرئيسي للتسعير التنافسي) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-indigo-500/30 relative overflow-hidden">
        
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          
          {/* Header row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  رادار التسعير التنافسي الذكي
                </span>
                <span className="text-xs text-slate-400">
                  السوق المصري • محدث الآن
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight font-['Alexandria'] text-white">
                {product.title}
              </h2>
              <p className="text-xs text-slate-300">
                الماركة: <strong className="text-indigo-300">{product.brand}</strong> | الموديل: <strong className="text-indigo-300">{product.model}</strong> | الباركود: <strong className="text-slate-300">{product.barcode || '62288990011'}</strong>
              </p>
            </div>

            {/* Product Thumbnail, SKU Badge & Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-2.5 rounded-2xl border border-white/10">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-14 h-14 rounded-xl object-cover border border-white/10"
                />
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">رمز المنتج (SKU)</div>
                  <div className="text-xs font-mono font-bold text-indigo-200">{product.sku || 'SKU-EG-8821'}</div>
                  <div className="text-[11px] font-bold text-emerald-400 mt-0.5">ثقة التطابق 99.2%</div>
                </div>
              </div>

              {/* Watchlist, Alert & Camera Studio Fast Buttons */}
              <div className="flex flex-wrap sm:flex-col gap-1.5">
                {onOpenBestSellersModal && (
                  <button
                    type="button"
                    id="btn-radar-open-bestsellers-modal"
                    onClick={onOpenBestSellersModal}
                    className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400 text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20"
                    title="عرض قائمة أفضل المنتجات مبيعاً على المنصات وإضافتها لقائمة المتابعة بضغطة زر"
                  >
                    <Flame className="w-3.5 h-3.5 fill-slate-950" />
                    <span>أفضل المنتجات مبيعاً (Best Sellers) 🔥</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    const el = document.getElementById('competitor-price-history-chart-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="h-8 px-3 rounded-xl bg-gradient-to-r from-amber-500/25 to-orange-500/25 hover:from-amber-500/35 hover:to-orange-500/35 text-amber-200 border border-amber-400/50 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="النزول مباشرة للرسم البياني التفاعلي لتاريخ تغيرات أسعار المنافسين وسلوك السوق"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>تاريخ وسلوك الأسعار 📉</span>
                </button>

                {onOpenSalesDashboard && (
                  <button
                    onClick={onOpenSalesDashboard}
                    className="h-8 px-3 rounded-xl bg-gradient-to-r from-indigo-500/30 via-blue-500/30 to-teal-500/30 hover:from-indigo-500/40 hover:to-teal-500/40 text-cyan-200 border border-cyan-400/50 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="فتح لوحة تحكم أداء المبيعات ومقارنتها بتغير أسعار المنافسين"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-cyan-300" />
                    <span>لوحة أداء المبيعات والتسعير 📈</span>
                  </button>
                )}

                {onOpenProfitSimulator && (
                  <button
                    onClick={onOpenProfitSimulator}
                    className="h-8 px-3 rounded-xl bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-blue-500/30 hover:from-purple-500/40 hover:to-blue-500/40 text-purple-200 border border-purple-400/50 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="فتح محاكي الربح المستقبلي والنمذجة التنبؤية لاستراتيجيات التسعير"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-purple-300" />
                    <span>محاكي الربح المستقبلي 💎</span>
                  </button>
                )}

                {onOpenPeriodicReports && (
                  <button
                    onClick={onOpenPeriodicReports}
                    className="h-8 px-3 rounded-xl bg-gradient-to-r from-blue-500/30 to-indigo-500/30 hover:from-blue-500/40 hover:to-indigo-500/40 text-blue-200 border border-blue-500/50 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="عرض تقارير الأداء الدورية ورسوم الـ Buy Box البيانية المتقدمة"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-blue-300" />
                    <span>تقارير الأداء ومخططات الـ Buy Box 📊</span>
                  </button>
                )}

                {onOpenBulkReprice && (
                  <button
                    onClick={onOpenBulkReprice}
                    className="h-8 px-3 rounded-xl bg-gradient-to-r from-emerald-500/30 to-teal-500/30 hover:from-emerald-500/40 hover:to-teal-500/40 text-emerald-200 border border-emerald-500/50 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="التحديث الجماعي للأسعار لكافة المنتجات أو رفع ملف CSV"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>التحديث الجماعي للأسعار (CSV) 🚀</span>
                  </button>
                )}

                {onOpenStudio && (
                  <button
                    onClick={onOpenStudio}
                    className="h-8 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="فتح استوديو تصميم زوايا المنتج والكاميرا"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                    <span>استوديو الكاميرا والزوايا 📸</span>
                  </button>
                )}

                {onToggleWatchlist && (
                  <button
                    onClick={() => onToggleWatchlist(product)}
                    className={`h-8 px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isWatchlisted
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-slate-950' : ''}`} />
                    <span>{isWatchlisted ? 'في قائمة المتابعة ✓' : 'حفظ بالمتابعة'}</span>
                  </button>
                )}

                {onOpenAlertModal && (
                  <button
                    onClick={() => onOpenAlertModal(product)}
                    className="h-8 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تنبيه واتساب</span>
                  </button>
                )}

                {onArchiveProduct && (
                  <button
                    onClick={() => onArchiveProduct(product)}
                    className="h-8 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="أرشفة هذا المنتج وعزله عن القوائم النشطة"
                  >
                    <Archive className="w-3.5 h-3.5 text-amber-400" />
                    <span>أرشفة الصنف 🗄️</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Intelligence Hero Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Box 1: Current Lowest Market Price */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm space-y-1.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                أرخص سعر منافس في السوق المصري
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-300">
                  {lowestPrice.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-300">{currency}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                لدى: <strong className="text-white">{lowestOffer?.merchantName}</strong> ({lowestOffer?.deliveryTime})
              </div>
            </div>

            {/* Box 2: Wholesale Cost Reference */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm space-y-1.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                تكلفة الجملة المقدرة (شارع عبد العزيز / البستان)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-blue-300">
                  {wholesaleCost.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-300">{currency}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                أقل كمية طلب: <strong className="text-white">3-5 قطع كاش</strong>
              </div>
            </div>

            {/* Box 3: Your Winning Undercut Price (التسعير الذكي لتاجرنا) */}
            <div className="bg-emerald-500/15 border-2 border-emerald-400/60 rounded-2xl p-4 backdrop-blur-md space-y-1.5 shadow-lg shadow-emerald-950/40">
              <span className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                سعر بيعك الرابح المقترح (أقل من أرخص منافس)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {winningPrice.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-200">{currency}</span>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md mr-auto">
                  وفر للزبون {discountSavingsAmount.toLocaleString()} {currency}
                </span>
              </div>
              <div className="text-[11px] text-emerald-200 flex items-center justify-between">
                <span>صافي ربحك: <strong>+{profitMargin.toLocaleString()} {currency}</strong></span>
                <span className="font-bold">هامش: {profitMarginPercent}%</span>
              </div>
            </div>

          </div>

          {/* 1-Click Undercut & Discount Selector Controls */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/70">
            
            {/* Discount Percent Buttons */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Percent className="w-3 h-3 text-indigo-400" />
                اختر نسبة الخصم المرغوبة تحت أرخص منافس:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {discountPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setSelectedDiscount(preset.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedDiscount === preset.value
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30 scale-105'
                        : 'bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600'
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className="text-[10px] opacity-75 mr-1 hidden md:inline">({preset.desc})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 1-Click Reprice & Apply Button - High Contrast Emerald */}
            <button
              onClick={() => onApplyWinningPrice(winningPrice, selectedDiscount)}
              className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 border border-emerald-500/50 transition-all cursor-pointer shrink-0"
            >
              <Zap className="w-4 h-4 text-white fill-white" />
              <span>اعتماد السعر ({winningPrice.toLocaleString()} {currency}) وتجهيز النشر</span>
            </button>

            {/* Generate Shipping Waybill Button for Active Product */}
            {onOpenGenerateWaybillModal && product && (
              <button
                type="button"
                onClick={() => onOpenGenerateWaybillModal(product)}
                className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-300 hover:text-emerald-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md border border-emerald-500/40 transition-all cursor-pointer shrink-0"
                title="توليد بوليصة شحن فورية لهذا المنتج وجدولتها وربطها بالمخزون"
              >
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>توليد بوليصة شحن 🚚</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Smart Dynamic Pricing & Profit Guardrails Autopilot Engine (التسعير الديناميكي الذكي المرتبط بقواعد حماية الأرباح) */}
      <SmartDynamicPricingPanel
        product={product}
        allProducts={allProducts}
        currency={currency}
        onAutoAdjustProductPrice={(productId, newMerchantPrice, updatedCompetitorPrice, competitorName, reasonLabel) => {
          if (onAutoAdjustProductPrice) {
            onAutoAdjustProductPrice(productId, newMerchantPrice, updatedCompetitorPrice, competitorName, reasonLabel);
          } else {
            onApplyWinningPrice(newMerchantPrice, selectedDiscount);
          }
        }}
        onBulkAutoAdjustAllProducts={onBulkAutoAdjustAllProducts}
        onNavigateToGuardrails={onNavigateToGuardrails}
        onShowToast={onShowToast}
      />

      {/* Embedded Profit Margin & Operational Fees Calculator (آلة حاسبة لهامش الربح والرسوم وتقارير الأداء) */}
      <ProfitMarginCalculator
        product={product}
        currency={currency}
        winningPrice={winningPrice}
        selectedDiscount={selectedDiscount}
        onApplyCustomPrice={(price) => {
          onApplyWinningPrice(price, selectedDiscount);
          if (onShowToast) onShowToast(`تم اعتماد السعر ${price.toLocaleString()} ${currency} وتحديث الرادار`);
        }}
        onShowToast={onShowToast}
      />

      {/* Competitor Price History Interactive Chart (تاريخ تغيرات وسلوك أسعار المنافسين عبر الزمن) */}
      <CompetitorPriceHistoryChart
        product={product}
        currency={currency}
        winningPrice={winningPrice}
        onApplyWinningPrice={onApplyWinningPrice}
        onShowToast={onShowToast}
      />

      {/* Competitor Platforms Comparison Table & Cards (جدول مقارنة المنافسين المباشر) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md space-y-5 text-slate-100" id="competitor-comparison-table-section">
        
        {/* Table Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-black text-white font-['Alexandria']">
                جدول مقارنة المنافسين المباشر (Direct Competitor Live Table)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              مقارنة فورية لأعمدة (اسم المنافس، سعر البيع الحالي، مدة الشحن، تقييم البائع) مع تظليل تلقائي ذكي لأفضل سعر في مصر
            </p>
          </div>

          {/* Platform Filters & Export */}
          <div className="flex flex-wrap items-center gap-1.5">
            {onOpenChannelCompetitorImport && (
              <button
                type="button"
                onClick={() => onOpenChannelCompetitorImport(filterPlatform !== 'all' ? filterPlatform : undefined)}
                id="btn-radar-import-competitor-csv"
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="استيراد قائمة منافسين جديدة عبر ملف CSV لقناة بيع محددة ودمجهم بالرادار فوراً"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>استيراد منافسين (CSV) 📥</span>
              </button>
            )}

            <button
              onClick={() => {
                exportSingleProductFullAuditCSV(product);
                if (onShowToast) onShowToast(`تم تصدير تدقيق منتج ${product.title.substring(0, 20)}... إلى ملف Excel / CSV 📊`);
              }}
              id="btn-export-single-product-radar-csv"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="تصدير بيانات وأسعار المنافسين وسجل التغيرات لهذا المنتج إلى Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>تصدير تقرير المنتج (Excel)</span>
            </button>

            {/* Theme Colors Switcher Button */}
            <button
              type="button"
              onClick={() => {
                setActiveGlobalSettingsTab('theme');
                setIsThemeModalOpen(true);
              }}
              id="btn-radar-theme-customize"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="تخصيص الألوان الرئيسية لرادار الأسعار ولوحة التحكم (Primary Colors)"
            >
              <span 
                className="w-2.5 h-2.5 rounded-full inline-block border border-black/10 shrink-0" 
                style={{ backgroundColor: currentTheme.primaryHex }}
              />
              <Palette className="w-3.5 h-3.5 text-slate-600" />
              <span>ألوان الرادار</span>
            </button>

            {/* Competitor Audio Notifications Button */}
            <button
              type="button"
              onClick={() => {
                setActiveGlobalSettingsTab('audio');
                setIsThemeModalOpen(true);
              }}
              id="btn-radar-audio-customize"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="تخصيص النغمات الصوتية لتغيرات حالة المنافسين والـ Buy Box"
            >
              <Volume2 className="w-3.5 h-3.5 text-purple-700" />
              <span>نغمات المنافسين 🔊</span>
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block mx-1" />

            <button
              onClick={() => setFilterPlatform('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterPlatform === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              جميع المنصات ({merchantOffers.length})
            </button>
            <button
              onClick={() => setFilterPlatform('amazon_eg')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterPlatform === 'amazon_eg'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              أمازون مصر
            </button>
            <button
              onClick={() => setFilterPlatform('noon_eg')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterPlatform === 'noon_eg'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              نون مصر
            </button>
            <button
              onClick={() => setFilterPlatform('jumia_eg')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterPlatform === 'jumia_eg'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              جوميا
            </button>
          </div>
        </div>

        {/* Highlight Banner for Best Price */}
        {lowestOffer && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-teal-500/10 border border-emerald-300/80 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <div className="text-xs text-slate-800">
                <span className="font-bold text-emerald-800">أفضل وأقل سعر متاح حالياً بالسوق: </span>
                <span className="font-black text-slate-900 font-mono text-sm">{lowestPrice.toLocaleString()} {currency}</span>
                <span className="text-slate-500 mr-2">لدى ({lowestOffer.merchantName} - {lowestOffer.platformName})</span>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-xs">
              مظلل باللون الأخضر والذهبي بالجدول أدناه 👇
            </span>
          </div>
        )}

        {/* Structured Comparison Table or No-Competitors Notice */}
        {filteredOffers.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/90 rounded-2xl border border-dashed border-slate-300 space-y-3" id="no-competitors-banner">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100/70 text-amber-800 flex items-center justify-center text-xl shadow-xs">
              🛋️
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 font-['Alexandria']">
                لا توجد عروض منافسين مسجلة لقطعة الأثاث الحالية ({product.title})
              </h4>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                يعمل محرك الرادار بنمط <strong className="text-indigo-700 font-bold">المطابقة الصارم لقطاع الأثاث والمفروشات</strong>. تم تلقائياً استبعاد أي بيانات وهمية أو منتجات خارج تخصص الأثاث. أنت البائع الحصري لهذا المنتج حالياً، أو يمكنك استيراد ملف CSV مخصص بأسعار منافسي الأثاث الفعليين.
              </p>
            </div>
            {onOpenChannelCompetitorImport && (
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChannelCompetitorImport(filterPlatform !== 'all' ? filterPlatform : undefined)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>استيراد أسعار منافسين لقطعة الأثاث (CSV)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-full overflow-x-auto rounded-2xl border border-slate-800 shadow-xl custom-scrollbar">
            <table className="w-full min-w-[760px] text-right border-collapse" id="direct-competitors-table">
              <thead>
                <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-300 text-xs font-black">
                  <th className="py-3.5 px-4 min-w-[240px]">اسم المنافس والمنصة</th>
                  <th className="py-3.5 px-4 min-w-[140px] whitespace-nowrap">سعر البيع الحالي</th>
                  <th className="py-3.5 px-4 min-w-[160px]">مدة الشحن والتوصيل</th>
                  <th className="py-3.5 px-4 min-w-[130px] whitespace-nowrap">تقييم البائع</th>
                  <th className="py-3.5 px-4 min-w-[150px]">حالة التوفر والضمان</th>
                  <th className="py-3.5 px-4 min-w-[110px] text-center whitespace-nowrap">الرابط المباشر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {filteredOffers.map((offer) => {
                  const isLowest = offer.id === lowestOffer?.id;
                  const diffFromLowest = offer.price - lowestPrice;

                  return (
                    <tr
                      key={offer.id}
                      className={`transition-colors duration-150 ${
                        isLowest
                          ? 'bg-emerald-950/40 hover:bg-emerald-950/60 font-medium'
                          : 'hover:bg-slate-800/40 text-slate-200'
                      }`}
                    >
                      {/* Column 1: Competitor Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <MerchantLogoBadge
                            logo={offer.merchantLogo}
                            merchantName={offer.merchantName}
                            platformName={offer.platformName}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white font-['Alexandria'] truncate max-w-[200px]">
                                <bdi>{offer.merchantName}</bdi>
                              </span>
                              {isLowest && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-2xs flex items-center gap-1 shrink-0">
                                  <span>🏆</span> أفضل سعر (Buy Box)
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              <bdi>{offer.platformName}</bdi>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Selling Price with auto-highlighting */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-baseline gap-1">
                            <span className={`text-base font-black font-mono ${
                              isLowest ? 'text-emerald-400 text-lg' : 'text-white'
                            }`}>
                              <bdi>{offer.price.toLocaleString()}</bdi>
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">{currency}</span>
                          </div>
                          {diffFromLowest > 0 ? (
                            <span className="text-[10px] font-semibold text-rose-400 block">
                              <bdi>أعلى بـ +{diffFromLowest.toLocaleString()} {currency}</bdi>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-400 block">
                              ✓ السعر الأرخص بالسوق
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Shipping Duration */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <span className="text-sm shrink-0">🚚</span>
                          <span className="font-medium text-[11px] leading-tight"><bdi>{offer.deliveryTime}</bdi></span>
                        </div>
                        {offer.fulfillmentType && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {offer.fulfillmentType === 'fba' ? 'مستودعات أمازون FBA' : 'شحن بائع مباشر'}
                          </span>
                        )}
                      </td>

                      {/* Column 4: Seller Rating */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-500 font-bold"><bdi>⭐ {offer.rating}</bdi></span>
                          <span className="text-slate-400 text-[11px] font-mono">
                            <bdi>({offer.reviewCount.toLocaleString()})</bdi>
                          </span>
                        </div>
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="bg-amber-400 h-full rounded-full" 
                            style={{ width: `${Math.min(100, (offer.rating / 5) * 100)}%` }} 
                          />
                        </div>
                      </td>

                      {/* Column 5: Stock Status & Warranty */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          const isInStock = stockOverrides[offer.id] !== undefined ? stockOverrides[offer.id] : true;
                          return (
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => handleToggleCompetitorStock(offer)}
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap transition-all cursor-pointer border ${
                                  isInStock
                                    ? 'text-emerald-700 bg-emerald-100/70 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border-emerald-200'
                                    : 'text-rose-700 bg-rose-100 hover:bg-emerald-50 hover:text-emerald-700 border-rose-300 animate-pulse'
                                }`}
                                title={isInStock ? "انقر لمحاكاة نفاد مخزون هذا المنافس وإطلاق تنبيه صوتي" : "انقر لإعادة توفر المنتج بالمخزن"}
                              >
                                {isInStock ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>متوفر بالمخزن</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
                                    <span>نفد المخزون ⚠️</span>
                                  </>
                                )}
                              </button>
                              {offer.warranty && (
                                <span className="text-[10px] text-slate-500 block leading-tight">
                                  <bdi>🛡️ {offer.warranty}</bdi>
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Column 6: Action */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <a
                          href={offer.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 text-xs font-bold transition-all border border-indigo-200 cursor-pointer shadow-2xs"
                        >
                          <span>فتح بالمتجر</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Product Quick Specs Accordion */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <button
          onClick={() => setShowAllSpecs(!showAllSpecs)}
          className="w-full flex items-center justify-between text-right cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900 font-['Alexandria']">
              المواصفات الفنية المعتمدة للمنتج ({specs.reduce((acc, s) => acc + (s.items?.length || 0), 0)} خاصية)
            </h4>
          </div>
          {showAllSpecs ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {showAllSpecs && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {specs.map((cat, idx) => (
              <div key={idx} className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                <h5 className="text-xs font-bold text-indigo-700">{cat.category}</h5>
                <div className="space-y-1.5 text-xs">
                  {(cat.items || []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500">{item.label}:</span>
                      <span className="font-semibold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
