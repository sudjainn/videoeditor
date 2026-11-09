import React, { forwardRef, useEffect, useCallback } from 'react';
import { Track, TrackType, Clip } from '../../types';

interface VideoRendererProps {
  tracks: Track[];
}

// Memoized individual clip component to prevent re-renders and ref detaching
const MediaClip = React.memo(({ clip, track, registerRef }: { clip: Clip, track: Track, registerRef: (id: string, el: HTMLElement | null) => void }) => {
  const commonStyle: React.CSSProperties = {
    opacity: 0, // Controlled by Player.tsx syncMedia
    mixBlendMode: (clip.properties.blendMode as any) || 'normal',
  };

  const isBlob = clip.source.startsWith('blob:');
  const corsProps = isBlob ? {} : { crossOrigin: 'anonymous' as const };

  if (track.type === TrackType.VIDEO) {
    return (
      <video
        ref={(el) => registerRef(clip.id, el)}
        src={clip.source}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-75"
        style={commonStyle}
        muted={track.isMuted ?? false}
        preload="auto"
        playsInline
        onError={(e) => console.error(`[VideoRenderer] Error playing clip ${clip.id}`, e)}
      />
    );
  }

  if (track.type === TrackType.IMAGE) {
    return (
      <img
        ref={(el) => registerRef(clip.id, el)}
        src={clip.source}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-75"
        style={commonStyle}
        alt={clip.name}
        {...corsProps}
        referrerPolicy="no-referrer"
        onError={(e) => console.error(`[VideoRenderer] Error loading image clip ${clip.id}`, e)}
      />
    );
  }

  if (track.type === TrackType.AUDIO || track.type === TrackType.VOICE) {
    return (
      <audio
        ref={(el) => registerRef(clip.id, el)}
        src={clip.source}
        preload="auto"
        muted={track.isMuted ?? false}
        {...corsProps}
        onError={(e) => console.error(`[VideoRenderer] Error playing audio/voice clip ${clip.id}`, e)}
      />
    );
  }

  return null;
});

export const VideoRenderer = React.memo(forwardRef<Record<string, HTMLVideoElement | HTMLAudioElement | HTMLImageElement>, VideoRendererProps>(({ tracks }, ref) => {
  
  // Stable ref callback
  const registerRef = useCallback((id: string, el: HTMLElement | null) => {
    if (ref && 'current' in ref && ref.current) {
       if (el) {
         (ref.current as any)[id] = el;
       } else {
         delete (ref.current as any)[id];
       }
    }
  }, [ref]);

  return (
    <>
      {tracks.map(track => {
        if (track.isHidden && track.type !== TrackType.AUDIO && track.type !== TrackType.VOICE) return null;
        if (track.type === TrackType.TEXT || track.type === TrackType.OBJECT || track.type === TrackType.IMAGE) return null; // Text, Objects, and Images handled by FabricOverlay

        return (track.clips || []).map(clip => (
          <MediaClip 
            key={clip.id}
            clip={clip} 
            track={track} 
            registerRef={registerRef} 
          />
        ));
      })}
    </>
  );
}));
