
export const TrackType = {
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  OBJECT: 'OBJECT',
  VOICE: 'VOICE',
  VISUALIZER: 'VISUALIZER'
} as const;

export type TrackType = typeof TrackType[keyof typeof TrackType];

export type ExportFormat = 'webm' | 'mp4' | 'gif';

export interface LyricWord {
  word: string;
  time: number; // Offset in seconds relative to clip start
  chunkId?: number; // The paragraph/sentence block index this word belongs to
}

export type TransitionType = 'none' | 'fade' | 'swirl' | 'wipe' | 'radial' | 'zoom_cinematic' | 'blinds' | 'flash' | 'push' | 'dissolve' | 'leak_flash' | 'wave_warp' | 'spin_blur' | 'cube_spin' | 'shake_zoom' | 'flipside';

export interface LayerProperties {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  
  // Text Content & Font
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number; // 'bold', 'normal', 400, 700
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'linethrough';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  charSpacing?: number;
  lineHeight?: number;
  wordSpacing?: number;
  
  // Colors & Texture
  color?: string;
  textureImage?: string; // URL for pattern/texture
  
  // Background Styles
  backgroundStyle?: 'none' | 'block' | 'strip';
  backgroundColor?: string;
  backgroundPadding?: number;
  backgroundCornerRadius?: number; // New: Rounded corners
  backgroundOpacity?: number;      // New: Opacity 0-1

  // Media Specific
  volume?: number; // 0 to 1
  audioFadeIn?: number; // seconds
  audioFadeOut?: number; // seconds
  audioEffect?: string;

  // Transitions
  transitionIn?: TransitionType;
  transitionOut?: TransitionType;
  transitionInDuration?: number; // seconds
  transitionOutDuration?: number; // seconds
  
  // Lyrics Specific (For Audio Tracks)
  lyrics?: LyricWord[];
  lyricsStyle?: 'simple' | 'dynamic' | 'karaoke';
  lyricsAutoScroll?: boolean;
  lyricOffset?: number; // +/- seconds to shift lyrics
  lyricSpeed?: number;  // Multiplier to speed up/slow down text display (default 1)
  lyricHighlightColor?: string; // Color for the active word in karaoke mode
  
  // Transform
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  skewX?: number;
  skewY?: number;
  
  // Animation
  animation?: string;
  
  // Visual Effects
  blendMode?: 'normal' | 'screen' | 'multiply' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'difference';
  opacity?: number; // 0 to 1

  // Stroke / Border
  stroke?: string;
  strokeWidth?: number;

  // Shadow
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  // Object Specific
  colorOverrides?: Record<string, string>; // Map original color -> new color

  // Visualizer Specific
  visualizerType?: 'bars' | 'wave' | 'circle' | 'line' | 'dots' | 'mirror' | 'blocks';
  visualizerColor?: string;
  visualizerColor2?: string; // For gradient/alternate
  visualizerCount?: number;
  visualizerGap?: number;
  visualizerThickness?: number;
  visualizerRoundness?: number;
  visualizerSpeed?: number;
  visualizerLinkedTrackId?: string;
  customDuration?: number;
}

export interface Clip {
  id: string;
  name: string;
  startOffset: number; // Where in the timeline it starts (seconds)
  duration: number; // Length of the clip (seconds)
  mediaStartOffset: number; // Offset into the source media (trimming from start)
  source: string; // URL for media or identifier
  type: TrackType;
  properties: LayerProperties;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  clips: Clip[];
  isMuted?: boolean;
  isHidden?: boolean;
}

export interface CanvasSettings {
  width: number;
  height: number;
  backgroundColor: string;
}

export interface AppState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  tracks: Track[];
  selectedClipId: string | null;
  zoom: number; // Pixels per second
  isDragging: boolean;
  canvasSettings: CanvasSettings;
}