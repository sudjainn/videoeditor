import React from "react";
import { Track, TrackType, Clip } from "../../types";
import {
  Video,
  Music,
  Type,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Shapes,
  Mic,
} from "lucide-react";
import { ClipItem } from "./ClipItem";

interface TrackListProps {
  tracks: Track[];
  zoom: number;
  selectedClipId: string | null;
  onSelectClip: (id: string | null) => void;
  onUpdateClip: (id: string, updates: Partial<Clip>) => void;
  onToggleTrackMute: (trackId: string) => void;
  onToggleTrackHide: (trackId: string) => void;
  onOpenTransition?: (clipId: string, side: "in" | "out") => void;
}

export const TrackList = React.memo<TrackListProps>(
  ({
    tracks,
    zoom,
    selectedClipId,
    onSelectClip,
    onUpdateClip,
    onToggleTrackMute,
    onToggleTrackHide,
    onOpenTransition,
  }) => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    const getTrackIcon = (type: TrackType) => {
      switch (type) {
        case TrackType.VIDEO:
          return <Video size={16} />;
        case TrackType.AUDIO:
          return <Music size={16} />;
        case TrackType.TEXT:
          return <Type size={16} />;
        case TrackType.IMAGE:
          return <ImageIcon size={16} />;
        case TrackType.OBJECT:
          return <Shapes size={16} />;
        case TrackType.VOICE:
          return <Mic size={16} />;
        default:
          return <Video size={16} />;
      }
    };

    const gridSpacing = zoom < 20 ? zoom * 10 : zoom < 50 ? zoom * 5 : zoom;

    return (
      <div className="flex flex-col min-w-full relative">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="flex h-[45px] border-b border-gray-200 dark:border-[#27272a] group"
          >
            <div
              className={`w-[120px] md:w-[200px] bg-white dark:bg-[#18181b] border-r border-gray-200 dark:border-[#27272a] flex gap-1 md:gap-2 justify-start px-2 md:px-3 shrink-0 ${
                isMobile ? "" : "sticky left-0 z-[110] shadow-lg"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 md:gap-2 text-gray-700 dark:text-gray-200 text-xs md:text-sm font-medium truncate">
                  {getTrackIcon(track.type)}
                  <span className="truncate">{track.name}</span>
                </div>
              </div>
              <div className="flex">
                {(track.type === TrackType.VIDEO ||
                  track.type === TrackType.AUDIO ||
                  track.type === TrackType.VOICE) && (
                  <button
                    onClick={() => onToggleTrackMute(track.id)}
                    className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 ${
                      track.isMuted ? "text-red-500" : "text-gray-500"
                    }`}
                  >
                    {track.isMuted ? (
                      <VolumeX size={14} />
                    ) : (
                      <Volume2 size={14} />
                    )}
                  </button>
                )}
                {(track.type === TrackType.VIDEO ||
                  track.type === TrackType.IMAGE ||
                  track.type === TrackType.TEXT ||
                  track.type === TrackType.OBJECT) && (
                  <button
                    onClick={() => onToggleTrackHide(track.id)}
                    className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 ${
                      track.isHidden ? "text-red-500" : "text-gray-500"
                    }`}
                  >
                    {track.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>

            <div className="relative flex-1 bg-gray-50 dark:bg-[#09090b]">
              <div
                className="absolute inset-0 w-full h-full pointer-events-none opacity-10 dark:opacity-10"
                style={{
                  backgroundImage: `linear-gradient(90deg, #3f3f46 1px, transparent 1px)`,
                  backgroundSize: `${gridSpacing}px 100%`,
                }}
              />
              {track.clips.map((clip) => (
                <ClipItem
                  key={clip.id}
                  clip={clip}
                  trackType={track.type}
                  zoom={zoom}
                  isSelected={selectedClipId === clip.id}
                  onSelect={onSelectClip}
                  onUpdateClip={onUpdateClip}
                  onOpenTransition={onOpenTransition}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
);
