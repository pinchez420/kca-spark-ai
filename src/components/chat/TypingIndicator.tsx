import React from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div 
      className={cn("flex items-center gap-1 px-4 py-3 bg-card border border-border rounded-2xl w-fit", className)}
      role="status"
      aria-label="AI is typing"
    >
      <span className="sr-only">AI is typing</span>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{
            animationDelay: `${index * 0.15}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
}

export default TypingIndicator;

