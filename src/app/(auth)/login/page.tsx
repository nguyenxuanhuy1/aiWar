'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ThemeSettings } from '@/components/common/ThemeSettings';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Nếu người dùng đã đăng nhập, chuyển hướng ngay đến dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Vui lòng điền đầy đủ tài khoản và mật khẩu');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper autofill thông tin tài khoản demo
  const fillCredentials = (demoUsername: string) => {
    setUsername(demoUsername);
    setPassword('admin1');
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-bg">
        <div className="w-10 h-10 border-[3px] border-primary/10 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6 relative overflow-hidden bg-theme-bg text-theme-text-primary transition-colors duration-300">
      
      {/* Floating Appearance Settings Panel */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeSettings />
      </div>

      {/* Background Glowing Blurs (Softer in light mode) */}
      <div className="absolute top-[15%] left-[20%] w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(99,102,241,0.25)_0%,transparent_70%)] blur-[40px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[15%] right-[20%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(168,85,247,0.06)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(168,85,247,0.2)_0%,transparent_70%)] blur-[40px] pointer-events-none animate-pulse-glow" />
      
      <Card className="w-full max-w-[460px] z-10 animate-fade-in">
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="text-2xl [filter:drop-shadow(0_0_8px_rgba(99,102,241,0.5))]">🛡️</div>
            <span className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-theme-text-primary to-theme-text-muted bg-clip-text text-transparent">
              SecurePortal
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-2 text-theme-text-primary">Chào mừng trở lại</h1>
          <p className="text-sm text-theme-text-secondary leading-relaxed">Đăng nhập để kết nối với Spring Boot HTTP-only Cookie Backend</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 animate-[fadeIn_0.3s_ease-out]">
            <span className="text-lg shrink-0">⚠️</span>
            <span className="text-sm text-red-400 dark:text-red-300 leading-normal">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col">
          <Input
            label="Tên tài khoản (Username)"
            type="text"
            placeholder="Nhập tài khoản (vd: admin1)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isSubmitting}
            required
          />

          <Input
            label="Mật khẩu"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />

          <Button 
            type="submit" 
            size="lg" 
            isLoading={isSubmitting} 
            className="w-full mt-2.5 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary"
          >
            Đăng nhập
          </Button>
        </form>

        <div className="flex items-center my-6 text-xs text-theme-text-muted uppercase tracking-widest before:flex-1 before:border-t before:border-theme-divider before:mr-3 after:flex-1 after:border-t after:border-theme-divider after:ml-3">
          <span>Tài khoản thử nghiệm</span>
        </div>

        <div className="flex flex-col gap-2.5 mb-4">
          <button 
            type="button" 
            onClick={() => fillCredentials('admin1')}
            className="font-sans text-xs text-theme-text-secondary bg-theme-demo-bg border border-theme-demo-border rounded-xl p-3 text-left transition-all duration-200 hover:bg-primary/8 hover:border-primary/20 hover:text-theme-text-primary hover:translate-x-1 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            disabled={isSubmitting}
          >
            <strong className="text-primary mr-1.5">Admin:</strong> username là `admin1`
          </button>
        </div>
      </Card>
    </div>
  );
}
