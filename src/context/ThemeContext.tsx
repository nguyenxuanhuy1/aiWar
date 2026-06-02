'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type PrimaryType = 'preset' | 'custom';
export type PrimaryPreset = 'navy' | 'forest' | 'burgundy' | 'plum' | 'teal' | 'indigo' | 'rose' | 'copper';
export type BgType = 'preset' | 'custom';
export type BgPreset = 'default';

interface ThemeContextType {
  themeMode: ThemeMode;
  primaryType: PrimaryType;
  primaryPreset: PrimaryPreset;
  primaryCustomColor: string;
  bgType: BgType;
  bgPreset: BgPreset;
  bgCustomColor: string;
  actualTheme: 'light' | 'dark'; // Theme thực tế sau khi tính toán (light hay dark)
  
  setThemeMode: (mode: ThemeMode) => void;
  setPrimaryPreset: (preset: PrimaryPreset) => void;
  setPrimaryCustomColor: (color: string) => void;
  setBgPreset: (preset: BgPreset) => void;
  setBgCustomColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Preset Colors
export const ACCENT_COLORS: Record<PrimaryPreset, { light: string; dark: string }> = {
  navy: { light: '#1e40af', dark: '#60a5fa' },
  forest: { light: '#065f46', dark: '#34d399' },
  burgundy: { light: '#991b1b', dark: '#fb7185' },
  plum: { light: '#6b21a8', dark: '#c084fc' },
  teal: { light: '#0f766e', dark: '#2dd4bf' },
  indigo: { light: '#4f46e5', dark: '#6366f1' },
  rose: { light: '#be123c', dark: '#f43f5e' },
  copper: { light: '#9a3412', dark: '#fb923c' },
};

// Preset Backgrounds (Chỉ giữ lại 1 kiểu Mặc định tuyệt đẹp)
export const BG_STYLES: Record<BgPreset, { light: { bg: string; grad: string }; dark: { bg: string; grad: string } }> = {
  default: {
    light: { bg: '#f8fafc', grad: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' },
    dark: { bg: '#030712', grad: 'radial-gradient(circle at 50% 50%, #0c1020 0%, #030712 100%)' }
  }
};

// Helper color algorithms
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const darkenHex = (hex: string, percent: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  let { r, g, b } = rgb;
  r = Math.max(0, Math.floor(r * (1 - percent)));
  g = Math.max(0, Math.floor(g * (1 - percent)));
  b = Math.max(0, Math.floor(b * (1 - percent)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const lightenHex = (hex: string, percent: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  let { r, g, b } = rgb;
  r = Math.min(255, Math.floor(r + (255 - r) * percent));
  g = Math.min(255, Math.floor(g + (255 - g) * percent));
  b = Math.min(255, Math.floor(b + (255 - b) * percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const getGlowColor = (hex: string, opacity: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(99, 102, 241, ${opacity})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
};

// Thuật toán đo độ sáng để tính tương phản chữ đen/trắng (Luminance)
const isLightColor = (hex: string): boolean => {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  // Khối lượng chuẩn YIQ
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
  return luminance > 140; // lớn hơn 140 coi là màu sáng
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [primaryType, setPrimaryTypeState] = useState<PrimaryType>('preset');
  const [primaryPreset, setPrimaryPresetState] = useState<PrimaryPreset>('indigo');
  const [primaryCustomColor, setPrimaryCustomColorState] = useState<string>('#6366f1');
  const [bgType, setBgTypeState] = useState<BgType>('preset');
  const [bgPreset, setBgPresetState] = useState<BgPreset>('default');
  const [bgCustomColor, setBgCustomColorState] = useState<string>('#030712');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');

  // Khôi phục từ localStorage khi mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mode = localStorage.getItem('themeMode') as ThemeMode || 'dark';
    const pType = localStorage.getItem('primaryType') as PrimaryType || 'preset';
    const pPreset = localStorage.getItem('primaryPreset') as PrimaryPreset || 'indigo';
    const pCustom = localStorage.getItem('primaryCustomColor') || '#6366f1';
    const bType = localStorage.getItem('bgType') as BgType || 'preset';
    const bCustom = localStorage.getItem('bgCustomColor') || '#030712';

    setThemeModeState(mode);
    setPrimaryTypeState(pType);
    setPrimaryPresetState(pPreset);
    setPrimaryCustomColorState(pCustom);
    setBgTypeState(bType);
    setBgPresetState('default'); // Luôn chuyển đổi an toàn về 'default' làm kiểu nền cài sẵn
    setBgCustomColorState(bCustom);
  }, []);

  // Áp dụng các cài đặt giao diện
  const applyThemeSettings = useCallback(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;

    // 1. Xác định theme thực tế (sáng hay tối)
    let isLight = false;
    if (bgType === 'custom') {
      isLight = isLightColor(bgCustomColor);
    } else {
      if (themeMode === 'system') {
        isLight = !window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isLight = themeMode === 'light';
      }
    }

    const currentActualTheme = isLight ? 'light' : 'dark';
    setActualTheme(currentActualTheme);

    if (currentActualTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 2. Xác định màu chủ đạo
    let primary = '';
    if (primaryType === 'preset') {
      primary = ACCENT_COLORS[primaryPreset][currentActualTheme];
    } else {
      primary = primaryCustomColor;
    }

    const primaryHover = darkenHex(primary, 0.15);
    const primaryGlow = getGlowColor(primary, currentActualTheme === 'dark' ? 0.15 : 0.04);
    
    // Ghi đè CSS variables của màu chủ đạo
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--primary-hover', primaryHover);
    root.style.setProperty('--primary-glow', primaryGlow);

    // 3. Xác định màu nền
    let bg = '';
    let grad = 'none';

    if (bgType === 'preset') {
      const bgSettings = BG_STYLES[bgPreset][currentActualTheme];
      bg = bgSettings.bg;
      grad = bgSettings.grad;
    } else {
      bg = bgCustomColor;
      grad = 'none';
    }

    root.style.setProperty('--background', bg);
    root.style.setProperty('--bg-gradient', grad);

    // 4. Thiết lập các biến CSS tùy thuộc theo chế độ sáng/tối
    if (currentActualTheme === 'dark') {
      root.style.setProperty('--foreground', '#f3f4f6');
      root.style.setProperty('--card-bg', 'rgba(17, 24, 39, 0.65)');
      
      // Tính toán nền đục động theo custom background
      let cardBgOpaque = '#0b0f19';
      if (bgType === 'custom') {
        cardBgOpaque = lightenHex(bgCustomColor, 0.08);
      }
      root.style.setProperty('--card-bg-opaque', cardBgOpaque);

      root.style.setProperty('--card-border', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--card-border-hover', getGlowColor(primary, 0.35));
      root.style.setProperty('--card-glow', getGlowColor(primary, 0.05));
      root.style.setProperty('--text-primary', '#f3f4f6');
      root.style.setProperty('--text-secondary', '#9ca3af');
      root.style.setProperty('--text-muted', '#6b7280');
      root.style.setProperty('--input-bg', 'rgba(255, 255, 255, 0.02)');
      root.style.setProperty('--input-border', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--divider-line', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--demo-btn-bg', 'rgba(255, 255, 255, 0.02)');
      root.style.setProperty('--demo-btn-border', 'rgba(255, 255, 255, 0.05)');
    } else {
      root.style.setProperty('--foreground', '#0f172a');
      root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.7)');

      // Tính toán nền đục động theo custom background
      let cardBgOpaque = '#ffffff';
      if (bgType === 'custom') {
        cardBgOpaque = isLightColor(bgCustomColor) ? '#ffffff' : lightenHex(bgCustomColor, 0.12);
      }
      root.style.setProperty('--card-bg-opaque', cardBgOpaque);

      root.style.setProperty('--card-border', 'rgba(15, 23, 42, 0.08)');
      root.style.setProperty('--card-border-hover', getGlowColor(primary, 0.25));
      root.style.setProperty('--card-glow', getGlowColor(primary, 0.02));
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-secondary', '#475569');
      root.style.setProperty('--text-muted', '#94a3b8');
      root.style.setProperty('--input-bg', 'rgba(15, 23, 42, 0.01)');
      root.style.setProperty('--input-border', 'rgba(15, 23, 42, 0.1)');
      root.style.setProperty('--divider-line', 'rgba(15, 23, 42, 0.08)');
      root.style.setProperty('--demo-btn-bg', 'rgba(15, 23, 42, 0.01)');
      root.style.setProperty('--demo-btn-border', 'rgba(15, 23, 42, 0.06)');
    }
  }, [themeMode, primaryType, primaryPreset, primaryCustomColor, bgType, bgPreset, bgCustomColor]);

  // Đồng bộ giao diện mỗi khi state thay đổi
  useEffect(() => {
    applyThemeSettings();
  }, [applyThemeSettings]);

  // Bộ lắng nghe sự kiện thay đổi theme hệ thống
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = () => {
      if (themeMode === 'system') {
        applyThemeSettings();
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [themeMode, applyThemeSettings]);

  // Wrapper set state và lưu localStorage
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('themeMode', mode);
  };

  const setPrimaryPreset = (preset: PrimaryPreset) => {
    setPrimaryTypeState('preset');
    setPrimaryPresetState(preset);
    localStorage.setItem('primaryType', 'preset');
    localStorage.setItem('primaryPreset', preset);
  };

  const setPrimaryCustomColor = (color: string) => {
    setPrimaryTypeState('custom');
    setPrimaryCustomColorState(color);
    localStorage.setItem('primaryType', 'custom');
    localStorage.setItem('primaryCustomColor', color);
  };

  const setBgPreset = (preset: BgPreset) => {
    setBgTypeState('preset');
    setBgPresetState(preset);
    localStorage.setItem('bgType', 'preset');
    localStorage.setItem('bgPreset', preset);
  };

  const setBgCustomColor = (color: string) => {
    setBgTypeState('custom');
    setBgCustomColorState(color);
    localStorage.setItem('bgType', 'custom');
    localStorage.setItem('bgCustomColor', color);
  };

  return (
    <ThemeContext.Provider value={{
      themeMode,
      primaryType,
      primaryPreset,
      primaryCustomColor,
      bgType,
      bgPreset,
      bgCustomColor,
      actualTheme,
      setThemeMode,
      setPrimaryPreset,
      setPrimaryCustomColor,
      setBgPreset,
      setBgCustomColor
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme phải được sử dụng bên trong ThemeProvider');
  }
  return context;
}
