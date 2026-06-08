'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/ui/Select';
import { ThemeSettings } from '@/components/common/ThemeSettings';
import { battleApi } from '@/services/battleApi';
import { useBattleStore } from '@/stores/battleStore';

// Form validation schema with Zod
const kingdomSchema = z.object({
  name: z.string().min(2, 'Tên quốc gia ít nhất 2 ký tự'),
  model: z.string().min(1, 'Vui lòng chọn mô hình AI'),
  apiKey: z.string().optional(),
});

const formSchema = z.object({
  maxRound: z.number().min(5, 'Số vòng tối thiểu là 5').max(200, 'Số vòng tối đa là 200'),
  kingdoms: z.array(kingdomSchema).min(1, 'Cần tối thiểu 1 vương quốc').max(4, 'Chỉ hỗ trợ tối đa 4 vương quốc'),
});

type FormValues = z.infer<typeof formSchema>;

const MODEL_OPTIONS = [
  { value: 'Gemini 3.5 Flash', label: 'Gemini 3.5 Flash (Thấp/Nhanh)' },
  { value: 'Gemini 3.5 Pro', label: 'Gemini 3.5 Pro (Đỉnh cao)' },
  { value: 'GPT-4o', label: 'GPT-4o (OpenAI)' },
  { value: 'GPT-4o-mini', label: 'GPT-4o Mini' },
  { value: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet (Anthropic)' },
  { value: 'Llama 3 70B', label: 'Llama 3 70B (Meta Open-source)' }
];

const PRESETS = [
  { name: 'Alpha Empire', model: 'Gemini 3.5 Pro' },
  { name: 'Beta Dynasty', model: 'GPT-4o' },
  { name: 'Gamma Republic', model: 'Claude 3.5 Sonnet' },
  { name: 'Delta Union', model: 'Llama 3 70B' },
  { name: 'Omega Legion', model: 'Gemini 3.5 Flash' },
];

export default function CreateBattlePage() {
  const router = useRouter();
  const [isOfflineSim, setIsOfflineSim] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startLocalSimulation = useBattleStore((state) => state.startLocalSimulation);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      maxRound: 30,
      kingdoms: [
        { name: 'Alpha Empire', model: 'Gemini 3.5 Pro', apiKey: '' },
        { name: 'Beta Dynasty', model: 'GPT-4o', apiKey: '' },
        { name: 'Gamma Republic', model: 'Claude 3.5 Sonnet', apiKey: '' },
        { name: 'Delta Union', model: 'Llama 3 70B', apiKey: '' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'kingdoms',
  });

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      if (isOfflineSim) {
        // Local simulation path: initialize Zustand and direct to /battles/sim
        startLocalSimulation(data.maxRound, data.kingdoms);
        router.push('/battles/simulation-arena');
      } else {
        // API path
        const payload = {
          maxRound: data.maxRound,
          kingdoms: data.kingdoms.map((k) => ({
            name: k.name,
            model: k.model,
            apiKey: k.apiKey || '',
          })),
        };
        const res = await battleApi.createBattle(payload);
        if (res && res.battleId) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`joined-${res.battleId}`, 'true');
            sessionStorage.setItem(`kingdomId-${res.battleId}`, 'k-1');
          }
          router.push(`/battles/${res.battleId}`);
        } else {
          alert('Tạo phòng đấu thất bại! Bạn có muốn bật chế độ Mô phỏng Offline không?');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ! Hãy thử bật chế độ "Mô phỏng Offline".');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddKingdom = () => {
    if (fields.length < 4) {
      const preset = PRESETS[fields.length] || { name: `Kingdom ${fields.length + 1}`, model: 'Gemini 3.5 Flash' };
      append({ name: preset.name, model: preset.model, apiKey: '' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-theme-text-primary transition-colors duration-300 relative pb-12">
      {/* Decorative Glows */}
      <div className="absolute top-[-10%] left-[-15%] w-[40%] h-[40%] bg-primary-glow rounded-full filter blur-[120px] pointer-events-none opacity-20" />

      {/* Floating Theme Settings */}
      <div className="absolute top-4 right-4 z-50 select-none">
        <ThemeSettings />
      </div>

      {/* Main Form Area */}
      <main className="max-w-[800px] w-full mx-auto px-6 pt-12 z-10 flex-1">
        <h1 className="font-display text-3xl font-black tracking-tight mb-3">
          Thiết Lập Đấu Trường
        </h1>
        <p className="text-xs text-theme-text-muted mb-8 leading-relaxed">
          Định cấu hình các thông số về số lượt đấu và nạp các Agent AI tham chiến. Mỗi Agent AI sẽ đại diện cho một Vương quốc chiến đấu tranh giành bờ cõi.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Card 1: Cấu hình chung */}
          <Card className="flex flex-col gap-5">
            <h2 className="font-display text-base font-bold text-theme-text-primary border-b border-theme-divider pb-2.5 select-none">
              ⚙️ Thông Số Chung
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
              <div>
                <Input
                  type="number"
                  label="Số Vòng Đấu Tối Đa (Max Round):"
                  placeholder="Ví dụ: 30"
                  error={errors.maxRound?.message}
                  {...register('maxRound', { valueAsNumber: true })}
                />
              </div>

              {/* Mode Toggle Checkbox */}
              <div 
                onClick={() => setIsOfflineSim(!isOfflineSim)}
                className={`
                  flex items-center gap-3 p-3.5 rounded-none border cursor-pointer select-none transition-all duration-200
                  ${isOfflineSim 
                    ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' 
                    : 'bg-theme-input-bg border-theme-input-border text-theme-text-secondary hover:border-theme-border'
                  }
                `}
              >
                <div className="text-xl">🕹️</div>
                <div>
                  <div className="text-xs font-bold leading-tight">Mô phỏng Offline (Không cần backend)</div>
                  <div className="text-[10px] text-theme-text-muted mt-0.5">Hệ thống sẽ giả lập các Agent cục bộ tại browser</div>
                </div>
                <input
                  type="checkbox"
                  checked={isOfflineSim}
                  onChange={() => {}}
                  className="ml-auto pointer-events-none hidden"
                />
              </div>
            </div>
          </Card>

          {/* Card 2: Danh sách Kingdom */}
          <Card className="flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-theme-divider pb-2.5 select-none">
              <h2 className="font-display text-base font-bold text-theme-text-primary">
                🛡️ Thiết Lập Các Agent Vương Quốc ({fields.length}/4)
              </h2>
              {fields.length < 4 && (
                <Button 
                  type="button" 
                  onClick={handleAddKingdom} 
                  variant="secondary" 
                  size="sm"
                  className="font-bold cursor-pointer"
                >
                  ＋ Thêm Quốc Gia
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-6">
              {fields.map((field, idx) => {
                const colors = ['text-blue-400', 'text-red-400', 'text-green-400', 'text-purple-400', 'text-orange-400'];
                const colorClass = colors[idx % colors.length];

                return (
                  <div 
                    key={field.id}
                    className="p-5 rounded-none bg-gray-950/40 border border-white/5 relative flex flex-col gap-4.5 animate-[fadeIn_0.15s_ease-out]"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center select-none">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-red-500' : idx === 2 ? 'bg-green-500' : idx === 3 ? 'bg-purple-500' : 'bg-orange-500'}`} />
                        <span className={`text-xs font-black uppercase ${colorClass}`}>
                          Vương Quốc #{idx + 1}
                        </span>
                      </div>
                      
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          className="text-xs text-red-500 hover:text-red-400 transition-colors font-medium border-none bg-transparent cursor-pointer outline-none"
                        >
                          Xóa bỏ 🗑️
                        </button>
                      )}
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Tên Vương Quốc:"
                        placeholder="Ví dụ: Alpha Empire"
                        error={errors.kingdoms?.[idx]?.name?.message}
                        {...register(`kingdoms.${idx}.name` as const)}
                      />

                      <Select
                        label="Mô Hình LLM:"
                        options={MODEL_OPTIONS}
                        error={errors.kingdoms?.[idx]?.model?.message}
                        {...register(`kingdoms.${idx}.model` as const)}
                      />

                      <Input
                        type="password"
                        label="API Key (Tùy chọn):"
                        placeholder="Để trống nếu đã cài trên server"
                        error={errors.kingdoms?.[idx]?.apiKey?.message}
                        {...register(`kingdoms.${idx}.apiKey` as const)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Action Footer */}
          <div className="flex justify-end gap-3 mt-4 select-none">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/')}
              className="w-32 cursor-pointer font-bold"
            >
              Hủy Bỏ
            </Button>
            
            <Button
              type="submit"
              isLoading={submitting}
              className="w-56 font-bold shadow-lg"
            >
              {isOfflineSim ? '🕹️ Khởi Chạy Giả Lập' : '🚀 Tạo Phòng Đấu'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
