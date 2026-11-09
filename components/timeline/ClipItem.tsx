import React, { useRef } from "react";
import { Clip, TrackType, TransitionType } from "../../types";
import { Sparkles, ArrowLeftRight, RotateCw, Aperture, Maximize, GripHorizontal, Zap, Divide, ZoomIn, FlipHorizontal, Sun, AlertTriangle, Waves, Box as BoxIcon } from "lucide-react";

interface ClipItemProps {
  clip: Clip;
  trackType: TrackType;
  zoom: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdateClip: (id: string, updates: Partial<Clip>) => void;
  onOpenTransition?: (clipId: string, side: "in" | "out") => void;
}

export const ClipItem = React.memo<ClipItemProps>(
  ({
    clip,
    trackType,
    zoom,
    isSelected,
    onSelect,
    onUpdateClip,
    onOpenTransition,
  }) => {
    const itemRef = useRef<HTMLDivElement>(null);

    const safeLeft =
      Number.isFinite(clip.startOffset) && Number.isFinite(zoom)
        ? clip.startOffset * zoom
        : 0;
    const safeWidth =
      Number.isFinite(clip.duration) &&
      Number.isFinite(zoom) &&
      clip.duration > 0
        ? clip.duration * zoom
        : 0;

    const renderFilmstrip = () => {
      if (trackType !== TrackType.VIDEO || safeWidth < 20) return null;
      const thumbWidth = 70;
      const count = Math.ceil(safeWidth / thumbWidth);
      const thumbs = [];
      for (let i = 0; i < count; i++) {
        thumbs.push(
          <div
            key={i}
            className="w-[70px] h-full shrink-0 border-r border-white/20 overflow-hidden relative bg-black/40"
          >
            <video
              src={clip.source}
              className="w-full h-full object-cover opacity-60"
              preload="auto"
              muted
            />
          </div>
        );
      }
      return (
        <div className="absolute inset-0 flex overflow-hidden pointer-events-none rounded-md z-0 opacity-100">
          {thumbs}
        </div>
      );
    };

    const getTransitionIcon = (type?: TransitionType) => {
      switch (type) {
        case "fade":
          return <Sparkles size={15} className="text-black" />;
        case "swirl":
          return <RotateCw size={15} className="text-black" />;
        case "wipe":
          return <ArrowLeftRight size={15} className="text-black" />;
        case "radial":
          return <Aperture size={15} className="text-black" />;
        case "zoom_cinematic":
          return <Maximize size={15} className="text-black" />;
        case "blinds":
          return <GripHorizontal size={15} className="text-black" />;
        case "flash":
          return <Zap size={15} className="text-black" />;
        case "push":
          return <Divide size={15} className="text-black" />;
        case "dissolve":
          return <AlertTriangle size={15} className="text-black" />;
        case "leak_flash":
          return <Sun size={15} className="text-black" />;
        case "wave_warp":
          return <Waves size={15} className="text-black" />;
        case "spin_blur":
          return <RotateCw size={15} className="text-black" />;
        case "cube_spin":
          return <BoxIcon size={15} className="text-black" />;
        case "shake_zoom":
          return <ZoomIn size={15} className="text-black" />;
        case "flipside":
          return <FlipHorizontal size={15} className="text-black" />;
        default:
          return <div className="w-[1px] h-2.5 bg-black" />;
      }
    };

    const handleStart = (
      clientX: number,
      type: "move" | "trim-left" | "trim-right"
    ) => {
      onSelect(clip.id);
      const startX = clientX;
      const originalStart = clip.startOffset;
      const originalDuration = clip.duration;
      const originalMediaStart = clip.mediaStartOffset;

      const handleMove = (moveClientX: number) => {
        const deltaX = moveClientX - startX;
        const deltaSeconds = deltaX / zoom;
        let newStart = originalStart;
        let newDuration = originalDuration;
        if (type === "move") {
          newStart = Math.max(0, originalStart + deltaSeconds);
        } else if (type === "trim-left") {
          const maxDelta = originalDuration - 0.1;
          const validDelta = Math.min(deltaSeconds, maxDelta);
          const limitLeft = -originalMediaStart;
          const finalDelta = Math.max(validDelta, limitLeft);
          newStart = originalStart + finalDelta;
          newDuration = originalDuration - finalDelta;
        } else if (type === "trim-right") {
          newDuration = Math.max(0.1, originalDuration + deltaSeconds);
        }
        if (itemRef.current) {
          if (type === "move" || type === "trim-left")
            itemRef.current.style.left = `${newStart * zoom}px`;
          if (type === "trim-left" || type === "trim-right")
            itemRef.current.style.width = `${newDuration * zoom}px`;
        }
      };

      const handleEnd = (endClientX: number) => {
        const deltaX = endClientX - startX;
        const deltaSeconds = deltaX / zoom;
        let updates: Partial<Clip> = {};
        if (type === "move")
          updates = { startOffset: Math.max(0, originalStart + deltaSeconds) };
        else if (type === "trim-left") {
          const finalDelta = Math.max(
            Math.min(deltaSeconds, originalDuration - 0.1),
            -originalMediaStart
          );
          updates = {
            startOffset: originalStart + finalDelta,
            duration: originalDuration - finalDelta,
            mediaStartOffset: originalMediaStart + finalDelta,
          };
        } else if (type === "trim-right")
          updates = {
            duration: Math.max(0.1, originalDuration + deltaSeconds),
          };
        onUpdateClip(clip.id, updates);
      };
      return { handleMove, handleEnd };
    };

    const onMouseDown = (
      e: React.MouseEvent,
      type: "move" | "trim-left" | "trim-right"
    ) => {
      e.stopPropagation();
      const { handleMove, handleEnd } = handleStart(e.clientX, type);
      const onMouseMove = (ev: MouseEvent) => {
        ev.preventDefault();
        handleMove(ev.clientX);
      };
      const onMouseUp = (ev: MouseEvent) => {
        handleEnd(ev.clientX);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const TransitionHandle = ({ side }: { side: "in" | "out" }) => {
      if (trackType !== TrackType.VIDEO) return null;
      const type =
        side === "in"
          ? clip.properties.transitionIn
          : clip.properties.transitionOut;
      return (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onOpenTransition?.(clip.id, side);
          }}
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-sm shadow-md flex items-center justify-center cursor-pointer z-40 border border-gray-300 hover:scale-110 transition-transform ${
            side === "in" ? "left-6" : "right-6"
          }`}
        >
          {getTransitionIcon(type)}
        </div>
      );
    };

    const onTouchStart = (e: React.TouchEvent, type: 'move' | 'trim-left' | 'trim-right') => {
      e.stopPropagation();
      // passive: false is critical to prevent scrolling while dragging
      const { handleMove, handleEnd } = handleStart(e.touches[0].clientX, type);
      
      const onTouchMove = (ev: TouchEvent) => {
          ev.preventDefault(); // Stop scrolling
          handleMove(ev.touches[0].clientX);
      };
      const onTouchEnd = (ev: TouchEvent) => {
          // Use changedTouches for the end position
          handleEnd(ev.changedTouches[0].clientX);
          document.removeEventListener('touchmove', onTouchMove);
          document.removeEventListener('touchend', onTouchEnd);
      };
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    };

    return (
      <div
        ref={itemRef}
        onMouseDown={(e) => onMouseDown(e, "move")}
        onTouchStart={(e) => onTouchStart(e, 'move')}
        className={`absolute top-1 bottom-1 rounded-md overflow-hidden cursor-pointer border-2 transition-colors group select-none touch-none
        ${
          isSelected
            ? "!border-white z-20 shadow-lg ring-1 ring-black/20"
            : "border-transparent z-10 opacity-100"
        }
        ${trackType === TrackType.VIDEO ? "bg-blue-900 border-blue-500" : ""}
        ${
          trackType === TrackType.AUDIO
            ? "bg-emerald-900 border-emerald-700"
            : ""
        }
        ${trackType === TrackType.TEXT ? "bg-purple-900 border-purple-700" : ""}
        ${trackType === TrackType.IMAGE ? "bg-pink-900 border-pink-700" : ""}
        ${
          trackType === TrackType.OBJECT
            ? "bg-orange-900 border-orange-700"
            : ""
        }
        ${
          trackType === TrackType.VOICE ? "bg-yellow-600 border-yellow-500" : ""
        }
      `}
        style={{ left: `${safeLeft}px`, width: `${safeWidth}px` }}
      >
        {renderFilmstrip()}
        <TransitionHandle side="in" />
        <TransitionHandle side="out" />
        <div className="absolute inset-0 px-2 py-1 text-xs text-white truncate font-medium flex items-center h-full select-none pointer-events-none drop-shadow-md z-10">
          <span className="bg-black/30 px-1 rounded backdrop-blur-sm">
            {clip.name}
          </span>
        </div>
        <div
          onMouseDown={(e) => onMouseDown(e, "trim-left")}
          onTouchStart={(e) => onTouchStart(e, 'trim-left')}
          className="absolute left-0 top-0 bottom-0 w-6 cursor-w-resize z-30 flex items-center justify-center group/handle hover:bg-white/20 transition-colors touch-none"
        >
          <div className="w-1.5 h-6 bg-white/50 rounded-full group-hover/handle:bg-white shadow-sm" />
        </div>
        <div
          onMouseDown={(e) => onMouseDown(e, "trim-right")}
          onTouchStart={(e) => onTouchStart(e, 'trim-right')}
          className="absolute right-0 top-0 bottom-0 w-6 cursor-e-resize z-30 flex items-center justify-center group/handle hover:bg-white/20 transition-colors touch-none"
        >
          <div className="w-1.5 h-6 bg-white/50 rounded-full group-hover/handle:bg-white shadow-sm" />
        </div>
      </div>
    );
  }
);
