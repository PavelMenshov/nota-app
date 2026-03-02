'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/** Positions (left %, top %) and sizes for a calm scatter of bubbles */
const BUBBLES: { left: number; top: number; size: number; delay: number }[] = [
  { left: 5, top: 15, size: 12, delay: 0 },
  { left: 18, top: 70, size: 8, delay: 0.05 },
  { left: 25, top: 40, size: 14, delay: 0.1 },
  { left: 42, top: 85, size: 10, delay: 0.02 },
  { left: 55, top: 20, size: 16, delay: 0.08 },
  { left: 62, top: 55, size: 9, delay: 0.12 },
  { left: 78, top: 75, size: 11, delay: 0.03 },
  { left: 88, top: 35, size: 13, delay: 0.06 },
  { left: 12, top: 50, size: 10, delay: 0.04 },
  { left: 35, top: 10, size: 8, delay: 0.09 },
  { left: 70, top: 90, size: 12, delay: 0.01 },
  { left: 92, top: 60, size: 9, delay: 0.07 },
  { left: 8, top: 88, size: 11, delay: 0.11 },
  { left: 48, top: 45, size: 7, delay: 0.04 },
  { left: 75, top: 12, size: 14, delay: 0.1 },
];

export interface PageBackgroundBubblesProps {
  /** When true, bubbles float up slightly; when false, they sit back down */
  readonly active: boolean;
  readonly className?: string;
  /** Bubble fill - default primary green, subtle */
  readonly bubbleColor?: string;
}

export function PageBackgroundBubbles({
  active,
  className,
  bubbleColor = 'hsl(var(--primary) / 0.18)',
}: PageBackgroundBubblesProps) {
  return (
    <div
      role="presentation"
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-0 z-0',
        className
      )}
    >
      {BUBBLES.map((b) => (
        <div
          key={`${b.left}-${b.top}-${b.size}`}
          className="absolute rounded-full transition-transform duration-500 ease-out"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            width: b.size,
            height: b.size,
            background: bubbleColor,
            transform: active ? 'translateY(-20px)' : 'translateY(0)',
            transitionDelay: `${b.delay * 100}ms`,
          }}
        />
      ))}
    </div>
  );
}
