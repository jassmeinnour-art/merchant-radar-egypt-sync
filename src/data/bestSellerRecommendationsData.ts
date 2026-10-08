import { ProductData } from '../types';

export interface BestSellerRecommendation {
  product: ProductData;
  categoryKey: string;
  categoryTitle: string;
  categoryBadge: string;
  bestSellerRank: number;
  dailySalesEstimate: number;
  monthlyRevenueEstimateEGP: number;
  demandMomentumPercent: number;
  expectedProfitMarginPercent: number;
  netProfitPerUnitEGP: number;
  topSellingPlatform: string;
  topSellingPlatformBadge: string;
  recommendationReason: string;
  urgencyBadge: string;
  supplierStockAlert: string;
}

export interface BestSellerCategoryMeta {
  key: string;
  label: string;
  icon: string;
}

export const BEST_SELLER_CATEGORIES: BestSellerCategoryMeta[] = [
  { key: 'all', label: 'جميع الفئات الأكثر مبيعاً', icon: '🔥' },
  { key: 'furniture', label: 'الأثاث والمفروشات والديكور', icon: '🪑' },
  { key: 'home_appliances', label: 'الأجهزة المنزلية والمطبخ', icon: '☕' },
  { key: 'personal_care', label: 'العناية الشخصية والجمال', icon: '✨' },
  { key: 'computing', label: 'الكمبيوتر ومستلزمات المكاتب', icon: '💻' },
];

// Clean production state: No mock best-seller products
export const PROACTIVE_BEST_SELLER_RECOMMENDATIONS: BestSellerRecommendation[] = [];
