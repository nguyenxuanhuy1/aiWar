import React from 'react';

interface WeatherEffectsProps {
  activeGlobalEffect: 'PLAGUE' | 'DISASTER' | null;
  mapHeight: number;
}

export function WeatherEffects({ activeGlobalEffect, mapHeight }: WeatherEffectsProps) {
  if (!activeGlobalEffect) return null;

  return (
    <>
      {activeGlobalEffect === 'DISASTER' && (
        <g pointerEvents="none">
          <rect
            x="-180"
            y="0"
            width="960"
            height={mapHeight}
            fill="rgba(15, 23, 42, 0.45)"
            className="animate-fade-in"
          />
          <g className="animate-storm-clouds" opacity="0.75">
            <text x="-120" y="45" fontSize="42" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' }}>☁️</text>
            <text x="80" y="30" fontSize="56" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' }}>🌧️</text>
            <text x="280" y="55" fontSize="48" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' }}>☁️</text>
            <text x="480" y="35" fontSize="52" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' }}>🌧️</text>
            <text x="680" y="50" fontSize="46" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' }}>☁️</text>
          </g>
          {Array.from({ length: 24 }).map((_, i) => {
            const rx = -180 + (i * 45) + (i % 3) * 10;
            const ryStart = -80 - (i % 4) * 40;
            const dur = 0.55 + (i % 5) * 0.08;
            return (
              <line
                key={`rain-${i}`}
                x1={rx}
                y1={ryStart}
                x2={rx - 15}
                y2={ryStart + 50}
                stroke="#a5f3fc"
                strokeWidth="1.2"
                strokeOpacity="0.65"
              >
                <animate
                  attributeName="y1"
                  from={ryStart}
                  to={mapHeight + 80}
                  dur={`${dur}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="y2"
                  from={ryStart + 50}
                  to={mapHeight + 130}
                  dur={`${dur}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="x1"
                  from={rx}
                  to={rx - 150}
                  dur={`${dur}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="x2"
                  from={rx - 15}
                  to={rx - 165}
                  dur={`${dur}s`}
                  repeatCount="indefinite"
                />
              </line>
            );
          })}
        </g>
      )}

      {activeGlobalEffect === 'PLAGUE' && (
        <g pointerEvents="none">
          <rect
            x="-180"
            y="0"
            width="960"
            height={mapHeight}
            fill="rgba(34, 197, 94, 0.18)"
            className="animate-plague-pulse"
          />
          <g className="animate-plague-spores">
            <text x="-120" y="200" fontSize="26" opacity="0.5" className="animate-float-slow-1">🦠</text>
            <text x="40" y="100" fontSize="20" opacity="0.6" className="animate-float-slow-2">🦠</text>
            <text x="200" y="380" fontSize="24" opacity="0.5" className="animate-float-slow-3">🦠</text>
            <text x="420" y="160" fontSize="28" opacity="0.6" className="animate-float-slow-1">🦠</text>
            <text x="640" y="320" fontSize="22" opacity="0.5" className="animate-float-slow-2">🦠</text>
            <text x="780" y="120" fontSize="24" opacity="0.6" className="animate-float-slow-3">🦠</text>
          </g>
        </g>
      )}
    </>
  );
}
