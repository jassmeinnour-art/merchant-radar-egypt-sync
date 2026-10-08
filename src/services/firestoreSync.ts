import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  query,
  limit 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../db';
import { ProductData, WatchlistItem, PriceAlert, ProductInventoryRecord, ConnectedMerchantPlatform } from '../types';
import { triggerGlobalAsyncStart, triggerGlobalAsyncEnd } from '../context/AsyncOperationsContext';

export interface SavedStudioDesign {
  id: string;
  userId: string;
  productId?: string;
  title: string;
  aspectRatio?: string;
  backgroundTheme?: string;
  imageData: string; // Base64 or URL
  createdAt?: any;
}

// 1. Sync Watchlist
export async function saveWatchlistToCloud(userId: string, items: WatchlistItem[]): Promise<void> {
  const path = `users/${userId}/watchlist`;
  const opId = triggerGlobalAsyncStart('database', 'حفظ قائمة المراقبة في Firestore', `مزامنة ${items.length} منتجات مراقبة`);
  try {
    for (const item of items) {
      const docId = item.productId;
      const docRef = doc(db, path, docId);
      await setDoc(docRef, {
        id: docId,
        userId: userId,
        productId: item.productId,
        productTitle: item.product?.title || item.productId,
        targetPrice: item.targetAlertPrice || item.product?.suggestedRetailPrice || 0,
        currentPrice: item.lastCheckedPrice || item.product?.currentLowestPrice || 0,
        competitor: item.lastPriceChangeSource || 'سوق محلي',
        priceTrend: item.priceTrend || 'stable',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
    triggerGlobalAsyncEnd(opId, true, 'تم حفظ قائمة المراقبة بالسحابة', 'database');
  } catch (error) {
    triggerGlobalAsyncEnd(opId, false, 'تعذر مزامنة قائمة المراقبة بالسحابة', 'database');
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToWatchlist(userId: string, onUpdate: (items: WatchlistItem[]) => void) {
  const path = `users/${userId}/watchlist`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: WatchlistItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          productId: data.productId || docSnap.id,
          product: {
            id: data.productId || docSnap.id,
            title: data.productTitle || 'منتج مراقب',
            suggestedRetailPrice: data.targetPrice || 0,
            currentLowestPrice: data.currentPrice || 0,
          } as any,
          addedAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          lastCheckedPrice: data.currentPrice || 0,
          priceTrend: data.priceTrend || 'stable',
          priceChangePercent: 0,
          competitorStockStatus: 'normal',
          targetAlertPrice: data.targetPrice || 0,
          autoTrack: true,
        });
      });
      if (items.length > 0) {
        onUpdate(items);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// 2. Sync Price Alerts
export async function savePriceAlertsToCloud(userId: string, alerts: PriceAlert[]): Promise<void> {
  const path = `users/${userId}/alerts`;
  const opId = triggerGlobalAsyncStart('database', 'حفظ تنبيهات الأسعار في Firestore', `مزامنة ${alerts.length} تنبيهات`);
  try {
    for (const alert of alerts) {
      const docRef = doc(db, path, alert.id);
      await setDoc(docRef, {
        id: alert.id,
        userId: userId,
        productId: alert.productId,
        productTitle: alert.productTitle || 'منتج',
        triggerCondition: alert.triggerCondition || 'drop_below',
        targetPrice: alert.targetPrice || 0,
        channel: alert.channel || 'whatsapp',
        isActive: alert.isActive !== false,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
    triggerGlobalAsyncEnd(opId, true, 'تم حفظ تنبيهات الأسعار بالسحابة', 'database');
  } catch (error) {
    triggerGlobalAsyncEnd(opId, false, 'تعذر مزامنة تنبيهات الأسعار', 'database');
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 3. Sync Inventory Records
export async function saveInventoryToCloud(userId: string, inventory: ProductInventoryRecord[]): Promise<void> {
  const path = `users/${userId}/inventory`;
  const opId = triggerGlobalAsyncStart('database', 'مزامنة المخزون مع السحابة (Firestore)', `تحديث بيانات ${inventory.length} صنف`);
  try {
    for (const item of inventory) {
      const docId = item.productId;
      const docRef = doc(db, path, docId);
      await setDoc(docRef, {
        id: docId,
        userId: userId,
        productId: item.productId,
        sku: item.sku || 'SKU-EG',
        currentStock: item.currentStock || 0,
        minReorderLevel: item.minReorderLevel || 0,
        maxStockLevel: item.maxStockLevel || 0,
        costPerUnitEGP: item.costPerUnitEGP || 0,
        totalInventoryValuationEGP: item.totalInventoryValuationEGP || 0,
        warehouseLocation: item.warehouseLocation || 'مستودع القاهرة',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
    triggerGlobalAsyncEnd(opId, true, 'تم تحديث المخزون بالسحابة', 'database');
  } catch (error) {
    triggerGlobalAsyncEnd(opId, false, 'تعذر تحديث المخزون بالسحابة', 'database');
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchInventoryFromCloud(userId: string): Promise<Partial<ProductInventoryRecord>[]> {
  const path = `users/${userId}/inventory`;
  const opId = triggerGlobalAsyncStart('database', 'استرجاع المخزون من السحابة (Firestore)', 'جاري جلب أحدث بيانات المستودعات');
  try {
    const snap = await getDocs(collection(db, path));
    const items: Partial<ProductInventoryRecord>[] = [];
    snap.forEach((docSnap) => {
      items.push(docSnap.data() as Partial<ProductInventoryRecord>);
    });
    triggerGlobalAsyncEnd(opId, true, `تم استرجاع ${items.length} صنف من السحابة`, 'database');
    return items;
  } catch (error) {
    triggerGlobalAsyncEnd(opId, false, 'تعذر استرجاع المخزون من السحابة', 'database');
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

// 4. Save and Retrieve Studio Designs (Images Created & Edited)
export async function saveStudioDesignToCloud(
  userId: string, 
  design: Omit<SavedStudioDesign, 'userId' | 'createdAt'>
): Promise<void> {
  const path = `users/${userId}/studio_designs`;
  const opId = triggerGlobalAsyncStart('database', 'حفظ تصميم الاستوديو في السحابة', design.title || 'تصميم جديد');
  try {
    const docRef = doc(db, path, design.id);
    await setDoc(docRef, {
      ...design,
      userId,
      createdAt: serverTimestamp(),
    });
    triggerGlobalAsyncEnd(opId, true, 'تم حفظ صورة المنتج بالسحابة', 'database');
  } catch (error) {
    triggerGlobalAsyncEnd(opId, false, 'تعذر حفظ التصميم بالسحابة', 'database');
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchStudioDesignsFromCloud(userId: string): Promise<SavedStudioDesign[]> {
  const path = `users/${userId}/studio_designs`;
  const opId = triggerGlobalAsyncStart('database', 'تحميل تصميمات الاستوديو من السحابة', 'جاري جلب الصور المحفوظة');
  try {
    const snap = await getDocs(query(collection(db, path), limit(20)));
    const designs: SavedStudioDesign[] = [];
    snap.forEach((docSnap) => {
      designs.push(docSnap.data() as SavedStudioDesign);
    });
    triggerGlobalAsyncEnd(opId, true, `تم تحميل ${designs.length} تصميم من السحابة`, 'database');
    return designs;
  } catch (error) {
    triggerGlobalAsyncEnd(opId, false, 'تعذر تحميل التصميمات من السحابة', 'database');
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function deleteStudioDesignFromCloud(userId: string, designId: string): Promise<void> {
  const path = `users/${userId}/studio_designs`;
  const opId = triggerGlobalAsyncStart('database', 'حذف تصميم من السحابة (Firestore)', designId);
  try {
    await deleteDoc(doc(db, path, designId));
    triggerGlobalAsyncEnd(opId, true, 'تم حذف التصميم من السحابة', 'database');
  } catch (error) {
    triggerGlobalAsyncEnd(opId, false, 'تعذر حذف التصميم من السحابة', 'database');
    handleFirestoreError(error, OperationType.DELETE, `${path}/${designId}`);
  }
}

// 5. Sync Merchant Platforms and Gmail-linked accounts
export async function savePlatformsToCloud(
  userId: string,
  platforms: ConnectedMerchantPlatform[],
  linkedGmail?: string
): Promise<void> {
  const path = `users/${userId}/platforms`;
  const opId = triggerGlobalAsyncStart('database', 'حفظ منصات التاجر وربط Gmail في السحابة', `مزامنة ${platforms.length} منصة`);
  try {
    for (const plat of platforms) {
      const docRef = doc(db, path, plat.id);
      await setDoc(docRef, {
        id: plat.id,
        name: plat.name,
        code: plat.code,
        category: plat.category || 'marketplace',
        sellerName: plat.sellerName || '',
        sellerId: plat.sellerId || '',
        merchantEmail: plat.merchantEmail || linkedGmail || '',
        sellerPortalUrl: plat.sellerPortalUrl || '',
        isGmailLinked: plat.isGmailLinked ?? false,
        linkedGmail: plat.linkedGmail || linkedGmail || '',
        isConnected: plat.isConnected ?? true,
        autoSyncPrice: plat.autoSyncPrice ?? true,
        status: plat.status || 'active',
        commissionFeePercent: plat.commissionFeePercent || 0,
        lastSyncedAt: plat.lastSyncedAt || 'الآن',
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    triggerGlobalAsyncEnd(opId, true, 'تم حفظ ربط المنصات السحابي بنجاح', 'database');
  } catch (error) {
    triggerGlobalAsyncEnd(opId, false, 'تعذر مزامنة منصات التاجر مع السحابة', 'database');
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchPlatformsFromCloud(userId: string): Promise<Partial<ConnectedMerchantPlatform>[]> {
  const path = `users/${userId}/platforms`;
  const opId = triggerGlobalAsyncStart('database', 'استرجاع المنصات المرتبطة بالسحابة', 'جاري جلب حسابات المنصات المرتبطة');
  try {
    const snap = await getDocs(collection(db, path));
    const list: Partial<ConnectedMerchantPlatform>[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as Partial<ConnectedMerchantPlatform>);
    });
    triggerGlobalAsyncEnd(opId, true, `تم استرجاع ${list.length} منصات مرتبطة`, 'database');
    return list;
  } catch (error) {
    triggerGlobalAsyncEnd(opId, false, 'تعذر استرجاع المنصات من السحابة', 'database');
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

// 6. Sync Live Merchant Products
export async function saveLiveProductsToCloud(userId: string, products: ProductData[]): Promise<void> {
  const path = `users/${userId}/products`;
  const opId = triggerGlobalAsyncStart('database', 'مزامنة منتجات المتجر الحقيقية في Firestore', `حفظ ${products.length} منتجات فعلية`);
  try {
    for (const p of products) {
      const docRef = doc(db, path, p.id);
      await setDoc(docRef, {
        id: p.id,
        userId,
        title: p.title || 'منتج',
        brand: p.brand || '',
        category: p.category || '',
        suggestedRetailPrice: p.suggestedRetailPrice || 0,
        estimatedWholesaleCost: p.estimatedWholesaleCost || 0,
        currentLowestPrice: p.currentLowestPrice || 0,
        imageUrl: p.imageUrl || '',
        sku: p.sku || '',
        currency: p.currency || 'EGP',
        merchantOffers: p.merchantOffers || [],
        quickHighlights: p.quickHighlights || [],
        specs: p.specs || [],
        seoListing: p.seoListing || null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    triggerGlobalAsyncEnd(opId, true, 'تم حفظ المنتجات الفعلية بالسحابة', 'database');
  } catch (error) {
    triggerGlobalAsyncEnd(opId, false, 'تعذر حفظ المنتجات بالسحابة', 'database');
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchLiveProductsFromCloud(userId: string): Promise<ProductData[]> {
  const path = `users/${userId}/products`;
  const opId = triggerGlobalAsyncStart('database', 'استرجاع المنتجات من السحابة (Firestore)', 'جاري جلب قائمة المنتجات الفعلية');
  try {
    const snap = await getDocs(collection(db, path));
    const items: ProductData[] = [];
    snap.forEach((docSnap) => {
      items.push(docSnap.data() as ProductData);
    });
    triggerGlobalAsyncEnd(opId, true, `تم استرجاع ${items.length} منتجات من السحابة`, 'database');
    return items;
  } catch (error) {
    triggerGlobalAsyncEnd(opId, false, 'تعذر استرجاع المنتجات من السحابة', 'database');
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}


