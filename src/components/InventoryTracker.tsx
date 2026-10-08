import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  Download,
  Search,
  Filter,
  ArrowUpRight,
  Truck,
  Plus,
  Minus,
  MessageCircle,
  FileText,
  Sliders,
  DollarSign,
  Calendar,
  Layers,
  MapPin,
  Building,
  Building2,
  Phone,
  Clock,
  X,
  Send,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Info,
  Zap,
  Scale
} from 'lucide-react';
import {
  ProductData,
  ProductInventoryRecord,
  InventoryAlertNotification,
  InventoryStockStatus,
  ReorderPurchaseOrder,
  SupplierProfile
} from '../types';
import {
  calculateStockStatus,
  createWhatsAppSupplierReorderMessage,
  exportInventoryToCSV,
  EGYPTIAN_WAREHOUSES,
  saveStoredInventory,
  getStoredReorders,
  saveStoredReorders,
  getStoredSuppliers,
  saveStoredSuppliers
} from '../data/inventoryData';
import { WhatsAppSupplierAutomationModal } from './WhatsAppSupplierAutomationModal';
import { SupplierDirectoryModal } from './SupplierDirectoryModal';
import { safeOpenUrl } from '../utils/safeWindowOpen';

interface InventoryTrackerProps {
  products: ProductData[];
  inventory: ProductInventoryRecord[];
  onUpdateInventory: (updated: ProductInventoryRecord[]) => void;
  currency?: string;
  onShowToast?: (message: string) => void;
  onSelectProduct?: (product: ProductData) => void;
  onNavigateToWholesale?: (product?: ProductData, query?: string) => void;
  initialFilterStatus?: 'all' | 'reorder_needed' | 'critical' | 'low' | 'healthy';
  onOpenGenerateWaybillModal?: (product: ProductData) => void;
}

export const InventoryTracker: React.FC<InventoryTrackerProps> = ({
  products,
  inventory,
  onUpdateInventory,
  currency = 'EGP',
  onShowToast,
  onSelectProduct,
  onNavigateToWholesale,
  initialFilterStatus = 'all',
  onOpenGenerateWaybillModal
}) => {
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reorder_needed' | 'critical' | 'low' | 'healthy'>(initialFilterStatus);
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'stock_asc' | 'urgency' | 'value_desc' | 'burn_rate_desc'>('urgency');

  // Purchase Order (PO) Modal state
  const [isPoModalOpen, setIsPoModalOpen] = useState<boolean>(false);
  const [selectedProductForPo, setSelectedProductForPo] = useState<{
    record: ProductInventoryRecord;
    product: ProductData;
  } | null>(null);
  const [poQuantity, setPoQuantity] = useState<number>(20);
  const [poWarehouse, setPoWarehouse] = useState<string>('');
  const [poNotes, setPoNotes] = useState<string>('');

  // Edit threshold modal state
  const [editingThresholdRecord, setEditingThresholdRecord] = useState<ProductInventoryRecord | null>(null);
  const [tempMinReorderLevel, setTempMinReorderLevel] = useState<number>(5);
  const [tempReorderQty, setTempReorderQty] = useState<number>(25);

  // Quick Restock modal state
  const [quickRestockRecord, setQuickRestockRecord] = useState<ProductInventoryRecord | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  // WhatsApp Supplier Automation modal state
  const [isWhatsAppAutomationModalOpen, setIsWhatsAppAutomationModalOpen] = useState<boolean>(false);
  const [selectedProductForWhatsApp, setSelectedProductForWhatsApp] = useState<string | undefined>(undefined);

  // Supplier Directory & Comparison modal state
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>(getStoredSuppliers);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState<boolean>(false);
  const [selectedProductForSupplierModal, setSelectedProductForSupplierModal] = useState<string | undefined>(undefined);
  const [supplierModalTab, setSupplierModalTab] = useState<'directory' | 'comparison' | 'alternative_decision'>('directory');

  // Map products by ID for fast lookup
  const productMap = useMemo(() => {
    return new Map(products.map(p => [p.id, p]));
  }, [products]);

  // Aggregate Key Performance Indicators
  const kpis = useMemo(() => {
    let totalUnits = 0;
    let totalValuation = 0;
    let reorderNeededCount = 0;
    let criticalStockoutCount = 0;
    let lowStockCount = 0;
    let healthyCount = 0;
    let totalDailyBurn = 0;

    inventory.forEach(item => {
      totalUnits += item.currentStock;
      totalValuation += item.totalInventoryValuationEGP;
      totalDailyBurn += item.dailyBurnRate;

      if (item.currentStock <= item.minReorderLevel) {
        reorderNeededCount++;
      }
      if (item.currentStock <= 1) {
        criticalStockoutCount++;
      } else if (item.currentStock <= item.minReorderLevel) {
        // counted in reorderNeeded
      } else if (item.currentStock <= item.minReorderLevel * 1.5) {
        lowStockCount++;
      } else {
        healthyCount++;
      }
    });

    const avgDaysCover = totalDailyBurn > 0 ? (totalUnits / totalDailyBurn).toFixed(1) : '90+';

    return {
      totalUnits,
      totalValuation,
      reorderNeededCount,
      criticalStockoutCount,
      lowStockCount,
      healthyCount,
      avgDaysCover
    };
  }, [inventory]);

  // Filtered and sorted inventory records
  const filteredInventory = useMemo(() => {
    return inventory
      .filter(item => {
        const prod = productMap.get(item.productId);
        const title = prod?.title || '';
        const titleEn = prod?.titleEn || '';
        const brand = prod?.brand || '';

        // Search text matching
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matches =
            item.sku.toLowerCase().includes(q) ||
            (item.barcode && item.barcode.includes(q)) ||
            title.toLowerCase().includes(q) ||
            titleEn.toLowerCase().includes(q) ||
            brand.toLowerCase().includes(q) ||
            item.supplierName.toLowerCase().includes(q) ||
            item.warehouseLocation.toLowerCase().includes(q);

          if (!matches) return false;
        }

        // Warehouse filter
        if (warehouseFilter !== 'all' && item.warehouseLocation !== warehouseFilter) {
          return false;
        }

        // Status filter
        if (statusFilter === 'reorder_needed') {
          return item.currentStock <= item.minReorderLevel;
        }
        if (statusFilter === 'critical') {
          return item.currentStock <= 1;
        }
        if (statusFilter === 'low') {
          return item.currentStock > item.minReorderLevel && item.currentStock <= item.minReorderLevel * 1.5;
        }
        if (statusFilter === 'healthy') {
          return item.currentStock > item.minReorderLevel * 1.5;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'urgency') {
          // Most urgent (lowest days of supply or stock/min ratio) first
          const ratioA = a.currentStock / Math.max(a.minReorderLevel, 1);
          const ratioB = b.currentStock / Math.max(b.minReorderLevel, 1);
          return ratioA - ratioB;
        }
        if (sortBy === 'stock_asc') {
          return a.currentStock - b.currentStock;
        }
        if (sortBy === 'value_desc') {
          return b.totalInventoryValuationEGP - a.totalInventoryValuationEGP;
        }
        if (sortBy === 'burn_rate_desc') {
          return b.dailyBurnRate - a.dailyBurnRate;
        }
        return 0;
      });
  }, [inventory, productMap, searchQuery, warehouseFilter, statusFilter, sortBy]);

  // Handler for modifying stock quantity (+ or - or direct value)
  const handleModifyStock = (productId: string, delta: number) => {
    const updated = inventory.map(item => {
      if (item.productId === productId) {
        const newStock = Math.max(0, item.currentStock + delta);
        const newStatus = calculateStockStatus(newStock, item.minReorderLevel, item.maxStockLevel);
        const newDays = item.dailyBurnRate > 0 ? Number((newStock / item.dailyBurnRate).toFixed(1)) : 99;
        const newRecord: ProductInventoryRecord = {
          ...item,
          currentStock: newStock,
          stockStatus: newStatus,
          daysOfSupplyLeft: newDays,
          totalInventoryValuationEGP: newStock * item.costPerUnitEGP
        };

        // If stock hit or fell below the reorder point, dispatch alert toast
        if (newStock <= item.minReorderLevel) {
          const prod = productMap.get(productId);
          const title = prod?.title ? prod.title.slice(0, 30) + '...' : item.sku;
          if (onShowToast) {
            onShowToast(`⚠️ تنبيه حد الطلب: الصنف "${title}" وصل إلى ${newStock} قطع (الحد الأدنى: ${item.minReorderLevel})! ننصحك بالتوجه فوراً لقسم أسواق الجملة (Wholesale Locations) لإعادة التوريد.`);
          }
        } else if (newStock <= Math.ceil(item.minReorderLevel * 1.25) && delta < 0) {
          const prod = productMap.get(productId);
          const title = prod?.title ? prod.title.slice(0, 30) + '...' : item.sku;
          if (onShowToast) {
            onShowToast(`⚡ تنبيه استباقي: الصنف "${title}" يقترب من حد الطلب (${newStock} ق متبقية). فكر في إعادة التوريد من أسواق الجملة.`);
          }
        } else if (delta > 0 && onShowToast) {
          onShowToast(`✅ تم تحديث المخزون بنجاح: الرصيد الحالي ${newStock} قطعة.`);
        }

        return newRecord;
      }
      return item;
    });

    onUpdateInventory(updated);
    saveStoredInventory(updated);
  };

  // Handler for direct manual stock input
  const handleDirectStockChange = (productId: string, val: number) => {
    const validVal = isNaN(val) ? 0 : Math.max(0, Math.floor(val));
    const updated = inventory.map(item => {
      if (item.productId === productId) {
        const newStatus = calculateStockStatus(validVal, item.minReorderLevel, item.maxStockLevel);
        const newDays = item.dailyBurnRate > 0 ? Number((validVal / item.dailyBurnRate).toFixed(1)) : 99;
        const newRecord: ProductInventoryRecord = {
          ...item,
          currentStock: validVal,
          stockStatus: newStatus,
          daysOfSupplyLeft: newDays,
          totalInventoryValuationEGP: validVal * item.costPerUnitEGP
        };

        if (validVal <= item.minReorderLevel && onShowToast) {
          const prod = productMap.get(productId);
          const title = prod?.title ? prod.title.slice(0, 30) + '...' : item.sku;
          onShowToast(`⚠️ تنبيه حد الطلب: الصنف "${title}" وصل إلى ${validVal} قطع (الحد الأدنى: ${item.minReorderLevel})! يوصى بالتوجه لقسم Wholesale Locations للتوريد.`);
        } else if (validVal <= Math.ceil(item.minReorderLevel * 1.25) && onShowToast) {
          const prod = productMap.get(productId);
          const title = prod?.title ? prod.title.slice(0, 30) + '...' : item.sku;
          onShowToast(`⚡ تنبيه اقتراب من حد الطلب: الصنف "${title}" متبقي منه ${validVal} ق فقط.`);
        }

        return newRecord;
      }
      return item;
    });

    onUpdateInventory(updated);
    saveStoredInventory(updated);
  };

  // Save modified min reorder level and suggested reorder qty
  const handleSaveThreshold = () => {
    if (!editingThresholdRecord) return;
    const updated = inventory.map(item => {
      if (item.productId === editingThresholdRecord.productId) {
        const newMin = Math.max(1, tempMinReorderLevel);
        const newReorderQty = Math.max(1, tempReorderQty);
        const newStatus = calculateStockStatus(item.currentStock, newMin, item.maxStockLevel);
        return {
          ...item,
          minReorderLevel: newMin,
          reorderQuantity: newReorderQty,
          stockStatus: newStatus
        };
      }
      return item;
    });

    onUpdateInventory(updated);
    saveStoredInventory(updated);
    setEditingThresholdRecord(null);

    if (onShowToast) {
      onShowToast(`✅ تم تحديث حد الطلب الأدنى إلى (${tempMinReorderLevel} قطع) وكمية التوريد إلى (${tempReorderQty} قطعة).`);
    }
  };

  // Save quick restock action
  const handleApplyQuickRestock = () => {
    if (!quickRestockRecord) return;
    handleModifyStock(quickRestockRecord.productId, restockAmount);
    setQuickRestockRecord(null);
  };

  // Dispatch live alerts for all products at/below reorder point
  const handleDispatchAllAlerts = () => {
    const atRisk = inventory.filter(item => item.currentStock <= item.minReorderLevel);
    if (atRisk.length === 0) {
      if (onShowToast) onShowToast('✅ مستويات المخزون لجميع الأصناف آمنة ومستقرة، ولا توجد أصناف عند حد الطلب الأدنى حالياً.');
      return;
    }

    if (onShowToast) {
      onShowToast(`🚨 تم رصد (${atRisk.length}) أصناف وصلت أو تجاوزت حد الطلب الأدنى! جاري إرسال إشعارات التنبيه...`);
      // Trigger individual item toast briefly
      const first = atRisk[0];
      const prod = productMap.get(first.productId);
      const title = prod?.title ? prod.title.slice(0, 35) + '...' : first.sku;
      setTimeout(() => {
        onShowToast(`⚠️ تنبيه عاجل: الصنف "${title}" تبقى منه ${first.currentStock} قطع فقط (حد الطلب: ${first.minReorderLevel}).`);
      }, 900);
    }
  };

  // Open PO modal
  const handleOpenPoModal = (item: ProductInventoryRecord) => {
    const prod = productMap.get(item.productId);
    if (!prod) return;
    setSelectedProductForPo({ record: item, product: prod });
    setPoQuantity(item.reorderQuantity || 25);
    setPoWarehouse(item.warehouseLocation);
    setPoNotes('');
    setIsPoModalOpen(true);
  };

  // Submit and confirm PO
  const handleConfirmPurchaseOrder = (sendWhatsApp: boolean = false) => {
    if (!selectedProductForPo) return;
    const { record, product } = selectedProductForPo;
    const qty = Math.max(1, poQuantity);
    const totalCost = qty * record.costPerUnitEGP;

    const newOrder: ReorderPurchaseOrder = {
      id: `po-${Date.now()}`,
      productId: record.productId,
      productTitle: product.title,
      sku: record.sku,
      quantity: qty,
      supplierName: record.supplierName,
      supplierPhone: record.supplierPhone,
      warehouseLocation: poWarehouse || record.warehouseLocation,
      unitCostEGP: record.costPerUnitEGP,
      totalCostEGP: totalCost,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + record.leadTimeDays * 86400000).toISOString().split('T')[0],
      status: 'pending',
      notes: poNotes
    };

    const existingOrders = getStoredReorders();
    saveStoredReorders([newOrder, ...existingOrders]);

    // Update incoming stock on the record
    const updated = inventory.map(item => {
      if (item.productId === record.productId) {
        return {
          ...item,
          incomingStock: (item.incomingStock || 0) + qty
        };
      }
      return item;
    });
    onUpdateInventory(updated);
    saveStoredInventory(updated);

    setIsPoModalOpen(false);

    if (sendWhatsApp) {
      const msg = createWhatsAppSupplierReorderMessage(record, product, qty);
      const cleanPhone = record.supplierPhone.replace(/[^0-9]/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${msg}`;
      safeOpenUrl(waUrl);
      if (onShowToast) {
        onShowToast(`📦 تم إصدار أمر التوريد (${qty} قطعة) وفتح محادثة واتساب مع المورد: ${record.supplierName}`);
      }
    } else {
      if (onShowToast) {
        onShowToast(`📦 تم إصدار أمر التوريد بنجاح (${qty} قطعة بقيمة ${totalCost.toLocaleString()} ج.م) وتم قيدها كبضاعة واردة.`);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="inventory-tracker-container">
      {/* Top Banner & KPI Strip */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/70 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                وحدة تتبع مستويات المخزون وحدود الطلب (Inventory Tracker)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                مربوط بالمستودعات المصرية 🇪🇬
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              إدارة المخزون والتنبيه الآلي لنقاط إعادة الطلب
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              متابعة كميات المخزون الفعلي، معدلات الاستهلاك اليومي، وتنبيهات فورية عند وصول المنتجات لحد الطلب الأدنى لمنع فقدان الـ Buy Box وأوامر الشحن.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap">
            {/* Multi-Supplier Comparison Table Button */}
            <button
              id="btn-open-supplier-comparison"
              type="button"
              onClick={() => {
                setSupplierModalTab('comparison');
                setSelectedProductForSupplierModal(undefined);
                setIsSupplierModalOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 active:scale-98 text-amber-950 text-xs font-bold rounded-xl border border-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="جدول مقارنة معدل التوريد والأسعار لعدة موردين بالتوازي لنفس المنتج"
            >
              <Scale className="w-4 h-4 text-amber-600" />
              <span>مقارنة الموردين والأسعار ⚖️</span>
            </button>

            {/* Supplier Directory & Lead Time Management */}
            <button
              id="btn-open-supplier-directory"
              type="button"
              onClick={() => {
                setSupplierModalTab('directory');
                setIsSupplierModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 active:scale-98 text-indigo-900 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="إدارة بيانات الموردين (اسم المورد، رقم الواتساب، وقت التوريد المعتاد بالأيام)"
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>بيانات الموردين ({suppliers.length})</span>
            </button>

            {/* WhatsApp Supplier Automation Button */}
            <button
              id="btn-open-whatsapp-automation"
              type="button"
              onClick={() => {
                setSelectedProductForWhatsApp(undefined);
                setIsWhatsAppAutomationModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl border border-emerald-600 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="أتمتة إشعارات الواتساب التلقائية للموردين عند وصول حد الطلب الأدنى"
            >
              <MessageCircle className="w-4 h-4 fill-emerald-100 text-white" />
              <span>أتمتة واتساب الموردين</span>
              {kpis.reorderNeededCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white text-emerald-800 text-[10px] font-black">
                  {kpis.reorderNeededCount}
                </span>
              )}
            </button>

            {/* Reorder Alerts Trigger Button */}
            <button
              id="btn-trigger-stock-alerts"
              type="button"
              onClick={handleDispatchAllAlerts}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
                kpis.reorderNeededCount > 0
                  ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-amber-200 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="فحص فوري وإطلاق إشعارات التنبيه للأصناف عند حد الطلب"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>فحص تنبيهات حد الطلب ({kpis.reorderNeededCount})</span>
            </button>

            {/* Export Inventory CSV */}
            <button
              id="btn-export-inventory-csv"
              type="button"
              onClick={() => exportInventoryToCSV(inventory, products)}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="تصدير كشف المخزون وحدود الطلب إلى ملف CSV متوافق مع Excel"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>تصدير كشف المخزون CSV</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-6">
          {/* Total Units */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span>إجمالي قطع المخزون</span>
              <Package className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {kpis.totalUnits.toLocaleString()} <span className="text-xs font-medium text-slate-500">قطعة</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              عبر {inventory.length} صنف نشط
            </div>
          </div>

          {/* Reorder Point Alerts (Highest Priority KPI) */}
          <div 
            onClick={() => setStatusFilter('reorder_needed')}
            className={`rounded-xl p-4 border transition-all cursor-pointer ${
              kpis.reorderNeededCount > 0 
                ? 'bg-amber-50/90 border-amber-200/90 text-amber-900 hover:shadow-xs' 
                : 'bg-slate-50/80 border-slate-200/70 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="flex items-center gap-1">
                <AlertTriangle className={`w-4 h-4 ${kpis.reorderNeededCount > 0 ? 'text-amber-600 animate-bounce' : 'text-slate-400'}`} />
                عند حد الطلب الأدنى ⚠️
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/70 font-black">فلترة</span>
            </div>
            <div className="text-2xl font-black text-amber-700 tracking-tight">
              {kpis.reorderNeededCount} <span className="text-xs font-medium text-amber-600">أصناف</span>
            </div>
            <div className="text-[11px] text-amber-800 font-semibold mt-1">
              تحتاج أمر توريد عاجل الآن
            </div>
          </div>

          {/* Critical Stockouts */}
          <div 
            onClick={() => setStatusFilter('critical')}
            className={`rounded-xl p-4 border transition-all cursor-pointer ${
              kpis.criticalStockoutCount > 0 
                ? 'bg-rose-50/90 border-rose-200/90 text-rose-900 hover:shadow-xs' 
                : 'bg-slate-50/80 border-slate-200/70 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                نفاد حرج (0-1 قطعة) 🚨
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/70 font-black">فلترة</span>
            </div>
            <div className="text-2xl font-black text-rose-700 tracking-tight">
              {kpis.criticalStockoutCount} <span className="text-xs font-medium text-rose-600">أصناف</span>
            </div>
            <div className="text-[11px] text-rose-700 font-semibold mt-1">
              معرضة لفقدان الترتيب والإيقاف
            </div>
          </div>

          {/* Total Valuation */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span>رأس المال بالمخزون</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {kpis.totalValuation.toLocaleString()} <span className="text-xs font-medium text-slate-500">{currency}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              تقييم المخزون بسعر الجملة
            </div>
          </div>

          {/* Avg Days of Cover */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span>متوسط أيام التغطية</span>
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {kpis.avgDaysCover} <span className="text-xs font-medium text-slate-500">يوم</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              حسب وتيرة السحب والمبيعات
            </div>
          </div>
        </div>
      </div>

      {/* Reorder Alerts Notice Bar (When active reorder items exist) */}
      {kpis.reorderNeededCount > 0 && (
        <div className="bg-linear-to-r from-amber-500 via-amber-600 to-orange-600 rounded-2xl p-4 sm:p-5 text-white shadow-md space-y-3 animate-fadeIn">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  تنبيه تشغيلي عاجل: ({kpis.reorderNeededCount}) أصناف وصلت أو تجاوزت حد الطلب الأدنى!
                </h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  تأخير أمر التوريد قد يتسبب في نفاد المخزون وفقدان ميزة الشحن السريع وحصة صندوق الشراء (Buy Box).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Trigger WhatsApp Supplier Automation */}
              <button
                id="btn-inventory-notice-whatsapp"
                type="button"
                onClick={() => {
                  setSelectedProductForWhatsApp(undefined);
                  setIsWhatsAppAutomationModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl border border-emerald-400/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-100 text-white" />
                <span>إرسال أوامر التوريد عبر واتساب 📲</span>
              </button>

              <button
                onClick={() => setStatusFilter('reorder_needed')}
                className="px-3.5 py-1.5 bg-white text-amber-900 text-xs font-bold rounded-xl hover:bg-amber-50 transition-colors shadow-2xs cursor-pointer"
              >
                عرض الأصناف المحتاجة ({kpis.reorderNeededCount})
              </button>
              {onNavigateToWholesale && (
                <button
                  id="btn-inventory-notice-wholesale"
                  type="button"
                  onClick={() => {
                    const firstAlert = inventory.find(i => i.currentStock <= i.minReorderLevel);
                    const prod = firstAlert ? productMap.get(firstAlert.productId) : undefined;
                    onNavigateToWholesale(prod, prod?.title);
                  }}
                  className="px-3.5 py-1.5 bg-amber-900/90 hover:bg-black text-white text-xs font-bold rounded-xl border border-amber-300/40 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>أسواق الجملة 🏢</span>
                </button>
              )}
              <button
                onClick={handleDispatchAllAlerts}
                className="px-3.5 py-1.5 bg-amber-700/80 hover:bg-amber-800 text-white text-xs font-bold rounded-xl border border-amber-400/40 transition-colors cursor-pointer"
              >
                إشعار النظام 🔔
              </button>
            </div>
          </div>

          {/* Smart AI restock suggestion box */}
          <div className="p-3 bg-black/15 backdrop-blur-xs rounded-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-amber-50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                <strong className="text-white font-bold">💡 اقتراح الذكاء الاصطناعي لإعادة التوريد:</strong> توجه فوراً لقسم <strong className="text-white underline">أسواق ومنافذ الجملة (Wholesale Locations)</strong> لمراجعة مستوردي وموزعي شارع عبد العزيز وسنتر البستان وسوق العتبة لتأمين البضاعة بأفضل سعر جملة الجملة وتفادي تجميد المبيعات.
              </span>
            </div>
            {onNavigateToWholesale && (
              <button
                type="button"
                onClick={() => {
                  const firstAlert = inventory.find(i => i.currentStock <= i.minReorderLevel);
                  const prod = firstAlert ? productMap.get(firstAlert.productId) : undefined;
                  onNavigateToWholesale(prod, prod?.title);
                }}
                className="px-3 py-1 bg-white hover:bg-amber-50 text-amber-900 font-black rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs text-[11px]"
              >
                <span>دليل الجملة المصري</span>
                <ArrowRight className="w-3 h-3 text-amber-700" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <button
            id="tab-filter-all"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            كل المخزون ({inventory.length})
          </button>

          <button
            id="tab-filter-reorder"
            onClick={() => setStatusFilter('reorder_needed')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'reorder_needed'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>وصلت لحد الطلب الأدنى ({kpis.reorderNeededCount})</span>
          </button>

          <button
            id="tab-filter-critical"
            onClick={() => setStatusFilter('critical')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'critical'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/80'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>نفاد حرج وشيك ({kpis.criticalStockoutCount})</span>
          </button>

          <button
            id="tab-filter-low"
            onClick={() => setStatusFilter('low')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'low'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80'
            }`}
          >
            مخزون منخفض ({kpis.lowStockCount})
          </button>

          <button
            id="tab-filter-healthy"
            onClick={() => setStatusFilter('healthy')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'healthy'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80'
            }`}
          >
            مخزون مستقر وصحي ({kpis.healthyCount})
          </button>
        </div>

        {/* Search, Warehouse, and Sort Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المنتج، كود SKU، الباركود، المستودع، أو اسم المورد..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Warehouse Selector */}
          <div className="md:col-span-3">
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">كل المستودعات والمخازن</option>
              {EGYPTIAN_WAREHOUSES.map((wh, idx) => (
                <option key={idx} value={wh}>{wh}</option>
              ))}
            </select>
          </div>

          {/* Sort By Selector */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="urgency">الأكثر إلحاحاً للتوريد أولاً ⚠️</option>
              <option value="stock_asc">الأقل مخزوناً أولاً</option>
              <option value="value_desc">الأعلى قيمة مالية بالمخزون</option>
              <option value="burn_rate_desc">الأعلى سحباً يومياً (الأسرع مبيعاً)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Products Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <span>قائمة متابعة الأصناف</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 text-[11px]">
              {filteredInventory.length} من أصل {inventory.length} صنف
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            اضغط على زر <span className="font-bold text-indigo-600">(+)</span> أو <span className="font-bold text-indigo-600">(-)</span> لتعديل الرصيد الفعلي لحظياً
          </div>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">لا توجد أصناف تطابق معايير الفلترة</h3>
            <p className="text-xs text-slate-500 mt-1">جرّب مسح البحث أو تغيير فلتر المستودع أو حالة المخزون.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setWarehouseFilter('all');
              }}
              className="mt-3 px-3.5 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 text-[11px] font-bold border-b border-slate-200/70">
                  <th className="py-3 px-4">المنتج والكود (SKU)</th>
                  <th className="py-3 px-4">المستودع والمورد</th>
                  <th className="py-3 px-4 text-center">المخزون الحالي</th>
                  <th className="py-3 px-4 text-center">حد الطلب الأدنى ⚠️</th>
                  <th className="py-3 px-4">مقياس التغطية والأيام</th>
                  <th className="py-3 px-4">قيمة المخزون</th>
                  <th className="py-3 px-4 text-center">الحالة</th>
                  <th className="py-3 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInventory.map(item => {
                  const prod = productMap.get(item.productId);
                  const isAtReorder = item.currentStock <= item.minReorderLevel;
                  const isCritical = item.currentStock <= 1;
                  const progressPercent = Math.min(100, Math.round((item.currentStock / Math.max(item.maxStockLevel, 1)) * 100));
                  const thresholdPercent = Math.min(100, Math.round((item.minReorderLevel / Math.max(item.maxStockLevel, 1)) * 100));

                  return (
                    <tr
                      key={item.productId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCritical
                          ? 'bg-rose-50/30'
                          : isAtReorder
                          ? 'bg-amber-50/30'
                          : ''
                      }`}
                    >
                      {/* Product Thumbnail & Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod?.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                            alt={prod?.title || item.sku}
                            className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                          />
                          <div className="max-w-xs">
                            <div 
                              onClick={() => prod && onSelectProduct && onSelectProduct(prod)}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 cursor-pointer"
                              title={prod?.title}
                            >
                              {prod?.title || item.sku}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {item.sku}
                              </span>
                              {prod?.brand && <span>{prod.brand}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Warehouse & Supplier */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[170px]" title={item.warehouseLocation}>
                            {item.warehouseLocation.split('-')[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]" title={item.supplierName}>
                            {item.supplierName}
                          </span>
                        </div>
                      </td>

                      {/* Current Stock with Quick +/- Buttons */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`btn-stock-dec-${item.productId}`}
                            type="button"
                            onClick={() => handleModifyStock(item.productId, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black transition-colors cursor-pointer"
                            title="إنقاص المخزون بمقدار 1"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={item.currentStock}
                            onChange={(e) => handleDirectStockChange(item.productId, parseInt(e.target.value))}
                            className={`w-14 text-center py-1 px-1 rounded-lg border font-black text-sm transition-colors ${
                              isCritical
                                ? 'bg-rose-50 border-rose-300 text-rose-700 focus:ring-rose-500'
                                : isAtReorder
                                ? 'bg-amber-50 border-amber-300 text-amber-800 focus:ring-amber-500'
                                : 'bg-white border-slate-200 text-slate-900 focus:ring-indigo-500'
                            }`}
                          />

                          <button
                            id={`btn-stock-inc-${item.productId}`}
                            type="button"
                            onClick={() => handleModifyStock(item.productId, 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black transition-colors cursor-pointer"
                            title="زيادة المخزون بمقدار 1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick +10 restock shortcut */}
                          <button
                            type="button"
                            onClick={() => handleModifyStock(item.productId, 10)}
                            className="text-[10px] font-bold px-1.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 transition-colors ml-1 cursor-pointer"
                            title="استلام شحنة سريعة +10 قطع"
                          >
                            +10
                          </button>
                        </div>

                        {item.incomingStock && item.incomingStock > 0 ? (
                          <div className="text-[10px] text-center text-sky-700 font-semibold mt-1 flex items-center justify-center gap-1">
                            <Truck className="w-3 h-3 text-sky-600" />
                            <span>قيد الشحن: {item.incomingStock} ق</span>
                          </div>
                        ) : null}
                      </td>

                      {/* Min Reorder Threshold (Editable) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <button
                            onClick={() => {
                              setEditingThresholdRecord(item);
                              setTempMinReorderLevel(item.minReorderLevel);
                              setTempReorderQty(item.reorderQuantity);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="تعديل حد الطلب الأدنى لهذا الصنف"
                          >
                            <span>{item.minReorderLevel} قطع</span>
                            <Sliders className="w-3 h-3 text-slate-400" />
                          </button>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            طلب مقترح: {item.reorderQuantity} ق
                          </span>
                        </div>
                      </td>

                      {/* Visual Stock Level Progress Bar & Days of Supply */}
                      <td className="py-3.5 px-4">
                        <div className="w-36 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                            <span>السحب: {item.dailyBurnRate} ق/يوم</span>
                            <span className={isAtReorder ? 'text-amber-700 font-black' : 'text-slate-500'}>
                              {item.daysOfSupplyLeft <= 2 ? `⚠️ ${item.daysOfSupplyLeft} يوم` : `${item.daysOfSupplyLeft} يوم`}
                            </span>
                          </div>

                          <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            {/* Threshold Marker Flag */}
                            <div
                              style={{ right: `${thresholdPercent}%` }}
                              className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                              title={`حد الطلب الأدنى: ${item.minReorderLevel} قطع`}
                            />

                            {/* Current Stock Bar */}
                            <div
                              style={{ width: `${progressPercent}%` }}
                              className={`h-full rounded-full transition-all ${
                                isCritical
                                  ? 'bg-rose-500'
                                  : isAtReorder
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Inventory Valuation */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <div className="font-bold text-slate-900">
                          {item.totalInventoryValuationEGP.toLocaleString()} {currency}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.costPerUnitEGP.toLocaleString()} ج.م / ق
                        </div>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            نفاد حرج 🚨
                          </span>
                        ) : isAtReorder ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            حد الطلب ⚠️
                          </span>
                        ) : item.stockStatus === 'low_stock' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            منخفض ⚡
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            مستقر ✅
                          </span>
                        )}
                      </td>

                      {/* Actions (Reorder PO / WhatsApp / Wholesale) */}
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap sm:flex-nowrap">
                          {/* Generate Waybill & Order Fulfillment Button */}
                          {onOpenGenerateWaybillModal && prod && (
                            <button
                              id={`btn-generate-waybill-${item.productId}`}
                              type="button"
                              onClick={() => onOpenGenerateWaybillModal(prod)}
                              className="px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm border border-emerald-500/50 active:scale-95 shrink-0"
                              title="توليد بوليصة شحن فورية لهذا المنتج وجدولتها وربطها بالمخزون 🚚"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>توليد بوليصة</span>
                            </button>
                          )}

                          {/* Quick Wholesale Suggestion Button when at or near reorder point */}
                          {onNavigateToWholesale && (isAtReorder || isCritical) && (
                            <button
                              id={`btn-row-wholesale-${item.productId}`}
                              type="button"
                              onClick={() => {
                                if (prod && onSelectProduct) onSelectProduct(prod);
                                onNavigateToWholesale(prod, prod?.title);
                              }}
                              className="px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 shadow-2xs shrink-0"
                              title="اقتراح تلقائي: التوجه لأسواق ومنافذ الجملة المصرية (شارع عبد العزيز / البستان / العتبة) لتوريد هذا الصنف فوراً"
                            >
                              <Building2 className="w-3.5 h-3.5 text-amber-800" />
                              <span className="hidden sm:inline">أسواق الجملة</span>
                              <span className="sm:hidden">جملة</span>
                            </button>
                          )}

                          {/* Reorder PO Button */}
                          <button
                            id={`btn-reorder-po-${item.productId}`}
                            onClick={() => handleOpenPoModal(item)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                              isAtReorder
                                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80'
                            }`}
                            title="إصدار أمر توريد بضاعة للمخزن"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>أمر توريد</span>
                          </button>

                          {/* Multi-Supplier Comparison Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductForSupplierModal(item.productId);
                              setSupplierModalTab('comparison');
                              setIsSupplierModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-800 transition-all cursor-pointer"
                            title="جدول مقارنة معدل التوريد والأسعار لعدة موردين لهذا الصنف ⚖️"
                          >
                            <Scale className="w-3.5 h-3.5 text-amber-700" />
                          </button>

                          {/* Alternative Supplier Decision Helper Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductForSupplierModal(item.productId);
                              setSupplierModalTab('alternative_decision');
                              setIsSupplierModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer"
                            title="مقارنة واختيار مورد بديل أسرع بناءً على معدل التوريد ⚡"
                          >
                            <Zap className="w-3.5 h-3.5 text-indigo-600" />
                          </button>

                          {/* Quick WhatsApp Supplier Automation Trigger */}
                          <button
                            id={`btn-whatsapp-supplier-${item.productId}`}
                            onClick={() => {
                              setSelectedProductForWhatsApp(item.productId);
                              setIsWhatsAppAutomationModalOpen(true);
                            }}
                            className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                              isAtReorder
                                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs active:scale-95'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title="أتمتة وإرسال أمر التوريد عبر واتساب للمورد"
                          >
                            <MessageCircle className={`w-4 h-4 ${isAtReorder ? 'fill-emerald-100 text-white' : 'text-emerald-600'}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* Modal 1: Reorder Purchase Order (أمر توريد جديد) */}
      {/* ========================================================= */}
      {isPoModalOpen && selectedProductForPo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">إصدار أمر توريد بضاعة (Reorder PO)</h3>
                  <p className="text-xs text-slate-500">تأكيد طلب التوريد للمستودع وإشعار المورد</p>
                </div>
              </div>
              <button
                onClick={() => setIsPoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4">
              {/* Product Info Strip */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center gap-3">
                <img
                  src={selectedProductForPo.product.imageUrl}
                  alt={selectedProductForPo.product.title}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                    {selectedProductForPo.product.title}
                  </h4>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>الكود: <strong className="font-mono text-slate-700">{selectedProductForPo.record.sku}</strong></span>
                    <span>•</span>
                    <span>الرصيد الحالي: <strong className="text-amber-700">{selectedProductForPo.record.currentStock} قطعة</strong></span>
                  </div>
                </div>
              </div>

              {/* Quantity Input with Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الكمية المطلوبة للتوريد (قطع)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={poQuantity}
                    onChange={(e) => setPoQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    {[10, 25, 50, 100].map(qty => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setPoQuantity(qty)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          poQuantity === qty
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Warehouse Destination */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  وجهة التسليم (المستودع)
                </label>
                <select
                  value={poWarehouse}
                  onChange={(e) => setPoWarehouse(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {EGYPTIAN_WAREHOUSES.map((wh, idx) => (
                    <option key={idx} value={wh}>{wh}</option>
                  ))}
                </select>
              </div>

              {/* Cost Calculation Summary */}
              <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-emerald-800 font-bold block">إجمالي تكلفة أمر التوريد:</span>
                  <span className="text-emerald-600 text-[11px]">
                    سعر الجملة: {selectedProductForPo.record.costPerUnitEGP.toLocaleString()} {currency} × {poQuantity} قطعة
                  </span>
                </div>
                <div className="text-lg font-black text-emerald-800">
                  {(poQuantity * selectedProductForPo.record.costPerUnitEGP).toLocaleString()} {currency}
                </div>
              </div>

              {/* Supplier Selection & Details Box */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>المورد المعتمد لأمر التوريد:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSupplierModalOpen(true)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    إدارة بيانات الموردين ⚙️
                  </button>
                </div>

                <select
                  value={selectedProductForPo.record.supplierName}
                  onChange={(e) => {
                    const supp = suppliers.find(s => s.name === e.target.value);
                    if (supp) {
                      setSelectedProductForPo(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          record: {
                            ...prev.record,
                            supplierName: supp.name,
                            supplierPhone: supp.phone,
                            leadTimeDays: supp.leadTimeDays,
                            warehouseLocation: supp.warehouseLocation || prev.record.warehouseLocation
                          }
                        };
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-xs"
                >
                  {suppliers.map(s => {
                    const avg = s.averageDeliveryDays ?? s.leadTimeDays ?? 2;
                    return (
                      <option key={s.id} value={s.name}>
                        {s.name} • ⏱️ معدل التوريد: {avg} يوم • 📱 {s.phone}
                      </option>
                    );
                  })}
                </select>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600 border-t border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">معدل التوريد الفعلي:</span>
                    <span className="font-black text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                      ⏱️ {selectedProductForPo.record.leadTimeDays} أيام للتوصيل
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">واتساب المورد:</span>
                    <span className="font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md" dir="ltr">
                      {selectedProductForPo.record.supplierPhone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPoModalOpen(false);
                      setSelectedProductForSupplierModal(selectedProductForPo.record.productId);
                      setIsSupplierModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>مقارنة واختيار مورد بديل أسرع لهذا الصنف ⚡</span>
                  </button>
                </div>
              </div>

              {/* Wholesale Locations suggestion in PO modal */}
              {onNavigateToWholesale && (
                <div className="bg-amber-50/90 rounded-xl p-3 border border-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      هل تبحث عن بدائل توريد أو مقارنة أسعار موزعي الجملة في مصر (شارع عبد العزيز / البستان / العتبة)؟
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPoModalOpen(false);
                      onNavigateToWholesale(selectedProductForPo.product, selectedProductForPo.product.title);
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>استعراض أسواق الجملة</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPoModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={() => handleConfirmPurchaseOrder(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                تأكيد وقيد أمر التوريد 📦
              </button>

              <button
                type="button"
                onClick={() => handleConfirmPurchaseOrder(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال عبر واتساب للمورد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Modal 2: Edit Min Reorder Threshold (تعديل حد الطلب) */}
      {/* ========================================================= */}
      {editingThresholdRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">ضبط حد الطلب الأدنى ونقطة التنبيه</h3>
              </div>
              <button
                onClick={() => setEditingThresholdRecord(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <p className="text-slate-600">
                عند وصول رصيد المخزون الفعلي إلى هذه القيمة أو أقل، سيقوم النظام تلقائياً بإطلاق إشعار تنبيهي فوري لك لإصدار أمر توريد.
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  حد الطلب الأدنى (قطع):
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={tempMinReorderLevel}
                  onChange={(e) => setTempMinReorderLevel(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  الرصيد الحالي: {editingThresholdRecord.currentStock} قطعة
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  كمية التوريد المقترحة تلقائياً (قطع):
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={tempReorderQty}
                  onChange={(e) => setTempReorderQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingThresholdRecord(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveThreshold}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Supplier Automation Modal */}
      {isWhatsAppAutomationModalOpen && (
        <WhatsAppSupplierAutomationModal
          isOpen={isWhatsAppAutomationModalOpen}
          onClose={() => setIsWhatsAppAutomationModalOpen(false)}
          inventory={inventory}
          products={products}
          onUpdateInventory={onUpdateInventory}
          onShowToast={onShowToast}
          preselectedProductId={selectedProductForWhatsApp}
          onOpenSupplierDirectory={(productId) => {
            setSelectedProductForSupplierModal(productId);
            setIsSupplierModalOpen(true);
          }}
        />
      )}

      {/* Supplier Directory & Management Modal */}
      {isSupplierModalOpen && (
        <SupplierDirectoryModal
          isOpen={isSupplierModalOpen}
          onClose={() => {
            setIsSupplierModalOpen(false);
            setSelectedProductForSupplierModal(undefined);
          }}
          suppliers={suppliers}
          onUpdateSuppliers={setSuppliers}
          inventory={inventory}
          onUpdateInventory={onUpdateInventory}
          products={products}
          onShowToast={onShowToast}
          initialSelectedProductId={selectedProductForSupplierModal}
          initialTab={supplierModalTab}
          onOpenWhatsAppAutomation={(productId) => {
            setSelectedProductForWhatsApp(productId);
            setIsWhatsAppAutomationModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
