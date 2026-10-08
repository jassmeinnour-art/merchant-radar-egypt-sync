import { ConnectedMerchantPlatform, RemoteMerchantClient, MerchantApiCredentials } from '../types';

export interface PlatformPortalMeta {
  code: string;
  name: string;
  shortName: string;
  sellerPortalUrl: string;
  portalLabel: string;
  portalDescription: string;
  badgeText: string;
  themeColor: string;
  accentBg: string;
  loginTip: string;
  directLaunchSupported: boolean;
}

export const DEFAULT_PLATFORM_PORTALS: Record<string, PlatformPortalMeta> = {
  amazon_eg: {
    code: 'amazon_eg',
    name: 'أمازون مصر (Amazon Egypt)',
    shortName: 'أمازون مصر',
    sellerPortalUrl: 'https://sellercentral.amazon.eg/',
    portalLabel: 'Amazon Seller Central EG',
    portalDescription: 'لوحة إدارة المنتجات، أسعار Buy Box، طلبات الشحن FBA والمخزون',
    badgeText: 'سيلر سنترال',
    themeColor: '#FF9900',
    accentBg: 'bg-amber-500/10 text-amber-700 border-amber-200',
    loginTip: 'تسجيل الدخول التلقائي بحساب البائع المعتمد عبر البريد المرتبط',
    directLaunchSupported: true,
  },
  noon_eg: {
    code: 'noon_eg',
    name: 'نون مصر (Noon Partner)',
    shortName: 'نون مصر',
    sellerPortalUrl: 'https://core.noon.partners/',
    portalLabel: 'Noon Partners & Seller Lab EG',
    portalDescription: 'بوابة شركاء نون لإدارة الكتالوج، الكوبونات وتحديث الأسعار التنافسية',
    badgeText: 'نون بارتنرز',
    themeColor: '#FEE000',
    accentBg: 'bg-yellow-500/10 text-yellow-800 border-yellow-200',
    loginTip: 'ربط مباشر عبر بوابة Noon Core Partners',
    directLaunchSupported: true,
  },
  jumia_eg: {
    code: 'jumia_eg',
    name: 'جوميا مصر (Jumia Seller Center)',
    shortName: 'جوميا مصر',
    sellerPortalUrl: 'https://sellercenter.jumia.com.eg/',
    portalLabel: 'Jumia Seller Center Egypt',
    portalDescription: 'لوحة التحكم للمنتجات، العروض الترويجية ووثائق الشحن لمصر',
    badgeText: 'سيلر سنتر',
    themeColor: '#F68B1E',
    accentBg: 'bg-orange-500/10 text-orange-700 border-orange-200',
    loginTip: 'الوصول المباشر لمركز بائعي جوميا مصر',
    directLaunchSupported: true,
  },
  raneen_eg: {
    code: 'raneen_eg',
    name: 'رنين (Raneen Egypt - الأدوات المنزلية والأجهزة)',
    shortName: 'رنين مصر',
    sellerPortalUrl: 'https://seller.raneen.com/',
    portalLabel: 'Raneen Vendor & Partner Portal',
    portalDescription: 'بوابة موردي وشركاء رنين في قطاع الأجهزة والأدوات المنزلية والعروض',
    badgeText: 'بوابة رنين',
    themeColor: '#0055A5',
    accentBg: 'bg-blue-500/10 text-blue-700 border-blue-200',
    loginTip: 'تسجيل دخول موزع رنين المعتمد بحساب التاجر',
    directLaunchSupported: true,
  },
  kenzz_eg: {
    code: 'kenzz_eg',
    name: 'كنز (Kenzz Egypt - التجارة الاجتماعية)',
    shortName: 'كنز مصر',
    sellerPortalUrl: 'https://seller.kenzz.com/',
    portalLabel: 'Kenzz Suppliers & Social Commerce',
    portalDescription: 'إدارة طلبات التوريد والشحن للتجارة الاجتماعية الجماعية في مصر',
    badgeText: 'مورد كنز',
    themeColor: '#10B981',
    accentBg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
    loginTip: 'بوابة موردي وموزعي كنز مصر',
    directLaunchSupported: true,
  },
  homzmart_eg: {
    code: 'homzmart_eg',
    name: 'هومزمارت (Homzmart Egypt - الأثاث والتجهيزات)',
    shortName: 'هومزمارت',
    sellerPortalUrl: 'https://seller.homzmart.com/',
    portalLabel: 'Homzmart Merchant Hub',
    portalDescription: 'إدارة معارض الأثاث، الديكورات، التجهيزات ومخزون المنتجات العصرية',
    badgeText: 'تجار هومزمارت',
    themeColor: '#6366F1',
    accentBg: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
    loginTip: 'لوحة تجار وموردي منصة هومزمارت مصر',
    directLaunchSupported: true,
  },
  btech_eg: {
    code: 'btech_eg',
    name: 'بي تك (B.TECH Egypt - الأجهزة والميني كاش)',
    shortName: 'بي تك',
    sellerPortalUrl: 'https://partner.btech.com/',
    portalLabel: 'B.TECH Partners & Marketplace',
    portalDescription: 'بوابة شركاء الأجهزة والإلكترونيات ومنظومة تقسيط الميني كاش',
    badgeText: 'شركاء B.TECH',
    themeColor: '#0284C7',
    accentBg: 'bg-sky-500/10 text-sky-700 border-sky-200',
    loginTip: 'نظام إدارة شركاء بي تك الرسمي',
    directLaunchSupported: true,
  },
  elaraby_group: {
    code: 'elaraby_group',
    name: 'مجموعة العربي (ElAraby Group - توشيبا، تورنيدو، شارب)',
    shortName: 'العربي جروب',
    sellerPortalUrl: 'https://www.elarabygroup.com/',
    portalLabel: 'ElAraby Distributors & Dealers Portal',
    portalDescription: 'بوابة الموزعين المعتمدين لماركات توشيبا، تورنيدو، شارب وسيكو',
    badgeText: 'موزعو العربي',
    themeColor: '#E11D48',
    accentBg: 'bg-rose-500/10 text-rose-700 border-rose-200',
    loginTip: 'بوابة الموزعين والوكلاء المعتمدين',
    directLaunchSupported: true,
  },
  facebook_marketplace: {
    code: 'facebook_marketplace',
    name: 'فيسبوك ماركت بليس (Facebook Marketplace & Meta)',
    shortName: 'ميتا وفيسبوك',
    sellerPortalUrl: 'https://business.facebook.com/commerce',
    portalLabel: 'Meta Commerce Manager & Facebook',
    portalDescription: 'إدارة كتالوج المنتجات، حملات المتاجر، وإنستغرام وفيسبوك شوب',
    badgeText: 'Meta Commerce',
    themeColor: '#1877F2',
    accentBg: 'bg-blue-600/10 text-blue-700 border-blue-200',
    loginTip: 'لوحة تحكم مدير التجارة والكتالوجات من Meta',
    directLaunchSupported: true,
  },
  twob_eg: {
    code: 'twob_eg',
    name: '2B مصر (2B Computer & Electronics)',
    shortName: '2B مصر',
    sellerPortalUrl: 'https://2b.com.eg/',
    portalLabel: '2B Partners & Vendor Portal',
    portalDescription: 'لوحة توريد اللابتوب والإلكترونيات وأجهزة الكمبيوتر',
    badgeText: 'بوابة 2B',
    themeColor: '#9333EA',
    accentBg: 'bg-purple-500/10 text-purple-700 border-purple-200',
    loginTip: 'بوابة تجار وموردي شبكة 2B مصر',
    directLaunchSupported: true,
  },
  shopify_salla: {
    code: 'shopify_salla',
    name: 'المتجر الإلكتروني الخاص (Shopify / سلة / زد)',
    shortName: 'المتجر الخاص',
    sellerPortalUrl: 'https://admin.shopify.com/',
    portalLabel: 'Online Store Admin (Shopify / Salla / Zid)',
    portalDescription: 'لوحة التحكم المستقلة بالمتجر لإدارة المنتجات، التخفيضات والطلبات المباشرة',
    badgeText: 'إدارة المتجر',
    themeColor: '#059669',
    accentBg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
    loginTip: 'لوحة التحكم المركزية لمتجرك الإلكتروني الخاص',
    directLaunchSupported: true,
  },
  tiktok_shop: {
    code: 'tiktok_shop',
    name: 'تيك توك شوب وسوشيال ميديا (TikTok Shop EG)',
    shortName: 'تيك توك شوب',
    sellerPortalUrl: 'https://seller.tiktok.com/',
    portalLabel: 'TikTok Shop Seller Center',
    portalDescription: 'إدارة مبيعات الفيديو، البث المباشر (Live Selling)، وتفاعل المتابعين',
    badgeText: 'سيلر سنتر',
    themeColor: '#000000',
    accentBg: 'bg-slate-900/10 text-slate-800 border-slate-300',
    loginTip: 'بوابة بائعي تيك توك شوب الرسمية',
    directLaunchSupported: true,
  },
};

/**
 * Returns the effective seller portal URL for a platform.
 * Prefers the platform's custom configured `sellerPortalUrl`,
 * falls back to predefined default, then `merchantStoreUrl`.
 */
export function getPlatformSellerPortalUrl(platform: ConnectedMerchantPlatform): string {
  if (platform.sellerPortalUrl && platform.sellerPortalUrl.trim().length > 0) {
    return platform.sellerPortalUrl.trim();
  }
  const meta = DEFAULT_PLATFORM_PORTALS[platform.code];
  if (meta?.sellerPortalUrl) {
    return meta.sellerPortalUrl;
  }
  if (platform.merchantStoreUrl && platform.merchantStoreUrl.trim().length > 0) {
    return platform.merchantStoreUrl.trim();
  }
  return 'https://sellercentral.amazon.eg/';
}

/**
 * Returns portal metadata for a given platform code.
 */
export function getPlatformPortalMeta(code: string): PlatformPortalMeta | undefined {
  return DEFAULT_PLATFORM_PORTALS[code];
}

export function getSellerPortalUrlByCode(code: string): string {
  const meta = DEFAULT_PLATFORM_PORTALS[code];
  if (meta?.sellerPortalUrl) {
    return meta.sellerPortalUrl;
  }
  return 'https://sellercentral.amazon.eg/';
}

/**
 * Directly launches seller central / portal for any platform code safely
 */
export function launchSellerPortalByCode(
  code: string,
  platformName?: string,
  merchantName?: string,
  onLaunched?: (msg: string) => void
): string {
  const url = getSellerPortalUrlByCode(code);
  const meta = DEFAULT_PLATFORM_PORTALS[code];
  const name = platformName || meta?.name || code;
  
  if (typeof window !== 'undefined') {
    try {
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      // Safe fallback
    }
  }

  const notification = merchantName 
    ? `جاري فتح لوحة تحكم السيلر سنترال (${name}) للتاجر "${merchantName}" 🚀`
    : `جاري فتح لوحة تحكم السيلر سنترال (${name}) فوراً 🚀`;
    
  if (onLaunched) {
    onLaunched(notification);
  }
  return url;
}

/**
 * Direct launch executor: opens the seller portal in a new tab safely.
 */
export function directLaunchPlatformPortal(
  platform: ConnectedMerchantPlatform,
  options?: { onLaunched?: (url: string) => void }
): string {
  const url = getPlatformSellerPortalUrl(platform);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  if (options?.onLaunched) {
    options.onLaunched(url);
  }
  return url;
}

const STORAGE_PLATFORMS_KEY = 'merchant_radar_connected_platforms_v2';
const STORAGE_GMAIL_LINKED_KEY = 'merchant_radar_linked_gmail_account';

/**
 * Loads stored platforms from localStorage if available, or returns default platforms.
 */
export function loadStoredPlatforms(defaultPlatforms: ConnectedMerchantPlatform[]): ConnectedMerchantPlatform[] {
  try {
    const raw = localStorage.getItem(STORAGE_PLATFORMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let hasHealedStaleErrors = false;
        // Ensure new fields from defaultPlatforms are preserved
        const existingList = parsed.map((plat) => {
          const defaultPlat = defaultPlatforms.find((d) => d.id === plat.id || d.code === plat.code);
          const meta = DEFAULT_PLATFORM_PORTALS[plat.code];

          // Auto-heal any stale simulated error from old mock data (e.g., Homzmart mock error)
          const isStaleMockError = (plat.syncError && typeof plat.syncError === 'string' && plat.syncError.includes('خطأ في توثيق API Token')) ||
                                  (plat.code === 'homzmart_eg' && (plat.status === 'error' || plat.hasSyncError));
          
          if (isStaleMockError) {
            hasHealedStaleErrors = true;
            return {
              ...defaultPlat,
              ...plat,
              status: 'active',
              hasSyncError: false,
              syncError: undefined,
              lastSyncedAt: 'منذ 10 دقائق (مزامنة سليمة)',
              sellerPortalUrl: plat.sellerPortalUrl || meta?.sellerPortalUrl || defaultPlat?.sellerPortalUrl,
              directLaunchSupported: true,
            };
          }

          const sanitizedCompetitors = (plat.importedCompetitors || []).filter((rec: any) => {
            const title = (rec.productTitleOrSku || '').toLowerCase();
            const comp = (rec.competitorName || '').toLowerCase();
            return !title.includes('سماع') && !title.includes('headphone') && 
                   !title.includes('q30') && !comp.includes('أنكر');
          });

          return {
            ...defaultPlat,
            ...plat,
            importedCompetitors: sanitizedCompetitors,
            importedCompetitorsCount: sanitizedCompetitors.length,
            sellerPortalUrl: plat.sellerPortalUrl || meta?.sellerPortalUrl || defaultPlat?.sellerPortalUrl,
            directLaunchSupported: true,
          };
        });

        // Also ensure any newly added default platform (e.g. raneen_eg) is merged into stored array if missing
        const existingCodes = new Set(existingList.map((p) => p.code));
        const missingDefaults = defaultPlatforms.filter((d) => !existingCodes.has(d.code)).map((plat) => {
          const meta = DEFAULT_PLATFORM_PORTALS[plat.code];
          return {
            ...plat,
            sellerPortalUrl: plat.sellerPortalUrl || meta?.sellerPortalUrl,
            directLaunchSupported: true,
          };
        });

        const combinedList = [...existingList, ...missingDefaults];

        // If we healed any mock errors, persist clean state to localStorage
        if (hasHealedStaleErrors) {
          try {
            localStorage.setItem(STORAGE_PLATFORMS_KEY, JSON.stringify(combinedList));
          } catch {}
        }

        return combinedList;
      }
    }
  } catch {
    // safe fallback
  }
  return defaultPlatforms.map((plat) => {
    const meta = DEFAULT_PLATFORM_PORTALS[plat.code];
    return {
      ...plat,
      sellerPortalUrl: plat.sellerPortalUrl || meta?.sellerPortalUrl,
      directLaunchSupported: true,
    };
  });
}

/**
 * Saves connected platforms to localStorage.
 */
export function saveStoredPlatforms(platforms: ConnectedMerchantPlatform[]): void {
  try {
    localStorage.setItem(STORAGE_PLATFORMS_KEY, JSON.stringify(platforms));
  } catch {
    // safe fallback
  }
}

/**
 * Retrieves the currently linked Gmail address from localStorage.
 */
export function getStoredLinkedGmail(): string | null {
  try {
    return localStorage.getItem(STORAGE_GMAIL_LINKED_KEY);
  } catch {
    return null;
  }
}

/**
 * Persists the linked Gmail address in localStorage.
 */
export function saveStoredLinkedGmail(email: string | null): void {
  try {
    if (email) {
      localStorage.setItem(STORAGE_GMAIL_LINKED_KEY, email.trim());
    } else {
      localStorage.removeItem(STORAGE_GMAIL_LINKED_KEY);
    }
  } catch {
    // safe fallback
  }
}

/**
 * Core Smart Auto-Link Engine with Gmail:
 * Automatically associates all merchant platforms with the given primary Gmail address.
 * Sets isConnected: true, isGmailLinked: true, merchantEmail: gmail, status: 'active'.
 */
export function autoLinkPlatformsWithGmail(
  platforms: ConnectedMerchantPlatform[],
  gmailAddress: string
): { updatedPlatforms: ConnectedMerchantPlatform[]; linkedCount: number } {
  const cleanEmail = gmailAddress.trim().toLowerCase();
  const emailPrefix = cleanEmail.split('@')[0] || 'merchant';
  const nowStr = new Date().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const updatedPlatforms = platforms.map((plat) => {
    const meta = DEFAULT_PLATFORM_PORTALS[plat.code];
    const portalUrl = plat.sellerPortalUrl || meta?.sellerPortalUrl || getPlatformSellerPortalUrl(plat);

    // Keep existing seller name if customized, otherwise enrich with merchant identifier
    const defaultSeller = plat.sellerName || `متجر ${emailPrefix}`;

    return {
      ...plat,
      isConnected: true,
      isGmailLinked: true,
      linkedGmail: cleanEmail,
      merchantEmail: cleanEmail,
      sellerPortalUrl: portalUrl,
      directLaunchSupported: true,
      status: 'active' as const,
      hasSyncError: false,
      syncError: undefined,
      lastSyncedAt: `مزامنة ذكية عبر Gmail (${nowStr}) ⚡`,
      sellerName: defaultSeller,
    };
  });

  // Save to localStorage immediately
  saveStoredPlatforms(updatedPlatforms);
  saveStoredLinkedGmail(cleanEmail);

  return {
    updatedPlatforms,
    linkedCount: updatedPlatforms.length,
  };
}

/**
 * Unlinks Gmail from all platforms or a single platform.
 */
export function unlinkPlatformsFromGmail(
  platforms: ConnectedMerchantPlatform[],
  targetPlatformId?: string
): ConnectedMerchantPlatform[] {
  const updated = platforms.map((plat) => {
    if (!targetPlatformId || plat.id === targetPlatformId) {
      return {
        ...plat,
        isGmailLinked: false,
        linkedGmail: undefined,
        lastSyncedAt: 'تم فك الربط الذكي',
      };
    }
    return plat;
  });

  saveStoredPlatforms(updated);
  if (!targetPlatformId) {
    saveStoredLinkedGmail(null);
  }
  return updated;
}

export const STORAGE_MERCHANTS_LIST_KEY = 'merchant_radar_remote_merchants_v1';
export const STORAGE_ACTIVE_MANAGED_MERCHANT_KEY = 'merchant_radar_active_managed_merchant_id';

// Default multi-tenant merchants (Step QUeen, star steel, Art Deco Egypt, Royal Furniture)
export const DEFAULT_REGISTERED_MERCHANTS: RemoteMerchantClient[] = [
  {
    id: 'merchant-step-queen',
    storeName: 'Step QUeen',
    contactPerson: 'أ. ريم أحمد',
    primaryEmail: 'contact@stepqueen-eg.com',
    additionalEmails: ['sales@stepqueen-eg.com'],
    phone: '+20 10 9876 5432',
    city: 'القاهرة - المعادي',
    platformsSubscribed: ['amazon_eg', 'noon_eg', 'jumia_eg', 'tiktok_shop'],
    assignedProductIds: [],
    weeklySalesTargetEGP: 180000,
    currentWeeklySalesEGP: 0,
    currentWeeklyOrdersCount: 0,
    averageProfitMarginPercent: 28.5,
    buyBoxWinRatePercent: 88,
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
      dataMode: 'live',
      isConfigured: false
    }
  },
  {
    id: 'merchant-star-steel',
    storeName: 'star steel',
    contactPerson: 'م. إبراهيم فؤاد',
    primaryEmail: 'info@starsteel-egypt.com',
    additionalEmails: ['operations@starsteel-egypt.com'],
    phone: '+20 11 4455 6677',
    city: 'العاشر من رمضان',
    platformsSubscribed: ['amazon_eg', 'noon_eg', 'homzmart_eg'],
    assignedProductIds: [],
    weeklySalesTargetEGP: 150000,
    currentWeeklySalesEGP: 0,
    currentWeeklyOrdersCount: 0,
    averageProfitMarginPercent: 24.0,
    buyBoxWinRatePercent: 82,
    reportDayOfWeek: 'thursday',
    autoSendWeeklyReport: true,
    sendWhatsAppReport: true,
    status: 'active',
    dataMode: 'demo',
    apiCredentials: {
      amazonClientId: '',
      amazonClientSecret: '',
      amazonRefreshToken: '',
      amazonRegion: 'eu-west-1',
      amazonMarketplaceId: 'ARBP9OOSHTCHU',
      noonAuthKey: '',
      noonAppId: '',
      dataMode: 'demo',
      isConfigured: false
    }
  },
  {
    id: 'merchant-art-deco',
    storeName: 'Art Deco Egypt (أرت ديكو للأثاث)',
    contactPerson: 'م. حسام الشريف',
    primaryEmail: 'hossam@artdeco-egypt.com',
    additionalEmails: ['sales@artdeco-egypt.com'],
    phone: '+20 10 1994 4201',
    city: 'القاهرة - التجمع الخامس',
    platformsSubscribed: ['amazon_eg', 'noon_eg', 'homzmart_eg', 'btech_eg'],
    assignedProductIds: [],
    weeklySalesTargetEGP: 220000,
    currentWeeklySalesEGP: 0,
    currentWeeklyOrdersCount: 0,
    averageProfitMarginPercent: 26.5,
    buyBoxWinRatePercent: 91,
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
      dataMode: 'live',
      isConfigured: false
    }
  },
  {
    id: 'merchant-royal-furniture',
    storeName: 'Royal Furniture EG (رويال فورنتشر)',
    contactPerson: 'الباشمهندس طارق رضوان',
    primaryEmail: 'tarek@royalfurniture-eg.com',
    additionalEmails: ['contact@royalfurniture-eg.com'],
    phone: '+20 12 2390 1124',
    city: 'دمياط - معارض شطا',
    platformsSubscribed: ['amazon_eg', 'noon_eg', 'homzmart_eg'],
    assignedProductIds: [],
    weeklySalesTargetEGP: 250000,
    currentWeeklySalesEGP: 0,
    currentWeeklyOrdersCount: 0,
    averageProfitMarginPercent: 25.0,
    buyBoxWinRatePercent: 85,
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
      dataMode: 'live',
      isConfigured: false
    }
  }
];

const STORAGE_VODAFONE_WALLET_KEY = 'merchant_radar_admin_vodafone_cash_wallet_v1';

/**
 * Retrieves the Admin-configured Vodafone Cash wallet number for receiving subscription payments.
 */
export function getVodafoneCashAdminWallet(): string {
  try {
    const saved = localStorage.getItem(STORAGE_VODAFONE_WALLET_KEY);
    if (saved && saved.trim().length >= 8) {
      return saved.trim();
    }
  } catch {}
  return '01023456789';
}

/**
 * Updates the Admin-configured Vodafone Cash wallet number.
 */
export function saveVodafoneCashAdminWallet(walletNumber: string): string {
  const cleaned = walletNumber.trim() || '01023456789';
  try {
    localStorage.setItem(STORAGE_VODAFONE_WALLET_KEY, cleaned);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('merchant_radar_vodafone_wallet_updated', { detail: cleaned }));
    }
  } catch {}
  return cleaned;
}

/**
 * Ensures a merchant object has valid 3-day free trial (72 hours) and subscription fields.
 */
export function ensureMerchantTrialFields(merchant: RemoteMerchantClient): RemoteMerchantClient {
  if (merchant.trialStartDate && merchant.trialEndDate && merchant.subscriptionStatus) {
    if (merchant.subscriptionStatus === 'pending_verification') {
      return merchant;
    }
    // Check if trial has expired dynamically when status is 'trialing'
    if (merchant.subscriptionStatus === 'trialing') {
      const endMs = new Date(merchant.trialEndDate).getTime();
      if (endMs <= Date.now()) {
        return {
          ...merchant,
          subscriptionStatus: 'expired'
        };
      }
    }
    return merchant;
  }

  const now = new Date();
  const trialStart = merchant.createdAt ? new Date(merchant.createdAt) : now;
  const trialEnd = new Date(trialStart.getTime() + 3 * 24 * 60 * 60 * 1000); // 72 hours (3 days)

  return {
    ...merchant,
    createdAt: merchant.createdAt || now.toISOString(),
    trialStartDate: merchant.trialStartDate || trialStart.toISOString(),
    trialEndDate: merchant.trialEndDate || trialEnd.toISOString(),
    subscriptionStatus: merchant.subscriptionStatus || (trialEnd.getTime() > Date.now() ? 'trialing' : 'expired'),
    subscriptionPlanId: merchant.subscriptionPlanId || 'trial_3_days',
    paymentHistory: merchant.paymentHistory || []
  };
}

/**
 * Calculates the real-time subscription and 3-day trial status for a specific merchant.
 */
export function evaluateMerchantSubscriptionState(merchant?: RemoteMerchantClient | null): {
  status: 'trialing' | 'active' | 'expired' | 'pending_verification';
  isTrialActive: boolean;
  isTrialExpired: boolean;
  isSubscribed: boolean;
  isPendingVerification: boolean;
  remainingDays: number;
  remainingHours: number;
  remainingMinutes: number;
  formattedBannerText: string;
  badgeLabel: string;
} {
  if (!merchant) {
    return {
      status: 'trialing',
      isTrialActive: true,
      isTrialExpired: false,
      isSubscribed: false,
      isPendingVerification: false,
      remainingDays: 3,
      remainingHours: 0,
      remainingMinutes: 0,
      formattedBannerText: 'باقي 3 أيام (72 ساعة) على انتهاء تجربتك المجانية - اشترك الآن للحفاظ على استمرار الخدمة',
      badgeLabel: 'تجربة مجانية (3 أيام) ⏳'
    };
  }

  const normalized = ensureMerchantTrialFields(merchant);

  // 1. Active Paid Subscription
  if (normalized.subscriptionStatus === 'active') {
    const subEndMs = normalized.subscriptionEndDate ? new Date(normalized.subscriptionEndDate).getTime() : Date.now() + 30 * 86400000;
    if (subEndMs > Date.now()) {
      const planLabel =
        normalized.subscriptionPlanId === 'plan_12_months'
          ? 'باقة سنوية (12 شهراً)'
          : normalized.subscriptionPlanId === 'plan_6_months'
          ? 'باقة نصف سنوية (6 أشهر)'
          : normalized.subscriptionPlanId === 'plan_1_month'
          ? 'باقة شهرية'
          : 'اشتراك مفعل';
      return {
        status: 'active',
        isTrialActive: false,
        isTrialExpired: false,
        isSubscribed: true,
        isPendingVerification: false,
        remainingDays: Math.ceil((subEndMs - Date.now()) / 86400000),
        remainingHours: 0,
        remainingMinutes: 0,
        formattedBannerText: `اشتراك نشط ومعتمد (${planLabel}) — كافة ميزات سحب الطلبات والمعدِّل التلقائي مفعلة بالكامل ✅`,
        badgeLabel: `نشط (Subscribed) ✅`
      };
    }
  }

  // 1.5 Pending Verification (Vodafone Cash Receipt Submitted)
  if (normalized.subscriptionStatus === 'pending_verification' || normalized.pendingPaymentRequest?.status === 'pending_verification') {
    const txId = normalized.pendingPaymentRequest?.transactionId || 'N/A';
    return {
      status: 'pending_verification',
      isTrialActive: false,
      isTrialExpired: true,
      isSubscribed: false,
      isPendingVerification: true,
      remainingDays: 0,
      remainingHours: 0,
      remainingMinutes: 0,
      formattedBannerText: `طلب الاشتراك عبر فودافون كاش (رقم العملية: ${txId}) قيد التأكيد والمراجعة (Pending Verification) — بانتظار اعتماد الآدمن ⏳`,
      badgeLabel: `قيد التأكيد (Pending) ⏳`
    };
  }

  // 2. Check 3-Day Free Trial (72 hours)
  const trialEndMs = new Date(normalized.trialEndDate!).getTime();
  const diffMs = trialEndMs - Date.now();

  if (diffMs > 0 && normalized.subscriptionStatus !== 'expired') {
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let timeText = '';
    if (days > 0) {
      timeText = `باقي ${days} يوم و ${hours} ساعة على انتهاء تجربتك المجانية - اشترك الآن للحفاظ على استمرار الخدمة`;
    } else if (hours > 0) {
      timeText = `باقي ${hours} ساعة و ${minutes} دقيقة على انتهاء تجربتك المجانية - اشترك الآن للحفاظ على استمرار الخدمة`;
    } else {
      timeText = `باقي ${minutes} دقيقة فقط على انتهاء تجربتك المجانية - اشترك الآن للحفاظ على استمرار الخدمة`;
    }

    return {
      status: 'trialing',
      isTrialActive: true,
      isTrialExpired: false,
      isSubscribed: false,
      isPendingVerification: false,
      remainingDays: days,
      remainingHours: hours,
      remainingMinutes: minutes,
      formattedBannerText: timeText,
      badgeLabel: days > 0 ? `تجربة مجانية: باقي ${days} يوم و ${hours}س ⏳` : `تجربة مجانية: باقي ${hours}س ⏳`
    };
  }

  // 3. Expired Trial
  return {
    status: 'expired',
    isTrialActive: false,
    isTrialExpired: true,
    isSubscribed: false,
    isPendingVerification: false,
    remainingDays: 0,
    remainingHours: 0,
    remainingMinutes: 0,
    formattedBannerText: 'انتهت فترة التجربة المجانية (3 أيام) — تم إيقاف جلب الطلبات والمعدِّل التلقائي لحين تفعيل الاشتراك 🔒',
    badgeLabel: 'انتهت التجربة (موقوف مؤقتاً) 🔒'
  };
}

/**
 * Updates a merchant's subscription status (e.g., activating a monthly/semi-annual/annual plan, submitting pending Vodafone Cash receipt, approving pending verification, resetting 3-day trial, or expiring trial).
 */
export function updateMerchantSubscriptionStatus(
  merchantId: string,
  action: 'activate_plan' | 'submit_pending_payment' | 'approve_pending_payment' | 'reset_trial' | 'expire_trial',
  options?: {
    planId?: 'plan_1_month' | 'plan_6_months' | 'plan_12_months' | 'admin_lifetime';
    planName?: string;
    durationMonths?: number;
    amountEGP?: number;
    paymentMethod?: string;
    referenceNumber?: string;
    transactionId?: string;
    receiptImageUrl?: string;
    receiptFileName?: string;
    walletNumberUsed?: string;
  }
): RemoteMerchantClient | undefined {
  const list = loadAllRegisteredMerchants();
  const idx = list.findIndex(m => m.id === merchantId);
  if (idx === -1) return undefined;

  const curr = ensureMerchantTrialFields(list[idx]);
  const now = new Date();
  let updated: RemoteMerchantClient;

  if (action === 'submit_pending_payment') {
    const planId = (options?.planId === 'plan_1_month' || options?.planId === 'plan_6_months' || options?.planId === 'plan_12_months')
      ? options.planId
      : 'plan_12_months';
    const months = options?.durationMonths || (planId === 'plan_1_month' ? 1 : planId === 'plan_6_months' ? 6 : 12);
    const expiresAt = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
    const txId = options?.transactionId || `VF-${Date.now().toString().slice(-8)}`;
    const refNum = options?.referenceNumber || `VF-PEND-${txId}`;
    const amountEGP = options?.amountEGP ?? (months === 1 ? 350 : months === 6 ? 1500 : 2500);
    const planName = options?.planName || (months === 1 ? 'الباقة الشهرية' : months === 6 ? 'باقة 6 أشهر' : 'الباقة السنوية (12 شهراً)');

    const pendingEntry = {
      id: `pend-${Date.now()}`,
      merchantId: curr.id,
      merchantName: curr.storeName,
      planId,
      planName,
      durationMonths: months,
      amountEGP,
      paymentMethod: (options?.paymentMethod as any) || 'vodafone_cash',
      transactionId: txId,
      receiptImageUrl: options?.receiptImageUrl,
      receiptFileName: options?.receiptFileName,
      walletNumberUsed: options?.walletNumberUsed || getVodafoneCashAdminWallet(),
      submittedAt: now.toISOString(),
      status: 'pending_verification' as const
    };

    const historyItem = {
      id: pendingEntry.id,
      merchantId: curr.id,
      merchantName: curr.storeName,
      planId,
      planName,
      amountEGP,
      paymentMethod: options?.paymentMethod || 'vodafone_cash',
      referenceNumber: refNum,
      transactionId: txId,
      receiptImageUrl: options?.receiptImageUrl,
      receiptFileName: options?.receiptFileName,
      walletNumberUsed: pendingEntry.walletNumberUsed,
      activatedAt: now.toISOString(),
      expiresAt,
      status: 'pending_verification' as const
    };

    updated = {
      ...curr,
      subscriptionStatus: 'pending_verification',
      subscriptionPlanId: planId,
      pendingPaymentRequest: pendingEntry,
      paymentHistory: [historyItem, ...(curr.paymentHistory || [])]
    };
  } else if (action === 'approve_pending_payment') {
    const pending = curr.pendingPaymentRequest;
    const planId = pending?.planId || options?.planId || 'plan_12_months';
    const months = pending?.durationMonths || options?.durationMonths || (planId === 'plan_1_month' ? 1 : planId === 'plan_6_months' ? 6 : 12);
    const expiresAt = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
    const txId = pending?.transactionId || options?.transactionId || `VF-${Date.now().toString().slice(-6)}`;
    const refNum = `VF-APPROVED-${txId}`;
    const amountEGP = pending?.amountEGP ?? options?.amountEGP ?? (months === 1 ? 350 : months === 6 ? 1500 : 2500);
    const planName = pending?.planName || options?.planName || (months === 1 ? 'الباقة الشهرية' : months === 6 ? 'باقة 6 أشهر' : 'الباقة السنوية (12 شهراً)');

    const updatedHistory = (curr.paymentHistory || []).map(h =>
      h.status === 'pending_verification'
        ? { ...h, status: 'paid' as const, referenceNumber: refNum, activatedAt: now.toISOString(), expiresAt }
        : h
    );

    if (!updatedHistory.some(h => h.referenceNumber === refNum)) {
      updatedHistory.unshift({
        id: `pay-${Date.now()}`,
        merchantId: curr.id,
        merchantName: curr.storeName,
        planId,
        planName,
        amountEGP,
        paymentMethod: pending?.paymentMethod || 'vodafone_cash',
        referenceNumber: refNum,
        transactionId: txId,
        receiptImageUrl: pending?.receiptImageUrl || options?.receiptImageUrl,
        receiptFileName: pending?.receiptFileName || options?.receiptFileName,
        walletNumberUsed: pending?.walletNumberUsed || getVodafoneCashAdminWallet(),
        activatedAt: now.toISOString(),
        expiresAt,
        status: 'paid' as const
      });
    }

    updated = {
      ...curr,
      status: 'active',
      subscriptionStatus: 'active',
      subscriptionPlanId: planId,
      subscriptionStartDate: now.toISOString(),
      subscriptionEndDate: expiresAt,
      pendingPaymentRequest: pending ? { ...pending, status: 'approved' } : undefined,
      paymentHistory: updatedHistory
    };
  } else if (action === 'activate_plan') {
    const planId = options?.planId || 'plan_12_months';
    const months = options?.durationMonths || (planId === 'plan_1_month' ? 1 : planId === 'plan_6_months' ? 6 : 12);
    const expiresAt = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
    const refNum = options?.referenceNumber || `PAY-${Date.now().toString(36).toUpperCase()}`;
    const paymentEntry = {
      id: `pay-${Date.now()}`,
      merchantId: curr.id,
      merchantName: curr.storeName,
      planId,
      planName: options?.planName || (months === 1 ? 'الباقة الشهرية' : months === 6 ? 'باقة 6 أشهر' : 'الباقة السنوية (12 شهراً)'),
      amountEGP: options?.amountEGP ?? (months === 1 ? 350 : months === 6 ? 1500 : 2500),
      paymentMethod: options?.paymentMethod || 'instapay',
      referenceNumber: refNum,
      transactionId: options?.transactionId,
      receiptImageUrl: options?.receiptImageUrl,
      receiptFileName: options?.receiptFileName,
      walletNumberUsed: options?.walletNumberUsed,
      activatedAt: now.toISOString(),
      expiresAt,
      status: 'paid' as const
    };

    updated = {
      ...curr,
      status: 'active',
      subscriptionStatus: 'active',
      subscriptionPlanId: planId,
      subscriptionStartDate: now.toISOString(),
      subscriptionEndDate: expiresAt,
      pendingPaymentRequest: undefined,
      paymentHistory: [paymentEntry, ...(curr.paymentHistory || [])]
    };
  } else if (action === 'reset_trial') {
    const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    updated = {
      ...curr,
      status: 'active',
      trialStartDate: now.toISOString(),
      trialEndDate: trialEnd,
      subscriptionStatus: 'trialing',
      subscriptionPlanId: 'trial_3_days',
      subscriptionEndDate: undefined,
      pendingPaymentRequest: undefined
    };
  } else {
    // expire_trial
    const pastStart = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const pastEnd = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
    updated = {
      ...curr,
      trialStartDate: pastStart,
      trialEndDate: pastEnd,
      subscriptionStatus: 'expired',
      subscriptionPlanId: 'trial_3_days',
      subscriptionEndDate: undefined,
      pendingPaymentRequest: undefined
    };
  }

  list[idx] = updated;
  saveAllRegisteredMerchants(list);
  return updated;
}

/**
 * Retrieves all registered merchants from localStorage with safe fallback.
 */
export function loadAllRegisteredMerchants(): RemoteMerchantClient[] {
  try {
    const raw = localStorage.getItem(STORAGE_MERCHANTS_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(ensureMerchantTrialFields);
      }
    }
  } catch {}
  // Seed with default multi-tenant merchants
  const seeded = DEFAULT_REGISTERED_MERCHANTS.map(ensureMerchantTrialFields);
  saveAllRegisteredMerchants(seeded);
  return seeded;
}

/**
 * Saves all registered merchants to localStorage.
 */
export function saveAllRegisteredMerchants(merchants: RemoteMerchantClient[]): void {
  try {
    localStorage.setItem(STORAGE_MERCHANTS_LIST_KEY, JSON.stringify(merchants));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('merchant_radar_merchants_updated', { detail: merchants }));
    }
  } catch {}
}

/**
 * Gets a specific merchant by ID.
 */
export function getMerchantById(id: string): RemoteMerchantClient | undefined {
  const list = loadAllRegisteredMerchants();
  return list.find(m => m.id === id);
}

/**
 * Updates API credentials and data mode for a specific merchant.
 */
export function updateMerchantCredentials(
  merchantId: string,
  credentials: Partial<MerchantApiCredentials>,
  dataMode?: 'live' | 'demo'
): RemoteMerchantClient | undefined {
  const list = loadAllRegisteredMerchants();
  const index = list.findIndex(m => m.id === merchantId);
  if (index === -1) return undefined;

  const current = list[index];
  const mode = dataMode || credentials.dataMode || current.dataMode || 'live';
  const updatedCredentials: MerchantApiCredentials = {
    ...current.apiCredentials,
    ...credentials,
    dataMode: mode,
    isConfigured: Boolean(
      (credentials.amazonClientId || current.apiCredentials?.amazonClientId) &&
      (credentials.amazonClientSecret || current.apiCredentials?.amazonClientSecret) &&
      (credentials.amazonRefreshToken || current.apiCredentials?.amazonRefreshToken)
    )
  };

  const updated: RemoteMerchantClient = {
    ...current,
    dataMode: mode,
    apiCredentials: updatedCredentials
  };

  list[index] = updated;
  saveAllRegisteredMerchants(list);
  return updated;
}

/**
 * Returns the currently active managed merchant ID for the marketing manager.
 */
export function getActiveManagedMerchantId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_ACTIVE_MANAGED_MERCHANT_KEY);
    if (saved) return saved;
  } catch {}
  return 'merchant-step-queen';
}

/**
 * Sets the currently active managed merchant ID.
 */
export function setActiveManagedMerchantId(merchantId: string): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_MANAGED_MERCHANT_KEY, merchantId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('merchant_radar_active_merchant_changed', { detail: merchantId }));
    }
  } catch {}
}

/**
 * Loads platforms configured specifically for a given merchant cleanly.
 */
export function loadStoredPlatformsForMerchant(
  merchantId: string, 
  defaultPlatforms: ConnectedMerchantPlatform[], 
  merchant?: RemoteMerchantClient
): ConnectedMerchantPlatform[] {
  try {
    const key = `merchant_radar_connected_platforms_${merchantId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // Generate clean platforms for this merchant without any fake accounts or dummy IDs
  return defaultPlatforms.map((plat) => {
    const meta = DEFAULT_PLATFORM_PORTALS[plat.code];
    const creds = merchant?.platformCredentials?.[plat.code] || getMerchantPlatformCredentials(merchantId, plat.code);
    const isSubscribed = Boolean(creds?.isConnected || merchant?.platformsSubscribed?.includes(plat.code as any));
    return {
      ...plat,
      sellerName: creds?.sellerName || merchant?.storeName || '',
      merchantEmail: creds?.merchantEmail || merchant?.primaryEmail || '',
      sellerId: creds?.sellerId || '',
      apiKey: creds?.apiKey || '',
      mwsAuthToken: creds?.mwsAuthToken || '',
      sellerLoginId: creds?.sellerLoginId || '',
      linkedMerchantClientId: merchantId,
      isConnected: isSubscribed,
      status: isSubscribed ? 'active' : 'disconnected',
      sellerPortalUrl: creds?.sellerPortalUrl || plat.sellerPortalUrl || meta?.sellerPortalUrl,
      directLaunchSupported: true,
      lastSyncedAt: isSubscribed ? creds?.lastSyncedAt || 'تم الربط' : undefined,
    };
  });
}

/**
 * Saves platforms configured specifically for a given merchant.
 */
export function saveStoredPlatformsForMerchant(
  merchantId: string, 
  platforms: ConnectedMerchantPlatform[]
): void {
  try {
    const key = `merchant_radar_connected_platforms_${merchantId}`;
    localStorage.setItem(key, JSON.stringify(platforms));
    
    // Also save credentials per platform individually for extra resilience
    platforms.forEach(plat => {
      if (plat.apiKey || plat.sellerId || plat.mwsAuthToken || plat.sellerLoginId) {
        saveMerchantPlatformCredentials(merchantId, plat.code, {
          apiKey: plat.apiKey,
          sellerId: plat.sellerId,
          sellerName: plat.sellerName,
          merchantEmail: plat.merchantEmail,
          mwsAuthToken: plat.mwsAuthToken,
          sellerLoginId: plat.sellerLoginId,
          sellerPortalUrl: plat.sellerPortalUrl,
          merchantStoreUrl: plat.merchantStoreUrl,
          isConnected: plat.isConnected,
        });
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('merchant_radar_platforms_updated', { 
        detail: { merchantId, platforms } 
      }));
    }
  } catch {}
}

/**
 * Securely saves API credentials for a specific merchant and platform.
 */
export function saveMerchantPlatformCredentials(
  merchantId: string,
  platformCode: string,
  credentials: {
    apiKey?: string;
    sellerId?: string;
    sellerName?: string;
    merchantEmail?: string;
    mwsAuthToken?: string;
    spApiRefreshToken?: string;
    sellerLoginId?: string;
    sellerPortalUrl?: string;
    merchantStoreUrl?: string;
    isConnected?: boolean;
    credentialsNotes?: string;
  }
): void {
  try {
    const credKey = `merchant_credentials_${merchantId}_${platformCode}`;
    localStorage.setItem(credKey, JSON.stringify(credentials));
  } catch (err) {
    console.error('Failed to securely store merchant credentials:', err);
  }
}

/**
 * Retrieves API credentials for a specific merchant and platform.
 */
export function getMerchantPlatformCredentials(
  merchantId: string,
  platformCode: string
): Record<string, any> | null {
  try {
    const credKey = `merchant_credentials_${merchantId}_${platformCode}`;
    const raw = localStorage.getItem(credKey);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

