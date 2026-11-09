
import React, { useState, useEffect, useRef } from 'react';
import { ColorPickerButton } from '../components/InputGroups';
import { Clip, TrackType, LyricWord, TransitionType } from '../types';
import {
  X, Type, Move, Volume2, Layers,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline, Strikethrough,
  Music, Wand2, Clock, Scaling, Search, Palette, Sparkles, Image as ImageIcon,
  Mic, Cloud, Radio, Headphones, Waves, ArrowDown, Bot, Activity, Speaker, Cpu, Users, Wind, Zap, Triangle, Ban, Play, Square,
  ChevronDown, ChevronUp, MoreHorizontal, Check, Edit3, Type as TypeIcon, GripHorizontal, Box as BoxIcon,
  Maximize, RotateCw, ArrowLeftRight, Aperture, Ghost, Divide, ZoomIn, FlipHorizontal, Sun, AlertTriangle, PaletteIcon
} from 'lucide-react';
import { INSTAGRAM_FONTS, SYSTEM_FONTS, GOOGLE_FONTS_SANS, GOOGLE_FONTS_SERIF, GOOGLE_FONTS_DISPLAY, GOOGLE_FONTS_HANDWRITING, GOOGLE_FONTS_MONOSPACE } from '../utils/fontLibrary';

interface PropertiesPanelProps {
  clip: Clip | null;
  onUpdateClip: (clipId: string, updates: Partial<Clip>) => void;
  onDeleteClip: (clipId: string) => void;
  onClose: () => void;
  initialTab?: 'general' | 'transitions';
  initialTransitionSide?: 'in' | 'out';
}

export const ANIMATIONS = [
  { label: 'None', value: '' },
  { label: 'Typewriter', value: 'typewriter' },
  { label: 'Fade In', value: 'fadeIn' },
  { label: 'Pop (Strong)', value: 'pop' },
  { label: 'Jump (Bounce)', value: 'jump' },
  { label: 'Neon (Flicker)', value: 'flicker' },
  { label: 'Float', value: 'float' },
  { label: 'Slide Up', value: 'slideTop' },
  { label: 'Slide Down', value: 'slideBottom' },
  { label: 'Slide Left', value: 'slideLeft' },
  { label: 'Slide Right', value: 'slideRight' },
  { label: 'Zoom In', value: 'zoom' },
  { label: 'Emphasize', value: 'emphasize' },
  { label: 'Headline', value: 'headline' },
  { label: 'Fall', value: 'fall' },
];

export const STROKE_ANIMATIONS = [
  { label: 'None', value: '' },
  { label: 'Neon', value: 'neon' },
  { label: 'Halo', value: 'halo' },
  { label: 'Shimmer', value: 'shimmer' },
  { label: 'Digital', value: 'digital' },
  { label: 'Pixel Knockout', value: 'pixelKnockout' },
  { label: 'Stranger Things', value: 'strangerThings' },
];

const TEXTURES = [
  { name: 'None', url: '' },
  { name: 'Gold', url: 'https://spydersocial.com/files/assets/texture/gold-foil-texture-background_1194-7546.png' },
  { name: 'Silver', url: 'https://spydersocial.com/files/assets/texture/silver-texture-background_1194-7667.png' },
  { name: 'Grunge', url: 'https://spydersocial.com/files/assets/texture/grunge-paint-background_1104-160.png' },
  { name: 'Water', url: 'https://spydersocial.com/files/assets/texture/water-texture-background_1194-7346.png' }
];

const TRANSITIONS = [
  { label: 'None', value: 'none', icon: Ban },
  { label: 'Fade', value: 'fade', icon: Sparkles },
  { label: 'Swirl', value: 'swirl', icon: RotateCw },
  { label: 'Wipe', value: 'wipe', icon: ArrowLeftRight },
  { label: 'Radial', value: 'radial', icon: Aperture },
  { label: 'Zoom Cinematic', value: 'zoom_cinematic', icon: Maximize },
  { label: 'Blinds', value: 'blinds', icon: GripHorizontal },
  { label: 'Color Flash', value: 'flash', icon: Zap },
  { label: 'Side by Side Push', value: 'push', icon: Divide },
  { label: 'Glitch Dissolve', value: 'dissolve', icon: AlertTriangle },
  { label: 'Light Leak Flash', value: 'leak_flash', icon: Sun },
  { label: 'Wave Warp', value: 'wave_warp', icon: Waves },
  { label: 'Spin Blur', value: 'spin_blur', icon: RotateCw },
  { label: '3D Cube Spin', value: 'cube_spin', icon: BoxIcon },
  { label: 'Shake Zoom', value: 'shake_zoom', icon: ZoomIn },
  { label: 'Mirror Flipside', value: 'flipside', icon: FlipHorizontal },
];

const BLEND_MODES = [
  { label: 'Normal', value: 'normal' },
  { label: 'Screen (Black BG)', value: 'screen' },
  { label: 'Multiply (White BG)', value: 'multiply' },
  { label: 'Overlay', value: 'overlay' },
  { label: 'Lighten', value: 'lighten' },
  { label: 'Darken', value: 'darken' },
];

const AUDIO_EFFECTS = {
  music: [
    { id: 'none', label: 'None', icon: Ban },
    { id: 'dreamy', label: 'Dreamy', icon: Cloud },
    { id: 'radio', label: 'Radio', icon: Radio },
    { id: 'lofi', label: 'Lo-Fi', icon: Headphones },
    { id: 'underwater', label: 'Underwater', icon: Waves },
    { id: 'intercom', label: 'Intercom', icon: Mic },
  ],
  voice: [
    { id: 'none', label: 'None', icon: Ban },
    { id: 'low', label: 'Low', icon: ArrowDown },
    { id: 'android', label: 'Android', icon: Bot },
    { id: 'echo', label: 'Echo', icon: Activity },
    { id: 'stadium', label: 'Stadium', icon: Speaker },
    { id: 'machine', label: 'Machine', icon: Cpu },
  ],
  singing: [
    { id: 'harmonize', label: 'Harmonize', icon: Users },
    { id: 'surf', label: 'Surf', icon: Wind },
    { id: 'deepsynth', label: 'Deep Synth', icon: Zap },
    { id: 'angelic', label: 'Angelic', icon: Sparkles },
    { id: 'gritty', label: 'Gritty', icon: Triangle },
  ]
};

const PIXABAY_KEY = '42079516-87fed9c0356c38508f3230818';

// --- NEW ANIMATION VISUALS ---
const AnimIcon = ({ type, color = "currentColor" }: { type: string, color?: string }) => {
  const baseStyle = { stroke: color, strokeWidth: 2, fill: "none", strokeLinecap: "round" as "round", strokeLinejoin: "round" as "round" };
  switch (type) {
    case 'none': return <svg viewBox="0 0 24 24" width="24" height="24" {...baseStyle} stroke="#3b82f6"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>;
    case 'fade': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="50%" y="50%" dy="5" textAnchor="middle" fontSize="14" fill="#9ca3af" fontWeight="bold" opacity="0.3">Abc</text><text x="50%" y="50%" dy="5" textAnchor="middle" fontSize="14" fill={color} fontWeight="bold" opacity="1" className="animate-pulse">Abc</text></svg>);
    case 'slide': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="10" y="20" fontSize="14" fill={color} fontWeight="bold">Abc</text><path d="M5 25 L35 25" stroke={color} strokeWidth="2" opacity="0.3" /><path d="M30 22 L35 25 L30 28" fill="none" stroke={color} strokeWidth="2" /></svg>);
    case 'slide-top': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="25" textAnchor="middle" fontSize="14" fill={color} fontWeight="bold">Abc</text><path d="M20 25 L20 5" stroke={color} strokeWidth="2" opacity="0.3" /><path d="M17 8 L20 5 L23 8" fill="none" stroke={color} strokeWidth="2" /></svg>);
    case 'slide-bottom': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="10" textAnchor="middle" fontSize="14" fill={color} fontWeight="bold">Abc</text><path d="M20 5 L20 25" stroke={color} strokeWidth="2" opacity="0.3" /><path d="M17 22 L20 25 L23 22" fill="none" stroke={color} strokeWidth="2" /></svg>);
    case 'slide-right': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="10" y="20" fontSize="14" fill={color} fontWeight="bold">Abc</text><path d="M5 20 L35 20" stroke={color} strokeWidth="2" opacity="0.3" /><path d="M32 17 L35 20 L32 23" fill="none" stroke={color} strokeWidth="2" /></svg>);
    case 'block': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><rect x="5" y="5" width="30" height="20" fill="#e5e7eb" rx="2" /><text x="20" y="20" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold">Abc</text></svg>);
    case 'jump': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="20" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold">Abc</text><path d="M10 25 Q20 10 30 25" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" /></svg>);
    case 'flicker': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="20" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold" opacity="0.2">Abc</text><text x="20" y="20" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold" opacity="1">Abc</text><line x1="10" y1="10" x2="30" y2="10" stroke={color} strokeWidth="1" opacity="0.5" /></svg>);
    case 'emphasize': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="20" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold">Abc</text><circle cx="20" cy="18" r="10" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" /></svg>);
    case 'headline': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="15" textAnchor="middle" fontSize="14" fill={color} fontWeight="bold">Abc</text><line x1="10" y1="20" x2="30" y2="20" stroke={color} strokeWidth="2" /></svg>);
    case 'float': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="20" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold">Abc</text><path d="M10 25 Q20 15 30 25" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" /></svg>);
    case 'zoom-in': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="20" textAnchor="middle" fontSize="10" fill={color} fontWeight="bold">Abc</text><path d="M15 15 L25 25" stroke={color} strokeWidth="1.5" /><circle cx="25" cy="25" r="5" fill="none" stroke={color} strokeWidth="1.5" /></svg>);
    case 'typewriter': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="10" y="20" fontSize="14" fill={color} fontWeight="bold">Abc</text><line x1="36" y1="8" x2="36" y2="22" stroke={color} strokeWidth="2" /></svg>);
    case 'rise': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="15" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold">Abc</text><path d="M20 25 L20 18" stroke={color} strokeWidth="1.5" /><path d="M17 20 L20 17 L23 20" fill="none" stroke={color} strokeWidth="1.5" /></svg>);
    case 'pop': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="20" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold">Abc</text><line x1="20" y1="5" x2="20" y2="2" stroke={color} strokeWidth="1.5" /><line x1="10" y1="10" x2="7" y2="7" stroke={color} strokeWidth="1.5" /><line x1="30" y1="10" x2="33" y2="7" stroke={color} strokeWidth="1.5" /></svg>);
    case 'drop': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="25" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold">Abc</text><path d="M5 15 L10 15" stroke={color} strokeWidth="1.5" /><path d="M30 15 L35 15" stroke={color} strokeWidth="1.5" /><path d="M8 15 L8 25" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2 2" /><path d="M32 15 L32 25" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2 2" /></svg>);
    case 'compress': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="20" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold">Abc</text><path d="M5 20 L10 20" stroke={color} strokeWidth="2" markerEnd="url(#arrow)" /><path d="M35 20 L30 20" stroke={color} strokeWidth="2" /><path d="M10 17 L13 20 L10 23" fill="none" stroke={color} strokeWidth="1.5" /><path d="M30 17 L27 20 L30 23" fill="none" stroke={color} strokeWidth="1.5" /></svg>);
    case 'bounce': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="20" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold">Abc</text><path d="M20 25 Q25 25 25 20" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" /><path d="M20 25 Q15 25 15 20" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" /></svg>);
    case 'wave': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="18" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold">Abc</text><path d="M10 25 Q15 20 20 25 T30 25" fill="none" stroke={color} strokeWidth="1.5" /></svg>);
    case 'fall': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="15" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold" opacity="0.5">Abc</text><text x="20" y="28" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold">Abc</text><path d="M20 5 L20 10" stroke={color} strokeWidth="1.5" /><path d="M18 8 L20 10 L22 8" fill="none" stroke={color} strokeWidth="1.5" /></svg>);
    case 'skid': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="25" y="20" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold" style={{ fontStyle: 'italic' }}>Abc</text><path d="M5 22 L15 22" stroke={color} strokeWidth="1.5" opacity="0.5" strokeDasharray="2 1" /></svg>);
    case 'flipboard': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><rect x="10" y="10" width="20" height="15" fill="none" stroke={color} strokeWidth="1.5" /><path d="M20 8 L20 27" stroke={color} strokeWidth="1" strokeDasharray="2 1" /><path d="M32 12 Q35 17 32 22" fill="none" stroke={color} strokeWidth="1" /></svg>);
    case 'scale': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="20" textAnchor="middle" fontSize="10" fill={color} fontWeight="bold">Abc</text><path d="M5 25 L10 20" stroke={color} strokeWidth="1" /><path d="M35 5 L30 10" stroke={color} strokeWidth="1" /></svg>);
    case 'dragonfly': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="20" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold">Abc</text><path d="M10 10 L15 15" stroke={color} strokeWidth="1" /><path d="M30 10 L25 15" stroke={color} strokeWidth="1" /></svg>);
    case 'spin': return (<svg viewBox="0 0 40 30" width="100%" height="100%"><text x="20" y="20" textAnchor="middle" fontSize="12" fill={color} fontWeight="bold" style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: 'rotate(-15deg)' }}>Abc</text><path d="M15 25 Q20 30 25 25" fill="none" stroke={color} strokeWidth="1.5" /><path d="M25 25 L24 28" stroke={color} strokeWidth="1.5" /></svg>);
    default: return <text x="50%" y="50%" dy="5" textAnchor="middle" fontSize="12" fill={color}>Abc</text>;
  }
};

const ANIMATION_PRESETS = {
  in: [
    { id: 'none', label: 'None', icon: 'none', value: '' },
    { id: 'fade', label: 'Fade', icon: 'fade', value: 'fadeIn' },
    { id: 'slideTop', label: 'Slide Top', icon: 'slide-top', value: 'slideTop' },
    { id: 'slideBottom', label: 'Slide Bottom', icon: 'slide-bottom', value: 'slideBottom' },
    { id: 'slideLeft', label: 'Slide Left', icon: 'slide', value: 'slideLeft' },
    { id: 'slideRight', label: 'Slide Right', icon: 'slide-right', value: 'slideRight' },
    { id: 'block', label: 'Block', icon: 'block', value: 'block' },
    { id: 'jump', label: 'Jump', icon: 'jump', value: 'jump' },
    { id: 'flicker', label: 'Flicker', icon: 'flicker', value: 'flicker' },
    { id: 'emphasize', label: 'Emphasize', icon: 'emphasize', value: 'emphasize' },
    { id: 'headline', label: 'Headline', icon: 'headline', value: 'headline' },
    { id: 'float', label: 'Float', icon: 'float', value: 'float' },
    { id: 'zoom', label: 'Zoom In', icon: 'zoom-in', value: 'zoom' },
    { id: 'typewriter', label: 'Typewriter', icon: 'typewriter', value: 'typewriter' },
    { id: 'rise', label: 'Rise', icon: 'rise', value: 'rise' },
    { id: 'pop', label: 'Pop', icon: 'pop', value: 'pop' },
    { id: 'compress', label: 'Compress', icon: 'compress', value: 'compress' },
    { id: 'bounce', label: 'Bounce', icon: 'bounce', value: 'bounce' },
    { id: 'flipboard', label: 'Flipboard', icon: 'flipboard', value: 'flipboard' },
    { id: 'scale', label: 'Scale', icon: 'scale', value: 'scale' },
    { id: 'dragonfly', label: 'Dragonfly', icon: 'dragonfly', value: 'dragonfly' },
  ],
  out: [
    { id: 'none_out', label: 'None', icon: 'none', value: '' },
    // { id: 'fade_out', label: 'Fade', icon: 'fade', value: 'fadeOut' },
    { id: 'slide_out', label: 'Slide', icon: 'slide', value: 'slideOut' },
    { id: 'block_out', label: 'Block', icon: 'block', value: 'blockOut' },
    { id: 'zoom_out', label: 'Zoom Out', icon: 'scale', value: 'zoomOut' },
    { id: 'sink', label: 'Sink', icon: 'fall', value: 'sink' },
    { id: 'pop_out', label: 'Pop', icon: 'pop', value: 'popOut' },
    { id: 'drop', label: 'Drop', icon: 'drop', value: 'drop' },
    { id: 'decompress', label: 'Decompress', icon: 'compress', value: 'decompress' },
    { id: 'fall', label: 'Fall', icon: 'fall', value: 'fall' },
    { id: 'skid', label: 'Skid', icon: 'skid', value: 'skid' },
    { id: 'wave', label: 'Wave', icon: 'wave', value: 'wave' },
  ],
  loop: [
    { id: 'none_loop', label: 'None', icon: 'none', value: '' },
    { id: 'spin', label: 'Spin', icon: 'spin', value: 'spin' },
    { id: 'wave_loop', label: 'Wave', icon: 'wave', value: 'waveLoop' },
    { id: 'scale_loop', label: 'Scale', icon: 'scale', value: 'pulse' },
    { id: 'heartbeat', label: 'Heartbeat', icon: 'pop', value: 'heartbeat' },
    { id: 'vogue', label: 'Vogue', icon: 'flipboard', value: 'vogue' },
    { id: 'dragonfly_loop', label: 'Dragonfly', icon: 'dragonfly', value: 'dragonflyLoop' },
    { id: 'billboard', label: 'Billboard', icon: 'block', value: 'billboard' },
    { id: 'roll', label: 'Roll', icon: 'skid', value: 'roll' },
  ]
};

// --- UPDATED PRESETS TO SHOW BACKGROUNDS ---
const STYLE_PRESETS = [
  { id: 'default', svg: '', label: 'Plain', props: { color: '#000000', strokeWidth: 0, shadowColor: null, backgroundStyle: 'none' } },
  { id: 'white_outline', svg: '', label: 'Outline', props: { color: '#ffffff', stroke: '#000000', strokeWidth: 3, shadowColor: null, backgroundStyle: 'none' } },
  { id: 'shadow_hard', svg: '', label: 'Shadow', props: { color: '#ffffff', strokeWidth: 0, shadowColor: '#000000', shadowBlur: 0, shadowOffsetX: 3, shadowOffsetY: 3, backgroundStyle: 'none' } },
  { id: 'neon', svg: '', label: 'Neon', props: { color: '#ffffff', stroke: '#3b82f6', strokeWidth: 2, shadowColor: '#3b82f6', shadowBlur: 15, shadowOffsetX: 0, shadowOffsetY: 0, backgroundStyle: 'none' } },
  { id: 'black_box', svg: '', label: 'Black Box', props: { color: '#ffffff', backgroundStyle: 'block', backgroundColor: '#000000', backgroundCornerRadius: 20, backgroundOpacity: 1, shadowColor: null } },
  { id: 'white_box', svg: '', label: 'White Box', props: { color: '#000000', strokeWidth: 0, backgroundStyle: 'block', backgroundColor: '#ffffff', backgroundCornerRadius: 0, backgroundOpacity: 1, shadowColor: null, filter: null } },
  { id: 'subtitle', svg: '<svg viewBox="0 0 100 100" style="filter: drop-shadow(rgba(0, 0, 0, 0.298) -0.32px 0px 6.72px);"><text x="50" y="50" font-family="Roboto" font-weight="800" font-size="32" dominant-baseline="middle" text-anchor="middle" fill="none" stroke="#ffffff" stroke-width="8.96" stroke-linejoin="round" stroke-linecap="round">Abc</text><text x="50" y="50" font-family="Roboto" font-weight="800" font-size="32" dominant-baseline="middle" text-anchor="middle" fill="#000000">Abc</text></svg>', label: 'Subtitle', props: { color: '#000000', stroke: '#ffffff', strokeWidth: 20, backgroundStyle: 'none', backgroundCornerRadius: 4, backgroundOpacity: 1, shadowColor: null, filter: 'drop-shadow(rgba(0, 0, 0, 0.298) -0.32px 0px 6.72px)' } },
  { id: 'rounded_trans', svg: '<svg viewBox="0 0 100 100" style="filter: drop-shadow(rgba(86, 103, 245, 0.647) -0.32px 0px 8.96px);"><text x="50" y="50" font-family="Roboto" font-weight="800" font-size="32" dominant-baseline="middle" text-anchor="middle" fill="none" stroke="#5667F5" stroke-width="2.56" stroke-linejoin="round" stroke-linecap="round">Abc</text><text x="50" y="50" font-family="Roboto" font-weight="800" font-size="32" dominant-baseline="middle" text-anchor="middle" fill="#ffffff">Abc</text></svg>', label: 'Rounded', props: { color: '#ffffff', stroke: '#5667F5', strokeWidth: 4, backgroundStyle: 'none', backgroundOpacity: 1, shadowColor: '#5667F5', shadowBlur: 50, shadowOffsetX: 0, shadowOffsetY: 0 } },
  { id: 'strip', label: 'Strip', svg: '<svg viewBox="0 0 100 100" style="filter: drop-shadow(rgb(86, 103, 245) 2.71529px 2.71529px 0px);"><text x="50" y="50" font-family="Roboto" font-weight="800" font-size="32" dominant-baseline="middle" text-anchor="middle" fill="none" stroke="#5667F5" stroke-width="5.12" stroke-linejoin="round" stroke-linecap="round">Abc</text><text x="50" y="50" font-family="Roboto" font-weight="800" font-size="32" dominant-baseline="middle" text-anchor="middle" fill="#ffffff">Abc</text></svg>', props: { color: '#ffffff', stroke: '#5667F5', strokeWidth: 15, backgroundStyle: 'none', backgroundOpacity: 1, shadowColor: null } },
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  clip,
  onUpdateClip,
  onDeleteClip,
  onClose,
  initialTab = 'general',
  initialTransitionSide = 'in'
}) => {
  const [svgColors, setSvgColors] = useState<string[]>([]);
  const [rawLyrics, setRawLyrics] = useState('');
  const [customDuration, setCustomDuration] = useState<number>(0);
  const [activeEffectTab, setActiveEffectTab] = useState<'music' | 'voice' | 'singing'>('voice');
  const [animTab, setAnimTab] = useState<'in' | 'out' | 'loop'>('in');
  const [activePanelTab, setActivePanelTab] = useState<'general' | 'transitions' | 'animation'>(initialTab);
  const [activeSide, setActiveSide] = useState<'in' | 'out'>(initialTransitionSide);
  const [showShadowSettings, setShowShadowSettings] = useState(false);
  const shadowSettingsRef = useRef<HTMLDivElement>(null);
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Texture Search State
  const [textureQuery, setTextureQuery] = useState('');
  const [searchedTextures, setSearchedTextures] = useState<string[]>([]);
  const [isSearchingTextures, setIsSearchingTextures] = useState(false);

  // Audio Preview State
  const loadedFonts = new Set<string>();
  const previewAudioContextRef = useRef<AudioContext | null>(null);
  const previewAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    setActivePanelTab('general');
    return () => stopPreview();
  }, [clip?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setActivePicker(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setActivePanelTab(initialTab); }, [initialTab]);
  useEffect(() => { setActiveSide(initialTransitionSide); }, [initialTransitionSide]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shadowSettingsRef.current && !shadowSettingsRef.current.contains(event.target as Node)) {
        setShowShadowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const stopPreview = () => {
    if (previewAudioElementRef.current) {
      previewAudioElementRef.current.pause();
      previewAudioElementRef.current = null;
    }
    if (previewAudioContextRef.current) {
      previewAudioContextRef.current.close();
      previewAudioContextRef.current = null;
    }
    setIsPreviewing(false);
  };

  const playEffectPreview = async (effectId: string) => {
    stopPreview();
    if (!clip?.source) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      previewAudioContextRef.current = ctx;

      const audio = new Audio(clip.source);
      audio.crossOrigin = "anonymous";
      audio.volume = clip.properties.volume ?? 1;
      previewAudioElementRef.current = audio;

      // Simple pitch/rate simulation
      if (effectId === 'low') audio.playbackRate = 0.85;
      else if (effectId === 'android') audio.playbackRate = 0.9;
      else if (effectId === 'machine') audio.playbackRate = 1.1;
      else audio.playbackRate = 1.0;

      const source = ctx.createMediaElementSource(audio);
      let output: AudioNode = source;

      // Apply Effects Graph
      if (effectId === 'radio' || effectId === 'intercom' || effectId === 'gritty') {
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 400;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 3000;

        if (effectId === 'gritty') {
          const shaper = ctx.createWaveShaper();
          const curve = new Float32Array(44100);
          for (let i = 0; i < 44100; i++) {
            const x = (i * 2) / 44100 - 1;
            curve[i] = (Math.PI + 50) * x / (Math.PI + 50 * Math.abs(x));
          }
          shaper.curve = curve;
          source.connect(shaper);
          shaper.connect(hp);
        } else {
          source.connect(hp);
        }
        hp.connect(lp);
        output = lp;
      }
      else if (effectId === 'underwater' || effectId === 'dreamy' || effectId === 'angelic') {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = effectId === 'underwater' ? 300 : 800;
        source.connect(lp);
        output = lp;

        if (effectId === 'dreamy' || effectId === 'angelic') {
          const delay = ctx.createDelay();
          delay.delayTime.value = 0.4;
          const fb = ctx.createGain();
          fb.gain.value = 0.5;
          lp.connect(delay);
          delay.connect(fb);
          fb.connect(delay);
          delay.connect(ctx.destination);
        }
      }
      else if (effectId === 'echo') {
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.25;
        const fb = ctx.createGain();
        fb.gain.value = 0.4;
        source.connect(delay);
        delay.connect(fb);
        fb.connect(delay);
        delay.connect(ctx.destination);
        source.connect(ctx.destination);
        output = null as any;
      }
      else if (effectId === 'stadium' || effectId === 'surf') {
        const delay1 = ctx.createDelay(); delay1.delayTime.value = 0.1;
        const delay2 = ctx.createDelay(); delay2.delayTime.value = 0.3;
        const fb = ctx.createGain(); fb.gain.value = 0.3;
        source.connect(delay1); delay1.connect(fb); fb.connect(delay1);
        source.connect(delay2); delay2.connect(fb);
        delay1.connect(ctx.destination);
        delay2.connect(ctx.destination);
        source.connect(ctx.destination);
        output = null as any;
      }
      else if (effectId === 'android') {
        const osc = ctx.createOscillator();
        osc.frequency.value = 40;
        osc.start();
        const ringGain = ctx.createGain();
        ringGain.gain.value = 0;
        source.connect(ringGain);
        osc.connect(ringGain.gain);
        output = ringGain;
      }
      else if (effectId === 'harmonize') {
        const d1 = ctx.createDelay(); d1.delayTime.value = 0.03;
        const d2 = ctx.createDelay(); d2.delayTime.value = 0.05;
        source.connect(d1); d1.connect(ctx.destination);
        source.connect(d2); d2.connect(ctx.destination);
        source.connect(ctx.destination);
        output = null as any;
      }

      if (output) output.connect(ctx.destination);

      audio.onended = () => setIsPreviewing(false);
      await audio.play();
      setIsPreviewing(true);
    } catch (e) {
      console.error("Audio preview failed", e);
      setIsPreviewing(false);
    }
  };

  const handleEffectClick = (effectId: string) => {
    updateProps({ audioEffect: effectId });
    playEffectPreview(effectId);
  };

  useEffect(() => {
    if (clip?.type === TrackType.OBJECT && clip.source) {
      // Fetch SVG to find colors (lightweight parsing)
      fetch(clip.source)
        .then(res => res.text())
        .then(text => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'image/svg+xml');
          const fills = new Set<string>();
          const elements = doc.querySelectorAll('[fill]');
          elements.forEach(el => {
            const fill = el.getAttribute('fill');
            if (fill && fill !== 'none' && fill !== 'currentColor') {
              fills.add(fill);
            }
          });
          const styledElements = doc.querySelectorAll('[style*="fill"]');
          styledElements.forEach(el => {
            const style = el.getAttribute('style');
            const match = style?.match(/fill:\s*([^;]+)/);
            if (match && match[1] && match[1] !== 'none') {
              fills.add(match[1].trim());
            }
          });
          setSvgColors(Array.from(fills).slice(0, 8));
        })
        .catch(err => console.warn("Failed to parse SVG colors", err));
    } else {
      setSvgColors([]);
    }
  }, [clip?.id, clip?.source, clip?.type]);

  useEffect(() => {
    if (clip?.type === TrackType.AUDIO || clip?.type === TrackType.VOICE) {
      if (clip.properties.lyrics && clip.properties.lyrics.length > 0) {
        const lyrics = clip.properties.lyrics;
        let text = '';
        let currentChunk = lyrics[0].chunkId;

        lyrics.forEach((l, i) => {
          if (l.chunkId !== undefined && l.chunkId !== currentChunk) {
            text = text.trim() + '\n\n';
            currentChunk = l.chunkId;
          }
          text += l.word + ' ';
        });
        setRawLyrics(text.trim());
      }

      if(clip.properties.customDuration < 0 || clip.properties.customDuration === 0) {
        updateProps({ customDuration: parseFloat(clip.duration) || 0 })
      }
    } else {
      setRawLyrics('');
    }
  }, [clip?.id]);

  if (!clip) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#18181b] flex items-center justify-center mb-4">
          <Move className="w-8 h-8 opacity-50" />
        </div>
        <p className="text-sm">Select a clip on the timeline to edit its properties.</p>
      </div>
    );
  }

  if (!clip) return <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center"><div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#18181b] flex items-center justify-center mb-4"><Move className="w-8 h-8 opacity-50" /></div><p className="text-sm">Select a clip on the timeline to edit its properties.</p></div>;

  const updateProps = (props: Partial<Clip['properties']>) => onUpdateClip(clip.id, { properties: props });

  const isVisual = clip.type === TrackType.VIDEO || clip.type === TrackType.IMAGE || clip.type === TrackType.OBJECT || clip.type === TrackType.TEXT;
  const isAudio = clip.type === TrackType.AUDIO || clip.type === TrackType.VOICE || clip.type === TrackType.VIDEO;

  const handleColorOverride = (original: string, newColor: string) => {
    const overrides = { ...(clip.properties.colorOverrides || {}) };
    overrides[original] = newColor;
    updateProps({ colorOverrides: overrides });
  };

  const generateLyrics = () => {
    const dummyLyrics = "First paragraph here.\n\nSecond paragraph appears after.";
    setRawLyrics(dummyLyrics);
    syncLyricsToDuration(dummyLyrics);
  };

  const syncLyricsToDuration = (text: string) => {
    if (!text.trim()) {
      updateProps({ lyrics: [] });
      return;
    }
    const chunks = text.split(/\n+/).filter(line => line.trim().length > 0);
    const chunkWordCounts = chunks.map(chunk => chunk.trim().split(/\s+/).length);
    const totalWords = chunkWordCounts.reduce((a, b) => a + b, 0);
    const targetDuration = clip.properties.customDuration > 0 ? clip.properties.customDuration : clip.duration;
    const timePerWord = targetDuration / totalWords;
    const formattedLyrics: LyricWord[] = [];
    let currentTimeOffset = 0;

    chunks.forEach((chunk, chunkIndex) => {
      const words = chunk.trim().split(/\s+/);
      words.forEach((word) => {
        formattedLyrics.push({
          word,
          time: currentTimeOffset,
          chunkId: chunkIndex
        });
        currentTimeOffset += timePerWord;
      });
    });

    updateProps({ lyrics: formattedLyrics });
  };

  const searchTextures = async () => {
    if (!textureQuery) return;
    setIsSearchingTextures(true);
    try {
      const res = await fetch(`https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(textureQuery + ' texture pattern')}&image_type=photo&per_page=12`);
      const data = await res.json();
      if (data.hits) {
        setSearchedTextures(data.hits.map((h: any) => h.webformatURL));
      }
    } catch (e) { console.error(e); }
    setIsSearchingTextures(false);
  };

  const buttonClass = "p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex justify-center";
  const activeClass = "bg-primary-500 text-white hover:bg-primary-600 hover:text-white";
  const isBold = (w: string | number | undefined) => w === 'bold' || w === 700 || w === 900 || (typeof w === 'number' && w >= 600);

  const loadGoogleFont = (fontFamily: string, weights = "400") => {
    if (loadedFonts.has(fontFamily)) return;

    const familyParam = fontFamily.trim().replace(/\s+/g, "+");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weights}&display=swap`;
    document.head.appendChild(link);
    loadedFonts.add(fontFamily);
  }

  // Helper to set Instagram font style
  const setInstaFont = async(fontName: string) => {
    const font = INSTAGRAM_FONTS.find(f => f.label === fontName);
    if (font) {
      await loadGoogleFont(font.family, "400");
      updateProps({
        fontFamily: font.family,
        fontWeight: font.weight || 'normal',
        fontStyle: (font as any).style || 'normal'
      });
    }
  };

  const handleFontChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const font = e.target.value;
    await loadGoogleFont(font, "400");
    updateProps({
      fontFamily: font,
      fontWeight: 'normal',
      fontStyle: 'normal'
    });
  };

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`w-9 h-5 rounded-full relative transition-colors ${checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );

  const VisualizerSettings = () => {
    return (
      <div className="border-b border-gray-200 dark:border-[#27272a] pb-6 space-y-5">
        <div className="flex items-center justify-between"><label className="block text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2"><PaletteIcon size={14} /> Visualizer Style</label></div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 block">Primary Color</label>
            <ColorPickerButton color={clip.properties.visualizerColor || '#4f46e5'} picker='primary' onChange={(val) => updateProps({ visualizerColor: val })} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 block">Accent Color</label>
            <ColorPickerButton color={clip.properties.visualizerColor2 || '#ffffff'} picker='accent' onChange={(val) => updateProps({ visualizerColor2: val })} />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[10px] font-bold uppercase text-gray-500">Effect Duration</label>
              <span className="text-[10px] text-primary-500 font-mono">{clip.duration.toFixed(1)}s</span>
            </div>
            <input type="range" min="0.5" max="60" step="0.5" value={clip.duration} onChange={(e) => onUpdateClip(clip.id, { duration: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-primary-500" />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[10px] text-gray-400">Element Count</label>
              <span className="text-[10px] text-gray-500">{clip.properties.visualizerCount || 30}</span>
            </div>
            <input type="range" min="10" max="150" value={clip.properties.visualizerCount || 30} onChange={(e) => updateProps({ visualizerCount: parseInt(e.target.value) })} className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-primary-500" />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[10px] text-gray-400">Thickness</label>
              <span className="text-[10px] text-gray-500">{clip.properties.visualizerThickness || 4}px</span>
            </div>
            <input type="range" min="1" max="20" value={clip.properties.visualizerThickness || 4} onChange={(e) => updateProps({ visualizerThickness: parseInt(e.target.value) })} className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-primary-500" />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[10px] text-gray-400">Reaction Speed</label>
              <span className="text-[10px] text-gray-500">{(clip.properties.visualizerSpeed || 1).toFixed(1)}x</span>
            </div>
            <input type="range" min="0.1" max="5" step="0.1" value={clip.properties.visualizerSpeed || 1} onChange={(e) => updateProps({ visualizerSpeed: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-primary-500" />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[10px] text-gray-400">Roundness</label>
              <span className="text-[10px] text-gray-500">{clip.properties.visualizerRoundness || 0}px</span>
            </div>
            <input type="range" min="0" max="20" value={clip.properties.visualizerRoundness || 0} onChange={(e) => updateProps({ visualizerRoundness: parseInt(e.target.value) })} className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-primary-500" />
          </div>
        </div>
      </div>
    );
  };

  const StylesSection = () => {
    const hasStroke = (clip.properties.strokeWidth || 0) > 0;
    const hasShadow = !!clip.properties.shadowColor;
    const hasBackground = clip.properties.backgroundStyle && clip.properties.backgroundStyle !== 'none';
    const bgStyle = clip.properties.backgroundStyle || 'none';
    const shadowX = clip.properties.shadowOffsetX || 0;
    const shadowY = clip.properties.shadowOffsetY || 0;
    const dist = Math.round(Math.sqrt(shadowX * shadowX + shadowY * shadowY));
    const angle = Math.round(Math.atan2(shadowY, shadowX) * (180 / Math.PI));

    const updateShadow = (d: number, a: number, blur: number) => {
      const rad = a * (Math.PI / 180);
      updateProps({
        shadowOffsetX: Math.round(d * Math.cos(rad)),
        shadowOffsetY: Math.round(d * Math.sin(rad)),
        shadowBlur: blur
      });
    };

    return (
      <div className="border-b border-gray-200 dark:border-[#27272a] pb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300">Styles</label>
          <ChevronUp size={14} className="text-gray-400" />
        </div>
        <div className="mb-4">
          <label className="text-xs text-gray-400 block mb-2">Presets</label>
          <div className="grid grid-cols-3 gap-2">
            {STYLE_PRESETS.map((style) => (
              <button
                key={style.id}
                onClick={() => updateProps(style.props as any)}
                className="h-10 rounded-lg bg-gray-100 dark:bg-[#27272a] border border-transparent hover:border-gray-300 dark:hover:border-gray-500 flex items-center justify-center overflow-hidden transition-all group relative"
                title={style.label}
              >
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    backgroundColor: (style.props as any).backgroundStyle === 'block' ? (style.props as any).backgroundColor : 'transparent',
                    borderRadius: (style.props as any).backgroundCornerRadius ? `${Math.min((style.props as any).backgroundCornerRadius, 10)}px` : '0px',
                    opacity: (style.props as any).backgroundOpacity !== undefined ? (style.props as any).backgroundOpacity : 1
                  }}
                >
                  {style.svg ? (
                    <div
                      className="w-80 mt-1.5"
                      dangerouslySetInnerHTML={{ __html: style.svg }}
                    />
                  ) : (
                    <span
                      className="text-lg font-bold select-none"
                      style={{
                        color: style.props.color,
                        WebkitTextStroke: style.props.strokeWidth ? `${style.props.strokeWidth}px ${style.props.stroke}` : '0px transparent',
                        textShadow: style.props.shadowColor ? `${style.props.shadowOffsetX}px ${style.props.shadowOffsetY}px ${style.props.shadowBlur}px ${style.props.shadowColor}` : 'none',
                        fontFamily: 'Inter'
                      }}
                    >
                      Abc
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <label className="text-xs text-gray-400 block mb-3">Customize</label>
        <div className="space-y-3">

          {/* Text Color */}
          <div className="bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#3f3f46] rounded-lg p-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Text Color</span>
            <ColorPickerButton 
              picker='text'
              color={clip.properties.color || '#ffffff'}
              onChange={(val) => updateProps({ color: val })}
            />
          </div>

          {/* Background with Opacity and Radius */}
          <div className="bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#3f3f46] rounded-lg p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Background</span>
              <Toggle
                checked={!!hasBackground}
                onChange={(checked) => updateProps({
                  backgroundStyle: checked ? 'block' : 'none',
                  backgroundColor: checked ? (clip.properties.backgroundColor || '#000000') : undefined
                })}
              />
            </div>
            {hasBackground && (
              <div className="flex flex-col gap-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex bg-white dark:bg-[#18181b] rounded border border-gray-200 dark:border-[#3f3f46] p-0.5">
                    <button
                      onClick={() => updateProps({ backgroundStyle: 'block' })}
                      className={`p-1.5 rounded transition-colors ${bgStyle === 'block' ? 'bg-gray-100 dark:bg-[#3f3f46] text-primary-500' : 'text-gray-400'}`}
                      title="Block"
                    >
                      <BoxIcon size={16} />
                    </button>
                    <button
                      onClick={() => updateProps({ backgroundStyle: 'strip' })}
                      className={`p-1.5 rounded transition-colors ${bgStyle === 'strip' ? 'bg-gray-100 dark:bg-[#3f3f46] text-primary-500' : 'text-gray-400'}`}
                      title="Strip"
                    >
                      <AlignJustify size={16} />
                    </button>
                  </div>
                  <ColorPickerButton
                    picker='background'
                    color={clip.properties.backgroundColor || '#000000'}
                    onChange={(val) => updateProps({ backgroundColor: val })}
                  />
                </div>

                {/* New: Rounded & Transparency Controls */}
                {bgStyle === 'block' && (
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center pt-1">
                    <span className="text-[10px] text-gray-500">Radius</span>
                    <input
                      type="range" min="0" max="50"
                      value={clip.properties.backgroundCornerRadius || 0}
                      onChange={(e) => updateProps({ backgroundCornerRadius: parseInt(e.target.value) })}
                      className="h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                    <span className="text-[10px] text-gray-500">Opacity</span>
                    <input
                      type="range" min="0" max="1" step="0.1"
                      value={clip.properties.backgroundOpacity !== undefined ? clip.properties.backgroundOpacity : 1}
                      onChange={(e) => updateProps({ backgroundOpacity: parseFloat(e.target.value) })}
                      className="h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Text Outline */}
          <div className="bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#3f3f46] rounded-lg p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Text sds Outline</span>
              <Toggle
                checked={hasStroke}
                onChange={(checked) => updateProps({ strokeWidth: checked ? 2 : 0, stroke: clip.properties.stroke || '#000000' })}
              />
            </div>
            {hasStroke && (
              <div className="flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <input
                  type="range"
                  min="1" max="20"
                  value={clip.properties.strokeWidth || 0}
                  onChange={(e) => updateProps({ strokeWidth: parseInt(e.target.value) })}
                  className="flex-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="w-8 flex items-center justify-center text-xs text-gray-500 bg-white dark:bg-[#18181b] rounded border border-gray-200 dark:border-[#3f3f46] h-6">
                  <Edit3 size={12} className="mr-1" />
                  {clip.properties.strokeWidth}
                </div>
                <ColorPickerButton
                  picker='stroke'
                  color={clip.properties.stroke || '#000000'}
                  onChange={(val) => updateProps({ stroke: val })}
                />
              </div>
            )}
          </div>

          {/* Text Shadow */}
          <div className="bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#3f3f46] rounded-lg p-2 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Text Shadow</span>
              <Toggle
                checked={hasShadow}
                onChange={(checked) => {
                  // Ensure we send a valid color string when enabling, or null/empty when disabling
                  updateProps({
                    shadowColor: checked ? '#000000' : null,
                    shadowBlur: checked ? 5 : 0,
                    shadowOffsetX: checked ? 3 : 0,
                    shadowOffsetY: checked ? 3 : 0
                  });
                }}
              />
            </div>
            {hasShadow && (
              <div className="flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <input
                  type="range"
                  min="0" max="50"
                  value={clip.properties.shadowBlur || 0}
                  onChange={(e) => updateProps({ shadowBlur: parseInt(e.target.value) })}
                  className="flex-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />

                <button
                  onClick={() => setShowShadowSettings(!showShadowSettings)}
                  className={`w-8 h-6 flex items-center justify-center rounded border border-gray-200 dark:border-[#3f3f46] hover:bg-white dark:hover:bg-[#18181b] transition-colors ${showShadowSettings ? 'bg-white dark:bg-[#18181b] text-primary-500' : 'bg-transparent text-gray-500'}`}
                >
                  <MoreHorizontal size={14} />
                </button>
                <ColorPickerButton
                  picker='shadow'
                  color={clip.properties.shadowColor || '#000000'}
                  onChange={(val) => updateProps({ shadowColor: val })}
                />
              </div>
            )}

            {/* Shadow Settings Popover */}
            {hasShadow && showShadowSettings && (
              <div ref={shadowSettingsRef} className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#3f3f46] rounded-xl shadow-xl z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-100">
                <div className="grid grid-cols-[60px_1fr_30px] gap-2 items-center">
                  <span className="text-[10px] text-gray-500 flex items-center gap-1"><Layers size={10} /> Dist</span>
                  <input
                    type="range" min="0" max="50" value={dist}
                    onChange={(e) => updateShadow(parseInt(e.target.value), angle, clip.properties.shadowBlur || 0)}
                    className="h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-primary-500"
                  />
                  <span className="text-[10px] text-right bg-gray-100 dark:bg-[#27272a] rounded px-1">{dist}</span>
                </div>
                <div className="grid grid-cols-[60px_1fr_30px] gap-2 items-center">
                  <span className="text-[10px] text-gray-500 flex items-center gap-1"><Maximize size={10} /> Blur</span>
                  <input
                    type="range" min="0" max="50" value={clip.properties.shadowBlur || 0}
                    onChange={(e) => updateProps({ shadowBlur: parseInt(e.target.value) })}
                    className="h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-primary-500"
                  />
                  <span className="text-[10px] text-right bg-gray-100 dark:bg-[#27272a] rounded px-1">{clip.properties.shadowBlur}</span>
                </div>
                <div className="grid grid-cols-[60px_1fr_30px] gap-2 items-center">
                  <span className="text-[10px] text-gray-500 flex items-center gap-1"><Triangle size={10} className="rotate-90" /> Angle</span>
                  <input
                    type="range" min="-180" max="180" value={angle}
                    onChange={(e) => updateShadow(dist, parseInt(e.target.value), clip.properties.shadowBlur || 0)}
                    className="h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-primary-500"
                  />
                  <span className="text-[10px] text-right bg-gray-100 dark:bg-[#27272a] rounded px-1">{angle}°</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ShadowSection = () => (
    <div className="border-b border-gray-200 dark:border-[#27272a] pb-6">
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300 mb-3 flex items-center gap-2">
        <Layers size={12} /> Shadow
      </label>
      <div className="space-y-3">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#27272a] p-1 rounded border border-gray-200 dark:border-[#3f3f46] mb-2">
          <ColorPickerButton color={clip.properties.shadowColor || '#000000'} picker='accent' onChange={(val) => updateProps({ shadowColor: val })} label='' />
          <span className="text-xs text-gray-400 ml-2">Shadow Color</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Offset X</label>
            <input
              type="number"
              className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-1.5 text-sm text-gray-900 dark:text-white outline-none"
              value={clip.properties.shadowOffsetX}
              onChange={(e) => updateProps({ shadowOffsetX: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Offset Y</label>
            <input
              type="number"
              className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-1.5 text-sm text-gray-900 dark:text-white outline-none"
              value={clip.properties.shadowOffsetY}
              onChange={(e) => updateProps({ shadowOffsetY: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-gray-500">Blur</label>
            <span className="text-xs text-gray-500">{clip.properties.shadowBlur || 0}</span>
          </div>
          <input
            type="range"
            min="0" max="50"
            className="w-full accent-primary-500"
            value={clip.properties.shadowBlur || 0}
            onChange={(e) => updateProps({ shadowBlur: parseInt(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );

  const StrokeSection = () => (
    <div className="border-b border-gray-200 dark:border-[#27272a] pb-6">
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300 mb-3">Outline / Stroke</label>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Color</label>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#27272a] p-1 rounded border border-gray-200 dark:border-[#3f3f46]">
            <ColorPickerButton color={clip.properties.stroke || '#000000'} picker='accent' onChange={(val) => updateProps({ stroke: val })} label='' />
            <div className="text-xs text-gray-500">{clip.properties.stroke || '#000'}</div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Width</label>
          <input
            type="number"
            min="0" max="20"
            className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-1.5 text-sm text-gray-900 dark:text-white outline-none"
            value={clip.properties.strokeWidth || 0}
            onChange={(e) => updateProps({ strokeWidth: parseInt(e.target.value) })}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">Stroke Animation</label>
        <select
          className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
          value={(clip.properties as any).strokeAnimation || ''}
          onChange={(e) => updateProps({ strokeAnimation: e.target.value } as any)}
        >
          {STROKE_ANIMATIONS.map(anim => (
            <option key={anim.value} value={anim.value}>{anim.label}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const TransitionsSection = () => {
    const isSideIn = activeSide === 'in';
    const currentTransition = isSideIn ? clip.properties.transitionIn : clip.properties.transitionOut;
    const currentDuration = (isSideIn ? clip.properties.transitionInDuration : clip.properties.transitionOutDuration) || 0.5;

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300 mb-3">Clip Side</label>
          <div className="flex p-1 bg-gray-100 dark:bg-[#27272a] rounded-lg">
            <button onClick={() => setActiveSide('in')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeSide === 'in' ? 'bg-white dark:bg-[#3f3f46] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Start (In)</button>
            <button onClick={() => setActiveSide('out')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeSide === 'out' ? 'bg-white dark:bg-[#3f3f46] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>End (Out)</button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300 mb-4">Effect</label>
          <div className="grid grid-cols-3 gap-2">
            {TRANSITIONS.map(t => {
              const isSelected = (currentTransition || 'none') === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => updateProps({ [isSideIn ? 'transitionIn' : 'transitionOut']: t.value as TransitionType })}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-2 aspect-square ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-600 dark:text-primary-400' : 'bg-gray-50 dark:bg-[#27272a] border-transparent text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                  <t.icon size={20} />
                  <span className="text-[10px] font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-300 flex items-center gap-1"><Clock size={12} /> Duration</label>
            <span className="text-xs text-gray-500 font-mono">{currentDuration}s</span>
          </div>
          <input
            type="range" min="0.1" max="2" step="0.1"
            value={currentDuration}
            onChange={(e) => updateProps({ [isSideIn ? 'transitionInDuration' : 'transitionOutDuration']: parseFloat(e.target.value) })}
            className="w-full accent-primary-500 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    );
  };

  const AnimationSection = () => {
    return (
      <div className="border-b border-gray-200 dark:border-[#27272a] pb-6">
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300 mb-4">Animations</label>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-[#3f3f46] mb-4">
          {['in', 'out', 'loop'].map(tab => (
            <button
              key={tab}
              onClick={() => setAnimTab(tab as 'in' | 'out' | 'loop')}
              className={`flex-1 pb-2 text-xs font-medium text-center capitalize relative ${animTab === tab
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              {tab}
              {animTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-2">
          {ANIMATION_PRESETS[animTab].map((anim: any) => {
            const isSelected = clip.properties.animation === anim.value;
            return (
              <button
                key={anim.id}
                onClick={() => updateProps({ animation: anim.value })}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all aspect-square group ${isSelected
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'bg-gray-50 dark:bg-[#27272a] border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <div className={`w-8 h-8 mb-1 flex items-center justify-center ${isSelected ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                  <AnimIcon type={anim.icon} color="currentColor" />
                </div>
                <span className={`text-[10px] ${isSelected ? 'font-medium' : 'text-gray-500'}`}>
                  {anim.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#18181b] border-l border-gray-200 dark:border-[#27272a] overflow-y-auto">

      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-[#27272a] shrink-0">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-white truncate pr-2">{clip.name} Properties</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="flex border-b border-gray-200 dark:border-[#27272a]">
        <button onClick={() => setActivePanelTab('general')} className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${activePanelTab === 'general' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/10' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}>General</button>
        {clip.type === TrackType.VIDEO && (
          <button onClick={() => setActivePanelTab('transitions')} className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${activePanelTab === 'transitions' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/10' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}>Transitions</button>
        )}
        {clip.type === TrackType.TEXT && (
          <button onClick={() => setActivePanelTab('animation')} className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${activePanelTab === 'animation' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/10' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}>Animation</button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {activePanelTab === 'transitions' && <TransitionsSection />}

        {activePanelTab === 'animation' && <AnimationSection />}

        {activePanelTab !== 'transitions' && activePanelTab !== 'animation' && (
          <>
            {(clip.type === TrackType.AUDIO && clip.type !== TrackType.VISUALIZER) && (
              <>
                <div className="border-b border-gray-200 dark:border-[#27272a] pb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300 flex items-center gap-2">
                      <Music size={14} /> Lyrics & Captions
                    </label>
                    <button onClick={generateLyrics} className="text-[10px] bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 px-2 py-1 rounded flex items-center gap-1 hover:bg-primary-100 dark:hover:bg-primary-900/50">
                      <Wand2 size={10} /> Auto-Generate
                    </button>
                  </div>
                  <textarea className="w-full bg-gray-50 dark:bg-[#09090b] border border-gray-300 dark:border-[#3f3f46] rounded p-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none resize-none h-32" value={rawLyrics} onChange={(e) => setRawLyrics(e.target.value)} placeholder="Enter text..." />
                  <div className="grid grid-cols-2 gap-2 items-end">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Total Time (sec)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-2 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-primary-500"
                        value={clip.properties.customDuration}
                        onChange={(e) => updateProps({ customDuration: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <button
                      onClick={() => syncLyricsToDuration(rawLyrics)}
                      className="h-[34px] bg-gray-100 dark:bg-[#27272a] hover:bg-gray-200 dark:hover:bg-[#3f3f46] text-gray-700 dark:text-gray-200 text-xs rounded border border-gray-200 dark:border-[#3f3f46] flex items-center justify-center gap-2"
                    >
                      <Clock size={12} /> Sync Text
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-medium text-gray-400">Timing Offset (Speed)</label>
                      <span className="text-xs text-gray-500">{clip.properties.lyricOffset || 0}s</span>
                    </div>
                    <input
                      type="range"
                      min="-5" max="5" step="0.1"
                      className="w-full accent-primary-500"
                      value={clip.properties.lyricOffset || 0}
                      onChange={(e) => updateProps({ lyricOffset: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"><Sparkles size={12} /> Effect Style</label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => updateProps({ lyricsStyle: 'simple' })}
                        className={`p-1.5 text-xs border rounded ${clip.properties.lyricsStyle === 'simple' || !clip.properties.lyricsStyle ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-200 dark:border-[#3f3f46] text-gray-500'}`}
                      >
                        Simple
                      </button>
                      <button
                        onClick={() => updateProps({ lyricsStyle: 'dynamic' })}
                        className={`p-1.5 text-xs border rounded ${clip.properties.lyricsStyle === 'dynamic' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-200 dark:border-[#3f3f46] text-gray-500'}`}
                      >
                        Insta
                      </button>
                      <button
                        onClick={() => updateProps({ lyricsStyle: 'karaoke' })}
                        className={`p-1.5 text-xs border rounded ${clip.properties.lyricsStyle === 'karaoke' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-200 dark:border-[#3f3f46] text-gray-500'}`}
                      >
                        Karaoke
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Typography</label>
                    <div className="flex items-center justify-between gap-1 bg-gray-50 dark:bg-[#27272a] p-1 rounded-lg border border-gray-200 dark:border-[#3f3f46]">
                      <div className="flex gap-1 border-r border-gray-200 dark:border-[#3f3f46] pr-2">
                        <button onClick={() => updateProps({ fontWeight: isBold(clip.properties.fontWeight) ? 'normal' : 'bold' })} className={`${buttonClass} ${isBold(clip.properties.fontWeight) ? activeClass : ''}`} title="Bold"><Bold size={14} /></button>
                        <button onClick={() => updateProps({ fontStyle: clip.properties.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`${buttonClass} ${clip.properties.fontStyle === 'italic' ? activeClass : ''}`} title="Italic"><Italic size={14} /></button>
                        <button onClick={() => updateProps({ textDecoration: clip.properties.textDecoration === 'underline' ? 'none' : 'underline' })} className={`${buttonClass} ${clip.properties.textDecoration === 'underline' ? activeClass : ''}`} title="Underline"><Underline size={14} /></button>
                        <button onClick={() => updateProps({ textDecoration: clip.properties.textDecoration === 'linethrough' ? 'none' : 'linethrough' })} className={`${buttonClass} ${clip.properties.textDecoration === 'linethrough' ? activeClass : ''}`} title="Strikethrough"><Strikethrough size={14} /></button>
                      </div>
                      <div className="flex gap-1 pl-1">
                        <button onClick={() => updateProps({ textAlign: 'left' })} className={`${buttonClass} ${clip.properties.textAlign === 'left' || (!clip.properties.textAlign && 'left' === 'left') ? activeClass : ''}`}><AlignLeft size={14} /></button>
                        <button onClick={() => updateProps({ textAlign: 'center' })} className={`${buttonClass} ${clip.properties.textAlign === 'center' ? activeClass : ''}`}><AlignCenter size={14} /></button>
                        <button onClick={() => updateProps({ textAlign: 'right' })} className={`${buttonClass} ${clip.properties.textAlign === 'right' ? activeClass : ''}`}><AlignRight size={14} /></button>
                        <button onClick={() => updateProps({ textAlign: 'justify' })} className={`${buttonClass} ${clip.properties.textAlign === 'justify' ? activeClass : ''}`}><AlignJustify size={14} /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Color</label>
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#27272a] p-1 rounded border border-gray-200 dark:border-[#3f3f46]">
                          <ColorPickerButton color={clip.properties.color || '#000000'} picker='accent' onChange={(val) => updateProps({ color: val })} label='' />
                          <div className="text-xs text-gray-500 uppercase">{clip.properties.color || '#fff'}</div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Size</label>
                        <input
                          type="number"
                          className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-1.5 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                          value={clip.properties.fontSize}
                          onChange={(e) => updateProps({ fontSize: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    {clip.properties.lyricsStyle === 'karaoke' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Highlight Color</label>
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#27272a] p-1 rounded border border-gray-200 dark:border-[#3f3f46]">
                          <ColorPickerButton color={clip.properties.lyricHighlightColor || '#000000'} picker='accent' onChange={(val) => updateProps({ lyricHighlightColor: val })} label='' />
                          <div className="text-xs text-gray-500 uppercase">Active Word</div>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Font Family</label>
                      <select
                        className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                        value={clip.properties.fontFamily || 'Inter'}
                        onChange={handleFontChange}
                      >
                        <optgroup label="System Fonts">
                          {SYSTEM_FONTS.map(font => (
                            <option key={font} value={font}>{font.split(',')[0]}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Sans Serif">
                          {GOOGLE_FONTS_SANS.map(font => (
                            <option key={font} value={font}>{font}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Serif">
                          {GOOGLE_FONTS_SERIF.map(font => (
                            <option key={font} value={font}>{font}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Display / Decorative">
                          {GOOGLE_FONTS_DISPLAY.map(font => (
                            <option key={font} value={font}>{font}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Handwriting / Script">
                          {GOOGLE_FONTS_HANDWRITING.map(font => (
                            <option key={font} value={font}>{font}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Monospace">
                          {GOOGLE_FONTS_MONOSPACE.map(font => (
                            <option key={font} value={font}>{font}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Instagram Fonts Selector */}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Instagram Font Style</label>
                      <select
                        className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                        value={INSTAGRAM_FONTS.find(f => f.family === clip.properties.fontFamily && f.weight == clip.properties.fontWeight)?.label || clip.properties.fontFamily || 'Modern'}
                        onChange={(e) => setInstaFont(e.target.value)}
                      >
                        {INSTAGRAM_FONTS.map(font => (
                          <option key={font.label} value={font.label}>{font.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                        <Scaling size={12} /> Spacing
                      </label>
                      <div className="space-y-3 bg-gray-50 dark:bg-[#27272a] p-2 rounded border border-gray-200 dark:border-[#3f3f46]">
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-[10px] text-gray-500">Word Gap</label>
                            <span className="text-[10px] text-gray-500">{clip.properties.wordSpacing || 10}px</span>
                          </div>
                          <input
                            type="range"
                            min="0" max="50"
                            className="w-full accent-primary-500"
                            value={clip.properties.wordSpacing || 10}
                            onChange={(e) => updateProps({ wordSpacing: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-[10px] text-gray-500">Line Height</label>
                            <span className="text-[10px] text-gray-500">{clip.properties.lineHeight || 1.2}</span>
                          </div>
                          <input
                            type="range"
                            min="0.8" max="2.0" step="0.1"
                            className="w-full accent-primary-500"
                            value={clip.properties.lineHeight || 1.2}
                            onChange={(e) => updateProps({ lineHeight: parseFloat(e.target.value) || 1.2 })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-b border-gray-200 dark:border-[#27272a] pb-6">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <ImageIcon size={12} /> Texture & Pattern
                  </label>
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {TEXTURES.map((tex, i) => (
                      <button
                        key={i}
                        onClick={() => updateProps({ textureImage: tex.url })}
                        className={`aspect-square rounded border border-gray-200 dark:border-[#3f3f46] overflow-hidden relative hover:border-primary-500 transition-colors ${clip.properties.textureImage === tex.url ? 'ring-2 ring-primary-500' : ''}`}
                        title={tex.name}
                      >
                        {tex.url ? (
                          <img src={tex.url} alt={tex.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 dark:bg-[#27272a] flex items-center justify-center text-[8px] text-gray-500">None</div>
                        )}
                      </button>
                    ))}
                    {searchedTextures.map((url, i) => (
                      <button
                        key={`search-${i}`}
                        onClick={() => updateProps({ textureImage: url })}
                        className={`aspect-square rounded border border-gray-200 dark:border-[#3f3f46] overflow-hidden relative hover:border-primary-500 transition-colors ${clip.properties.textureImage === url ? 'ring-2 ring-primary-500' : ''}`}
                      >
                        <img src={url} alt="texture" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search textures (e.g. glitter)..."
                      className="flex-1 bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-2 text-xs text-gray-900 dark:text-white focus:outline-none"
                      value={textureQuery}
                      onChange={(e) => setTextureQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchTextures()}
                    />
                    <button onClick={searchTextures} className="p-2 bg-gray-100 dark:bg-[#27272a] rounded hover:bg-gray-200 dark:hover:bg-[#3f3f46]">
                      {isSearchingTextures ? <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div> : <Search size={14} className="text-gray-500" />}
                    </button>
                  </div>
                </div>
                <ShadowSection />
                <StrokeSection />
              </>
            )}

            {clip.type === TrackType.OBJECT && svgColors.length > 0 && (
              <div className="border-b border-gray-200 dark:border-[#27272a] pb-6">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300 mb-3">Fill Colors</label>
                <div className="space-y-3">
                  {svgColors.map((originalColor, i) => {
                    const currentColor = clip.properties.colorOverrides?.[originalColor] || originalColor;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <label className="text-xs text-gray-400 w-16 truncate" title={originalColor}>Color {i + 1}</label>
                        <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-[#27272a] p-1 rounded border border-gray-200 dark:border-[#3f3f46]">
                          <ColorPickerButton color={currentColor || '#000000'} picker={`accent_${i}`} onChange={(val) => handleColorOverride(originalColor, val)} label='' />
                          <span className="text-xs text-gray-500 dark:text-gray-400">{currentColor}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {clip.type === TrackType.TEXT && (
              <>
                <div className="border-b border-gray-200 dark:border-[#27272a] pb-6 space-y-4">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300">Text</label>

                  <textarea
                    className="w-full bg-gray-50 dark:bg-[#09090b] border border-gray-300 dark:border-[#3f3f46] rounded p-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none resize-none h-24 placeholder:text-gray-400 dark:placeholder:text-gray-600"
                    style={{
                      fontFamily: clip.properties.fontFamily,
                      fontWeight: clip.properties.fontWeight as any,
                      fontStyle: clip.properties.fontStyle,
                      textDecoration: clip.properties.textDecoration === 'linethrough' ? 'line-through' : clip.properties.textDecoration,
                      textAlign: clip.properties.textAlign as any
                    }}
                    value={clip.properties.text || ''}
                    onChange={(e) => updateProps({ text: e.target.value })}
                    placeholder="Enter text..."
                  />

                  <div className="flex items-center justify-between gap-1 bg-gray-50 dark:bg-[#27272a] p-1 rounded-lg border border-gray-200 dark:border-[#3f3f46]">
                    <div className="flex gap-1 border-r border-gray-200 dark:border-[#3f3f46] pr-2">
                      <button onClick={() => updateProps({ fontWeight: isBold(clip.properties.fontWeight) ? 'normal' : 'bold' })} className={`${buttonClass} ${isBold(clip.properties.fontWeight) ? activeClass : ''}`} title="Bold"><Bold size={14} /></button>
                      <button onClick={() => updateProps({ fontStyle: clip.properties.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`${buttonClass} ${clip.properties.fontStyle === 'italic' ? activeClass : ''}`} title="Italic"><Italic size={14} /></button>
                      <button onClick={() => updateProps({ textDecoration: clip.properties.textDecoration === 'underline' ? 'none' : 'underline' })} className={`${buttonClass} ${clip.properties.textDecoration === 'underline' ? activeClass : ''}`} title="Underline"><Underline size={14} /></button>
                      <button onClick={() => updateProps({ textDecoration: clip.properties.textDecoration === 'linethrough' ? 'none' : 'linethrough' })} className={`${buttonClass} ${clip.properties.textDecoration === 'linethrough' ? activeClass : ''}`} title="Strikethrough"><Strikethrough size={14} /></button>
                    </div>
                    <div className="flex gap-1 pl-1">
                      <button onClick={() => updateProps({ textAlign: 'left' })} className={`${buttonClass} ${clip.properties.textAlign === 'left' || (!clip.properties.textAlign && 'left' === 'left') ? activeClass : ''}`}><AlignLeft size={14} /></button>
                      <button onClick={() => updateProps({ textAlign: 'center' })} className={`${buttonClass} ${clip.properties.textAlign === 'center' ? activeClass : ''}`}><AlignCenter size={14} /></button>
                      <button onClick={() => updateProps({ textAlign: 'right' })} className={`${buttonClass} ${clip.properties.textAlign === 'right' ? activeClass : ''}`}><AlignRight size={14} /></button>
                      <button onClick={() => updateProps({ textAlign: 'justify' })} className={`${buttonClass} ${clip.properties.textAlign === 'justify' ? activeClass : ''}`}><AlignJustify size={14} /></button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Font Family</label>
                    <select
                      className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                      value={clip.properties.fontFamily || 'Inter'}
                      onChange={handleFontChange}
                    >
                      <optgroup label="System Fonts">
                        {SYSTEM_FONTS.map(font => (
                          <option key={font} value={font}>{font.split(',')[0]}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Sans Serif">
                        {GOOGLE_FONTS_SANS.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Serif">
                        {GOOGLE_FONTS_SERIF.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Display / Decorative">
                        {GOOGLE_FONTS_DISPLAY.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Handwriting / Script">
                        {GOOGLE_FONTS_HANDWRITING.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Monospace">
                        {GOOGLE_FONTS_MONOSPACE.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Instagram Fonts Selector */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Instagram Font Style</label>
                    <select
                      className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                      value={INSTAGRAM_FONTS.find(f => f.family === clip.properties.fontFamily && f.weight == clip.properties.fontWeight)?.label || clip.properties.fontFamily || 'Modern'}
                      onChange={(e) => setInstaFont(e.target.value)}
                    >
                      {INSTAGRAM_FONTS.map(font => (
                        <option key={font.label} value={font.label}>{font.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Size (px)</label>
                      <input
                        type="number"
                        className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-1.5 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                        value={clip.properties.fontSize}
                        onChange={(e) => updateProps({ fontSize: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Spacing</label>
                      <input
                        type="number"
                        className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-1.5 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                        value={clip.properties.charSpacing}
                        onChange={(e) => updateProps({ charSpacing: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="mt-1">
                    <div className="flex justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-400">Line Height</label>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{clip.properties.lineHeight || 1.16}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5" max="3" step="0.1"
                      className="w-full accent-primary-500"
                      value={clip.properties.lineHeight || 1.16}
                      onChange={(e) => updateProps({ lineHeight: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <StylesSection />

                <div className="border-b border-gray-200 dark:border-[#27272a] pb-6">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <ImageIcon size={12} /> Texture & Pattern
                  </label>
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {TEXTURES.map((tex, i) => (
                      <button
                        key={i}
                        onClick={() => updateProps({ textureImage: tex.url })}
                        className={`aspect-square rounded border border-gray-200 dark:border-[#3f3f46] overflow-hidden relative hover:border-primary-500 transition-colors ${clip.properties.textureImage === tex.url ? 'ring-2 ring-primary-500' : ''}`}
                        title={tex.name}
                      >
                        {tex.url ? (
                          <img src={tex.url} alt={tex.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 dark:bg-[#27272a] flex items-center justify-center text-[8px] text-gray-500">None</div>
                        )}
                      </button>
                    ))}
                    {searchedTextures.map((url, i) => (
                      <button
                        key={`search-${i}`}
                        onClick={() => updateProps({ textureImage: url })}
                        className={`aspect-square rounded border border-gray-200 dark:border-[#3f3f46] overflow-hidden relative hover:border-primary-500 transition-colors ${clip.properties.textureImage === url ? 'ring-2 ring-primary-500' : ''}`}
                      >
                        <img src={url} alt="texture" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search textures (e.g. glitter)..."
                      className="flex-1 bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-2 text-xs text-gray-900 dark:text-white focus:outline-none"
                      value={textureQuery}
                      onChange={(e) => setTextureQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchTextures()}
                    />
                    <button onClick={searchTextures} className="p-2 bg-gray-100 dark:bg-[#27272a] rounded hover:bg-gray-200 dark:hover:bg-[#3f3f46]">
                      {isSearchingTextures ? <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div> : <Search size={14} className="text-gray-500" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {isVisual && (
              <div className="border-b border-gray-200 dark:border-[#27272a] pb-6">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300 mb-4 flex items-center gap-2"><Maximize size={14} /> Transform</label>
                <div className="space-y-4">
                  {(clip.type === TrackType.VIDEO || clip.type === TrackType.IMAGE) && (
                    <div className="space-y-2 mb-4">
                      <label className="text-[10px] text-gray-400 block mb-1 flex items-center gap-1"><Ghost size={10} /> Blend Mode</label>
                      <select
                        value={clip.properties.blendMode || 'normal'}
                        onChange={(e) => updateProps({ blendMode: e.target.value as any })}
                        className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded px-2 py-1 text-xs"
                      >
                        {BLEND_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                  )}

                  {(clip.type === TrackType.IMAGE || clip.type === TrackType.VIDEO) && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">X Position (%)</label>
                          <input type="number" step="1" className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded px-2 py-1 text-xs" value={Math.round(clip.properties.x ?? 50)} onChange={(e) => updateProps({ x: parseFloat(e.target.value) })} />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Y Position (%)</label>
                          <input type="number" step="1" className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded px-2 py-1 text-xs" value={Math.round(clip.properties.y ?? 50)} onChange={(e) => updateProps({ y: parseFloat(e.target.value) })} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1"><label className="text-[10px] text-gray-400">Scale</label><span className="text-[10px] text-gray-500">{(clip.properties.scaleX ?? 1).toFixed(2)}x</span></div>
                        <input type="range" min="0.1" max="5" step="0.01" className="w-full accent-primary-500" value={clip.properties.scaleX ?? 1} onChange={(e) => { const s = parseFloat(e.target.value); updateProps({ scaleX: s, scaleY: s }); }} />
                      </div>
                    </>
                  )}

                  {(clip.type === TrackType.TEXT || clip.type === TrackType.OBJECT) && (
                    <>
                      <div>
                        <div className="flex justify-between mb-1"><label className="text-[10px] text-gray-400">Skew Y</label><span className="text-[10px] text-gray-500">{Math.round(clip.properties.skewY ?? 0)}°</span></div>
                        <input type="range" min="-180" max="180" step="1" className="w-full accent-primary-500" value={clip.properties.skewY ?? 0} onChange={(e) => updateProps({ skewY: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1"><label className="text-[10px] text-gray-400">Skew X</label><span className="text-[10px] text-gray-500">{Math.round(clip.properties.skewX ?? 0)}°</span></div>
                        <input type="range" min="-180" max="180" step="1" className="w-full accent-primary-500" value={clip.properties.skewX ?? 0} onChange={(e) => updateProps({ skewX: parseFloat(e.target.value) || 0 })} />
                      </div>
                    </>
                  )}

                  <div>
                    <div className="flex justify-between mb-1"><label className="text-[10px] text-gray-400">Rotation</label><span className="text-[10px] text-gray-500">{Math.round(clip.properties.rotation ?? 0)}°</span></div>
                    <input type="range" min="-180" max="180" step="1" className="w-full accent-primary-500" value={clip.properties.rotation ?? 0} onChange={(e) => updateProps({ rotation: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1"><label className="text-[10px] text-gray-400">Opacity</label><span className="text-[10px] text-gray-500">{Math.round((clip.properties.opacity ?? 1) * 100)}%</span></div>
                    <input type="range" min="0" max="1" step="0.01" className="w-full accent-primary-500" value={clip.properties.opacity ?? 1} onChange={(e) => updateProps({ opacity: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>

              </div>
            )}

            {isAudio && clip.type !== TrackType.VISUALIZER && (
              <div className="border-b border-gray-200 dark:border-[#27272a] pb-6">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300 mb-3 flex items-center gap-2"><Volume2 size={14} /> Volume & Fade</label>
                <div className="space-y-4">
                  <div><div className="flex justify-between mb-1"><label className="text-xs text-gray-400">Volume</label><span className="text-xs text-gray-500">{Math.round((clip.properties.volume ?? 1) * 100)}%</span></div><input type="range" min="0" max="1" step="0.1" className="w-full accent-primary-500" value={clip.properties.volume ?? 1} onChange={(e) => updateProps({ volume: parseFloat(e.target.value) || 0 })} /></div>
                  <div><div className="flex justify-between mb-1"><label className="text-xs text-gray-400">Fade In</label><span className="text-xs text-gray-500">{clip.properties.audioFadeIn || 0}s</span></div><input type="range" min="0" max="1.5" step="0.1" className="w-full accent-primary-500" value={clip.properties.audioFadeIn || 0} onChange={(e) => updateProps({ audioFadeIn: parseFloat(e.target.value) || 0 })} /></div>
                  <div><div className="flex justify-between mb-1"><label className="text-xs text-gray-400">Fade Out</label><span className="text-xs text-gray-500">{clip.properties.audioFadeOut || 0}s</span></div><input type="range" min="0" max="1.5" step="0.1" className="w-full accent-primary-500" value={clip.properties.audioFadeOut || 0} onChange={(e) => updateProps({ audioFadeOut: parseFloat(e.target.value) || 0 })} /></div>
                </div>
              </div>
            )}

            {clip.type === TrackType.VISUALIZER && <VisualizerSettings />}

            {((clip.type === TrackType.AUDIO && clip.type !== TrackType.VISUALIZER) || clip.type === TrackType.VIDEO || clip.type === TrackType.VOICE) && (
              <>
                {(clip.type === TrackType.AUDIO || clip.type === TrackType.VOICE) && (
                  <div className="border-b border-gray-200 dark:border-[#27272a] pb-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300 flex items-center gap-2">
                        <Sparkles size={14} /> Audio Effects
                      </label>
                      {isPreviewing && (
                        <button onClick={stopPreview} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded flex items-center gap-1 hover:bg-red-200 dark:hover:bg-red-900/50">
                          <Square size={10} fill="currentColor" /> Stop Preview
                        </button>
                      )}
                    </div>

                    <div className="flex p-1 bg-gray-100 dark:bg-[#27272a] rounded-lg mb-4">
                      <button onClick={() => setActiveEffectTab('music')} className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${activeEffectTab === 'music' ? 'bg-white dark:bg-[#3f3f46] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Music</button>
                      <button onClick={() => setActiveEffectTab('voice')} className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${activeEffectTab === 'voice' ? 'bg-white dark:bg-[#3f3f46] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Voice</button>
                      <button onClick={() => setActiveEffectTab('singing')} className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${activeEffectTab === 'singing' ? 'bg-white dark:bg-[#3f3f46] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Singing</button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {AUDIO_EFFECTS[activeEffectTab].map(effect => (
                        <button
                          key={effect.id}
                          onClick={() => handleEffectClick(effect.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-2 ${clip.properties.audioEffect === effect.id ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-600 dark:text-primary-400' : 'bg-gray-50 dark:bg-[#27272a] border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3f3f46]'}`}
                        >
                          <effect.icon size={20} />
                          <span className="text-[10px] font-medium">{effect.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">Click an effect to preview it with your clip.</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className="p-4 space-y-6">
        <button
          onClick={() => onDeleteClip(clip.id)}
          className="w-full py-2 px-4 bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 rounded text-sm font-medium transition-colors"
        >
          Delete Clip
        </button>
      </div>
    </div>
  );
};
