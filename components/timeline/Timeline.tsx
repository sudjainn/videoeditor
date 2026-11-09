import React, { useRef, useEffect, useState } from "react";
import { Track, Clip } from "../../types";
import { Ruler } from "./Ruler";
import { TrackList } from "./TrackList";
import { Playhead } from "./Playhead";

interface TimelineProps {
  tracks: Track[];
  duration: number;
  zoom: number; // pixels per second
  onSeek: (time: number) => void;
  currentTime?: number;
  selectedClipId: string | null;
  onSelectClip: (id: string | null) => void;
  onUpdateClip: (id: string, updates: Partial<Clip>) => void;
  onToggleTrackMute: (trackId: string) => void;
  onToggleTrackHide: (trackId: string) => void;
  onPause: () => void;
  onZoomChange?: (newZoom: number) => void;
  onOpenTransition?: (clipId: string, side: "in" | "out") => void;
  playheadRef: React.RefObject<HTMLDivElement>;
}

export const Timeline = React.memo<TimelineProps>(
  ({
    tracks,
    duration,
    zoom,
    onSeek,
    currentTime = 0,
    selectedClipId,
    onSelectClip,
    onUpdateClip,
    onToggleTrackMute,
    onToggleTrackHide,
    onPause,
    onZoomChange,
    onOpenTransition,
    playheadRef,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
      null
    );
    const mouseDragRef = useRef<{ x: number; time: number } | null>(null);
    const pinchRef = useRef<{ dist: number; startZoom: number } | null>(null);
    const [windowWidth, setWindowWidth] = useState(
      typeof window !== "undefined" ? window.innerWidth : 1000
    );
    useEffect(() => {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const isMobile = windowWidth < 768;
    const sidebarWidth = isMobile ? 120 : 200;
    const totalWidth = duration * zoom;
    const fullContentWidth = sidebarWidth + totalWidth;
    const containerWidth = Math.max(fullContentWidth, windowWidth);

    const handleTouchStart = (e: React.TouchEvent) => {
      onPause();
      if (e.touches.length === 2 && onZoomChange) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchRef.current = { dist, startZoom: zoom };
        return;
      }
      if (e.touches.length === 1 && isMobile) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: currentTime,
        };
      } else if (!isMobile) updateTimeFromInput(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current && onZoomChange) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = dist / pinchRef.current.dist;
        onZoomChange(
          Math.min(200, Math.max(10, pinchRef.current.startZoom * scale))
        );
        return;
      }
      if (e.touches.length === 1 && touchStartRef.current && isMobile) {
        const deltaX = touchStartRef.current.x - e.touches[0].clientX;
        const deltaY = touchStartRef.current.y - e.touches[0].clientY;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (e.cancelable) e.preventDefault();
          onSeek(
            Math.max(
              0,
              Math.min(touchStartRef.current.time + deltaX / zoom, duration)
            )
          );
        }
      } else if (!isMobile && e.touches.length === 1) {
        if (e.cancelable) e.preventDefault();
        updateTimeFromInput(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      pinchRef.current = null;
      touchStartRef.current = null;
    };

    const updateTimeFromInput = (clientX: number) => {
      if (!containerRef.current || isMobile) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x =
        clientX - rect.left - sidebarWidth + containerRef.current.scrollLeft;
      onSeek(Math.max(0, Math.min(x / zoom, duration)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      onPause();
      if (isMobile) {
        mouseDragRef.current = { x: e.clientX, time: currentTime };
        e.preventDefault();
        const handleMouseMove = (mv: MouseEvent) => {
          if (mouseDragRef.current)
            onSeek(
              Math.max(
                0,
                Math.min(
                  mouseDragRef.current.time +
                    (mouseDragRef.current.x - mv.clientX) / zoom,
                  duration
                )
              )
            );
        };
        const handleMouseUp = () => {
          mouseDragRef.current = null;
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return;
      }
      updateTimeFromInput(e.clientX);
      const handleMouseMove = (mv: MouseEvent) => {
        mv.preventDefault();
        updateTimeFromInput(mv.clientX);
      };
      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const centerOffset = windowWidth / 2;
    const contentTranslate = isMobile
      ? centerOffset - sidebarWidth - currentTime * zoom
      : 0;

    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#09090b] select-none border-t border-gray-200 dark:border-[#27272a]">
        <div
          className={`flex-1 relative ${
            isMobile
              ? "overflow-x-hidden overflow-y-auto cursor-grab active:cursor-grabbing touch-pan-y"
              : "overflow-auto"
          }`}
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div
            className="relative min-h-full flex flex-col transition-transform duration-75 ease-linear will-change-transform"
            style={{
              width: isMobile ? `${containerWidth}px` : `${fullContentWidth}px`,
              minWidth: isMobile ? "0" : "100%",
              transform: isMobile
                ? `translateX(${contentTranslate}px)`
                : "none",
            }}
          >
            <div className="flex h-10 bg-transparent pointer-events-none">
              <div
                className={`${
                  isMobile
                    ? ""
                    : "sticky left-0 z-[120] shadow-sm pointer-events-auto"
                } top-0 h-full w-[120px] md:w-[200px] border-r border-b border-gray-200 dark:border-[#27272a] flex items-center px-2 md:px-4 bg-gray-50 dark:bg-[#18181b] shrink-0`}
              >
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
                  Tracks
                </span>
              </div>
              <div
                className={`relative flex-1 ${
                  isMobile ? "" : "sticky z-[90] pointer-events-auto"
                } top-0 border-b border-gray-200 dark:border-[#27272a] bg-gray-50 dark:bg-[#18181b]`}
                onMouseDown={!isMobile ? handleMouseDown : undefined}
              >
                <Ruler duration={duration} zoom={zoom} />
              </div>
            </div>
            {!isMobile && (
              <div
                className="absolute inset-0 z-0 top-10"
                onMouseDown={handleMouseDown}
              />
            )}
            <div className="relative flex-1">
              <TrackList
                tracks={tracks}
                zoom={zoom}
                selectedClipId={selectedClipId}
                onSelectClip={onSelectClip}
                onUpdateClip={onUpdateClip}
                onToggleTrackMute={onToggleTrackMute}
                onToggleTrackHide={onToggleTrackHide}
                onOpenTransition={onOpenTransition}
              />
            </div>
            {!isMobile && (
              <Playhead
                ref={playheadRef}
                zoom={zoom}
                sidebarWidth={sidebarWidth}
                onMouseDown={handleMouseDown}
                onTouchStart={() => {}}
              />
            )}
          </div>
        </div>
        {isMobile && (
          <div className="absolute inset-0 pointer-events-none z-[200] flex justify-center">
            <div className="w-[2px] h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] relative">
              <div className="absolute -top-0 -translate-x-1/2 w-4 h-4 text-red-500">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22L2 2h20l-10 20z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
