import React, { createContext, useContext, useState, useEffect } from 'react';

export type PrimaryThemeId = 
  | 'indigo' 
  | 'blue' 
  | 'emerald' 
  | 'purple' 
  | 'amber' 
  | 'rose' 
  | 'teal' 
  | 'slate';

export interface PrimaryThemeConfig {
  id: PrimaryThemeId;
  name: string;
  nameEn: string;
  description: string;
  primaryHex: string;     // e.g. #4f46e5 (Tailwind 600)
  hoverHex: string;       // e.g. #4338ca (Tailwind 700)
  activeHex: string;      // e.g. #3730a3 (Tailwind 800)
  lightHex: string;       // e.g. #eef2ff (Tailwind 50)
  lightHoverHex: string;  // e.g. #e0e7ff (Tailwind 100)
  borderHex: string;      // e.g. #c7d2fe (Tailwind 200)
  textHex: string;        // e.g. #4338ca (Tailwind 700)
  chartPrimary: string;   // Main chart line/bar color
  chartFill: string;      // Chart area gradient top
  chartLight: string;     // Chart fill light
  category: 'classic' | 'modern' | 'vibrant' | 'minimal';
}

export const THEME_PRESETS: PrimaryThemeConfig[] = [
  {
    id: 'indigo',
    name: 'النيلي الكلاسيكي',
    nameEn: 'Classic Indigo',
    description: 'النسق الافتراضي الأنيق لمنظومة رادار التاجر المصري، هادئ ومتوازن للمبيعات والتحليلات.',
    primaryHex: '#4f46e5',
    hoverHex: '#4338ca',
    activeHex: '#3730a3',
    lightHex: '#eef2ff',
    lightHoverHex: '#e0e7ff',
    borderHex: '#c7d2fe',
    textHex: '#4338ca',
    chartPrimary: '#4f46e5',
    chartFill: '#818cf8',
    chartLight: '#e0e7ff',
    category: 'classic'
  },
  {
    id: 'blue',
    name: 'الأزرق الملكي التجاري',
    nameEn: 'Royal Sapphire',
    description: 'لون الاحترافية والمصداقية المصرفية، يوفر وضوحاً فائقاً في لوحة أداء المبيعات والتسعير.',
    primaryHex: '#2563eb',
    hoverHex: '#1d4ed8',
    activeHex: '#1e40af',
    lightHex: '#eff6ff',
    lightHoverHex: '#dbeafe',
    borderHex: '#bfdbfe',
    textHex: '#1d4ed8',
    chartPrimary: '#2563eb',
    chartFill: '#60a5fa',
    chartLight: '#dbeafe',
    category: 'classic'
  },
  {
    id: 'emerald',
    name: 'الزمردي والأخضر الاستثماري',
    nameEn: 'Emerald Green',
    description: 'لون الأرباح والنمو المالي وهوامش الربح الإيجابية، ملهم لزيادة المبيعات وتحقيق العوائد.',
    primaryHex: '#059669',
    hoverHex: '#047857',
    activeHex: '#065f46',
    lightHex: '#ecfdf5',
    lightHoverHex: '#d1fae5',
    borderHex: '#a7f3d0',
    textHex: '#047857',
    chartPrimary: '#059669',
    chartFill: '#34d399',
    chartLight: '#d1fae5',
    category: 'modern'
  },
  {
    id: 'purple',
    name: 'البنفسجي الإمبراطوري',
    nameEn: 'Imperial Purple',
    description: 'نسق راقٍ حديث يمنح لوحة التحكم طابعاً تقنياً متقدماً وفخامة بصرية للعلامات التجارية.',
    primaryHex: '#7c3aed',
    hoverHex: '#6d28d9',
    activeHex: '#5b21b6',
    lightHex: '#f5f3ff',
    lightHoverHex: '#ede9fe',
    borderHex: '#ddd6fe',
    textHex: '#6d28d9',
    chartPrimary: '#7c3aed',
    chartFill: '#a78bfa',
    chartLight: '#ede9fe',
    category: 'modern'
  },
  {
    id: 'amber',
    name: 'العنبري والذهبي التجاري',
    nameEn: 'Commercial Amber & Gold',
    description: 'طاقة تجارية عالية تعكس الصفقات الذهبية والفرص البيعية العاجلة في الأسواق المصرية.',
    primaryHex: '#d97706',
    hoverHex: '#b45309',
    activeHex: '#92400e',
    lightHex: '#fffbeb',
    lightHoverHex: '#fef3c7',
    borderHex: '#fde68a',
    textHex: '#b45309',
    chartPrimary: '#d97706',
    chartFill: '#fbbf24',
    chartLight: '#fef3c7',
    category: 'vibrant'
  },
  {
    id: 'rose',
    name: 'الياقوتي والوردي العصري',
    nameEn: 'Ruby Rose',
    description: 'نسق متميز وجريء مثالي لمتاجر الموضة والعناية والإلكترونيات الاستهلاكية الحديثة.',
    primaryHex: '#e11d48',
    hoverHex: '#be123c',
    activeHex: '#9f1239',
    lightHex: '#fff1f2',
    lightHoverHex: '#ffe4e6',
    borderHex: '#fecdd3',
    textHex: '#be123c',
    chartPrimary: '#e11d48',
    chartFill: '#fb7185',
    chartLight: '#ffe4e6',
    category: 'vibrant'
  },
  {
    id: 'teal',
    name: 'الفيروزي والأكوا البحري',
    nameEn: 'Ocean Teal',
    description: 'مزيج منعش من الأزرق والأخضر يريح العين خلال جلسات المتابعة الطويلة ورصد المنافسين.',
    primaryHex: '#0d9488',
    hoverHex: '#0f766e',
    activeHex: '#115e59',
    lightHex: '#f0fdfa',
    lightHoverHex: '#ccfbf1',
    borderHex: '#99f6e4',
    textHex: '#0f766e',
    chartPrimary: '#0d9488',
    chartFill: '#2dd4bf',
    chartLight: '#ccfbf1',
    category: 'modern'
  },
  {
    id: 'slate',
    name: 'الرمادي الحجري والغرافيت',
    nameEn: 'Charcoal Slate',
    description: 'نسق محايد فاخر وراكز جداً يقلل التشتت البصري ويركز على الأرقام والأسعار الصافية.',
    primaryHex: '#475569',
    hoverHex: '#334155',
    activeHex: '#1e293b',
    lightHex: '#f8fafc',
    lightHoverHex: '#f1f5f9',
    borderHex: '#cbd5e1',
    textHex: '#334155',
    chartPrimary: '#475569',
    chartFill: '#94a3b8',
    chartLight: '#f1f5f9',
    category: 'minimal'
  },
];

const LOCAL_STORAGE_THEME_KEY = 'merchant_radar_primary_theme';

interface ThemeContextType {
  currentThemeId: PrimaryThemeId;
  currentTheme: PrimaryThemeConfig;
  allThemes: PrimaryThemeConfig[];
  setPrimaryTheme: (themeId: PrimaryThemeId) => void;
  resetToDefaultTheme: () => void;
  isThemeModalOpen: boolean;
  setIsThemeModalOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read initial theme from localStorage safely
  const [currentThemeId, setCurrentThemeId] = useState<PrimaryThemeId>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
        if (saved && THEME_PRESETS.some(t => t.id === saved)) {
          return saved as PrimaryThemeId;
        }
      } catch {
        // safe fallback
      }
    }
    return 'indigo';
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);

  const currentTheme = THEME_PRESETS.find(t => t.id === currentThemeId) || THEME_PRESETS[0];

  // Apply theme to DOM and CSS custom properties whenever currentThemeId changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const root = document.documentElement;
      
      // Set HTML attribute for CSS selector matching
      root.setAttribute('data-primary-theme', currentTheme.id);

      // Set CSS custom properties on root
      root.style.setProperty('--primary-color', currentTheme.primaryHex);
      root.style.setProperty('--primary-hover', currentTheme.hoverHex);
      root.style.setProperty('--primary-active', currentTheme.activeHex);
      root.style.setProperty('--primary-light', currentTheme.lightHex);
      root.style.setProperty('--primary-light-hover', currentTheme.lightHoverHex);
      root.style.setProperty('--primary-border', currentTheme.borderHex);
      root.style.setProperty('--primary-text', currentTheme.textHex);
      root.style.setProperty('--primary-chart-stroke', currentTheme.chartPrimary);
      root.style.setProperty('--primary-chart-fill', currentTheme.chartFill);
      root.style.setProperty('--primary-chart-light', currentTheme.chartLight);

      // Save to localStorage
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, currentTheme.id);

      // Dispatch custom event so listeners or iframes can react
      window.dispatchEvent(new CustomEvent('merchant_theme_changed', { detail: { themeId: currentTheme.id } }));
    } catch {
      // safe fallback
    }
  }, [currentTheme]);

  const setPrimaryTheme = (themeId: PrimaryThemeId) => {
    if (THEME_PRESETS.some(t => t.id === themeId)) {
      setCurrentThemeId(themeId);
    }
  };

  const resetToDefaultTheme = () => {
    setCurrentThemeId('indigo');
  };

  return (
    <ThemeContext.Provider
      value={{
        currentThemeId,
        currentTheme,
        allThemes: THEME_PRESETS,
        setPrimaryTheme,
        resetToDefaultTheme,
        isThemeModalOpen,
        setIsThemeModalOpen,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      currentThemeId: 'indigo',
      currentTheme: THEME_PRESETS[0],
      allThemes: THEME_PRESETS,
      setPrimaryTheme: () => {},
      resetToDefaultTheme: () => {},
      isThemeModalOpen: false,
      setIsThemeModalOpen: () => {},
    };
  }
  return context;
};
