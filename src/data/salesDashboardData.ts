import { 
  ProductData, 
  WatchlistItem, 
  ProductSalesPerformance, 
  DailySalesDataPoint, 
  SalesDashboardSummary, 
  SalesTimeframeType 
} from '../types';
import { VERIFIED_AMAZON_EG_PRODUCTS } from '../services/livePlatformProductSync';

// Generate realistic date strings for the last 30 days
function getDateLabels(daysCount: number): { date: string; dateLabel: string; dayOfWeek: string }[] {
  const daysOfWeekArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const monthsArabic = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  const results = [];
  const baseDate = new Date(2026, 7, 26); // August 26, 2026

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dateLabel = `${d.getDate()} ${monthsArabic[d.getMonth()]}`;
    const dayOfWeek = daysOfWeekArabic[d.getDay()];
    results.push({ date: dayStr, dateLabel, dayOfWeek });
  }
  return results;
}

// Generate product-specific historical sales and competitor price trend
export function generateProductDailyHistory(
  product: ProductData, 
  daysCount: number = 14
): DailySalesDataPoint[] {
  const dateObjs = getDateLabels(daysCount);
  const basePrice = product.suggestedRetailPrice || product.currentLowestPrice;
  const cost = product.estimatedWholesaleCost;
  const lowestCompBase = product.currentLowestPrice;
  const compName = product.merchantOffers?.[0]?.merchantName || 'نون إكسبريس (FBN)';

  return dateObjs.map((item, index) => {
    // Generate realistic fluctuating price & competitor dynamics
    // Simulate: Day 3-5 competitor dropped price -> our sales dipped
    // Day 6: We matched/undercut -> sales jumped!
    let merchantPrice = basePrice;
    let competitorPrice = lowestCompBase;
    let units = 8 + Math.floor(Math.sin(index) * 4);
    let event: string | undefined = undefined;
    let decision: string | undefined = undefined;

    if (daysCount === 7) {
      if (index === 1) {
        competitorPrice = lowestCompBase - 150;
        merchantPrice = basePrice;
        units = Math.max(3, Math.round(units * 0.45));
        event = `منافس ${compName} خفّض سعره بـ 150 ج.م`;
      } else if (index === 2) {
        competitorPrice = lowestCompBase - 150;
        merchantPrice = basePrice;
        units = Math.max(4, Math.round(units * 0.5));
      } else if (index === 3) {
        merchantPrice = lowestCompBase - 200; // We undercut!
        competitorPrice = lowestCompBase - 150;
        units = Math.round(units * 2.1);
        decision = 'تخفيض السعر واقتناص الـ Buy Box';
        event = 'قفزة مبيعات كبرى بعد الفوز بالـ Buy Box (+110%)';
      } else if (index >= 4) {
        merchantPrice = lowestCompBase - 200;
        competitorPrice = lowestCompBase - 100;
        units = Math.round(units * 1.6);
      }
    } else {
      // 14 or 30 days
      const cycle = index % 7;
      if (cycle === 1 || cycle === 2) {
        competitorPrice = lowestCompBase - 100;
        merchantPrice = basePrice;
        units = Math.max(4, Math.round(units * 0.6));
        if (index === 1) event = `تخفيض سعر من منافس ${compName}`;
      } else if (cycle === 3) {
        merchantPrice = lowestCompBase - 140;
        units = Math.round(units * 1.9);
        decision = 'تعديل السعر التنافسي الذكي';
        if (index === 3) event = 'استعادة صدارة الـ Buy Box وارتفاع المبيعات';
      } else {
        units = Math.round(units * 1.25);
      }
    }

    const priceDiff = merchantPrice - competitorPrice;
    const buyBoxWon = priceDiff <= 0;
    const revenue = units * merchantPrice;
    const profit = units * (merchantPrice - cost);
    const margin = Math.round(((merchantPrice - cost) / merchantPrice) * 1000) / 10;

    // Platform distribution
    const amazonUnits = Math.max(1, Math.round(units * 0.46));
    const noonUnits = Math.max(1, Math.round(units * 0.32));
    const jumiaUnits = Math.max(0, Math.round(units * 0.15));
    const directUnits = Math.max(0, units - amazonUnits - noonUnits - jumiaUnits);

    return {
      date: item.date,
      dateLabel: item.dateLabel,
      dayOfWeek: item.dayOfWeek,
      unitsSold: units,
      revenueEGP: revenue,
      merchantAvgPrice: merchantPrice,
      lowestCompetitorAvgPrice: competitorPrice,
      competitorName: compName,
      priceDifferenceEGP: priceDiff,
      buyBoxWon,
      amazonSalesUnits: amazonUnits,
      noonSalesUnits: noonUnits,
      jumiaSalesUnits: jumiaUnits,
      directSalesUnits: directUnits,
      grossMarginPercent: margin,
      netProfitEGP: profit,
      significantEvent: event,
      pricingDecisionMade: decision
    };
  });
}

// Generate full performance object for a product
export function getProductSalesPerformance(
  product: ProductData, 
  isWatchlisted: boolean = true,
  daysCount: number = 14
): ProductSalesPerformance {
  const history = generateProductDailyHistory(product, daysCount);
  const todayPoint = history[history.length - 1];
  const yesterdayPoint = history[history.length - 2] || todayPoint;
  
  const weeklyPoints = history.slice(-7);
  const weeklyUnits = weeklyPoints.reduce((acc, curr) => acc + curr.unitsSold, 0);
  const weeklyRev = weeklyPoints.reduce((acc, curr) => acc + curr.revenueEGP, 0);

  const prevWeekPoints = history.length >= 14 ? history.slice(0, 7) : history.slice(0, Math.max(1, history.length - 7));
  const prevWeekUnits = prevWeekPoints.reduce((acc, curr) => acc + curr.unitsSold, 0) || 1;
  const salesGrowth = Math.round(((weeklyUnits - prevWeekUnits) / prevWeekUnits) * 1000) / 10;

  const lowestCompOffer = product.merchantOffers?.[0];
  const lowestCompPrice = lowestCompOffer?.price || product.currentLowestPrice;
  const lowestCompName = lowestCompOffer?.merchantName || 'نون مصر إكسبريس';
  const currentPrice = product.suggestedRetailPrice || product.currentLowestPrice;
  const costPrice = product.estimatedWholesaleCost;
  const priceDiff = currentPrice - lowestCompPrice;

  let buyBoxStatus: 'won' | 'lost' | 'threatened' | 'exclusive' = 'won';
  if (priceDiff < -20) buyBoxStatus = 'won';
  else if (priceDiff <= 20) buyBoxStatus = 'threatened';
  else buyBoxStatus = 'lost';

  // Competitor recent price fluctuation
  const compPriceChange = priceDiff > 0 ? -120 : (priceDiff < 0 ? +80 : 0);

  // Elasticity analysis
  let elasticity: 'very_high' | 'high' | 'moderate' | 'low' = 'high';
  if (product.category.includes('صوتيات') || product.category.includes('إلكترونيات')) {
    elasticity = 'very_high';
  } else if (product.category.includes('أجهزة منزلية')) {
    elasticity = 'moderate';
  }

  // Recommended Action
  let recPrice = Math.max(costPrice + 100, lowestCompPrice - 50);
  let recReason = 'تخفيض 50 ج.م عن أرخص منافس لاقتناص الـ Buy Box فوراً';
  let lift = 38;

  if (buyBoxStatus === 'won') {
    recPrice = lowestCompPrice - 10;
    recReason = 'أنت رابح الـ Buy Box! يمكنك رفع السعر قليلاً لتحسين هامش الربح';
    lift = 12;
  } else if (buyBoxStatus === 'threatened') {
    recPrice = lowestCompPrice - 40;
    recReason = 'حماية موقعك السعري وتأكيد فوزك بصندوق الشراء على أمازون ونون';
    lift = 25;
  } else {
    recPrice = lowestCompPrice - 60;
    recReason = 'استعادة حصة المبيعات المفقودة بعد خفض المنافس لسعره';
    lift = 54;
  }

  return {
    productId: product.id,
    productTitle: product.title,
    productImage: product.imageUrl,
    productBrand: product.brand,
    sku: product.sku || `SKU-${product.id.substring(0, 6).toUpperCase()}`,
    category: product.category,
    isWatchlisted,
    currentPrice,
    costPrice,
    lowestCompetitorPrice: lowestCompPrice,
    lowestCompetitorName: lowestCompName,
    competitorPriceChange24h: compPriceChange,
    priceDifference: priceDiff,
    buyBoxStatus,
    todayUnitsSold: todayPoint.unitsSold,
    yesterdayUnitsSold: yesterdayPoint.unitsSold,
    weeklyUnitsSold: weeklyUnits,
    weeklyRevenueEGP: weeklyRev,
    salesGrowthPercent: salesGrowth,
    priceElasticity: elasticity,
    recommendedActionPrice: recPrice,
    recommendedActionReason: recReason,
    estimatedSalesLiftWithRecPrice: lift,
    dailyHistory: history
  };
}

// Generate Dashboard Summary and Aggregated Daily Trends
export function generateSalesDashboardData(
  allProducts: ProductData[] = [],
  watchlist: WatchlistItem[] = [],
  timeframe: SalesTimeframeType = '14days'
): {
  summary: SalesDashboardSummary;
  productPerformances: ProductSalesPerformance[];
} {
  const daysMap = { '7days': 7, '14days': 14, '30days': 30 };
  const daysCount = daysMap[timeframe] || 14;

  if (!allProducts || allProducts.length === 0) {
    return {
      summary: {
        timeframe,
        totalUnitsSold: 0,
        totalRevenueEGP: 0,
        totalNetProfitEGP: 0,
        overallMarginPercent: 0,
        buyBoxDominancePercent: 0,
        avgPriceAdvantageEGP: 0,
        salesGrowthRatePercent: 0,
        topPerformingProduct: 'لا توجد منتجات مسجلة حالياً',
        topOpportunityProduct: 'لا توجد منتجات مسجلة حالياً',
        dailyAggregatedData: []
      },
      productPerformances: []
    };
  }

  const watchlistIds = new Set(watchlist.map(w => w.productId));

  const productPerformances = allProducts.map(p => {
    const isW = watchlistIds.has(p.id);
    return getProductSalesPerformance(p, isW, daysCount);
  });

  // Calculate aggregated daily data points across all products
  const dateObjs = getDateLabels(daysCount);
  const dailyAggregatedData: DailySalesDataPoint[] = dateObjs.map((item, dIdx) => {
    let totalUnits = 0;
    let totalRev = 0;
    let totalProfit = 0;
    let sumMerchantPrice = 0;
    let sumCompetitorPrice = 0;
    let wonCount = 0;
    let amz = 0;
    let noon = 0;
    let jumia = 0;
    let direct = 0;
    let event: string | undefined = undefined;

    productPerformances.forEach(p => {
      const day = p.dailyHistory[dIdx];
      if (day) {
        totalUnits += day.unitsSold;
        totalRev += day.revenueEGP;
        totalProfit += day.netProfitEGP;
        sumMerchantPrice += day.merchantAvgPrice;
        sumCompetitorPrice += day.lowestCompetitorAvgPrice;
        if (day.buyBoxWon) wonCount++;
        amz += day.amazonSalesUnits;
        noon += day.noonSalesUnits;
        jumia += day.jumiaSalesUnits;
        direct += day.directSalesUnits;
        if (day.significantEvent && !event) event = day.significantEvent;
      }
    });

    const count = productPerformances.length || 1;
    const avgMerchant = Math.round(sumMerchantPrice / count);
    const avgComp = Math.round(sumCompetitorPrice / count);
    const margin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 1000) / 10 : 22.5;

    return {
      date: item.date,
      dateLabel: item.dateLabel,
      dayOfWeek: item.dayOfWeek,
      unitsSold: totalUnits,
      revenueEGP: totalRev,
      merchantAvgPrice: avgMerchant,
      lowestCompetitorAvgPrice: avgComp,
      competitorName: 'متوسط أرخص المنافسين',
      priceDifferenceEGP: avgMerchant - avgComp,
      buyBoxWon: wonCount > count / 2,
      amazonSalesUnits: amz,
      noonSalesUnits: noon,
      jumiaSalesUnits: jumia,
      directSalesUnits: direct,
      grossMarginPercent: margin,
      netProfitEGP: totalProfit,
      significantEvent: event
    };
  });

  // Calculate totals
  const totalUnitsSold = dailyAggregatedData.reduce((acc, curr) => acc + curr.unitsSold, 0);
  const totalRevenueEGP = dailyAggregatedData.reduce((acc, curr) => acc + curr.revenueEGP, 0);
  const totalNetProfitEGP = dailyAggregatedData.reduce((acc, curr) => acc + curr.netProfitEGP, 0);
  const overallMargin = totalRevenueEGP > 0 ? Math.round((totalNetProfitEGP / totalRevenueEGP) * 1000) / 10 : 0;

  const wonBuyBoxCount = productPerformances.filter(p => p.buyBoxStatus === 'won').length;
  const buyBoxDominance = productPerformances.length > 0 ? Math.round((wonBuyBoxCount / productPerformances.length) * 100) : 0;

  const avgPriceAdv = productPerformances.length > 0
    ? Math.round(productPerformances.reduce((acc, curr) => acc + curr.priceDifference, 0) / productPerformances.length)
    : 0;

  // Sort best performing & top opportunity
  const sortedBySales = [...productPerformances].sort((a, b) => b.weeklyUnitsSold - a.weeklyUnitsSold);
  const topPerforming = sortedBySales[0]?.productTitle || 'لا توجد منتجات مسجلة بعد';

  const sortedByOpportunity = [...productPerformances].sort((a, b) => b.estimatedSalesLiftWithRecPrice - a.estimatedSalesLiftWithRecPrice);
  const topOpportunity = sortedByOpportunity[0]?.productTitle || 'لا توجد منتجات مسجلة بعد';

  const summary: SalesDashboardSummary = {
    timeframe,
    totalUnitsSold,
    totalRevenueEGP,
    totalNetProfitEGP,
    overallMarginPercent: overallMargin,
    buyBoxDominancePercent: buyBoxDominance,
    avgPriceAdvantageEGP: avgPriceAdv,
    salesGrowthRatePercent: 0,
    topPerformingProduct: topPerforming,
    topOpportunityProduct: topOpportunity,
    dailyAggregatedData
  };

  return {
    summary,
    productPerformances
  };
}

// Insights Generator based on correlation
export interface SalesPricingCorrelationInsight {
  id: string;
  type: 'opportunity' | 'alert' | 'success' | 'surge';
  productTitle: string;
  headline: string;
  description: string;
  impactMetric: string;
  recommendedPriceEGP: number;
  currentPriceEGP: number;
  competitorPriceEGP: number;
  competitorName: string;
  estimatedLiftPercent: number;
}

export function generateSalesPricingInsights(
  products: ProductSalesPerformance[]
): SalesPricingCorrelationInsight[] {
  if (!products || products.length === 0) {
    return [];
  }

  const insights: SalesPricingCorrelationInsight[] = [];

  // 1. BuyBox opportunity or lost buybox
  const lostOrThreatened = products.find(p => p.buyBoxStatus === 'lost' || p.buyBoxStatus === 'threatened') || products[0];
  if (lostOrThreatened) {
    insights.push({
      id: `ins-${lostOrThreatened.productId}-1`,
      type: 'opportunity',
      productTitle: lostOrThreatened.productTitle,
      headline: 'فرصة اقتناص صدارة الـ Buy Box واستعادة وتيرة المبيعات',
      description: `خفّض منافس (${lostOrThreatened.lowestCompetitorName}) سعره إلى ${lostOrThreatened.lowestCompetitorPrice.toLocaleString()} ج.م. تخفيض سعرك إلى ${lostOrThreatened.recommendedActionPrice.toLocaleString()} ج.م سيعيد لمتجرك صدارة صندوق الشراء ويزيد المبيعات المتوقعة بنسبة +${lostOrThreatened.estimatedSalesLiftWithRecPrice}%.`,
      impactMetric: `+${lostOrThreatened.estimatedSalesLiftWithRecPrice}% مبيعات متوقعة`,
      recommendedPriceEGP: lostOrThreatened.recommendedActionPrice,
      currentPriceEGP: lostOrThreatened.currentPrice,
      competitorPriceEGP: lostOrThreatened.lowestCompetitorPrice,
      competitorName: lostOrThreatened.lowestCompetitorName,
      estimatedLiftPercent: lostOrThreatened.estimatedSalesLiftWithRecPrice
    });
  }

  // 2. Surge / Price increase opportunity if won
  const wonProduct = products.find(p => p.buyBoxStatus === 'won' && p.productId !== lostOrThreatened?.productId) || products[1];
  if (wonProduct) {
    const liftDiff = Math.max(50, Math.round(wonProduct.lowestCompetitorPrice - wonProduct.currentPrice));
    insights.push({
      id: `ins-${wonProduct.productId}-2`,
      type: 'surge',
      productTitle: wonProduct.productTitle,
      headline: 'فرصة رفع السعر وهامش الربح دون فقدان الصدارة',
      description: `متجرك يتصدر صندوق الشراء حالياً بفارق ممتاز عن أقرب المنافسين (${wonProduct.lowestCompetitorName}). يمكنك تحسين هامش الربح برفع السعر إلى ${wonProduct.recommendedActionPrice.toLocaleString()} ج.م بأمان.`,
      impactMetric: `+${liftDiff.toLocaleString()} ج.م أرباح إضافية للقطعة`,
      recommendedPriceEGP: wonProduct.recommendedActionPrice,
      currentPriceEGP: wonProduct.currentPrice,
      competitorPriceEGP: wonProduct.lowestCompetitorPrice,
      competitorName: wonProduct.lowestCompetitorName,
      estimatedLiftPercent: 12
    });
  }

  // 3. Price gap alert
  const alertProduct = products.find(p => p.productId !== lostOrThreatened?.productId && p.productId !== wonProduct?.productId) || products[2];
  if (alertProduct) {
    insights.push({
      id: `ins-${alertProduct.productId}-3`,
      type: 'alert',
      productTitle: alertProduct.productTitle,
      headline: 'تنبيه فجوة سعرية حرجة تؤثر على وتيرة التصريف',
      description: `البيانات تؤكد أن الحفاظ على سعر منافس يقارب (${alertProduct.lowestCompetitorPrice.toLocaleString()} ج.م) لدى ${alertProduct.lowestCompetitorName} يضمن وتيرة مبيعات أسرع بمقدار +${alertProduct.estimatedSalesLiftWithRecPrice}%.`,
      impactMetric: `استعادة حصة المبيعات المتوقعة (+${alertProduct.estimatedSalesLiftWithRecPrice}%)`,
      recommendedPriceEGP: alertProduct.recommendedActionPrice,
      currentPriceEGP: alertProduct.currentPrice,
      competitorPriceEGP: alertProduct.lowestCompetitorPrice,
      competitorName: alertProduct.lowestCompetitorName,
      estimatedLiftPercent: alertProduct.estimatedSalesLiftWithRecPrice
    });
  }

  return insights;
}
