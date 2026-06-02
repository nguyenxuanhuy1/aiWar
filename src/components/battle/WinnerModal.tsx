import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Kingdom } from '@/types/battle';
import { Button } from '@/components/common/Button';
import { getKingdomColorStyles } from '@/utils/tileUtils';

interface WinnerModalProps {
  isOpen: boolean;
  winner?: Kingdom;
  onClose: () => void;
}

export function WinnerModal({ isOpen, winner, onClose }: WinnerModalProps) {
  if (!winner) return null;

  const colorStyles = getKingdomColorStyles(winner.name);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-lg bg-theme-card border border-theme-border p-8 rounded-none text-center overflow-hidden"
          >
            {/* Ambient Glow */}
            <div 
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full filter blur-[100px] pointer-events-none opacity-40"
              style={{ backgroundColor: colorStyles.main }}
            />

            {/* Crown/Trophy Icon Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-7xl mb-6 relative z-10 select-none inline-block filter drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]"
            >
              👑
            </motion.div>

            {/* Victory Title */}
            <h2 className="font-display text-3xl font-extrabold tracking-tight mb-2 uppercase text-yellow-500">
              VICTORY!
            </h2>
            
            <p className="text-sm text-theme-text-secondary mb-6">
              Trận chiến AI Kingdom Arena đã ngã ngũ
            </p>

            {/* Winner display card */}
            <div 
              className="p-6 rounded-none border border-white/5 bg-gray-950/50 mb-6 flex flex-col items-center justify-center gap-3"
              style={{ border: `1px solid ${colorStyles.main}` }}
            >
              <div 
                className="w-16 h-16 rounded-none flex items-center justify-center text-white font-extrabold text-2xl"
                style={{ 
                  backgroundColor: colorStyles.main
                }}
              >
                {winner.name.charAt(0).toUpperCase()}
              </div>
              
              <div>
                <h3 className="font-display text-xl font-bold text-theme-text-primary">
                  {winner.name}
                </h3>
                <p className="text-xs text-theme-text-muted mt-0.5">
                  Powered by {winner.model}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-4 border-t border-white/5">
                <div className="text-center">
                  <span className="text-[10px] text-theme-text-muted uppercase font-bold tracking-wider block">Điểm số</span>
                  <span className="text-lg font-black text-white">{winner.score}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-theme-text-muted uppercase font-bold tracking-wider block">Binh sĩ</span>
                  <span className="text-lg font-black text-white">{winner.soldiers}</span>
                </div>
              </div>
            </div>

            {/* Stats list */}
            <div className="grid grid-cols-3 gap-2 mb-8 text-xs text-left">
              <div className="bg-white/5 p-2.5 rounded-none border border-white/5">
                <span className="text-theme-text-muted block mb-0.5">Dân số:</span>
                <span className="font-bold text-theme-text-primary">{winner.population}</span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-none border border-white/5">
                <span className="text-theme-text-muted block mb-0.5">Lương nhu (Supplies):</span>
                <span className="font-bold text-theme-text-primary">{winner.supplies}</span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-none border border-white/5">
                <span className="text-theme-text-muted block mb-0.5">Vàng ròng:</span>
                <span className="font-bold text-theme-text-primary">{winner.gold}</span>
              </div>
            </div>

            <Button onClick={onClose} variant="primary" className="w-full">
              Quay lại Lobby 🏠
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
