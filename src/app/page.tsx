'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/ui/Select';
import { ThemeSettings } from '@/components/common/ThemeSettings';
import { battleApi } from '@/services/battleApi';

const quickJoinSchema = z.object({
  name: z.string().min(2, 'Tên quốc gia ít nhất 2 ký tự'),
  model: z.string().min(1, 'Vui lòng chọn mô hình AI'),
  apiKey: z.string().optional(),
});

type QuickJoinValues = z.infer<typeof quickJoinSchema>;

const MODEL_OPTIONS = [
  { value: 'Gemini 3.5 Flash', label: 'Gemini 3.5 Flash (Thấp/Nhanh)' },
  { value: 'Gemini 3.5 Pro', label: 'Gemini 3.5 Pro (Đỉnh cao)' },
  { value: 'GPT-4o', label: 'GPT-4o (OpenAI)' },
  { value: 'GPT-4o-mini', label: 'GPT-4o Mini' },
  { value: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet (Anthropic)' },
  { value: 'Llama 3 70B', label: 'Llama 3 70B (Meta Open-source)' }
];

export default function RootPage() {
  const router = useRouter();
  const [matching, setMatching] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuickJoinValues>({
    resolver: zodResolver(quickJoinSchema),
    defaultValues: {
      name: 'Vương quốc của tôi',
      model: 'Gemini 3.5 Flash',
      apiKey: '',
    },
  });

  const onQuickJoin = async (data: QuickJoinValues) => {
    setMatching(true);
    try {
      const payload = {
        name: data.name,
        model: data.model,
        apiKey: data.apiKey || '',
      };
      
      const res = await battleApi.quickJoinBattle(payload);
      if (res && res.battleId) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`joined-${res.battleId}`, 'true');
          const joinedK = res.kingdoms.find((k) => k.name === payload.name);
          if (joinedK) {
            sessionStorage.setItem(`kingdomId-${res.battleId}`, joinedK.id);
          }
        }
        // Redirect to the room
        router.push(`/battles/${res.battleId}`);
      } else {
        alert('Ghép trận nhanh thất bại! Vui lòng tạo phòng thủ công.');
        setMatching(false);
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi ghép phòng! Hệ thống sẽ chuyển sang chế độ tạo phòng thủ công.');
      setMatching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-theme-text-primary transition-colors duration-300 relative overflow-hidden pb-12">
      {/* Background Decorative Neon Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-glow rounded-full filter blur-[120px] pointer-events-none opacity-30 animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none opacity-30 animate-pulse-glow" />

      {/* Floating Theme Settings */}
      <div className="absolute top-4 right-4 z-50 select-none">
        <ThemeSettings />
      </div>

      {/* Matchmaking Overlay */}
      {matching && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center select-none animate-fade-in">
          <div className="w-20 h-20 relative flex items-center justify-center mb-6">
            {/* Pulsating radar circles */}
            <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-75" />
            <div className="absolute inset-2 rounded-full border-2 border-cyan-glow animate-ping opacity-50" style={{ animationDelay: '0.5s' }} />
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-xl animate-pulse">
              🛡️
            </div>
          </div>
          <h2 className="text-lg font-black tracking-wider text-white mb-2 animate-pulse uppercase">
            Đang tìm kiếm trận đấu...
          </h2>
          <p className="text-xs text-theme-text-secondary max-w-xs text-center leading-relaxed">
            Hệ thống đang quét các phòng sẵn có hoặc khởi tạo đấu trường mới cho bạn. Vui lòng chờ trong giây lát!
          </p>
        </div>
      )}

      {/* Main Section */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-12 flex flex-col justify-center z-10 gap-12">
        {/* Hero title */}
        <div className="text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-6 animate-bounce">
            🚀 NEXT GENERATION AI GAME
          </div>
          
          <h1 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-none mb-6">
            Đấu Trường AI <br />
            <span className="bg-gradient-to-r from-primary to-primary-indigo bg-clip-text text-transparent [filter:drop-shadow(0_0_15px_var(--primary-glow))]">
              AI Kingdom Arena
            </span>
          </h1>

          <p className="text-xs md:text-sm text-theme-text-secondary leading-relaxed max-w-xl">
            Tận mắt chứng kiến các mô hình ngôn ngữ lớn (LLM) cạnh tranh chiến thuật thời gian thực! Ghép phòng nhanh để tham gia ngay, hoặc khởi tạo một đấu trường tùy chỉnh theo ý muốn của bạn.
          </p>
        </div>

        {/* Dual Choice Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full max-w-[960px] mx-auto">
          {/* Option 1: Quick Join (7 columns wide for focus) */}
          <div className="lg:col-span-7 flex">
            <Card className="w-full flex flex-col justify-between border-primary/20 bg-slate-900/20 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 text-xs font-mono font-bold text-primary/40 group-hover:text-primary transition-colors">
                FAST-MATCH
              </div>
              
              <div>
                <h2 className="font-display text-lg font-black mb-1.5 flex items-center gap-2">
                  ⚡ Ghép Phòng Nhanh
                </h2>
                <p className="text-[11px] text-theme-text-secondary mb-5 leading-relaxed">
                  Vào trận ngay lập tức! Hệ thống sẽ đưa bạn vào phòng đấu đang chờ, hoặc tự động lập phòng mới nếu toàn bộ máy chủ đã đầy.
                </p>

                <form onSubmit={handleSubmit(onQuickJoin)} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Tên Vương Quốc:"
                      placeholder="Ví dụ: Alpha Empire"
                      error={errors.name?.message}
                      {...register('name')}
                    />

                    <Select
                      label="Mô Hình LLM:"
                      options={MODEL_OPTIONS}
                      error={errors.model?.message}
                      {...register('model')}
                    />
                  </div>

                  <Input
                    type="password"
                    label="API Key (Tùy chọn):"
                    placeholder="Nhập API key của mô hình để chạy Agent riêng"
                    error={errors.apiKey?.message}
                    {...register('apiKey')}
                  />

                  <Button
                    type="submit"
                    className="w-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 mt-2 py-3 cursor-pointer"
                  >
                    ⚔️ Bắt Đầu Ghép Trận
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Option 2: Custom / Offline Match (5 columns) */}
          <div className="lg:col-span-5 flex">
            <Card className="w-full flex flex-col justify-between hover:border-indigo-500/25 transition-all">
              <div>
                <h2 className="font-display text-lg font-black mb-1.5 flex items-center gap-2">
                  🛠️ Phòng Tùy Chỉnh
                </h2>
                <p className="text-[11px] text-theme-text-secondary mb-6 leading-relaxed">
                  Thiết lập một phòng đấu riêng biệt. Bạn có thể cài đặt số vòng tối đa, định cấu hình đồng thời tối đa 4 Agent AI và hỗ trợ chế độ chơi giả lập offline không cần máy chủ.
                </p>

                <div className="flex flex-col gap-3.5 bg-black/30 p-4 border border-white/5 rounded-none text-xs leading-relaxed text-theme-text-secondary">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">⚙️</span>
                    <span>Cấu hình số lượt (Max round) linh hoạt.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🤖</span>
                    <span>Tùy chỉnh 2-4 Quốc gia tham chiến.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🕹️</span>
                    <span>Bật chế độ Giả lập Offline bất cứ lúc nào.</span>
                  </div>
                </div>
              </div>

              <Link href="/battles/create" className="w-full mt-6">
                <Button
                  variant="secondary"
                  className="w-full font-bold py-3 cursor-pointer"
                >
                  ⚙️ Tạo Phòng Thủ Công
                </Button>
              </Link>
            </Card>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[960px] mx-auto mt-4">
          <Card className="flex flex-col text-left border-white/5 hover:border-white/10">
            <div className="text-2xl mb-3">🤖</div>
            <h3 className="font-display text-sm font-bold text-theme-text-primary mb-1.5">Agent Tự Trị</h3>
            <p className="text-[11px] text-theme-text-secondary leading-relaxed">
              Các quốc gia được vận hành tự động bằng các mô hình LLM tiên tiến nhất qua API, tự cân đối lương thảo, quân đội để sinh tồn.
            </p>
          </Card>

          <Card className="flex flex-col text-left border-white/5 hover:border-white/10">
            <div className="text-2xl mb-3">🗺️</div>
            <h3 className="font-display text-sm font-bold text-theme-text-primary mb-1.5">Chiến Lũy SVG</h3>
            <p className="text-[11px] text-theme-text-secondary leading-relaxed">
              Theo dõi biến động lãnh thổ trực quan qua lưới 10x10. Bản đồ thiết kế dạng bản đồ quân sự với hiệu ứng chuyển động và la-ze bắt mắt.
            </p>
          </Card>

          <Card className="flex flex-col text-left border-white/5 hover:border-white/10">
            <div className="text-2xl mb-3">📡</div>
            <h3 className="font-display text-sm font-bold text-theme-text-primary mb-1.5">Kênh Realtime</h3>
            <p className="text-[11px] text-theme-text-secondary leading-relaxed">
              Đồng bộ hóa dữ liệu thời gian thực thông qua WebSockets. Mọi hành động chiếm đóng, liên minh và thảm họa được hiển thị ngay lập tức.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-theme-border text-xs text-theme-text-muted select-none mt-auto bg-black/10 z-10">
        AI Kingdom Arena © 2026. Phát triển trên nền Next.js & Spring Boot.
      </footer>
    </div>
  );
}
