'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ThemeSettings } from '@/components/common/ThemeSettings';
import { apiClient, getAccessToken, setAccessToken } from '@/lib/api-client';

interface LogItem {
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
  time: string;
}

// Giải mã JWT để lấy thời gian hết hạn (exp) thực tế
const getJwtExp = (token: string | null): number | null => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Giải mã Base64Url phần payload
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    return payload.exp ? payload.exp * 1000 : null; // exp ở dạng giây, chuyển sang miligiây
  } catch (e) {
    console.error('Lỗi khi giải mã JWT:', e);
    return null;
  }
};

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentInfo, setCurrentInfo] = useState<any>(null);
  const [tokenDisplay, setTokenDisplay] = useState<string | null>(null);
  const [tokenTimeLeft, setTokenTimeLeft] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isCallingApi, setIsCallingApi] = useState(false);
  const router = useRouter();
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const expTimeRef = useRef<number | null>(null);

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Bảo vệ route phía client
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    
    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  // Đồng bộ access token hiển thị và bộ đếm thời gian
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialToken = getAccessToken();
    setTokenDisplay(initialToken);
    
    const initialExp = getJwtExp(initialToken);
    expTimeRef.current = initialExp;

    const handleTokenChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const token = customEvent.detail;
      setTokenDisplay(token);
      
      const exp = getJwtExp(token);
      expTimeRef.current = exp;
    };

    const handleNewLog = (e: Event) => {
      const customEvent = e as CustomEvent;
      setLogs((prev) => [...prev, customEvent.detail]);
    };

    window.addEventListener('auth:token-changed', handleTokenChange);
    window.addEventListener('api:log', handleNewLog);
    
    // Log khởi tạo
    setLogs([
      {
        message: '🖥️ Đã kết nối với Spring Boot Authentication System.',
        type: 'info',
        time: new Date().toLocaleTimeString(),
      },
      {
        message: '🍪 Trình duyệt sẽ tự động lưu cookie `refresh_token` do backend trả về với cờ HttpOnly.',
        type: 'success',
        time: new Date().toLocaleTimeString(),
      }
    ]);

    return () => {
      window.removeEventListener('auth:token-changed', handleTokenChange);
      window.removeEventListener('api:log', handleNewLog);
    };
  }, []);

  // Bộ đếm lùi thời gian sống của Access Token dựa trên thời gian thực tế từ JWT
  useEffect(() => {
    const timer = setInterval(() => {
      if (expTimeRef.current) {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((expTimeRef.current - now) / 1000));
        setTokenTimeLeft(diff);
      } else {
        setTokenTimeLeft(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Tự động cuộn xuống cuối terminal log
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const callProtectedApi = async () => {
    setIsCallingApi(true);
    try {
      const res = await apiClient('/api/users/me');
      if (res.ok) {
        const apiRes = await res.json();
        if (apiRes.success) {
          setCurrentInfo(apiRes.data);
        } else {
          setCurrentInfo(null);
        }
      } else {
        setCurrentInfo(null);
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsCallingApi(false);
    }
  };

  // Giả lập làm mất Access Token trong Memory (Client) để kiểm tra luồng refresh
  const clearAccessTokenInMemory = () => {
    setAccessToken(null);
    setLogs((prev) => [
      ...prev,
      {
        message: '🗑️ Đã xóa Access Token trong Bộ nhớ Client (Memory)! Request tiếp theo sẽ bắt buộc phải kích hoạt refresh.',
        type: 'warn',
        time: new Date().toLocaleTimeString(),
      }
    ]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogColorClass = (type: 'info' | 'success' | 'warn' | 'error') => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'warn': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-bg">
        <div className="w-10 h-10 border-[3px] border-primary/10 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-theme-text-primary transition-colors duration-300">
      <header className="flex items-center justify-between px-8 py-4 bg-theme-card backdrop-blur-md border-b border-theme-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="text-2xl [filter:drop-shadow(0_0_8px_var(--primary-glow))]">🛡️</div>
          <span className="font-display text-lg font-extrabold tracking-tight">SecurePortal</span>
        </div>
        <div className="flex items-center gap-3">
          
          {/* Appearance Settings Panel */}
          <div className="mr-1">
            <ThemeSettings />
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-theme-demo-bg border border-transparent hover:border-theme-demo-border transition-all duration-200 cursor-pointer outline-none select-none text-left"
            >
              <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center font-bold text-sm shadow-[0_0_10px_var(--primary-glow)]">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col pr-2">
                <span className="text-xs font-bold text-theme-text-primary leading-tight">{user.username}</span>
                <span className="text-[10px] text-theme-text-muted leading-tight">{user.role}</span>
              </div>
              <span className={`text-[9px] text-theme-text-muted pr-1 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Dropdown Menu */}
            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-56 bg-theme-card-opaque border border-theme-border shadow-2xl rounded-2xl p-2 z-[100] animate-fade-in text-left">
                {/* User Info Header in Dropdown */}
                <div className="px-3 py-2 border-b border-theme-divider mb-1.5">
                  <p className="text-xs font-bold text-theme-text-primary truncate">{user.username}</p>
                  <p className="text-[10px] text-theme-text-muted truncate mt-0.5">{user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}</p>
                </div>

                {/* Account details placeholder menu items */}
                <button
                  onClick={() => {
                    alert('Tính năng Hồ sơ cá nhân đang được phát triển!');
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-demo-bg transition-colors duration-150 text-left cursor-pointer outline-none border-none"
                >
                  <span>👤</span>
                  <span>Hồ sơ cá nhân</span>
                </button>

                <button
                  onClick={() => {
                    alert('Tính năng Cài đặt tài khoản đang được phát triển!');
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-demo-bg transition-colors duration-150 text-left cursor-pointer outline-none border-none"
                >
                  <span>⚙️</span>
                  <span>Cài đặt tài khoản</span>
                </button>

                <div className="border-t border-theme-divider my-1.5" />

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setIsUserDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors duration-150 text-left cursor-pointer outline-none border-none"
                >
                  <span>➡️</span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1400px] w-full mx-auto animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Thông tin cấu hình và Token */}
          <Card className="h-full flex flex-col">
            <h2 className="font-display text-lg font-bold text-theme-text-primary mb-5 flex items-center gap-2">Thông tin Authentication (Memory)</h2>
            <div className="flex justify-between items-center py-3 border-b border-theme-divider">
              <span className="text-sm text-theme-text-secondary">Tài khoản:</span>
              <span className="text-sm font-medium text-theme-text-primary">{user.username}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-theme-divider">
              <span className="text-sm text-theme-text-secondary">Quyền hạn:</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                user.role === 'ADMIN' 
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30' 
                  : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30'
              }`}>
                {user.role}
              </span>
            </div>
            {user.createdAt && (
              <div className="flex justify-between items-center py-3 border-b border-theme-divider">
                <span className="text-sm text-theme-text-secondary">Ngày tạo:</span>
                <span className="text-sm font-medium text-theme-text-primary">{new Date(user.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            )}
            
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-theme-text-secondary">Access Token (Trong Memory):</span>
                {tokenTimeLeft !== null && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    tokenTimeLeft === 0 
                      ? 'text-red-500! bg-red-500/10! animate-pulse' 
                      : 'text-cyan-glow bg-cyan-500/10'
                  }`}>
                    {tokenTimeLeft > 0 ? `Hết hạn sau: ${tokenTimeLeft}s` : 'Đã hết hạn!'}
                  </span>
                )}
              </div>
              <div className="bg-theme-input-bg border border-theme-input-border rounded-xl p-4 max-h-[120px] overflow-y-auto relative">
                {tokenDisplay ? (
                  <code className="font-mono text-[11px] text-cyan-glow break-all whitespace-pre-wrap leading-normal">{tokenDisplay}</code>
                ) : (
                  <span className="text-sm text-theme-text-muted italic">Trống (Null - Chưa có token trong memory)</span>
                )}
              </div>
              <p className="text-[11px] text-theme-text-muted leading-normal mt-2.5">
                * Access Token được lưu ở biến cục bộ Javascript (Memory). Khi bạn reload trang (F5), biến này sẽ bị mất, hệ thống sẽ tự động gọi refresh token từ cookie.
              </p>
            </div>
          </Card>

          {/* Card 2: Hành động thử nghiệm */}
          <Card className="h-full flex flex-col">
            <h2 className="font-display text-lg font-bold text-theme-text-primary mb-5 flex items-center gap-2">Kích hoạt & Giả lập các kịch bản</h2>
            <p className="text-sm text-theme-text-secondary leading-relaxed mb-6">
              Bấm các nút dưới đây để kiểm chứng cách hệ thống bắt lỗi 401/403 và tự động dùng HTTP-only cookie để cấp mới token.
            </p>
            
            <div className="flex flex-col gap-3 mb-6">
              <Button onClick={callProtectedApi} isLoading={isCallingApi} className="w-full">
                🔍 Gửi API Bảo Mật (/api/users/me)
              </Button>

              <Button onClick={clearAccessTokenInMemory} variant="secondary" className="w-full">
                🗑️ Xóa Access Token trong Memory
              </Button>
            </div>

            {currentInfo && (
              <div className="mt-auto">
                <span className="text-xs text-theme-text-secondary block mb-2">Kết quả API `/me` trả về:</span>
                <pre className="bg-theme-input-bg border border-theme-input-border rounded-xl p-4 font-mono text-xs text-green-600 dark:text-green-400 overflow-x-auto">
                  {JSON.stringify(currentInfo, null, 2)}
                </pre>
              </div>
            )}
          </Card>

          {/* Card 3: Network Console Terminal (Giữ nguyên tối) */}
          <Card className="md:col-span-2 p-0! flex flex-col h-[380px] overflow-hidden bg-gray-950 border-white/5 hover:border-primary/35 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_24px_rgba(99,102,241,0.05)]!">
            <div className="flex justify-between items-center px-5 py-3 bg-[#0b0f19] border-b border-white/5 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full inline-block bg-[#ff5f56]" />
                <span className="w-3 h-3 rounded-full inline-block bg-[#ffbd2e]" />
                <span className="w-3 h-3 rounded-full inline-block bg-[#27c93f]" />
                <span className="font-mono text-xs font-bold text-gray-400 ml-2">Network Activity Console (BFF Interceptor)</span>
              </div>
              <button onClick={clearLogs} className="font-sans bg-transparent border-none text-gray-500 cursor-pointer text-xs transition-colors duration-150 hover:text-gray-200 outline-none">
                Dọn console 🗑️
              </button>
            </div>
            
            <div className="bg-gray-950 flex-1 p-5 font-mono text-xs overflow-y-auto rounded-b-2xl flex flex-col gap-2">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center mt-10 italic">Console trống. Hãy thực hiện hành động để xem log...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 leading-relaxed animate-[fadeIn_0.15s_ease-out]">
                    <span className="text-gray-500 shrink-0">[{log.time}]</span>
                    <span className={`break-all ${getLogColorClass(log.type)}`}>{log.message}</span>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
