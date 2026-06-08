import React from 'react';
import { Dialogue, Kingdom } from '@/types/battle';

interface DialogueOverlayProps {
  activeDialogue: Dialogue | null;
  kingdoms: Kingdom[];
}

export function DialogueOverlay({ activeDialogue, kingdoms }: DialogueOverlayProps) {
  if (!activeDialogue) return null;

  const senderIndex = kingdoms.findIndex(k => k.id === activeDialogue.senderId);
  
  let positionClasses = "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-novel-slide-up-center"; // default center
  if (senderIndex === 0) {
    positionClasses = "top-4 left-4 animate-novel-slide-up-corner";
  } else if (senderIndex === 1) {
    positionClasses = "top-4 right-4 animate-novel-slide-up-corner";
  } else if (senderIndex === 2) {
    positionClasses = "bottom-4 left-4 animate-novel-slide-up-corner";
  } else if (senderIndex === 3) {
    positionClasses = "bottom-4 right-4 animate-novel-slide-up-corner";
  }

  const senderColor = activeDialogue.senderColor || '#06b6d4';
  const receiverColor = activeDialogue.receiverColor || '#ec4899';

  return (
    <div 
      className={`absolute ${positionClasses} w-[90%] sm:w-[350px] bg-slate-950/15 backdrop-blur-md border-2 rounded-none p-3 z-40 flex flex-col gap-2.5 select-none`}
      style={{
        borderColor: senderColor,
        boxShadow: `0 0 15px ${senderColor}30`
      }}
    >
      {/* Hologram Scanner Effect with custom color */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_94%,var(--scanner-color-1)_95%,var(--scanner-color-2)_98%,rgba(18,24,38,0)_99%)] bg-[length:100%_40px] animate-hologram-scan pointer-events-none" 
        style={{
          '--scanner-color-1': `${senderColor}10`,
          '--scanner-color-2': `${senderColor}20`
        } as React.CSSProperties}
      />

      {/* Head-to-Head Avatars Row */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 z-10">
        {/* Left: Sender */}
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center border-2 relative"
            style={{
              borderColor: senderColor,
              boxShadow: `0 0 8px ${senderColor}`,
              background: `${senderColor}15`
            }}
          >
            <span className="text-xl select-none animate-pulse">👑</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black tracking-wide truncate max-w-[90px]" style={{ color: senderColor }}>
              {activeDialogue.senderName}
            </span>
            <span className="text-[7px] text-gray-400 font-mono truncate max-w-[90px]">
              {activeDialogue.senderModel}
            </span>
          </div>
        </div>

        {/* Center: Action Indicator */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <span className="text-xl select-none animate-bounce">
            {activeDialogue.type === 'ATTACK' ? '⚔️' : 
             activeDialogue.type === 'DIPLOMACY' ? '🤝' : 
             activeDialogue.type === 'DISASTER' ? (activeDialogue.message.includes('dịch') ? '🦠' : '🌪️') : '🚩'}
          </span>
          <span className="text-[7px] font-extrabold px-1 py-0.2 uppercase border bg-slate-900 tracking-wider" style={{ color: senderColor, borderColor: `${senderColor}40` }}>
            {activeDialogue.type}
          </span>
        </div>

        {/* Right: Receiver or soldiers */}
        {activeDialogue.receiverName ? (
          <div className="flex items-center gap-2 flex-row-reverse">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center border-2 relative"
              style={{
                borderColor: receiverColor,
                boxShadow: `0 0 8px ${receiverColor}`,
                background: `${receiverColor}15`
              }}
            >
              <span className="text-xl select-none animate-pulse">
                {activeDialogue.type === 'ATTACK' ? '🛡️' : '🤝'}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-black tracking-wide truncate max-w-[90px]" style={{ color: receiverColor }}>
                {activeDialogue.receiverName}
              </span>
              <span className="text-[7px] text-gray-400 font-mono truncate max-w-[90px]">
                {activeDialogue.receiverModel}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-row-reverse">
            <div className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-600 bg-slate-800/30 relative">
              <span className="text-xl select-none animate-pulse">💂</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-black tracking-wide text-gray-300">
                {activeDialogue.type === 'DISASTER' ? 'Quân Sĩ' : 'Binh Lính'}
              </span>
              <span className="text-[7px] text-gray-400 font-mono">
                Vương quốc
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dialogue Speech Bubbles */}
      <div className="flex flex-col gap-2 min-w-0 z-10 text-left">
        {/* Sender message */}
        <div className="bg-slate-950/20 border border-white/10 p-2 rounded-none relative animate-dialog-line-1">
          <div className="text-[8px] uppercase tracking-wider font-extrabold mb-0.5" style={{ color: senderColor }}>
            {activeDialogue.senderName}
          </div>
          <p className="text-xs text-gray-100 leading-relaxed font-sans font-semibold">
            &ldquo;{activeDialogue.message}&rdquo;
          </p>
        </div>

        {/* Reply/Receiver message */}
        {activeDialogue.replyMessage && (
          <div className="bg-slate-950/20 border border-white/10 p-2 rounded-none relative animate-dialog-line-2 self-end w-[95%]">
            <div className="text-[8px] uppercase tracking-wider font-extrabold mb-0.5 text-right" style={{ color: activeDialogue.receiverName ? receiverColor : '#9ca3af' }}>
              {activeDialogue.receiverName || (activeDialogue.type === 'DISASTER' ? 'Binh sĩ' : 'Quân sư')}
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans font-medium text-right italic">
              &ldquo;{activeDialogue.replyMessage}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
