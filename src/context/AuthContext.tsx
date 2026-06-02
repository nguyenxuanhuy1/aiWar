'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthState, ApiResponse, AuthResponse } from '@/types/auth';
import { apiClient, setAccessToken, getAccessToken } from '@/lib/api-client';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const router = useRouter();

  // Hàm Đăng xuất
  const logout = useCallback(async () => {
    try {
      await apiClient('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Lỗi khi gọi API đăng xuất:', err);
    } finally {
      // Xóa thông tin auth trong bộ nhớ
      setAccessToken(null);
      setState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      router.push('/login');
    }
  }, [router]);

  // Kiểm tra phiên đăng nhập hiện tại bằng cách refresh token
  const checkSession = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      // Gọi API refresh để lấy Access Token mới từ HttpOnly Refresh Cookie
      const response = await fetch('/api/auth/refresh', { method: 'POST' });
      
      if (response.ok) {
        const apiRes: ApiResponse<AuthResponse> = await response.json();
        
        if (apiRes.success && apiRes.data?.token) {
          const token = apiRes.data.token;
          
          // Lưu access token vào memory của api-client
          setAccessToken(token);

          // Lấy thông tin user hiện tại qua endpoint /api/users/me của Spring Boot
          const userRes = await apiClient('/api/users/me');
          if (userRes.ok) {
            const userApiRes: ApiResponse<User> = await userRes.json();
            if (userApiRes.success && userApiRes.data) {
              setState({
                user: userApiRes.data,
                accessToken: token,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
          }
        }
      }
      
      // Nếu không refresh được hoặc token không hợp lệ
      setAccessToken(null);
      setState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Lỗi khi kiểm tra phiên làm việc:', error);
      setAccessToken(null);
      setState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  // Hàm Đăng nhập
  const login = useCallback(async (username: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const apiRes: ApiResponse<AuthResponse> = await res.json();

      if (!res.ok || !apiRes.success) {
        throw new Error(apiRes.message || 'Đăng nhập thất bại');
      }

      const token = apiRes.data.token;

      // Lưu token vào memory
      setAccessToken(token);

      // Vì api login của Spring Boot chỉ trả về Token, ta cần fetch thông tin user qua /api/users/me
      const userRes = await apiClient('/api/users/me');
      if (!userRes.ok) {
        throw new Error('Đăng nhập thành công nhưng không thể lấy thông tin người dùng.');
      }

      const userApiRes: ApiResponse<User> = await userRes.json();
      if (!userApiRes.success || !userApiRes.data) {
        throw new Error(userApiRes.message || 'Không thể lấy thông tin người dùng.');
      }

      setState({
        user: userApiRes.data,
        accessToken: token,
        isAuthenticated: true,
        isLoading: false,
      });

      router.push('/dashboard');
    } catch (error: any) {
      setState((prev) => ({ ...prev, isLoading: false }));
      // Đảm bảo xóa token cũ trong memory nếu có lỗi xảy ra
      setAccessToken(null);
      throw error;
    }
  }, [router]);

  // Theo dõi sự kiện logout từ API client (hết hạn refresh token)
  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    
    // Chạy kiểm tra phiên làm việc lần đầu tiên khi app load
    checkSession();

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [checkSession, logout]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
}
