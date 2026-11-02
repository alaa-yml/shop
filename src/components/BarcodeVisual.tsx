import React from 'react';
import { getBarcodePattern } from '../utils/format';

interface BarcodeVisualProps {
  code: string;
  height?: number;
  showText?: boolean;
  className?: string;
}

export const BarcodeVisual: React.FC<BarcodeVisualProps> = ({
  code,
  height = 42,
  showText = true,
  className = ''
}) => {
  const pattern = getBarcodePattern(code);
  let currentX = 10;
  const bars: { x: number; width: number; fill: boolean }[] = [];

  pattern.forEach((w, idx) => {
    const isBlack = idx % 2 === 0;
    bars.push({
      x: currentX,
      width: Math.max(1.2, w * 1.4),
      fill: isBlack
    });
    currentX += Math.max(1.2, w * 1.4);
  });

  const totalWidth = currentX + 10;

  return (
    <div className={`flex flex-col items-center bg-white p-2 rounded-md border border-slate-200 dark:border-slate-800 ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full h-auto max-h-12"
        preserveAspectRatio="none"
      >
        {bars.map((bar, i) =>
          bar.fill ? (
            <rect
              key={i}
              x={bar.x}
              y={2}
              width={bar.width}
              height={height - (showText ? 14 : 4)}
              fill="#0f172a"
            />
          ) : null
        )}
      </svg>
      {showText && (
        <span className="text-[11px] font-mono tracking-widest text-slate-700 dark:text-slate-300 mt-1">
          {code}
        </span>
      )}
    </div>
  );
};
