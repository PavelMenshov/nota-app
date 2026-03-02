'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const BUBBLE_COUNT = 6;
const BUBBLE_POSITIONS = [10, 25, 50, 65, 80, 90]; // left % for variety
const BUBBLE_DELAYS = [0, 0.15, 0.1, 0.25, 0.2, 0.05]; // staggered start

export interface HoverBubbleWrapProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  /** Bubble color - uses primary (green) by default */
  readonly bubbleColor?: string;
}

export function HoverBubbleWrap({
  children,
  className,
  bubbleColor = 'hsl(var(--primary) / 0.5)',
}: HoverBubbleWrapProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <span
      role="presentation"
      className={cn('relative inline-block', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Floating circles - only animate when hovered */}
      <span
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] [contain:strict]"
        aria-hidden
      >
        {Array.from({ length: BUBBLE_COUNT }, (_, i) => (
          <span
            key={i}
            className="absolute bottom-0 h-3 w-3 rounded-full"
            style={{
              left: `${BUBBLE_POSITIONS[i]}%`,
              background: bubbleColor,
              animation: hovered
                ? 'bubble-float 1.4s ease-out forwards'
                : 'none',
              animationDelay: hovered ? `${BUBBLE_DELAYS[i]}s` : undefined,
              opacity: hovered ? undefined : 0,
              transition: hovered ? undefined : 'opacity 0.25s ease-out',
            }}
          />
        ))}
      </span>
      {children}
    </span>
  );
}
