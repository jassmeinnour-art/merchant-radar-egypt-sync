import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Percent, 
  CheckCircle2, 
  Save, 
  Sparkles, 
  Layers, 
  Zap, 
  Building2,
  HelpCircle
} from 'lucide-react';
import { ProductData, ProductPricingPlan, PlatformPriceGuardrail } from '../types';
import {
  getOrCreatePricingPlan,
  loadStoredPricingPlans,
  saveStoredPricingPlan,
} from '../data/pricingGuardrailsData';
import { SmartDynamicPricingPanel } from './SmartDynamicPricingPanel';

interface PricingGuardrailsManagerProps {
  products: ProductData[];
  selectedProduct: ProductData;
  currency?: string;
  onSelectProduct: (product: ProductData) => void;
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
  onShowToast?: (msg: string) => void;
  onNavigateToSimulator?: (product: ProductData) => void;
}

export const PricingGuardrailsManager: React.FC<PricingGuardrailsManagerProps> = ({
  products,
  selectedProduct,
  currency = 'ج.م',
  onSelectProduct,
  onAutoAdjustProductPrice,
  onBulkAutoAdjustAllProducts,
  onShowToast,
  onNavigateToSimulator
}) => {
  const [pricingPlans, setPricingPlans] = useState<Record<string, ProductPricingPlan>>(() => loadStoredPricingPlans());

  useEffect(() => {
    const handleSync = () => {
      setPricingPlans(loadStoredPricingPlans());
    };
    window.addEventListener('merchant_pricing_guardrails_updated', handleSync);
    return () => window.removeEventListener('merchant_pricing_guardrails_updated', handleSync);
  }, []);
  
  // Current active plan
  const currentPlan = pricingPlans[selectedProduct.id] || getOrCreatePricingPlan(selectedProduct);

  const handleUpdateGuardrail = (
    platformCode: string, 
    field: keyof PlatformPriceGuardrail, 
    value: any
  ) => {
    const updatedGuardrails = currentPlan.platformGuardrails.map(g => {
      if (g.platformCode === platformCode) {
        const updated = { ...g, [field]: value };
        
        // Recalculate net profit & margin when prices or commission changes
        if (field === 'actualSellingPrice' || field === 'platformCommissionPercent' || field === 'platformFixedFeeEGP') {
          const sellPrice = field === 'actualSellingPrice' ? Number(value) : updated.actualSellingPrice;
          const commPercent = field === 'platformCommissionPercent' ? Number(value) : updated.platformCommissionPercent;
          const fixedFee = field === 'platformFixedFeeEGP' ? Number(value) : updated.platformFixedFeeEGP;
          
          const commissionAmount = sellPrice * (commPercent / 100);
          const netProfit = Math.round(sellPrice - commissionAmount - fixedFee - currentPlan.costPrice);
          const netMargin = sellPrice > 0 ? Math.round((netProfit / sellPrice) * 100) : 0;
          
          updated.netProfitEGP = netProfit;
          updated.netMarginPercent = netMargin;
        }
        return updated;
      }
      return g;
    });

    const updatedPlan: ProductPricingPlan = {
      ...currentPlan,
      platformGuardrails: updatedGuardrails,
      lastModifiedAt: 'الآن (معدل)',
      modifiedBy: 'المسوق المسؤول عن بعد'
    };

    const nextAll = saveStoredPricingPlan(updatedPlan);
    setPricingPlans(nextAll);
  };

  const handleToggleFloorLock = (platformCode: string) => {
    const target = currentPlan.platformGuardrails.find(g => g.platformCode === platformCode);
    if (!target) return;
    handleUpdateGuardrail(platformCode, 'isFloorPriceLocked', !target.isFloorPriceLocked);
    if (onShowToast) {
      onShowToast(
        !target.isFloorPriceLocked 
          ? `تم تفعيل قفل الحد الأدنى لمنصة ${target.platformName} لحماية رأس المال` 
          : `تم فتح قفل الحد الأدنى لمنصة ${target.platformName}`
      );
    }
  };

  const handleSavePlan = () => {
    saveStoredPricingPlan(currentPlan);
    if (onShowToast) {
      onShowToast(`تم حفظ واعتماد خطة التسعير الديناميكي وحدود الحماية للمنتج (${selectedProduct.title}) بنجاح!`);
    }
  };

  return (
    <div className="space-y-6" id="pricing-guardrails-manager-container">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              صمام أمان التسعير (Floor & Ceiling Price Guardrails)
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-['Alexandria'] text-white">
              إدارة الحد الأدنى والأقصى وخطط التسعير الفعلية
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              تحديد الحد الأدنى الحرج (Floor Price) لمنع الخسارة تحت أي ظرف، والحد الأقصى (Ceiling Price) لاقتناص هوامش الأرباح العالية في أوقات ذروة الطلب عبر <strong>أمازون، نون، جوميا، كنز، هومزمارت، وتيك توك</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onNavigateToSimulator && (
              <button
                id="btn-guardrails-to-simulator"
                onClick={() => onNavigateToSimulator(selectedProduct)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                محاكاة تأثير الخطة على الأرباح
              </button>
            )}
            <button
              id="btn-save-pricing-plan"
              onClick={handleSavePlan}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              حفظ واعتماد خطة التسعير
            </button>
          </div>
        </div>

        {/* Global Cost and Bounds Info Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-800/50">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block mb-1">تكلفة الجملة الفعلية (Cost)</span>
            <div className="text-xl font-bold text-white font-mono">{currentPlan.costPrice.toLocaleString('ar-EG')} ج.م</div>
            <span className="text-[10px] text-slate-400">سعر التوريد من شارع عبد العزيز</span>
          </div>

          <div className="bg-rose-950/40 rounded-xl p-3 border border-rose-800/40">
            <span className="text-[11px] text-rose-300 block mb-1">الحد الأدنى المطلق (Global Floor)</span>
            <div className="text-xl font-bold text-rose-300 font-mono">{currentPlan.globalMinPrice.toLocaleString('ar-EG')} ج.م</div>
            <span className="text-[10px] text-rose-300">ممنوع البيع بأقل منه نهائياً</span>
          </div>

          <div className="bg-indigo-950/40 rounded-xl p-3 border border-indigo-800/40">
            <span className="text-[11px] text-indigo-300 block mb-1">الحد الأقصى (Global Ceiling)</span>
            <div className="text-xl font-bold text-indigo-200 font-mono">{currentPlan.globalMaxPrice.toLocaleString('ar-EG')} ج.م</div>
            <span className="text-[10px] text-indigo-300">سقف السعر في مواسم الشح</span>
          </div>

          <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-800/40">
            <span className="text-[11px] text-emerald-300 block mb-1">السعر التنافسي الموصى به</span>
            <div className="text-xl font-bold text-emerald-300 font-mono">{currentPlan.suggestedOptimalPrice.toLocaleString('ar-EG')} ج.م</div>
            <span className="text-[10px] text-emerald-300">للفوز بالـ Buy Box</span>
          </div>
        </div>
      </div>

      {/* Product Switcher Ribbon */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3 overflow-x-auto">
        <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-600" />
          اختر المنتج لتعديل خطة تسعيره:
        </span>
        <div className="flex items-center gap-2">
          {products.map((prod) => (
            <button
              key={prod.id}
              onClick={() => onSelectProduct(prod)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                prod.id === selectedProduct.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {prod.title.split(' ')[0]} {prod.title.split(' ')[1]} {prod.title.split(' ')[2]}
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Smart Dynamic Pricing Engine */}
      <SmartDynamicPricingPanel
        product={selectedProduct}
        allProducts={products}
        currency={currency}
        onAutoAdjustProductPrice={(productId, newMerchantPrice, updatedCompetitorPrice, competitorName, reasonLabel) => {
          setPricingPlans(loadStoredPricingPlans());
          if (onAutoAdjustProductPrice) {
            onAutoAdjustProductPrice(productId, newMerchantPrice, updatedCompetitorPrice, competitorName, reasonLabel);
          }
        }}
        onBulkAutoAdjustAllProducts={(adjustments) => {
          setPricingPlans(loadStoredPricingPlans());
          if (onBulkAutoAdjustAllProducts) {
            onBulkAutoAdjustAllProducts(adjustments);
          }
        }}
        onShowToast={onShowToast}
      />

      {/* Platforms Guardrails Grid Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 font-['Alexandria']">
              جدول الحدود السعرية الفعلية لكل منصة (أمازون، نون، جوميا، كنز، هومزمارت، تيك توك)
            </h3>
            <p className="text-xs text-slate-500">
              قم بتعديل السعر الفعلي، والحد الأدنى والأقصى، مع متابعة هامش الربح وصافي المكسب بعد خصم عمولات كل منصة
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span>آخر تعديل: <strong className="text-slate-800">{currentPlan.lastModifiedAt}</strong></span>
            <span>•</span>
            <span>بواسطة: <strong className="text-indigo-700">{currentPlan.modifiedBy}</strong></span>
          </div>
        </div>

        {/* Guardrails Cards per Platform */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentPlan.platformGuardrails.map((guardrail) => {
            const isDangerouslyLow = guardrail.actualSellingPrice < guardrail.minAllowedPrice;
            const isProfitable = guardrail.netProfitEGP > 0;

            return (
              <div
                key={guardrail.platformCode}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  isDangerouslyLow
                    ? 'bg-rose-50/50 border-rose-300'
                    : 'bg-slate-50/40 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {/* Platform Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {guardrail.platformCode === 'amazon_eg' ? '📦' :
                       guardrail.platformCode === 'noon_eg' ? '🟡' :
                       guardrail.platformCode === 'jumia_eg' ? '⭐' :
                       guardrail.platformCode === 'kenzz_eg' ? '💎' :
                       guardrail.platformCode === 'homzmart_eg' ? '🛋️' : '🎵'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 font-['Alexandria']">
                      {guardrail.platformName}
                    </h4>
                  </div>

                  {/* Floor Lock Button */}
                  <button
                    onClick={() => handleToggleFloorLock(guardrail.platformCode)}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                      guardrail.isFloorPriceLocked
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                    title={guardrail.isFloorPriceLocked ? 'الحد الأدنى مقفول ومحمي' : 'انقر لقفل الحد الأدنى'}
                  >
                    {guardrail.isFloorPriceLocked ? <Lock className="w-3.5 h-3.5 text-emerald-700" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />}
                    <span className="text-[10px]">{guardrail.isFloorPriceLocked ? 'مقفول' : 'مفتوح'}</span>
                  </button>
                </div>

                {/* Price Controls Input Fields */}
                <div className="space-y-3 text-xs">
                  {/* Actual Selling Price */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      السعر الفعلي المعتمد للبيع (ج.م):
                    </label>
                    <input
                      type="number"
                      value={guardrail.actualSellingPrice}
                      onChange={(e) => handleUpdateGuardrail(guardrail.platformCode, 'actualSellingPrice', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  {/* Min and Max Guardrails Dual Input */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-rose-700 block mb-1">
                        الحد الأدنى (Floor):
                      </label>
                      <input
                        type="number"
                        value={guardrail.minAllowedPrice}
                        onChange={(e) => handleUpdateGuardrail(guardrail.platformCode, 'minAllowedPrice', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-rose-200 bg-white text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-indigo-700 block mb-1">
                        الحد الأقصى (Ceiling):
                      </label>
                      <input
                        type="number"
                        value={guardrail.maxAllowedPrice}
                        onChange={(e) => handleUpdateGuardrail(guardrail.platformCode, 'maxAllowedPrice', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-indigo-200 bg-white text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>

                  {/* Platform Commission info */}
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>عمولة المنصة: <strong>{guardrail.platformCommissionPercent}%</strong></span>
                    <span>رسوم ثابتة: <strong>{guardrail.platformFixedFeeEGP} ج.م</strong></span>
                  </div>
                </div>

                {/* Net Profit & Margin Card Badge */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isProfitable ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div>
                    <span className="text-[10px] block opacity-80">صافي الربح التقديري:</span>
                    <span className="text-sm font-black font-mono">
                      {guardrail.netProfitEGP > 0 ? '+' : ''}{guardrail.netProfitEGP.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] block opacity-80">هامش الربح الصافي:</span>
                    <span className="text-sm font-black font-mono">
                      {guardrail.netMarginPercent}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
