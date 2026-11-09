
import React from 'react';
import { ChevronsLeft, Waves, Activity, BarChart3, Target, Share2, LayoutGrid, Disc, Plus, Check } from 'lucide-react';
import { Track, TrackType } from '../../types';

interface VisualizersPanelProps {
  tracks: Track[];
  onAddVisualizer: (type: 'bars' | 'wave' | 'circle' | 'dots' | 'mirror' | 'blocks') => void;
  onSelectClip: (id: string | null) => void;
  onClose: () => void;
}

const VISUALIZERS = [
  { id: 'bars', label: 'Music Bars', icon: BarChart3, desc: 'Classic jumping bars' },
  { id: 'wave', label: 'Audio Wave', icon: Activity, desc: 'Smooth frequency wave' },
  { id: 'mirror', label: 'Mirror Bars', icon: Share2, desc: 'Symmetric dual-sided bars' },
  { id: 'circle', label: 'Circle Pulse', icon: Disc, desc: 'Radial reactive pulse' },
  { id: 'dots', label: 'Floating Dots', icon: Target, desc: 'Bouncing particle system' },
  { id: 'blocks', label: 'Grid Blocks', icon: LayoutGrid, desc: 'Modern block visualizer' },
];

export const VisualizersPanel: React.FC<VisualizersPanelProps> = ({ tracks, onAddVisualizer, onSelectClip, onClose }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#18181b] border-r border-gray-200 dark:border-[#27272a] w-full md:w-[320px]">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#27272a]">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Waves size={18} className="text-primary-500" /> Audio Waves
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ChevronsLeft size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
          <p className="text-xs text-primary-700 dark:text-primary-300 leading-relaxed">
            Click on an effect card to customize it, or use the icon to add/remove.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
            {VISUALIZERS.map((v) => {
                const track = tracks.find(t => t.type === TrackType.VISUALIZER);
                const clip = track?.clips.find(c => c.properties.visualizerType === v.id);
                const isActive = !!clip;

                return (
                    <div
                        key={v.id}
                        onClick={() => isActive && onSelectClip(clip.id)}
                        className={`w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#27272a] border transition-all text-left group relative rounded-xl cursor-pointer ${
                            isActive 
                            ? 'border-primary-500 ring-1 ring-primary-500 dark:bg-primary-900/10' 
                            : 'border-gray-200 dark:border-[#3f3f46] hover:border-primary-500/50 hover:bg-gray-100 dark:hover:bg-[#3f3f46]'
                        }`}
                    >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-transform shadow-sm ${
                            isActive ? 'bg-primary-500 text-white' : 'bg-white dark:bg-[#18181b] text-primary-500 group-hover:scale-110'
                        }`}>
                            <v.icon size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-sm font-bold ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                                {v.label}
                            </h3>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">{v.desc}</p>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAddVisualizer(v.id as any); }}
                            className={`absolute right-4 transition-all ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'} ${isActive ? 'bg-green-500' : 'bg-primary-500'} text-white p-1 rounded-full shadow-md z-10 hover:scale-110 active:scale-95`}
                        >
                            {isActive ? <Check size={14} /> : <Plus size={14} />}
                        </button>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
