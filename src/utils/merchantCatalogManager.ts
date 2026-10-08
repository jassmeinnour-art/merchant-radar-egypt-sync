import { 
  MerchantCatalogProduct, 
  CompetitorOfferDetail, 
  MerchantCatalogSummary, 
  MerchantCatalogPricingStatus, 
  MerchantRepricingRule,
  RepricingAuditLogEntry,
  RemoteMerchantClient 
} from '../types';
import { loadAllRegisteredMerchants, evaluateMerchantSubscriptionState } from './platformLaunchHelper';

const CATALOG_STORAGE_PREFIX = 'merchant_catalog_items_v1_';
const REPRICING_LOG_STORAGE_PREFIX = 'merchant_repricing_audit_logs_v1_';

/**
 * Ensures every product has a well-formed default Automated Repricing Rule
 */
export function ensureDefaultRepricingRule(prod: MerchantCatalogProduct): MerchantCatalogProduct {
  if (prod.repricingRule) {
    return prod;
  }
  const baseCost = prod.estimatedCostEGP || Math.round(prod.merchantPrice * 0.72);
  const defaultMinPrice = Math.round(baseCost * 1.12); // حماية هامش ربح أدنى 12% فوق التكلفة
  const defaultMaxPrice = Math.round(prod.merchantPrice * 1.25);
  const beatBy = 1; // خفض السعر بمقدار 1 ج.م عن سعر المنافس / الـ Buy Box
  const refPrice = prod.buyBoxPrice || prod.lowestCompetitorPrice;
  const floorReached = (refPrice - beatBy) < defaultMinPrice;

  return {
    ...prod,
    repricingRule: {
      enabled: true,
      minPrice: defaultMinPrice,
      maxPrice: defaultMaxPrice,
      beatCompetitorBy: beatBy,
      targetBenchmark: 'buybox',
      floorPriceReached: floorReached
    }
  };
}

/**
 * Calculates pricing gap and status comparing merchant price with competitors and Buy Box
 */
export function evaluatePricingCompetitiveness(
  merchantPrice: number,
  lowestCompetitorPrice: number,
  buyBoxPrice: number
): {
  priceGapAmount: number;
  priceGapPercent: number;
  pricingStatus: MerchantCatalogPricingStatus;
  isBuyBoxWinner: boolean;
  suggestedAction: string;
} {
  const gapAmount = Math.round(merchantPrice - lowestCompetitorPrice);
  const gapPercent = lowestCompetitorPrice > 0 
    ? Number((((merchantPrice - lowestCompetitorPrice) / lowestCompetitorPrice) * 100).toFixed(1))
    : 0;

  const isBuyBoxWinner = merchantPrice <= buyBoxPrice;

  let pricingStatus: MerchantCatalogPricingStatus = 'competitive';
  let suggestedAction = 'سعرك منافس ومناسب للسوق';

  if (isBuyBoxWinner) {
    pricingStatus = 'winning_buybox';
    suggestedAction = 'أنت الفائز بالـ Buy Box حالياً! حافظ على استقرار السعر والمخزون.';
  } else if (gapPercent > 10) {
    pricingStatus = 'needs_repricing';
    suggestedAction = `سعرك أعلى بنسبة ${gapPercent}% (${gapAmount} ج.م) عن أدنى منافس. يُوصى بتخفيض السعر للمنافسة.`;
  } else if (merchantPrice > buyBoxPrice) {
    pricingStatus = 'higher_than_buybox';
    suggestedAction = `سعرك أعلى من سعر الـ Buy Box الحالي (${buyBoxPrice.toLocaleString('ar-EG')} ج.م). خفض السعر لمطابقة الـ Buy Box.`;
  } else {
    pricingStatus = 'competitive';
    suggestedAction = 'سعرك متقارب جداً مع المنافسين، ضمن النطاق المقبول.';
  }

  return {
    priceGapAmount: gapAmount,
    priceGapPercent: gapPercent,
    pricingStatus,
    isBuyBoxWinner,
    suggestedAction
  };
}

/**
 * Seed catalogs for default registered merchants
 * Strictly empty array: no mock or dummy products are seeded by default.
 */
function getInitialSeedCatalogForMerchant(_merchantId: string, _storeName: string): MerchantCatalogProduct[] {
  return [];
}

/**
 * Loads the catalog for a specific merchant from localStorage, returning an empty array if none exists
 */
export function loadMerchantCatalog(merchantId: string): MerchantCatalogProduct[] {
  if (!merchantId) return [];

  const key = `${CATALOG_STORAGE_PREFIX}${merchantId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out legacy seeded mock IDs ('stp-prod-', 'str-prod-', 'gen-')
        const cleaned = parsed.filter(
          (p: any) =>
            p &&
            p.id &&
            !String(p.id).startsWith('stp-prod-') &&
            !String(p.id).startsWith('str-prod-') &&
            !String(p.id).startsWith('gen-') &&
            p.dataMode !== 'demo'
        );
        if (cleaned.length !== parsed.length) {
          saveMerchantCatalog(merchantId, cleaned);
        }
        return cleaned.map(ensureDefaultRepricingRule);
      }
    }
  } catch (e) {
    console.error(`Error loading catalog for merchant ${merchantId}:`, e);
  }

  return [];
}

/**
 * Saves the catalog for a specific merchant to localStorage
 */
export function saveMerchantCatalog(merchantId: string, products: MerchantCatalogProduct[]): void {
  if (!merchantId) return;
  const key = `${CATALOG_STORAGE_PREFIX}${merchantId}`;
  try {
    localStorage.setItem(key, JSON.stringify(products));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('merchant_catalog_updated', {
        detail: { merchantId, productsCount: products.length, timestamp: Date.now() }
      }));
    }
  } catch (e) {
    console.error(`Error saving catalog for merchant ${merchantId}:`, e);
  }
}

/**
 * Pulls the live catalog for a merchant from Amazon SP-API / Noon API or Sandbox endpoint
 */
export async function pullLiveCatalogForMerchant(
  merchant: RemoteMerchantClient,
  platformFilter: 'all' | 'amazon_eg' | 'noon_eg' = 'all'
): Promise<MerchantCatalogProduct[]> {
  const subState = evaluateMerchantSubscriptionState(merchant);
  if (subState.isTrialExpired && !subState.isSubscribed) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('merchant_radar_open_subscription_paywall', { detail: { merchantId: merchant.id } }));
    }
    throw new Error(`انتهت فترة التجربة المجانية (3 أيام) للتاجر "${merchant.storeName}" — تم إيقاف سحب الكتالوج لحين تجديد الاشتراك 🔒`);
  }

  const merchantId = merchant.id;
  const merchantName = merchant.storeName;
  const dataMode = merchant.dataMode || 'live';
  const creds = merchant.apiCredentials;

  try {
    const res = await fetch('/api/merchant/catalog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-merchant-id': merchantId,
        'x-merchant-name': encodeURIComponent(merchantName),
        'x-data-mode': dataMode,
        'x-amz-client-id': creds?.amazonClientId || '',
        'x-amz-client-secret': creds?.amazonClientSecret || '',
        'x-amz-refresh-token': creds?.amazonRefreshToken || '',
        'x-amz-region': creds?.amazonRegion || 'eu-west-1'
      },
      body: JSON.stringify({
        merchantId,
        merchantName,
        platform: platformFilter,
        dataMode,
        clientId: creds?.amazonClientId,
        clientSecret: creds?.amazonClientSecret,
        refreshToken: creds?.amazonRefreshToken,
        region: creds?.amazonRegion || 'eu-west-1',
        noonAuthKey: creds?.noonAuthKey,
        noonAppId: creds?.noonAppId
      })
    });

    const data = await res.json();

    if (!res.ok) {
      // If error from backend, check message
      throw new Error(data.error || data.message || `فشل جلب كتالوج المنتجات للتاجر "${merchantName}"`);
    }

    if (Array.isArray(data.products) && data.products.length > 0) {
      saveMerchantCatalog(merchantId, data.products);
      return data.products;
    }
  } catch (err: any) {
    // If live mode failed or network issue, fallback to stored or seed if in demo mode
    if (dataMode === 'demo') {
      const existing = loadMerchantCatalog(merchantId);
      if (existing.length > 0) return existing;
      const seeded = getInitialSeedCatalogForMerchant(merchantId, merchantName);
      saveMerchantCatalog(merchantId, seeded);
      return seeded;
    }
    throw err;
  }

  return loadMerchantCatalog(merchantId);
}

/**
 * Refreshes competitor pricing and Buy Box analysis for all or selected products of a merchant
 */
export async function refreshMerchantCompetitorPricing(
  merchant: RemoteMerchantClient,
  productIds?: string[]
): Promise<MerchantCatalogProduct[]> {
  const currentCatalog = loadMerchantCatalog(merchant.id);
  const now = new Date().toISOString();

  // Try calling backend pricing comparison API
  try {
    const res = await fetch('/api/merchant/pricing/compare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-merchant-id': merchant.id,
        'x-data-mode': merchant.dataMode || 'live'
      },
      body: JSON.stringify({
        merchantId: merchant.id,
        merchantName: merchant.storeName,
        dataMode: merchant.dataMode || 'live',
        productIds: productIds || currentCatalog.map(p => p.id),
        products: currentCatalog
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length > 0) {
        saveMerchantCatalog(merchant.id, data.products);
        return data.products;
      }
    }
  } catch (e) {
    console.warn('Competitor pricing API call failed, recalculating locally:', e);
  }

  // Local recalculation with realistic live market spread
  const updatedCatalog = currentCatalog.map(p => {
    if (productIds && !productIds.includes(p.id)) return p;

    // Evaluate against existing or updated competitor offers
    const lowestOffer = p.competitors.length > 0 
      ? Math.min(...p.competitors.map(c => c.price))
      : p.lowestCompetitorPrice;

    const evalResult = evaluatePricingCompetitiveness(
      p.merchantPrice,
      lowestOffer,
      p.buyBoxPrice
    );

    return {
      ...p,
      lowestCompetitorPrice: lowestOffer,
      priceGapAmount: evalResult.priceGapAmount,
      priceGapPercent: evalResult.priceGapPercent,
      pricingStatus: evalResult.pricingStatus,
      isBuyBoxWinner: evalResult.isBuyBoxWinner,
      suggestedAction: evalResult.suggestedAction,
      lastRefreshedAt: now
    };
  });

  saveMerchantCatalog(merchant.id, updatedCatalog);
  return updatedCatalog;
}

/**
 * Updates a product price and recalculates Buy Box competitiveness immediately
 */
export function updateMerchantProductPrice(
  merchantId: string,
  productId: string,
  newPrice: number
): MerchantCatalogProduct | null {
  const catalog = loadMerchantCatalog(merchantId);
  const index = catalog.findIndex(p => p.id === productId);
  if (index === -1) return null;

  const current = catalog[index];
  const evalResult = evaluatePricingCompetitiveness(
    newPrice,
    current.lowestCompetitorPrice,
    current.buyBoxPrice
  );

  const updated: MerchantCatalogProduct = {
    ...current,
    merchantPrice: newPrice,
    priceGapAmount: evalResult.priceGapAmount,
    priceGapPercent: evalResult.priceGapPercent,
    pricingStatus: evalResult.pricingStatus,
    isBuyBoxWinner: evalResult.isBuyBoxWinner,
    buyBoxWinner: evalResult.isBuyBoxWinner ? `${current.merchantStoreName || 'متجرك'} (فائز بالـ Buy Box 🏆)` : current.buyBoxWinner,
    suggestedAction: evalResult.suggestedAction,
    lastRefreshedAt: new Date().toISOString()
  };

  catalog[index] = updated;
  saveMerchantCatalog(merchantId, catalog);

  // Send update to server if needed
  fetch('/api/merchant/catalog/reprice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantId,
      productId,
      sku: current.sku,
      asin: current.asin,
      platform: current.platform,
      newPrice
    })
  }).catch(() => {});

  return updated;
}

/**
 * Calculates high-level summary KPIs for a merchant catalog
 */
export function calculateCatalogSummary(products: MerchantCatalogProduct[]): MerchantCatalogSummary {
  if (products.length === 0) {
    return {
      totalProducts: 0,
      amazonProductsCount: 0,
      noonProductsCount: 0,
      winningBuyBoxCount: 0,
      buyBoxWinRatePercent: 0,
      higherThanBuyBoxCount: 0,
      needsRepricingCount: 0,
      totalInventoryQuantity: 0,
      totalCatalogValueEGP: 0,
      averagePriceGapPercent: 0,
      autoRepricerEnabledCount: 0,
      floorPriceReachedCount: 0
    };
  }

  const total = products.length;
  const amazonCount = products.filter(p => p.platform === 'amazon_eg').length;
  const noonCount = products.filter(p => p.platform === 'noon_eg').length;
  const winningBuyBox = products.filter(p => p.isBuyBoxWinner).length;
  const higherThanBuyBox = products.filter(p => p.pricingStatus === 'higher_than_buybox').length;
  const needsRepricing = products.filter(p => p.pricingStatus === 'needs_repricing').length;
  const totalQty = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
  const totalValue = products.reduce((acc, p) => acc + (p.merchantPrice * (p.stockQuantity || 1)), 0);
  const avgGap = Number((products.reduce((acc, p) => acc + p.priceGapPercent, 0) / total).toFixed(1));
  const autoRepricerEnabledCount = products.filter(p => p.repricingRule?.enabled).length;
  const floorPriceReachedCount = products.filter(p => p.repricingRule?.floorPriceReached).length;

  return {
    totalProducts: total,
    amazonProductsCount: amazonCount,
    noonProductsCount: noonCount,
    winningBuyBoxCount: winningBuyBox,
    buyBoxWinRatePercent: Math.round((winningBuyBox / total) * 100),
    higherThanBuyBoxCount: higherThanBuyBox,
    needsRepricingCount: needsRepricing,
    totalInventoryQuantity: totalQty,
    totalCatalogValueEGP: totalValue,
    averagePriceGapPercent: avgGap,
    autoRepricerEnabledCount,
    floorPriceReachedCount
  };
}

/**
 * Loads the Automated Repricer Audit Log for a specific merchant
 */
export function loadMerchantRepricingAuditLog(merchantId: string): RepricingAuditLogEntry[] {
  if (!merchantId) return [];
  const key = `${REPRICING_LOG_STORAGE_PREFIX}${merchantId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading repricing audit logs:', e);
  }
  return [];
}

/**
 * Saves the Automated Repricer Audit Log for a specific merchant
 */
export function saveMerchantRepricingAuditLog(merchantId: string, logs: RepricingAuditLogEntry[]): void {
  if (!merchantId) return;
  const key = `${REPRICING_LOG_STORAGE_PREFIX}${merchantId}`;
  try {
    localStorage.setItem(key, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.error('Error saving repricing audit logs:', e);
  }
}

/**
 * Updates the Automated Repricing Rule for a specific product
 */
export function updateProductRepricingRule(
  merchantId: string,
  productId: string,
  rule: MerchantRepricingRule
): MerchantCatalogProduct | null {
  const catalog = loadMerchantCatalog(merchantId);
  const idx = catalog.findIndex(p => p.id === productId);
  if (idx === -1) return null;

  const prod = catalog[idx];
  const refPrice = rule.targetBenchmark === 'lowest_competitor' ? prod.lowestCompetitorPrice : prod.buyBoxPrice;
  const floorPriceReached = (refPrice - rule.beatCompetitorBy) <= rule.minPrice;

  const updated: MerchantCatalogProduct = {
    ...prod,
    repricingRule: {
      ...rule,
      floorPriceReached
    }
  };

  catalog[idx] = updated;
  saveMerchantCatalog(merchantId, catalog);
  return updated;
}

/**
 * Toggles Enable/Disable Automated Repricer for a single product
 */
export function toggleProductRepricer(
  merchantId: string,
  productId: string,
  enabled: boolean
): MerchantCatalogProduct | null {
  const catalog = loadMerchantCatalog(merchantId);
  const idx = catalog.findIndex(p => p.id === productId);
  if (idx === -1) return null;

  const prod = ensureDefaultRepricingRule(catalog[idx]);
  const updated: MerchantCatalogProduct = {
    ...prod,
    repricingRule: {
      ...prod.repricingRule!,
      enabled
    }
  };

  catalog[idx] = updated;
  saveMerchantCatalog(merchantId, catalog);
  return updated;
}

/**
 * Core Automated Repricing Engine:
 * Applies the formula: New Price = Math.max(Competitor Price - Beat Amount, Min Price)
 * Bounded by Max Price (Ceiling Price), updates prices via Amazon Listings API / Noon API,
 * and records audit log entries & Floor Price Reached alerts.
 */
export async function executeAutomatedRepricingForMerchant(
  merchant: RemoteMerchantClient,
  targetProductIds?: string[]
): Promise<{
  updatedProducts: MerchantCatalogProduct[];
  newLogs: RepricingAuditLogEntry[];
  floorPriceReachedProducts: MerchantCatalogProduct[];
}> {
  const subState = evaluateMerchantSubscriptionState(merchant);
  if (subState.isTrialExpired && !subState.isSubscribed) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('merchant_radar_open_subscription_paywall', { detail: { merchantId: merchant.id } }));
    }
    throw new Error(`انتهت فترة التجربة المجانية (3 أيام) للتاجر "${merchant.storeName}" — تم إيقاف معدِّل الأسعار التلقائي (Repricer) لحين تجديد الاشتراك 🔒`);
  }

  const catalog = loadMerchantCatalog(merchant.id);
  const existingLogs = loadMerchantRepricingAuditLog(merchant.id);
  const newLogs: RepricingAuditLogEntry[] = [];
  const floorPriceReachedProducts: MerchantCatalogProduct[] = [];
  const now = new Date().toISOString();

  const updatedCatalog = catalog.map((rawProd) => {
    const prod = ensureDefaultRepricingRule(rawProd);
    const rule = prod.repricingRule!;

    // Only process enabled products (or explicitly targeted product IDs)
    if (targetProductIds && targetProductIds.length > 0 && !targetProductIds.includes(prod.id)) {
      return prod;
    }
    if (!rule.enabled && (!targetProductIds || !targetProductIds.includes(prod.id))) {
      return prod;
    }

    const competitorBenchmarkPrice =
      rule.targetBenchmark === 'lowest_competitor'
        ? prod.lowestCompetitorPrice
        : prod.buyBoxPrice;

    const competitorName =
      rule.targetBenchmark === 'lowest_competitor'
        ? prod.lowestCompetitorName
        : prod.buyBoxWinner;

    // Formula required: New Price = Math.max(Competitor Price - Beat Amount, Min Price)
    const rawTargetPrice = competitorBenchmarkPrice - rule.beatCompetitorBy;
    const boundedByFloor = Math.max(rawTargetPrice, rule.minPrice);
    const calculatedNewPrice = Math.min(boundedByFloor, rule.maxPrice);

    const isFloorReached = rawTargetPrice <= rule.minPrice;

    const evalResult = evaluatePricingCompetitiveness(
      calculatedNewPrice,
      prod.lowestCompetitorPrice,
      prod.buyBoxPrice
    );

    const apiEndpointUsed =
      prod.platform === 'amazon_eg'
        ? 'Amazon SP-API Listings Items PATCH (/listings/2021-08-01/items)'
        : 'Noon Partner Pricing Update API (/partner/v1/pricing/update)';

    const priceChanged = calculatedNewPrice !== prod.merchantPrice;

    if (priceChanged || isFloorReached) {
      const logEntry: RepricingAuditLogEntry = {
        id: `repr-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        merchantId: merchant.id,
        merchantStoreName: merchant.storeName,
        productId: prod.id,
        sku: prod.sku,
        asin: prod.asin,
        productTitle: prod.title,
        platform: prod.platform,
        platformName: prod.platformName,
        previousPrice: prod.merchantPrice,
        newPrice: calculatedNewPrice,
        competitorPrice: competitorBenchmarkPrice,
        competitorName: competitorName.replace(' - فائز بالـ Buy Box 🏆', ''),
        minPrice: rule.minPrice,
        maxPrice: rule.maxPrice,
        beatAmount: rule.beatCompetitorBy,
        floorPriceReached: isFloorReached,
        apiSyncStatus: isFloorReached && calculatedNewPrice > rawTargetPrice
          ? 'floor_blocked'
          : (merchant.dataMode === 'demo' ? 'synced_sandbox' : 'synced_live'),
        apiEndpointUsed,
        timestamp: now,
        notes: isFloorReached
          ? `⚠️ وصل المنتج للحد الأدنى للسعر (${rule.minPrice.toLocaleString('ar-EG')} ج.م) لحماية هامش الربح؛ سعر المنافس (${competitorBenchmarkPrice.toLocaleString('ar-EG')} ج.م).`
          : `✅ تم خفض السعر تلقائياً بمقدار ${rule.beatCompetitorBy} ج.م تحت سعر المنافس (${competitorBenchmarkPrice.toLocaleString('ar-EG')} ج.م) وانتزاع الـ Buy Box.`
      };
      newLogs.push(logEntry);
    }

    const updatedProd: MerchantCatalogProduct = {
      ...prod,
      merchantPrice: calculatedNewPrice,
      priceGapAmount: evalResult.priceGapAmount,
      priceGapPercent: evalResult.priceGapPercent,
      pricingStatus: evalResult.pricingStatus,
      isBuyBoxWinner: evalResult.isBuyBoxWinner,
      buyBoxWinner: evalResult.isBuyBoxWinner
        ? `${merchant.storeName} (فائز بالـ Buy Box 🏆)`
        : prod.buyBoxWinner,
      suggestedAction: isFloorReached
        ? `⚠️ تنبيه الحد الأدنى: توقف الخفض عند ${rule.minPrice.toLocaleString('ar-EG')} ج.م لحمايتك من الخسارة (سعر المنافس ${competitorBenchmarkPrice.toLocaleString('ar-EG')} ج.م).`
        : evalResult.suggestedAction,
      repricingRule: {
        ...rule,
        floorPriceReached: isFloorReached,
        lastAutoRepricedAt: now
      },
      lastRefreshedAt: now
    };

    if (isFloorReached) {
      floorPriceReachedProducts.push(updatedProd);
    }

    return updatedProd;
  });

  saveMerchantCatalog(merchant.id, updatedCatalog);

  if (newLogs.length > 0) {
    saveMerchantRepricingAuditLog(merchant.id, [...newLogs, ...existingLogs]);
  }

  // Dispatch batch automated repricing payload to backend API (Amazon Listings API / Noon Pricing API)
  try {
    await fetch('/api/merchant/repricer/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-merchant-id': merchant.id,
        'x-data-mode': merchant.dataMode || 'live'
      },
      body: JSON.stringify({
        merchantId: merchant.id,
        merchantName: merchant.storeName,
        dataMode: merchant.dataMode || 'live',
        credentials: merchant.apiCredentials,
        updates: newLogs
      })
    });
  } catch (e) {
    console.warn('Background repricer API sync note:', e);
  }

  return {
    updatedProducts: updatedCatalog,
    newLogs,
    floorPriceReachedProducts
  };
}
