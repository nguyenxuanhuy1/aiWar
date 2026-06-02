'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme, ACCENT_COLORS, BG_STYLES, PrimaryPreset, BgPreset } from '@/context/ThemeContext';

export function ThemeSettings() {
  const {
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
    setBgCustomColor,
  } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Set mounted state and listen to screen size for responsive portal
  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close popover when clicking outside (accounts for React Portal node tree)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current && 
        !popoverRef.current.contains(target) &&
        (!panelRef.current || !panelRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const triggerColorPicker = () => {
    colorInputRef.current?.click();
  };

  const triggerBgPicker = () => {
    bgInputRef.current?.click();
  };

  // Render the panel content
  const panelContent = (
    <div 
      ref={panelRef}
      className={`
        bg-theme-card-opaque border border-theme-border shadow-2xl rounded-2xl p-5 z-[100] animate-fade-in text-left
        ${isMobile 
          ? 'fixed top-auto bottom-6 left-6 right-6 w-auto max-w-[calc(100vw-48px)]' 
          : 'absolute right-0 mt-3 w-80'
        }
      `}
    >
      {/* Section 1: Màu chủ đạo */}
      <div className="mb-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted mb-3">Màu chủ đạo</h3>
        <div className="grid grid-cols-2 gap-2.5">
          
          {/* Default Accent Color Button */}
          <button
            onClick={() => setPrimaryPreset('indigo')}
            className={`
              flex items-center justify-center gap-2 px-3 py-2 rounded-full border cursor-pointer transition-all duration-150 text-xs font-semibold select-none
              ${primaryType === 'preset' && primaryPreset === 'indigo'
                ? 'border-primary! bg-primary/5 text-primary ring-1 ring-primary/30'
                : 'bg-theme-demo-bg border-theme-demo-border text-theme-text-secondary hover:border-theme-border-hover hover:scale-[1.02]'
              }
            `}
          >
            {/* Indigo color dot preview */}
            <span className="w-3.5 h-3.5 rounded-full bg-[#6366f1] shrink-0 shadow-inner border border-black/5" />
            <span className="flex items-center gap-1">
              {primaryType === 'preset' && primaryPreset === 'indigo' && <span className="text-[10px] font-bold">✓</span>}
              <span>Mặc định</span>
            </span>
          </button>

          {/* Custom Accent Color Button (Color Wheel) */}
          <button
            onClick={triggerColorPicker}
            className={`
              flex items-center justify-center gap-2 px-3 py-2 rounded-full border cursor-pointer transition-all duration-150 text-xs font-semibold select-none
              ${primaryType === 'custom'
                ? 'border-primary! bg-primary/5 text-primary ring-1 ring-primary/30'
                : 'bg-theme-demo-bg border-theme-demo-border text-theme-text-secondary hover:border-theme-border-hover hover:scale-[1.02]'
              }
            `}
          >
            {/* Conic color wheel preview */}
            <span 
              className="w-3.5 h-3.5 rounded-full bg-[conic-gradient(from_0deg,#ff5f56,#ffbd2e,#27c93f,#6366f1,#ff5f56)] shrink-0 shadow-inner border border-black/5" 
              style={{
                backgroundColor: primaryType === 'custom' ? primaryCustomColor : undefined,
                backgroundImage: primaryType === 'custom' ? 'none' : undefined
              }}
            />
            <span className="flex items-center gap-1">
              {primaryType === 'custom' && <span className="text-[10px] font-bold">✓</span>}
              <span>Tự chọn</span>
            </span>
          </button>
          
          {/* Hidden Native Color Input */}
          <input
            type="color"
            ref={colorInputRef}
            value={primaryCustomColor}
            onChange={(e) => setPrimaryCustomColor(e.target.value)}
            className="sr-only"
          />
        </div>
        
        {primaryType === 'custom' && (
          <div className="mt-2.5 flex items-center justify-between px-2.5 py-1.5 bg-theme-demo-bg border border-theme-demo-border rounded-lg">
            <span className="text-[11px] text-theme-text-secondary">Màu chủ đạo custom:</span>
            <span className="text-[11px] font-mono font-semibold uppercase text-theme-text-primary">{primaryCustomColor}</span>
          </div>
        )}
      </div>

      {/* Section 2: Chế độ */}
      <div className="mb-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted mb-3">Chế độ</h3>
        <div 
          onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
          className={`
            relative w-full h-11 rounded-full p-1 flex items-center cursor-pointer select-none transition-all duration-300 border
            ${themeMode === 'light' 
              ? 'bg-sky-50 border-sky-200/60 shadow-inner' 
              : 'bg-slate-950/80 border-slate-800 shadow-inner'
            }
          `}
        >
          {/* Sliding Thumb */}
          <div 
            className={`
              absolute w-[calc(50%-4px)] h-8 rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out flex items-center justify-center
              ${themeMode === 'light' 
                ? 'bg-white text-amber-500 border border-amber-100/50' 
                : 'bg-slate-800 text-indigo-400 border border-slate-700'
              }
            `}
            style={{
              transform: themeMode === 'light' ? 'translateX(0)' : 'translateX(100%)',
              left: '2px'
            }}
          >
            <span className="text-xs font-bold flex items-center gap-1.5">
              {themeMode === 'light' ? '☀️ Sáng' : '🌙 Tối'}
            </span>
          </div>
          
          {/* Underlay Labels */}
          <div className="w-full h-full flex items-center justify-between text-[11px] font-bold px-4 pointer-events-none">
            <span className={`transition-opacity duration-200 ${themeMode === 'light' ? 'opacity-0' : 'text-slate-500'}`}>☀️ Sáng</span>
            <span className={`transition-opacity duration-200 ${themeMode === 'dark' ? 'opacity-0' : 'text-sky-600'}`}>🌙 Tối</span>
          </div>
        </div>
      </div>

      {/* Section 3: Nền */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted mb-3">Kiểu nền</h3>
        <div className="grid grid-cols-2 gap-2.5">
          
          {/* Preset Background Styles (Mặc định) */}
          {(Object.keys(BG_STYLES) as BgPreset[]).map((key) => {
            const isActive = bgType === 'preset' && bgPreset === key;
            
            return (
              <button
                key={key}
                onClick={() => setBgPreset(key)}
                className={`
                  flex items-center justify-center gap-2 px-3 py-2 rounded-full border cursor-pointer transition-all duration-150 text-xs font-semibold select-none
                  ${isActive 
                    ? 'border-primary! bg-primary/5 text-primary ring-1 ring-primary/30' 
                    : 'bg-theme-demo-bg border-theme-demo-border text-theme-text-secondary hover:border-theme-border-hover hover:scale-[1.02]'
                  }
                `}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-[linear-gradient(135deg,#f1f5f9_0%,#e2e8f0_100%)] dark:bg-[radial-gradient(circle,#1e1b4b_0%,#030712_100%)] shrink-0 shadow-inner border border-black/5" />
                <span className="flex items-center gap-1">
                  {isActive && <span className="text-[10px] font-bold">✓</span>}
                  <span>Mặc định</span>
                </span>
              </button>
            );
          })}

          {/* Custom Background Color Picker */}
          <button
            onClick={triggerBgPicker}
            className={`
              flex items-center justify-center gap-2 px-3 py-2 rounded-full border cursor-pointer transition-all duration-150 text-xs font-semibold select-none
              ${bgType === 'custom' 
                ? 'border-primary! bg-primary/5 text-primary ring-1 ring-primary/30' 
                : 'bg-theme-demo-bg border-theme-demo-border text-theme-text-secondary hover:border-theme-border-hover hover:scale-[1.02]'
              }
            `}
          >
            <span 
              className="w-3.5 h-3.5 rounded-full bg-[conic-gradient(from_0deg,#ff5f56,#ffbd2e,#27c93f,#6366f1,#ff5f56)] shrink-0 shadow-inner border border-black/5"
              style={{
                backgroundColor: bgType === 'custom' ? bgCustomColor : undefined,
                backgroundImage: bgType === 'custom' ? 'none' : undefined
              }}
            />
            <span className="flex items-center gap-1">
              {bgType === 'custom' && <span className="text-[10px] font-bold">✓</span>}
              <span>Tự chọn</span>
            </span>
          </button>

          {/* Hidden Native Background Color Input */}
          <input
            type="color"
            ref={bgInputRef}
            value={bgCustomColor}
            onChange={(e) => setBgCustomColor(e.target.value)}
            className="sr-only"
          />
        </div>
        
        {bgType === 'custom' && (
          <div className="mt-2.5 flex items-center justify-between px-2.5 py-1.5 bg-theme-demo-bg border border-theme-demo-border rounded-lg">
            <span className="text-[11px] text-theme-text-secondary">Nền custom:</span>
            <span className="text-[11px] font-mono font-semibold uppercase text-theme-text-primary">{bgCustomColor}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button: Sun & Moon Morph */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-theme-demo-bg border border-theme-demo-border text-theme-text-primary hover:border-theme-border-hover hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer outline-none shadow-md overflow-hidden relative"
        title="Tùy chỉnh giao diện"
      >
        <div className="relative w-6 h-6 flex items-center justify-center pointer-events-none">
          {/* Sun icon */}
          <svg
            className={`absolute w-5 h-5 text-amber-500 transition-all duration-500 transform ${
              actualTheme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <circle cx="12" cy="12" r="5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          {/* Moon icon */}
          <svg
            className={`absolute w-5 h-5 text-indigo-400 transition-all duration-500 transform ${
              actualTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </div>
      </button>

      {/* Popover Settings Panel */}
      {isOpen && (
        mounted && isMobile 
          ? createPortal(panelContent, document.body) 
          : panelContent
      )}
    </div>
  );
}
