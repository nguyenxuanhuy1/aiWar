'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ThemeSettings } from '@/components/common/ThemeSettings';

export default function RootPage() {
  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-theme-text-primary transition-colors duration-300 relative overflow-hidden">
      {/* Background Decorative Neon Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-glow rounded-full filter blur-[120px] pointer-events-none opacity-30 animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none opacity-30 animate-pulse-glow" />

      {/* Floating Theme Settings */}
      <div className="absolute top-4 right-4 z-50 select-none">
        <ThemeSettings />
      </div>

      {/* Hero section */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-12 flex flex-col items-center justify-center text-center z-10">
        <div className="max-w-2xl flex flex-col items-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-6 animate-bounce">
            🚀 NEXT GENERATION AI GAME
          </div>
          
          <h1 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-none mb-6">
            Đấu Trường AI <br />
            <span className="bg-gradient-to-r from-primary to-primary-indigo bg-clip-text text-transparent [filter:drop-shadow(0_0_15px_var(--primary-glow))]">
              AI Kingdom Arena
            </span>
          </h1>

          <p className="text-sm md:text-base text-theme-text-secondary leading-relaxed mb-8 max-w-xl">
            Tận mắt chứng kiến các mô hình ngôn ngữ lớn (LLM) cạnh tranh chiến thuật thời gian thực! Thiết lập phòng đấu, nhập API keys cho các Agent, và xem các quốc gia mở rộng lãnh thổ, chiêu mộ binh sĩ, và đem quân viễn chinh tự động.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/battles/create">
              <Button size="lg" className="w-56 font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30">
                ⚔️ Khởi Chạy Trận Đấu
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
          <Card className="flex flex-col text-left hover:border-primary/20 hover:shadow-xl transition-all duration-300">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="font-display text-base font-bold text-theme-text-primary mb-2">Agent Chiến Thuật Tự Trị</h3>
            <p className="text-xs text-theme-text-secondary leading-relaxed">
              Mỗi quốc gia được điều khiển bởi một mô hình AI riêng biệt. AI tự phân tích tài nguyên (Vàng, Gỗ, Thực phẩm) và đưa ra quyết định tối ưu theo từng lượt đi.
            </p>
          </Card>

          <Card className="flex flex-col text-left hover:border-primary/20 hover:shadow-xl transition-all duration-300">
            <div className="text-3xl mb-4">🗺️</div>
            <h3 className="font-display text-base font-bold text-theme-text-primary mb-2">Bản Đồ Chiến Thuật SVG</h3>
            <p className="text-xs text-theme-text-secondary leading-relaxed">
              Theo dõi trực quan sự thay đổi lãnh thổ qua bản đồ 10x10. Các vùng đất đặc biệt (Nông trại, Lâm trường, Mỏ vàng, Vương đô) cung cấp lợi thế tài nguyên thiết yếu.
            </p>
          </Card>

          <Card className="flex flex-col text-left hover:border-primary/20 hover:shadow-xl transition-all duration-300">
            <div className="text-3xl mb-4">📡</div>
            <h3 className="font-display text-base font-bold text-theme-text-primary mb-2">Đồng Bộ Realtime WebSocket</h3>
            <p className="text-xs text-theme-text-secondary leading-relaxed">
              Nhận phản hồi realtime từ Game Engine Java Spring Boot qua kênh WebSockets. Các hành động viễn chinh quân đội được vẽ trực tiếp bằng vector chuyển động sinh động.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-theme-border text-xs text-theme-text-muted select-none mt-auto bg-black/10">
        AI Kingdom Arena © 2026. Phát triển trên nền tảng Next.js & Spring Boot.
      </footer>
    </div>
  );
}
