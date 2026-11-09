
import React, { forwardRef } from 'react';

interface PlayheadProps {
  zoom: number;
  sidebarWidth: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}

// We use forwardRef to allow direct DOM manipulation for smooth 60fps animation
export const Playhead = React.memo(forwardRef<HTMLDivElement, PlayheadProps>(({ zoom, sidebarWidth, onMouseDown, onTouchStart }, ref) => {
  return (
    <div 
      ref={ref}
      className="absolute top-0 bottom-0 z-[100] will-change-transform group touch-none"
      style={{ left: `${sidebarWidth}px` }} // Initial offset based on dynamic sidebar width
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        onTouchStart(e);
      }}
    >
      {/* Invisible Hit Area for easier grabbing */}
      <div className="absolute top-0 bottom-0 -left-4 -right-4 bg-transparent cursor-ew-resize hover:bg-white/5" />
      
      {/* Visual Line */}
      <div className="absolute top-0 bottom-0 left-0 w-px bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)] pointer-events-none" />
      
      {/* Top Handle / Triangle */}
      <div className="absolute -top-0 -translate-x-1/2 w-6 h-6 cursor-ew-resize transition-transform">
         <svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 15L2 9V1H14V9L8 15Z" fill="#EF4444"/>
         </svg>
      </div>
    </div>
  );
}));
