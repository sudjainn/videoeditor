
import React, { useMemo } from 'react';

interface RulerProps {
  duration: number;
  zoom: number;
}

export const Ruler = React.memo<RulerProps>(({ duration, zoom }) => {
  const markers = useMemo(() => {
    const items = [];
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    // Simplify for mobile: Just 1s intervals with dots
    const step = isMobile ? 1 : (zoom < 20 ? 5 : 1);
    const subStep = isMobile ? 1 : (zoom < 20 ? 1 : 0.2); 
    
    const stepsPerMain = Math.round(step / subStep);
    const totalSteps = Math.floor(duration / subStep);

    for (let j = 0; j <= totalSteps; j++) {
      const i = j * subStep;
      const isMain = (j % stepsPerMain === 0);
      
      // Label formatting
      let label = '';
      if (isMain) {
          const val = Math.round(i); // Use round to avoid floating point floor errors
          if (duration < 60 || isMobile) {
              // Just seconds: 1s, 2s
              label = `${val}s`;
          } else {
              // M:SS format
              const m = Math.floor(val / 60);
              const s = Math.floor(val % 60);
              label = `${m}:${s.toString().padStart(2, '0')}`;
          }
      }

      items.push(
        <div 
          key={j} 
          className={`absolute top-0 flex flex-col justify-end items-center select-none pointer-events-none text-gray-500`}
          style={{ 
              left: `${i * zoom}px`, 
              height: '100%',
              width: '1px', // virtual width
              transform: 'translateX(-50%)'
          }}
        >
          {isMain ? (
             <>
                {/* Dot */}
                <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600 mb-1"></div>
                {/* Label */}
                <span className="text-[10px] font-medium leading-none mb-1.5">{label}</span>
             </>
          ) : (
             !isMobile && <div className="w-px h-2 bg-gray-300 dark:bg-gray-700"></div>
          )}
        </div>
      );
    }
    return items;
  }, [duration, zoom]);

  return (
    <div className="relative h-full pointer-events-none overflow-hidden">
         {markers}
    </div>
  );
});
