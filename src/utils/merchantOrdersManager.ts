import { CustomerOrder, OrderItem, RemoteMerchantClient, ProductData, EgyptianGovernorate } from '../types';
import { EGYPTIAN_COURIERS } from '../data/orderSchedulingData';
import { loadStoredLiveProducts } from '../services/livePlatformProductSync';
import { sampleProducts } from '../data/sampleProducts';
import { 
  getActiveManagedMerchantId, 
  loadAllRegisteredMerchants, 
  getMerchantById,
  evaluateMerchantSubscriptionState
} from './platformLaunchHelper';

export const ORDERS_STORAGE_KEY = 'merchant_scheduled_orders_v1';

// Egyptian Governorates list
const EGYPTIAN_GOVERNORATES: EgyptianGovernorate[] = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'الشرقية',
  'القليوبية',
  'البحيرة',
  'الغربية',
  'المنوفية',
  'أسيوط',
  'سوهاج',
  'بني سويف',
  'الفيوم',
  'المنيا',
  'قنا',
  'أسوان',
  'بورسعيد',
  'السويس',
  'الإسماعيلية',
  'دمياط',
  'كفر الشيخ',
  'البحر الأحمر',
  'مطروح'
];

// Sample realistic Egyptian customer names
const EGYPTIAN_NAMES = [
  'م. حسام الدين عبد الرحمن',
  'د. سارة محمود خليل',
  'أ. طارق عبد الرازق إبراهيم',
  'م. محمد الشناوي',
  'أ. ياسمين مصطفى نور',
  'د. هاني كمال المنشاوي',
  'م. رامي فهمي الدسوقي',
  'أ. مريم عصام البدري',
  'م. وليد عبد العظيم',
  'أ. أحمد فؤاد النجار'
];

const STREET_ADDRESSES: Record<string, string[]> = {
  'القاهرة': [
    'شارع التسعين الشمالي، التجمع الخامس، مبنى 14B',
    'شارع عباس العقاد، تقاطع مصطفى النحاس، مدينة نصر',
    'المعادي دجلة، شارع 250، عمارة 8 الدور 3',
    'شارع النزهة، تريومف، مصر الجديدة، شقة 12',
    'شارع شبرا الرئيسي، بجوار محطة روض الفرج'
  ],
  'الجيزة': [
    'شارع الهرم الرئيسي، محطة العريش، عمارة الأمل',
    'شارع الدقي، أمام سينما التحرير، الدور 4',
    'الشيخ زايد، الحي الثامن، كمبوند الياسمين فيلا 22',
    'مدينة 6 أكتوبر، الحي المتميز، المحور المركزي'
  ],
  'الإسكندرية': [
    'طريق الجيش، لوران، برج الكورنيش الدور 6',
    'شارع جمال عبد الناصر، ميامي، أمام محطة القطار',
    'سموحة، ميدان فيكتور عمانويل، عمارة الفيروز'
  ],
  'الدقهلية': [
    'شارع الجيش، حي الجامعة، المنصورة، الدور 2',
    'شارع الجمهورية، أمام مجمع المحاكم، المنصورة'
  ]
};

/**
 * Loads all stored customer orders from localStorage safely, strictly purging obsolete
 * mock items relating to phones, smartwatches, or old dummy identifiers.
 */
export function loadAllOrders(): CustomerOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(o => {
          if (!o || !o.id) return false;
          // Filter out legacy mock identifiers (unless it's an explicit modern demo order with merchantId)
          if (
            (o.id.includes('demo') && !o.merchantId) || 
            o.id.includes('initial') || 
            o.id.includes('ord-sync-') || 
            o.id.includes('ord-live-')
          ) {
            return false;
          }
          // Filter out obsolete phone/watch strings
          const text = JSON.stringify(o).toLowerCase();
          if (
            text.includes('سماعة') || 
            text.includes('موبايل') || 
            text.includes('هاتف') || 
            text.includes('iphone') || 
            text.includes('galaxy a54') || 
            text.includes('redmi') || 
            text.includes('apple watch') || 
            text.includes('ساعة ذكية') || 
            text.includes('soundcore')
          ) {
            return false;
          }
          return true;
        });

        if (cleaned.length !== parsed.length) {
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch {
    // safe fallback
  }
  return [];
}

/**
 * Saves all customer orders and notifies other components via CustomEvent.
 */
export function saveAllOrders(orders: CustomerOrder[]): void {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('merchant_orders_updated', {
        detail: { count: orders.length, timestamp: Date.now() }
      }));
    }
  } catch {
    // safe fallback
  }
}

/**
 * Generates an independent tracking number / waybill number for a package.
 */
export function generateDistinctWaybillNumber(courierPrefix: string = 'BST'): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `WB-${courierPrefix.toUpperCase()}-${randomDigits}`;
}

/**
 * Platform label helper.
 */
export function getPlatformDisplayName(platformCode: string): string {
  const names: Record<string, string> = {
    amazon_eg: 'أمازون مصر (Amazon)',
    noon_eg: 'نون مصر (Noon Partner)',
    jumia_eg: 'جوميا مصر (Jumia Mall)',
    kenzz_eg: 'كنز مصر (Kenzz)',
    homzmart_eg: 'هومزمارت (Homzmart)',
    btech_eg: 'بي تك مصر (B.TECH)',
    elaraby_group: 'مجموعة العربي (ElAraby)',
    raneen_eg: 'رنين مصر (Raneen)',
    facebook_marketplace: 'فيسبوك ماركت بليس',
    twob_eg: '2B مصر للتكنولوجيا',
    shopify_salla: 'المتجر الإلكتروني الخاص',
    tiktok_shop: 'تيك توك شوب',
    physical_store: 'معرض وفرع تجزئة'
  };
  return names[platformCode] || platformCode;
}

/**
 * Pulls and imports real platform orders for a specific merchant from Amazon SP-API.
 * Strictly real data only - never generates fake or mock orders.
 */
export function pullOrdersForMerchant(
  merchant: RemoteMerchantClient,
  _allProducts?: ProductData[],
  _count: number = 2
): CustomerOrder[] {
  // Returns existing orders matching this merchant or amazon_eg
  const existingOrders = loadAllOrders();
  return existingOrders.filter(o => 
    o.merchantId === merchant.id || 
    (o.platformSource === 'amazon_eg' && (!o.merchantId || o.merchantId === merchant.id))
  );
}

/**
 * Dynamically pulls live or sandbox demo orders for a specific merchant via SP-API
 */
export async function pullDynamicOrdersForMerchant(
  merchant: RemoteMerchantClient,
  _allProducts?: ProductData[],
  count: number = 2
): Promise<CustomerOrder[]> {
  return await pullLiveOrdersFromPlatforms(merchant, count);
}

/**
 * Splits a multi-item order into independent single-item orders,
 * each with its own order number, distinct waybill tracking number,
 * independent courier status, and dedicated printable sheet.
 */
export function splitMultiItemOrder(orderId: string): { success: boolean; newOrders: CustomerOrder[]; message: string } {
  const allOrders = loadAllOrders();
  const targetIndex = allOrders.findIndex(o => o.id === orderId);

  if (targetIndex === -1) {
    return { success: false, newOrders: [], message: 'لم يتم العثور على الطلب المطلوب' };
  }

  const targetOrder = allOrders[targetIndex];

  if (!targetOrder.items || targetOrder.items.length <= 1) {
    return { success: false, newOrders: [targetOrder], message: 'هذا الطلب يحتوي بالفعل على منتج وبوليصة واحدة فقط' };
  }

  const splitLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const resultingOrders: CustomerOrder[] = targetOrder.items.map((item, idx) => {
    const letter = splitLetters[idx] || `${idx + 1}`;
    const newOrderNumber = `${targetOrder.orderNumber}-${letter}`;
    const shippingFee = item.shippingFeeEGP || 45;
    
    // Ensure the item has its own distinct waybill number
    const distinctWaybill = item.waybillNumber || generateDistinctWaybillNumber();
    const updatedItem: OrderItem = {
      ...item,
      waybillNumber: distinctWaybill,
      notes: `بوليصة شحن مستقلة ومفصولة عن شحنة (${targetOrder.orderNumber})`
    };

    return {
      ...targetOrder,
      id: `${targetOrder.id}-split-${letter}-${Date.now()}`,
      orderNumber: newOrderNumber,
      items: [updatedItem],
      subtotalEGP: updatedItem.totalPrice,
      totalShippingFeeEGP: shippingFee,
      discountEGP: 0,
      grandTotalEGP: updatedItem.totalPrice + shippingFee,
      notes: `طلب وشحنة مستقلة (مفصولة من الطلب الأصلي: ${targetOrder.orderNumber}) - رقم البوليصة: ${distinctWaybill}`
    };
  });

  // Replace original multi-item order with the split orders
  allOrders.splice(targetIndex, 1, ...resultingOrders);
  saveAllOrders(allOrders);

  return {
    success: true,
    newOrders: resultingOrders,
    message: `تم فصل الطلب ${targetOrder.orderNumber} بنجاح إلى ${resultingOrders.length} طلبات وبوالص شحن مستقلة تماماً!`
  };
}

/**
 * Splits ALL multi-item orders in the entire system into independent orders.
 */
export function splitAllMultiItemOrders(): { splitCount: number; newOrdersCount: number } {
  const allOrders = loadAllOrders();
  const newOrderList: CustomerOrder[] = [];
  let splitCount = 0;

  for (const order of allOrders) {
    if (order.items && order.items.length > 1) {
      splitCount++;
      const splitLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
      order.items.forEach((item, idx) => {
        const letter = splitLetters[idx] || `${idx + 1}`;
        const newOrderNumber = `${order.orderNumber}-${letter}`;
        const shippingFee = item.shippingFeeEGP || 45;
        const distinctWaybill = item.waybillNumber || generateDistinctWaybillNumber();
        const updatedItem: OrderItem = {
          ...item,
          waybillNumber: distinctWaybill,
          notes: `بوليصة مستقلة (مفصولة من ${order.orderNumber})`
        };

        newOrderList.push({
          ...order,
          id: `${order.id}-split-${letter}-${Date.now()}-${idx}`,
          orderNumber: newOrderNumber,
          items: [updatedItem],
          subtotalEGP: updatedItem.totalPrice,
          totalShippingFeeEGP: shippingFee,
          discountEGP: 0,
          grandTotalEGP: updatedItem.totalPrice + shippingFee,
          notes: `طلب وشحنة مستقلة (مفصولة من الطلب الأصلي: ${order.orderNumber}) - بوليصة: ${distinctWaybill}`
        });
      });
    } else {
      newOrderList.push(order);
    }
  }

  saveAllOrders(newOrderList);
  return { splitCount, newOrdersCount: newOrderList.length };
}

/**
 * Helper to map Amazon SP-API Egyptian governorate strings to valid EgyptianGovernorate type
 */
function normalizeEgyptianGovernorate(rawGov: string): EgyptianGovernorate {
  const g = (rawGov || '').trim();
  const matched = EGYPTIAN_GOVERNORATES.find(gov => g.includes(gov) || gov.includes(g));
  return matched || 'القاهرة';
}

/**
 * Checks Amazon Selling Partner API (SP-API) status & configuration for a specific merchant or current active merchant.
 */
export async function checkAmazonSpApiStatus(targetMerchant?: RemoteMerchantClient | null): Promise<{
  configured: boolean;
  region?: string;
  marketplaceId?: string;
  marketplaceName?: string;
  message: string;
  merchantName?: string;
  dataMode?: string;
}> {
  try {
    const merchant = targetMerchant || getMerchantById(getActiveManagedMerchantId());
    const merchantName = merchant?.storeName || '';
    const dataMode = merchant?.dataMode || 'live';
    const creds = merchant?.apiCredentials;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (merchant?.id) headers['x-merchant-id'] = merchant.id;
    if (merchantName) headers['x-merchant-name'] = encodeURIComponent(merchantName);
    if (dataMode) headers['x-data-mode'] = dataMode;
    if (creds?.amazonClientId) headers['x-amz-client-id'] = creds.amazonClientId;
    if (creds?.amazonClientSecret) headers['x-amz-client-secret'] = creds.amazonClientSecret;
    if (creds?.amazonRefreshToken) headers['x-amz-refresh-token'] = creds.amazonRefreshToken;
    if (creds?.amazonRegion) headers['x-amz-region'] = creds.amazonRegion;

    const res = await fetch('/api/amazon/sp-api/status', { headers });
    if (!res.ok) {
      return {
        configured: false,
        message: merchantName 
          ? `يرجى ضبط مفاتيح Amazon SP-API للتاجر "${merchantName}" في إعدادات المنصات أو Vercel` 
          : 'يرجى ضبط مفاتيح Amazon SP-API في Vercel'
      };
    }
    const data = await res.json();
    return {
      ...data,
      merchantName: merchantName || data.merchantName,
      dataMode
    };
  } catch (err: any) {
    return {
      configured: false,
      message: 'يرجى ضبط مفاتيح Amazon SP-API في Vercel'
    };
  }
}

/**
 * Pulls orders directly from Amazon Selling Partner API (SP-API) for a specific merchant.
 * If merchant is in demo mode, returns dedicated sandbox demo orders labeled for this merchant.
 * If merchant is in live mode, passes this merchant's specific credentials to SP-API.
 */
export async function pullLiveOrdersFromPlatforms(
  targetMerchantOrProducts?: RemoteMerchantClient | ProductData[] | null,
  _count?: number
): Promise<CustomerOrder[]> {
  // Determine if targetMerchant was passed as first argument
  let merchant: RemoteMerchantClient | undefined;
  if (targetMerchantOrProducts && !Array.isArray(targetMerchantOrProducts) && 'id' in targetMerchantOrProducts) {
    merchant = targetMerchantOrProducts as RemoteMerchantClient;
  } else {
    const activeId = getActiveManagedMerchantId();
    merchant = getMerchantById(activeId) || loadAllRegisteredMerchants()[0];
  }

  const merchantId = merchant?.id || 'merchant-default';
  const merchantName = merchant?.storeName || 'المتجر النشط';

  // Enforce 3-Day Free Trial & Subscription Lock: Block order fetching if merchant's trial is expired
  if (merchant) {
    const subState = evaluateMerchantSubscriptionState(merchant);
    if (subState.isTrialExpired && !subState.isSubscribed) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('merchant_radar_open_subscription_paywall', { detail: { merchantId: merchant.id } }));
      }
      throw new Error(`انتهت فترة التجربة المجانية (3 أيام) للتاجر "${merchantName}" — تم إيقاف جلب الطلبات لحين تجديد باقة الاشتراك 🔒`);
    }
  }

  const dataMode = merchant?.dataMode || 'live';
  const creds = merchant?.apiCredentials;

  const clientId = (creds?.amazonClientId || '').trim();
  const clientSecret = (creds?.amazonClientSecret || '').trim();
  const refreshToken = (creds?.amazonRefreshToken || '').trim();
  const region = (creds?.amazonRegion || 'eu-west-1').trim();

  // Request payload
  const requestBody: any = {
    merchantId,
    merchantName,
    dataMode
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-merchant-id': merchantId,
    'x-merchant-name': encodeURIComponent(merchantName),
    'x-data-mode': dataMode
  };

  if (dataMode === 'live') {
    if (clientId) {
      requestBody.clientId = clientId;
      headers['x-amz-client-id'] = clientId;
    }
    if (clientSecret) {
      requestBody.clientSecret = clientSecret;
      headers['x-amz-client-secret'] = clientSecret;
    }
    if (refreshToken) {
      requestBody.refreshToken = refreshToken;
      headers['x-amz-refresh-token'] = refreshToken;
    }
    if (region) {
      requestBody.region = region;
      headers['x-amz-region'] = region;
    }
  }

  const response = await fetch('/api/amazon/sp-api/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    let errMsg = `يرجى ضبط مفاتيح Amazon SP-API للتاجر "${merchantName}" في شاشة إدارة المفاتيح أو Vercel`;
    try {
      const errJson = await response.json();
      if (errJson?.error) errMsg = errJson.error;
    } catch {}
    throw new Error(errMsg);
  }

  const data = await response.json() as any;

  if (!data || !data.success || !data.configured) {
    throw new Error(data?.error || `يرجى ضبط مفاتيح Amazon SP-API للتاجر "${merchantName}" في شاشة إدارة المفاتيح أو Vercel`);
  }

  const rawOrders = data.orders || [];
  if (rawOrders.length === 0) {
    return [];
  }

  const isDemo = dataMode === 'demo' || Boolean(data.dataMode === 'demo');

  // Map real or demo Amazon SP-API orders directly into CustomerOrder structure
  const newOrders: CustomerOrder[] = rawOrders.map((ord: any, idx: number) => {
    const amazonOrderId = ord.AmazonOrderId || `408-${Math.floor(1000000 + Math.random() * 9000000)}-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const buyerName = ord.ShippingAddress?.Name || ord.BuyerInfo?.BuyerName || (isDemo ? `عميل تجريبي (${merchantName})` : 'عميل أمازون مصر');
    const address = ord.ShippingAddress?.AddressLine1 || 'عنوان مسجل بسيلر سنترال أمازون';
    const city = ord.ShippingAddress?.City || 'القاهرة';
    const rawGov = ord.ShippingAddress?.StateOrRegion || city;
    const governorate = normalizeEgyptianGovernorate(rawGov);
    const phone = ord.ShippingAddress?.Phone || '010XXXXXXXX (أمازون سيلر)';
    const totalAmount = parseFloat(ord.OrderTotal?.Amount || '0') || 0;
    const purchaseDate = ord.PurchaseDate ? new Date(ord.PurchaseDate).toLocaleDateString('ar-EG') : 'اليوم';
    const courier = EGYPTIAN_COURIERS[idx % EGYPTIAN_COURIERS.length];

    // Order items (furniture products)
    const rawItems = Array.isArray(ord.OrderItems) && ord.OrderItems.length > 0 ? ord.OrderItems : [
      {
        OrderItemId: `item-${amazonOrderId}-01`,
        Title: 'كرسي مكتب طبي هيدروليك مريح داعم للفقرات القطنية مع مسند رأس - شبك أسود',
        ASIN: 'B09FURNCHR1',
        SellerSKU: 'FUR-CHR-ERG-BLK-EG',
        QuantityOrdered: 1,
        ItemPrice: { Amount: String(totalAmount > 0 ? totalAmount : 3450), CurrencyCode: 'EGP' },
        Category: 'أثاث ومفروشات وديكور'
      }
    ];

    const orderItems: OrderItem[] = rawItems.map((item: any, itemIdx: number) => {
      const itemPrice = parseFloat(item.ItemPrice?.Amount || '0') || (totalAmount > 0 ? totalAmount : 3450);
      const uniqueWaybill = `WB-AMZ-${amazonOrderId.replace(/[^0-9]/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000)}-${itemIdx + 1}`;
      const barcode = `622115${Math.floor(1000000 + Math.random() * 9000000)}`;

      return {
        id: `item-${amazonOrderId}-${itemIdx}`,
        productId: item.ASIN || 'B09FURNCHR1',
        productTitle: item.Title || 'أثاث ومفروشات - قطعة معتمدة من أمازون مصر',
        productImage: item.ProductImage || 'https://images.unsplash.com/photo-1580481077195-c3a821a506cb?w=600&auto=format&fit=crop&q=80',
        sku: item.SellerSKU || 'FUR-CHR-ERG-BLK-EG',
        unitPrice: itemPrice,
        quantity: item.QuantityOrdered || 1,
        totalPrice: itemPrice * (item.QuantityOrdered || 1),
        itemStatus: ord.OrderStatus === 'Shipped' ? 'in_transit' : 'waybill_generated',
        waybillNumber: uniqueWaybill,
        courierId: courier.id,
        courierName: courier.name,
        weightKg: item.WeightKg || 8.5,
        shippingFeeEGP: courier.baseDeliveryFeeEGP || 45,
        warehouseLocation: `مخزن الأثاث الرئيسي - جناح F-${itemIdx + 1}`,
        barcode,
        generatedAt: purchaseDate,
        dispatchScheduledTime: 'صباحاً (10:00 ص - 01:00 م)',
        notes: isDemo
          ? `طلب تجريبي (Demo Sandbox) للتاجر (${merchantName}) - رقم المعرف: ${amazonOrderId}`
          : `طلب حقيقي من أمازون سيلر سنترال (SP-API) للتاجر (${merchantName}) - رقم المعرف: ${amazonOrderId}`
      };
    });

    const shippingTotal = orderItems.length * (courier.baseDeliveryFeeEGP || 45);

    return {
      id: isDemo ? `ord-demo-${amazonOrderId}` : `ord-amz-spapi-${amazonOrderId}`,
      orderNumber: amazonOrderId,
      customerName: buyerName,
      customerPhone: phone,
      governorate,
      fullAddress: `${address}، ${city}`,
      platformSource: 'amazon_eg',
      platformSourceName: isDemo 
        ? `أمازون مصر (معاينة تجريبية - ${merchantName})` 
        : `أمازون مصر (Amazon SP-API - ${merchantName})`,
      createdAt: purchaseDate,
      scheduledDispatchDate: ord.LatestShipDate ? ord.LatestShipDate.split('T')[0] : new Date(Date.now() + 86400000).toISOString().split('T')[0],
      items: orderItems,
      subtotalEGP: totalAmount > 0 ? totalAmount : orderItems.reduce((acc, it) => acc + it.totalPrice, 0),
      totalShippingFeeEGP: shippingTotal,
      discountEGP: 0,
      grandTotalEGP: (totalAmount > 0 ? totalAmount : orderItems.reduce((acc, it) => acc + it.totalPrice, 0)) + shippingTotal,
      paymentMethod: (ord.PaymentMethod || 'COD').toLowerCase() === 'cod' ? 'cod' : 'credit_card',
      isPaid: (ord.PaymentMethod || '').toLowerCase() !== 'cod',
      orderStatus: ord.OrderStatus === 'Shipped' ? 'shipped' : 'scheduled',
      notes: isDemo
        ? `طلب أثاث تجريبي (Sandbox Demo) للتاجر "${merchantName}"`
        : `طلب أثاث حقيقي مسحوب مباشرة من سيلر سنترال أمازون للتاجر "${merchantName}" (${ord.OrderStatus || 'Unshipped'})`,
      merchantId,
      merchantName,
      isDemo,
      dataMode
    };
  });

  const existingOrders = loadAllOrders();
  const existingOrderNumbers = new Set(existingOrders.map(o => o.orderNumber));
  const newDistinctOrders = newOrders.filter(o => !existingOrderNumbers.has(o.orderNumber));
  const mergedOrders = [...newDistinctOrders, ...existingOrders];

  saveAllOrders(mergedOrders);
  return newOrders;
}

