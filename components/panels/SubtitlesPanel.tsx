
import React, { useState, useEffect, useRef } from 'react';
import { Languages, ChevronsLeft, Loader2, Music, Sparkles, AlertCircle, Check, Edit3, Palette, Bold, Italic, Type as TypeIcon, AlignJustify, Box as BoxIcon, Move, Maximize, Ghost, Clock, FastForward, AlignLeft, AlignCenter, AlignRight, Type, Highlighter } from 'lucide-react';
import { Track, TrackType, LyricWord, Clip, LayerProperties } from '../../types';
import { Button } from '../Button';
import { useApiKeys } from '../../context/ApiKeyContext';
import { GoogleGenAI, Type as GenType } from "@google/genai";
import { INSTAGRAM_FONTS } from '../../utils/fontLibrary';
import { ColorPickerButton } from '../InputGroups';
import { transcribeAudioToSubtitles } from '../../services/geminiService';

interface SubtitlesPanelProps {
  tracks: Track[];
  onAddSubtitles: (subs: LyricWord[], trackId: string) => void;
  onUpdateClip: (clipId: string, updates: Partial<Clip>) => void;
  onClose: () => void;
}

export const SubtitlesPanel: React.FC<SubtitlesPanelProps> = ({ tracks, onAddSubtitles, onUpdateClip, onClose }) => {
  const { apiKeys } = useApiKeys();
  const [loading, setLoading] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'design'>('editor');
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const audioTracks = tracks.filter(t => t.type === TrackType.AUDIO || t.type === TrackType.VOICE);
  const allAudioClips = audioTracks.flatMap(t => t.clips.map(c => ({ ...c, trackId: t.id })));

  // Find the currently active subtitle clip
  const activeClip = allAudioClips.find(c => c.id === selectedTrackId) || allAudioClips.find(c => c.properties.lyrics && c.properties.lyrics.length > 0);
  const hasLyrics = !!(activeClip?.properties.lyrics && activeClip.properties.lyrics.length > 0);

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

  const handleTranscribe = async () => {
    const targetClipId = selectedTrackId || allAudioClips[0]?.id;
    if (!targetClipId) return;
    const clip = allAudioClips.find(c => c.id === targetClipId);
    if (!clip) return;

    setLoading(true);
    setError(null);
    setStatus('Preparing audio data...');

    try {
      const audioResponse = await fetch(clip.source);
      const audioBlob = await audioResponse.blob();
      setStatus('AI is transcribing...');
      
      // Call backend service which handles API key and credit deduction securely
      const subtitles = await transcribeAudioToSubtitles(audioBlob, clip.duration);

      onAddSubtitles(subtitles as LyricWord[], clip.id);
      setSelectedTrackId(clip.id);
      setStatus('Success!');
      setTimeout(() => setStatus(''), 2000);
      setActiveTab('design');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to transcribe audio.");
    } finally {
      setLoading(false);
    }
  };

  const updateClipProps = (props: Partial<LayerProperties>) => {
    if (activeClip) onUpdateClip(activeClip.id, { properties: props });
  };

  const updateLyricWord = (index: number, newWord: string) => {
    if (!activeClip || !activeClip.properties.lyrics) return;
    const newLyrics = [...activeClip.properties.lyrics];
    newLyrics[index] = { ...newLyrics[index], word: newWord };
    onUpdateClip(activeClip.id, { properties: { lyrics: newLyrics } });
  };

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!checked)} className={`w-9 h-5 rounded-full relative transition-colors ${checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}><div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} /></button>
  );

  const renderDesignTab = () => {
    if (!activeClip) return null;
    const props = activeClip.properties;
    const hasBackground = props.backgroundStyle && props.backgroundStyle !== 'none';

    return (
      <div className="p-4 space-y-6 animate-in fade-in duration-200">
        {/* Timing & Sync */}
        <section className="space-y-4 bg-primary-50/20 dark:bg-primary-900/10 p-3 rounded-xl border border-primary-100 dark:border-primary-800/30">
          <label className="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 flex items-center gap-1.5">
            <Clock size={12} /> Timing & Sync
          </label>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] text-gray-500 dark:text-gray-400">Time Offset (Sync)</label>
                <span className="text-[10px] font-mono text-primary-500">{(props.lyricOffset || 0).toFixed(2)}s</span>
              </div>
              <input
                type="range" min="-5" max="5" step="0.05"
                value={props.lyricOffset || 0}
                onChange={(e) => updateClipProps({ lyricOffset: parseFloat(e.target.value) })}
                className="w-full accent-primary-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1"><FastForward size={10} /> Display Speed</label>
                <span className="text-[10px] font-mono text-primary-500">{(props.lyricSpeed || 1).toFixed(2)}x</span>
              </div>
              <input
                type="range" min="0.5" max="2" step="0.01"
                value={props.lyricSpeed || 1}
                onChange={(e) => updateClipProps({ lyricSpeed: parseFloat(e.target.value) })}
                className="w-full accent-primary-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Layout & Container */}
        <section className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5"><Move size={12} /> Layout</label>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] text-gray-400 block mb-1">X Pos (%)</label><input type="number" step="1" className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded px-2 py-1 text-xs" value={Math.round(props.x ?? 50)} onChange={(e) => updateClipProps({ x: parseFloat(e.target.value) || 0 })} /></div>
            <div><label className="text-[10px] text-gray-400 block mb-1">Y Pos (%)</label><input type="number" step="1" className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded px-2 py-1 text-xs" value={Math.round(props.y ?? 50)} onChange={(e) => updateClipProps({ y: parseFloat(e.target.value) || 0 })} /></div>
          </div>
          <div>
            <div className="flex justify-between mb-1"><label className="text-[10px] text-gray-400">Container Width</label><span className="text-[10px] text-gray-500">{Math.round(props.width || 800)}px</span></div>
            <input type="range" min="200" max="2000" step="10" className="w-full accent-primary-500" value={props.width || 800} onChange={(e) => updateClipProps({ width: parseInt(e.target.value) })} />
          </div>

          <div className="flex gap-1 bg-gray-100 dark:bg-[#27272a] p-1 rounded-lg border border-gray-200 dark:border-[#3f3f46]">
            <button onClick={() => updateClipProps({ textAlign: 'left' })} className={`flex-1 p-1.5 rounded transition-colors flex justify-center ${props.textAlign === 'left' ? 'bg-primary-500 text-white' : 'text-gray-500'}`}><AlignLeft size={14} /></button>
            <button onClick={() => updateClipProps({ textAlign: 'center' })} className={`flex-1 p-1.5 rounded transition-colors flex justify-center ${props.textAlign === 'center' ? 'bg-primary-500 text-white' : 'text-gray-500'}`}><AlignCenter size={14} /></button>
            <button onClick={() => updateClipProps({ textAlign: 'right' })} className={`flex-1 p-1.5 rounded transition-colors flex justify-center ${props.textAlign === 'right' ? 'bg-primary-500 text-white' : 'text-gray-500'}`}><AlignRight size={14} /></button>
          </div>
        </section>

        {/* Text Style */}
        <section className="space-y-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5"><TypeIcon size={12} /> Typography</label>
          <div className="space-y-2">
            <select
              value={props.fontFamily || 'Inter'}
              onChange={(e) => updateClipProps({ fontFamily: e.target.value })}
              className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded px-3 py-2 text-sm outline-none"
            >
              {INSTAGRAM_FONTS.map(f => <option key={f.family} value={f.family}>{f.label}</option>)}
            </select>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1"><label className="text-[10px] text-gray-400">Font Size</label><span className="text-[10px] text-gray-500 font-mono">{props.fontSize || 60}px</span></div>
                  <input type="range" min="20" max="150" value={props.fontSize || 60} onChange={(e) => updateClipProps({ fontSize: parseInt(e.target.value) })} className="w-full accent-primary-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-[#27272a] rounded-xl border border-gray-200 dark:border-[#3f3f46]">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Highlighter size={10} /> Highlight Color</label>
                  <p className="text-[9px] text-gray-400 italic">Color of current word as it's spoken</p>
                </div>
                <ColorPickerButton color={props.lyricHighlightColor || '#fbbf24'} picker='Highlight' onChange={(val) => updateClipProps({ lyricHighlightColor: val })} label="Hi" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between mb-1"><label className="text-[10px] text-gray-400">Word Space</label></div>
                  <input
                    type="range" min="0" max="100" step="1"
                    value={props.wordSpacing ?? (props.fontSize || 60) * 0.25}
                    onChange={(e) => updateClipProps({ wordSpacing: parseInt(e.target.value) })}
                    className="w-full accent-primary-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1"><label className="text-[10px] text-gray-400">Line Height</label></div>
                  <input
                    type="range" min="0.5" max="3" step="0.1"
                    value={props.lineHeight || 1.2}
                    onChange={(e) => updateClipProps({ lineHeight: parseFloat(e.target.value) })}
                    className="w-full accent-primary-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1 bg-gray-100 dark:bg-[#27272a] p-1 rounded-lg border border-gray-200 dark:border-[#3f3f46]">
              <button onClick={() => updateClipProps({ fontWeight: props.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`p-1.5 rounded transition-colors ${props.fontWeight === 'bold' ? 'bg-primary-500 text-white' : 'text-gray-500'}`}><Bold size={14} /></button>
              <button onClick={() => updateClipProps({ fontStyle: props.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`p-1.5 rounded transition-colors ${props.fontStyle === 'italic' ? 'bg-primary-500 text-white' : 'text-gray-500'}`}><Italic size={14} /></button>
            </div>
            <ColorPickerButton color={props.color || '#ffffff'} picker='clip' onChange={(val) => updateClipProps({ color: val })} label="Main" />
          </div>
        </section>

        {/* Effects & Background */}
        <section className="space-y-4 pb-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5"><Palette size={12} /> Visual Effects</label>
          <div className="space-y-3">
            {/* Background */}
            <div className="bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#3f3f46] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-gray-700 dark:text-gray-300">Background Box</span><Toggle checked={!!hasBackground} onChange={(checked) => updateClipProps({ backgroundStyle: checked ? 'block' : 'none', backgroundColor: checked ? (props.backgroundColor || '#000000') : undefined, backgroundOpacity: 0.8 })} /></div>
              {hasBackground && (
                <div className="flex flex-col gap-3 mt-2 animate-in slide-in-from-top-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex bg-white dark:bg-[#18181b] rounded border border-gray-200 dark:border-[#3f3f46] p-0.5">
                      <button onClick={() => updateClipProps({ backgroundStyle: 'block' })} className={`p-1.5 rounded transition-colors ${props.backgroundStyle === 'block' ? 'bg-gray-100 dark:bg-[#3f3f46] text-primary-500' : 'text-gray-400'}`} title="Block"><BoxIcon size={16} /></button>
                      <button onClick={() => updateClipProps({ backgroundStyle: 'strip' })} className={`p-1.5 rounded transition-colors ${props.backgroundStyle === 'strip' ? 'bg-gray-100 dark:bg-[#3f3f46] text-primary-500' : 'text-gray-400'}`} title="Strip"><AlignJustify size={16} /></button>
                    </div>
                    <ColorPickerButton color={props.backgroundColor || '#000000'} picker='background' onChange={(val) => updateClipProps({ backgroundColor: val })} label="BG" />
                  </div>
                  <div className="space-y-2">
                    {props.backgroundStyle === 'block' && (
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center">
                        <span className="text-[10px] text-gray-500">Radius</span>
                        <input type="range" min="0" max="30" value={props.backgroundCornerRadius || 0} onChange={(e) => updateClipProps({ backgroundCornerRadius: parseInt(e.target.value) })} className="h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500" />
                      </div>
                    )}
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center">
                      <span className="text-[10px] text-gray-500">Opacity</span>
                      <input type="range" min="0" max="1" step="0.1" value={props.backgroundOpacity ?? 0.8} onChange={(e) => updateClipProps({ backgroundOpacity: parseFloat(e.target.value) })} className="h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stroke / Shadow */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#3f3f46] rounded-xl p-3 space-y-2">
                <span className="text-[10px] text-gray-500 block">Outline</span>
                <div className="flex flex-col gap-2">
                  <input type="range" min="0" max="10" value={props.strokeWidth || 0} onChange={(e) => updateClipProps({ strokeWidth: parseInt(e.target.value), stroke: props.stroke || '#000000' })} className="accent-primary-500" />
                  <ColorPickerButton color={props.stroke || '#000000'} picker='Shadow' onChange={(val) => updateClipProps({ stroke: val })} label="Stroke" />
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#3f3f46] rounded-xl p-3 space-y-2">
                <span className="text-[10px] text-gray-500 block">Shadow</span>
                <div className="flex flex-col gap-2">
                  <Toggle checked={!!props.shadowColor} onChange={(checked) => updateClipProps({ shadowColor: checked ? '#000000' : undefined, shadowBlur: 10, shadowOffsetX: 4, shadowOffsetY: 4 })} />
                  {props.shadowColor && <ColorPickerButton color={props.shadowColor} picker='shadowColor' onChange={(val) => updateClipProps({ shadowColor: val })} label="Shadow" />}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderEditorTab = () => {
    if (!activeClip || !activeClip.properties.lyrics) return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-primary-500" size={24} />
        <p className="text-sm">Select an audio clip to begin.</p>
      </div>
    );

    return (
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 animate-in fade-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transcription Chunks</h3>
          <span className="text-[10px] bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded font-mono">{activeClip.properties.lyrics.length} words</span>
        </div>
        <div className="space-y-1">
          {activeClip.properties.lyrics.map((lyric, idx) => (
            <div key={idx} className="flex gap-2 p-1.5 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-[#3f3f46] group transition-all">
              <div className="w-10 text-[9px] font-mono text-gray-400 pt-2 shrink-0">{lyric.time.toFixed(1)}s</div>
              <input
                type="text"
                value={lyric.word}
                onChange={(e) => updateLyricWord(idx, e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white border-b border-transparent focus:border-primary-500 outline-none transition-colors"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSelectionUI = () => (
    <div className="p-4 space-y-6">
      <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
        <p className="text-xs text-primary-700 dark:text-primary-300 leading-relaxed">
          Select an audio track to generate captions. AI will analyze the speech and sync it perfectly.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Select Audio Track
        </label>
        {allAudioClips.length > 0 ? (
          <div className="space-y-2">
            {allAudioClips.map(clip => (
              <button
                key={clip.id}
                onClick={() => setSelectedTrackId(clip.id)}
                className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all ${(selectedTrackId === clip.id || (!selectedTrackId && clip.properties.lyrics))
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-[#27272a] hover:border-gray-400 dark:hover:border-[#3f3f46]'
                  }`}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${(selectedTrackId === clip.id || (!selectedTrackId && clip.properties.lyrics)) ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-[#27272a] text-gray-400'}`}>
                  <Music size={16} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-xs font-medium truncate ${(selectedTrackId === clip.id || (!selectedTrackId && clip.properties.lyrics)) ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {clip.name}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono">{clip.duration.toFixed(1)}s {clip.properties.lyrics ? '• Captioning active' : ''}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-gray-500 border border-dashed border-gray-300 dark:border-[#27272a] rounded-xl flex flex-col items-center gap-3">
            <AlertCircle size={24} className="opacity-30" />
            No audio or voice tracks found.
          </div>
        )}
      </div>

      <div className="pt-4">
        <Button
          onClick={handleTranscribe}
          disabled={loading || allAudioClips.length === 0}
          className="w-full h-12 rounded-xl text-md font-bold shadow-md"
          icon={loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
        >
          {loading ? (status || 'Transcribing...') : (hasLyrics ? 'Regenerate Subtitles' : 'Generate Subtitles')}
        </Button>
        {status && <p className="text-center text-[10px] text-primary-500 mt-3 font-medium animate-pulse">{status}</p>}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#18181b] border-r border-gray-200 dark:border-[#27272a] w-full md:w-[320px] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#27272a] shrink-0">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Languages size={18} className="text-primary-500" /> Subtitles
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ChevronsLeft size={20} />
        </button>
      </div>

      {hasLyrics && (
        <div className="flex border-b border-gray-200 dark:border-[#27272a] shrink-0">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${activeTab === 'editor' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/10' : 'border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <Edit3 size={14} /> Edit Text
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${activeTab === 'design' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/10' : 'border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <Palette size={14} /> Design
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {!hasLyrics && !loading ? renderSelectionUI() : (loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
            <Loader2 className="animate-spin text-primary-500" size={40} />
            <div className="space-y-1">
              <p className="font-bold text-gray-900 dark:text-white">AI is transcribing...</p>
              <p className="text-xs text-gray-500">{status}</p>
            </div>
          </div>
        ) : (activeTab === 'editor' ? renderEditorTab() : renderDesignTab()))}
      </div>

      {hasLyrics && (
        <div className="p-3 bg-gray-50 dark:bg-[#09090b] border-t border-gray-200 dark:border-[#27272a] flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 text-[10px]" onClick={() => { setSelectedTrackId(null); onAddSubtitles([], activeClip!.id); }}>Clear</Button>
          <Button variant="secondary" size="sm" className="flex-1 text-[10px]" onClick={() => setActiveTab('design')}>Back to Design</Button>
        </div>
      )}

      {error && (
        <div className="m-4 flex items-start gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-200 dark:border-red-900/20">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
