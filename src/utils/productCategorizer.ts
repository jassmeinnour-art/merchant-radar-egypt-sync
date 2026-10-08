/**
 * Site Taxonomy & AI Product Auto-Categorization Utility
 * Aggregates categories across platformsGuideData, platformCommissionsData, and sampleProducts
 * to automatically analyze raw product names from Excel/CSV sheets and classify them into correct store departments.
 */

export interface SiteCategory {
  key: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  badgeClass: string;
  keywords: string[];
  patterns?: RegExp[];
}

export const SITE_STANDARD_CATEGORIES: SiteCategory[] = [
  {
    key: 'furniture_bedding',
    nameAr: 'أثاث ومفروشات ومراتب',
    nameEn: 'Furniture & Bedding',
    icon: '🛋️',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    keywords: [
      'مرتبة', 'مراتب', 'سرير', 'دولاب', 'كنبة', 'طاولة', 'كرسي', 'كراسي', 'مكتب', 'مكاتب',
      'سجادة', 'سجاد', 'لحاف', 'مخدة', 'مخدات', 'وسادة', 'ملاءة', 'غطاء سرير', 'كومود', 'جزامة',
      'انتريه', 'بوفيه', 'كنب', 'ركنة', 'طقم جلوس', 'دريسنج', 'تسريحة', 'طاولة قهوة', 'سوست',
      'يانسن', 'تاكي', 'هابيتات', 'بيج بد', 'فوربد', 'انجلندر', 'mattress', 'bed', 'sofa', 'desk',
      'chair', 'wardrobe', 'pillow', 'carpet', 'duvet', 'cushion', 'recliner', 'bookshelf'
    ],
    patterns: [
      /مرتب[ةه]/i,
      /سوست\s*(متصل[ةه]|منفصل[ةه]|بوكيت|بونيل)/i,
      /(سرير|دولاب|كنب[ةه]|ركن[ةه]|انتريه|صالون)/i,
      /مفروش/i,
      /طاول[ةه]/i
    ]
  },
  {
    key: 'audio_headphones',
    nameAr: 'صوتيات وسماعات',
    nameEn: 'Audio & Headphones',
    icon: '🎧',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    keywords: [
      'سماعة', 'سماعات', 'ايربودز', 'اير بودز', 'هيدفون', 'هيد فون', 'ساوندكور', 'ميكروفون',
      'مايك', 'مكبر صوت', 'ساوند بار', 'سبيكر', 'صب ووفر', 'صب', 'كاسيت', 'صوتيات', 'بلوتوث صوت',
      'soundcore', 'headphones', 'earbuds', 'headset', 'airpods', 'speaker', 'soundbar',
      'microphone', 'jbl', 'anker', 'sony audio', 'bose', 'earphone'
    ],
    patterns: [
      /سماع[ةه]/i,
      /(اير\s*بودز|airpods|earbuds|headphone)/i,
      /(مكبر\s*صوت|soundbar|speaker|سبيكر)/i,
      /(مايك|ميكروفون|mic)/i
    ]
  },
  {
    key: 'smartphones_tablets',
    nameAr: 'موبايل وأجهزة لوحية',
    nameEn: 'Smartphones & Tablets',
    icon: '📱',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    keywords: [
      'موبايل', 'موبايلات', 'هاتف', 'هواتف', 'تليفون', 'جوال', 'ايفون', 'آيفون', 'سامسونج',
      'جالاكسي', 'شاومي', 'ريدمي', 'بوكو', 'ريلمي', 'أوبو', 'اوبو', 'انفينكس', 'هواوي',
      'تابلت', 'تاب', 'آيباد', 'ايباد', 'شريحة', 'smartphone', 'mobile', 'iphone', 'galaxy',
      'samsung', 'xiaomi', 'redmi', 'poco', 'realme', 'oppo', 'infinix', 'ipad', 'tablet'
    ],
    patterns: [
      /(موبايل|هاتف\s*ذكي|جوال)/i,
      /(iphone|آيفون|ايفون)\s*(\d+|pro|max|plus)?/i,
      /(galaxy|جالاكسي|سامسونج)\s*(s\d+|a\d+|z|ultra|fe)?/i,
      /(redmi|ريدمي|شاومي|xiaomi|poco|ريلمي|realme)/i,
      /(تابلت|ايباد|ipad|tablet)/i
    ]
  },
  {
    key: 'electronics_accessories',
    nameAr: 'إلكترونيات وكمبيوتر وإكسسوارات',
    nameEn: 'Electronics & Computers',
    icon: '💻',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    keywords: [
      'لابتوب', 'لاب توب', 'كمبيوتر', 'ماوس', 'لوحة مفاتيح', 'كيبورد', 'شاحن', 'شواحن',
      'باور بنك', 'باوربنك', 'كابل', 'كابلات', 'وصلة', 'ساعة ذكية', 'سمارت ووتش', 'شاشة',
      'شاشات', 'راوتر', 'واي فاي', 'كاميرا', 'فلاشة', 'هارد ديسك', 'هارد', 'ssd', 'usb',
      'هاب', 'مشترك كهرباء', 'ستاند لابتوب', 'حامل موبايل', 'جراب', 'كفر', 'اسكرينة',
      'laptop', 'computer', 'mouse', 'keyboard', 'charger', 'powerbank', 'smartwatch',
      'monitor', 'router', 'webcam', 'flash drive', 'hard drive', 'cable', 'adapter'
    ],
    patterns: [
      /(لابتوب|لاب\s*توب|laptop)/i,
      /(شاحن|charger|power\s*bank|باور\s*بنك)/i,
      /(ساع[ةه]\s*ذكي[ةه]|smartwatch)/i,
      /(كيبورد|ماوس|keyboard|mouse)/i,
      /(شاش[ةه]\s*كمبيوتر|monitor|راوتر|router)/i
    ]
  },
  {
    key: 'home_appliances',
    nameAr: 'أجهزة منزلية ومطبخ',
    nameEn: 'Home & Kitchen Appliances',
    icon: '🍳',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    keywords: [
      'قلاية', 'قلاية هوائية', 'خلاط', 'مكنسة', 'مكنسة كهربائية', 'كبة', 'غلاية', 'كاتيل',
      'عجان', 'عجانة', 'فرن', 'فرن كهربائي', 'ميكروويف', 'ميكرويف', 'بوتجاز', 'بوتاجاز',
      'ثلاجة', 'ديب فريزر', 'فريزر', 'غسالة', 'غسالة صحون', 'تكييف', 'مكيف', 'مكواة',
      'مكواة بخار', 'سخان', 'سخان غاز', 'محضرة طعام', 'عصارة', 'توستر', 'صانع قهوة', 'دفاية',
      'مروحة', 'air fryer', 'blender', 'kettle', 'microwave', 'oven', 'vacuum', 'fridge',
      'refrigerator', 'washer', 'dishwasher', 'ac', 'iron', 'toaster', 'coffee maker', 'heater'
    ],
    patterns: [
      /(قلاي[ةه]\s*هوائي[ةه]|air\s*fryer)/i,
      /(خلاط|كبة|عجان[ةه]|blender|food\s*processor)/i,
      /(مكنس[ةه]|غلاي[ةه]|كاتيل|kettle|vacuum)/i,
      /(ميكروويف|فرن|بوتجاز|microwave|oven)/i,
      /(ثلاج[ةه]|غسال[ةه]|تكييف|ديب\s*فريزر|fridge|washer)/i
    ]
  },
  {
    key: 'home_decor',
    nameAr: 'ديكور وإضاءة ومنزل',
    nameEn: 'Home Decor & Lighting',
    icon: '✨',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    keywords: [
      'اباجورة', 'أباجورة', 'نجفة', 'نجف', 'ستارة', 'ستائر', 'مرآة', 'مراية', 'لوحة جدارية',
      'تابلوه', 'فازة', 'زهرية', 'رفوف', 'رف معلق', 'منظم', 'سلة تخزين', 'لمبة ليد',
      'إضاءة', 'سبوت لايت', 'شريط ليد', 'تحفة', 'ورد صناعي', 'شمعة معطرة', 'ساعة حائط',
      'lamp', 'curtain', 'mirror', 'decor', 'lighting', 'chandelier', 'vase', 'wall art', 'frame'
    ],
    patterns: [
      /(اباجور[ةه]|أباجور[ةه]|نجف[ةه]|نجف)/i,
      /(ستار[ةه]|ستائر|curtain)/i,
      /(مرآ[ةه]|مراي[ةه]|mirror)/i,
      /(لوح[ةه]\s*جداري[ةه]|تابلوه|wall\s*art)/i,
      /(شريط\s*ليد|سبوت\s*لايت|إضاء[ةه])/i
    ]
  },
  {
    key: 'fashion_apparel',
    nameAr: 'أزياء وملابس وأحذية',
    nameEn: 'Fashion & Apparel',
    icon: '👕',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    keywords: [
      'قميص', 'قمصان', 'بنطلون', 'بناطيل', 'تيشرت', 'تي شيرت', 'فستان', 'فساتين', 'عباية',
      'عبايات', 'حذاء', 'أحذية', 'جزمة', 'كوتشي', 'سنيكرز', 'صندل', 'شنطة يد', 'حقيبة',
      'محفظة', 'جاكيت', 'سويت شيرت', 'هودي', 'بدلة', 'ترنج', 'بيجامة', 'كاب', 'طرحة',
      'حزام جلد', 'نظارة شمسية', 'shoes', 'shirt', 'dress', 'jacket', 'bag', 'sneakers',
      'hoodie', 'pants', 't-shirt', 'coat', 'wallet', 'belt', 'sunglasses'
    ],
    patterns: [
      /(قميص|بنطلون|تيشرت|تي\s*شيرت|فستان|عباي[ةه])/i,
      /(حذاء|جزم[ةه]|كوتشي|سنيكرز|صندل|shoes|sneakers)/i,
      /(شنط[ةه]|حقيب[ةه]|محفظ[ةه]|bag|wallet)/i,
      /(جاكيت|سويت\s*شيرت|هودي|ترنج|jacket|hoodie)/i
    ]
  },
  {
    key: 'beauty_personal_care',
    nameAr: 'عناية وتجميل وعطور',
    nameEn: 'Beauty & Personal Care',
    icon: '💄',
    badgeClass: 'bg-pink-50 text-pink-800 border-pink-200',
    keywords: [
      'عطر', 'برفان', 'عطور', 'أودي بارفان', 'سيروم', 'سيرم', 'كريم', 'مرطب', 'غسول وجه',
      'مكياج', 'روج', 'ماسكارا', 'كونسيلر', 'كريم أساس', 'شامبو', 'بلسم', 'زيت شعر',
      'ماكينة حلاقة', 'مكواة شعر', 'سيشوار', 'مجفف شعر', 'معجون أسنان', 'فرشاة أسنان',
      'صابون', 'واقي شمس', 'صن بلوك', 'ماسك بشرة', 'مسك', 'لوشن', 'perfume', 'fragrance',
      'serum', 'cream', 'lotion', 'shampoo', 'conditioner', 'makeup', 'lipstick', 'sunscreen'
    ],
    patterns: [
      /(عطر|برفان|parfum|fragrance|perfume)/i,
      /(سيروم|سيرم|serum|كريم\s*(مرطب|أساس)|lotion)/i,
      /(شامبو|بلسم|shampoo|زيت\s*شعر)/i,
      /(مكياج|روج|ماسكارا|makeup|lipstick)/i,
      /(ماكين[ةه]\s*حلاق[ةه]|سيشوار|مجفف\s*شعر|shaver|hair\s*dryer)/i
    ]
  },
  {
    key: 'sports_fitness',
    nameAr: 'رياضة ولياقة وهوايات',
    nameEn: 'Sports & Fitness',
    icon: '🏃',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
    keywords: [
      'مشاية', 'مشاية كهربائية', 'دمبل', 'دمبلز', 'أوزان', 'حزام تخسيس', 'دراجة رياضية',
      'عجلة رياضية', 'كرة قدم', 'كرة سلة', 'مات يوجا', 'مات تمارين', 'مكملات غذائية',
      'واي بروتين', 'كرياتين', 'شريط مقاومة', 'جهاز بطن', 'حبل قفز', 'مضرب تنس', 'قفازات جيم',
      'treadmill', 'dumbbell', 'weights', 'exercise bike', 'yoga mat', 'whey protein', 'creatine', 'fitness'
    ],
    patterns: [
      /(مشاي[ةه]\s*كهربائي[ةه]|treadmill)/i,
      /(دمبل|أوزان|dumbbells?|weights)/i,
      /(دراج[ةه]\s*رياضي[ةه]|عجل[ةه]\s*تمارين)/i,
      /(واي\s*بروتين|كرياتين|protein|creatine)/i,
      /(مات\s*يوجا|yoga\s*mat|حبل\s*قفز)/i
    ]
  },
  {
    key: 'baby_toys',
    nameAr: 'ألعاب وأطفال ومواليد',
    nameEn: 'Toys & Baby Products',
    icon: '🧸',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    keywords: [
      'حفاضات', 'بامبرز', 'عربة أطفال', 'ستروولر', 'ببرونة', 'رضاعة', 'لهاية', 'تيتينا',
      'ألعاب أطفال', 'لعبة', 'دمية', 'عروسة لعبة', 'بازل', 'ليجو', 'سيارة أطفال',
      'سرير أطفال', 'كرسي سيارة أطفال', 'كرسي طعام أطفال', 'baby stroller', 'diapers',
      'baby bottle', 'pacifier', 'toys', 'lego', 'doll', 'puzzle', 'car seat'
    ],
    patterns: [
      /(حفاضات|بامبرز|diapers)/i,
      /(عرب[ةه]\s*أطفال|stroller|رضاع[ةه]|ببرون[ةه])/i,
      /(ألعاب|لعب[ةه]|دمي[ةه]|ليجو|lego|puzzle|toy)/i,
      /(كرسي\s*سيار[ةه]\s*أطفال|car\s*seat)/i
    ]
  },
  {
    key: 'hardware_tools',
    nameAr: 'أدوات وعدد وتحسينات المنزل',
    nameEn: 'Hardware & Tools',
    icon: '🔧',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    keywords: [
      'دريل', 'شنيور', 'هيلتي', 'مفك', 'مفكات', 'طقم عدد', 'صندوق عدة', 'سلم المونيوم',
      'بنسة', 'كماشة', 'شاكوش', 'مطرقة', 'منشار', 'مضخة مياه', 'موتور مياه', 'دهان',
      'بويات', 'رول دهان', 'مسامير', 'شريط قياس', 'متر قياس', 'drill', 'screwdriver',
      'tool set', 'toolbox', 'ladder', 'hammer', 'saw', 'water pump', 'tape measure'
    ],
    patterns: [
      /(شنيور|دريل|هيلتي|drill)/i,
      /(مفك|طقم\s*عدد|صندوق\s*عد[ةه]|toolbox|screwdriver)/i,
      /(شاكوش|منشار|بنس[ةه]|hammer|saw)/i,
      /(موتور\s*مياه|مضخ[ةه]|water\s*pump)/i
    ]
  },
  {
    key: 'grocery_supermarket',
    nameAr: 'سوبر ماركت وأغذية وبقالة',
    nameEn: 'Grocery & Supermarket',
    icon: '🛒',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    keywords: [
      'شاي', 'قهوة', 'بن', 'نسكافيه', 'زيت طعام', 'سمن', 'أرز', 'مكرونة', 'عسل نحل',
      'شوكولاتة', 'بسكويت', 'مكسرات', 'مياه معدنية', 'عصير', 'منظف أطباق', 'مسحوق غسيل',
      'اريال', 'برسيل', 'مناديل', 'صابون غسيل', 'تونة', 'سردين', 'صلصة', 'توابل',
      'coffee', 'tea', 'chocolate', 'honey', 'pasta', 'rice', 'detergent', 'tuna', 'oil'
    ],
    patterns: [
      /(شاي|قهو[ةه]|بن|نسكافيه|coffee|tea)/i,
      /(زيت\s*طعام|سمن|أرز|مكرون[ةه]|pasta|rice)/i,
      /(شوكولات[ةه]|بسكويت|chocolate|honey|عسل)/i,
      /(مسحوق\s*غسيل|منظف|مناديل|detergent|ariel|persil)/i
    ]
  }
];

export interface CategorizationResult {
  categoryKey: string;
  categoryName: string;
  categoryNameEn: string;
  icon: string;
  badgeClass: string;
  confidence: number;
  matchedKeywords: string[];
  isBeddingMattressMatch?: boolean;
}

/**
 * Automatically inspects a product title, dimensions, and notes to assign
 * the most accurate store category from the site's database taxonomy.
 */
export function autoCategorizeProduct(
  title: string,
  dimensions?: string,
  notes?: string
): CategorizationResult {
  const textToScan = `${title || ''} ${dimensions || ''} ${notes || ''}`.toLowerCase();

  let bestCategory: SiteCategory = SITE_STANDARD_CATEGORIES[0];
  let highestScore = 0;
  let matchedTerms: string[] = [];

  for (const cat of SITE_STANDARD_CATEGORIES) {
    let score = 0;
    const currentMatches: string[] = [];

    // 1. Regex patterns (high weight +15)
    if (cat.patterns) {
      for (const pattern of cat.patterns) {
        if (pattern.test(textToScan)) {
          score += 15;
          currentMatches.push(pattern.source);
        }
      }
    }

    // 2. Keyword exact / substring matches
    for (const kw of cat.keywords) {
      const lowerKw = kw.toLowerCase();
      if (textToScan.includes(lowerKw)) {
        // Longer keywords carry higher semantic weight
        const wordWeight = lowerKw.length > 5 ? 8 : 4;
        score += wordWeight;
        if (!currentMatches.includes(kw)) {
          currentMatches.push(kw);
        }
      }
    }

    // 3. Special dimension heuristics (e.g. 160×200 or 120×195 cm strongly implies furniture/mattress)
    if (cat.key === 'furniture_bedding') {
      if (/\b(100|120|140|150|160|170|180|200)\s*[×x*]\s*(190|195|200)\b/i.test(textToScan)) {
        score += 25;
        currentMatches.push('أبعاد مراتب قياسية');
      }
    }

    // Special appliance dimension heuristics (e.g. liters or watts)
    if (cat.key === 'home_appliances') {
      if (/\b(\d+\.?\d*)\s*(لتر|وات|watt|liter|l|w)\b/i.test(textToScan)) {
        score += 15;
        currentMatches.push('سعة/قدرة كهربائية');
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestCategory = cat;
      matchedTerms = currentMatches;
    }
  }

  // Calculate confidence percentage
  let confidence = 70;
  if (highestScore >= 30) {
    confidence = 98;
  } else if (highestScore >= 20) {
    confidence = 92;
  } else if (highestScore >= 10) {
    confidence = 85;
  } else if (highestScore > 0) {
    confidence = 78;
  } else {
    // Fallback: General Electronics & Accessories or Furniture based on generic word length
    bestCategory = SITE_STANDARD_CATEGORIES[3]; // Electronics Accessories
    confidence = 65;
  }

  return {
    categoryKey: bestCategory.key,
    categoryName: bestCategory.nameAr,
    categoryNameEn: bestCategory.nameEn,
    icon: bestCategory.icon,
    badgeClass: bestCategory.badgeClass,
    confidence,
    matchedKeywords: matchedTerms,
    isBeddingMattressMatch: bestCategory.key === 'furniture_bedding'
  };
}

/**
 * Returns a category object by its key
 */
export function getCategoryByKey(key: string): SiteCategory | undefined {
  return SITE_STANDARD_CATEGORIES.find(c => c.key === key);
}
