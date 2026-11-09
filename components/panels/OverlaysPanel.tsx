import React, { useState, useEffect, useCallback } from 'react';
import { ChevronsLeft, Layers, Loader2, AlertCircle, Plus, ChevronDown } from 'lucide-react';
import { Button } from '../Button';
import { useApiKeys } from '../../context/ApiKeyContext';

interface OverlaysPanelProps {
  onAddOverlay: (url: string, name: string) => void;
  onClose: () => void;
}

const OVERLAY_CATEGORIES = [
  { id: 'snow', label: 'Snow', query: 'snow overlay black background' },
  { id: 'rain', label: 'Rain', query: 'rain overlay black background' },
  { id: 'fire', label: 'Fire/Sparks', query: 'fire sparks overlay black background' },
  { id: 'dust', label: 'Particles', query: 'dust particles overlay black background' },
  { id: 'bokeh', label: 'Bokeh', query: 'bokeh light overlay black background' },
  { id: 'fog', label: 'Fog/Smoke', query: 'fog smoke overlay black background' },
  { id: 'glitch', label: 'Glitch', query: 'glitch overlay black background' },
  { id: 'film', label: 'Old Film', query: 'old film grain overlay black background' },
];

export const OverlaysPanel: React.FC<OverlaysPanelProps> = ({ onAddOverlay, onClose }) => {
  const { apiKeys } = useApiKeys();
  const [activeCategory, setActiveCategory] = useState<string>('snow');
  const [orientation, setOrientation] = useState<string>('landscape');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchOverlays = useCallback(async (pageNum: number, isLoadMore: boolean) => {
    setLoading(true);
    if (!isLoadMore) setError(null);
    const category = OVERLAY_CATEGORIES.find(c => c.id === activeCategory);
    if (!category) return;
    try {
      const orientParam = orientation === 'landscape' ? 'horizontal' : orientation === 'portrait' ? 'vertical' : 'all';
      const params = new URLSearchParams({
        key: apiKeys.PIXABAY_API_KEY,
        q: category.query,
        video_type: 'all',
        per_page: orientation === 'portrait' ? '100' : '24',
        safesearch: 'true',
        page: pageNum.toString(),
        orientation: orientParam
      });
      const response = await fetch(`https://pixabay.com/api/videos/?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch overlays');
      const data = await response.json();
      const items = data.hits.map((hit: any) => {
          const v = hit.videos.medium || hit.videos.small || hit.videos.tiny || hit.videos.large;
          return { id: hit.id, url: v.url, thumb: v.thumbnail, duration: hit.duration, width: v.width, height: v.height };
      }).filter((item: any) => {
          if (orientation === 'portrait') return item.height > item.width;
          if (orientation === 'landscape') return item.width > item.height;
          return true;
      });
      if (data.hits.length < 24) setHasMore(false); else setHasMore(true);
      if (isLoadMore) setResults(prev => [...prev, ...items]); else setResults(items);
    } catch (e) { console.error(e); setError("Could not load overlays. Try again later."); } finally { setLoading(false); }
  }, [activeCategory, orientation]);

  useEffect(() => { setResults([]); setPage(1); setHasMore(true); fetchOverlays(1, false); }, [activeCategory, orientation, fetchOverlays]);
  const handleLoadMore = () => { if (!loading && hasMore) { const nextPage = page + 1; setPage(nextPage); fetchOverlays(nextPage, true); } };
  const formatDuration = (seconds?: number) => { if (!seconds) return ''; const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60); return `${m}:${s.toString().padStart(2, '0')}`; };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#18181b] border-r border-gray-200 dark:border-[#27272a] w-full md:w-[320px] overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#27272a]">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers size={18} className="text-primary-500" /> Effects & Overlays
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ChevronsLeft size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#27272a] p-3 rounded-lg border border-gray-200 dark:border-[#3f3f46]">
           These overlays use <b>Screen</b> blend mode. Black backgrounds will become transparent.
        </p>

        <div className="flex gap-2">
           <div className="relative flex-1">
             <select 
               value={orientation}
               onChange={(e) => setOrientation(e.target.value)}
               className="w-full appearance-none bg-gray-50 dark:bg-[#27272a] text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-300 dark:border-[#3f3f46] text-xs focus:outline-none focus:border-primary-500 cursor-pointer"
             >
               <option value="landscape">Landscape (16:9)</option>
               <option value="portrait">Portrait (9:16)</option>
               <option value="all">All Orientations</option>
             </select>
             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
           </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
            {OVERLAY_CATEGORIES.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left ${
                        activeCategory === cat.id 
                        ? 'bg-primary-50 dark:bg-primary-600/20 border-primary-500 text-primary-600 dark:text-primary-300' 
                        : 'bg-gray-50 dark:bg-[#27272a] border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                    {cat.label}
                </button>
            ))}
        </div>

        <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                    {OVERLAY_CATEGORIES.find(c => c.id === activeCategory)?.label} Results
                </h3>
                <span className="text-[10px] text-gray-500 uppercase">{orientation}</span>
            </div>

            {error ? (
                <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/10 p-3 rounded">
                    <AlertCircle size={14} /> {error}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {results.map(item => (
                        <div 
                            key={item.id}
                            className={`group relative bg-black rounded-lg overflow-hidden cursor-pointer border border-gray-200 dark:border-[#3f3f46] hover:border-primary-500 transition-all ${
                                orientation === 'portrait' ? 'aspect-[9/16]' : 'aspect-video'
                            }`}
                            onClick={() => onAddOverlay(item.url, `${OVERLAY_CATEGORIES.find(c => c.id === activeCategory)?.label} Overlay`)}
                        >
                            <img 
                                src={item.thumb} 
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" 
                                alt="" 
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    const dim = orientation === 'portrait' ? '360x640' : '640x360';
                                    const fallbackUrl = `https://placehold.co/${dim}/000000/666666?text=No+Preview`;
                                    if (target.src !== fallbackUrl) target.src = fallbackUrl;
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-primary-600 rounded-full p-1.5 shadow-lg">
                                    <Plus size={16} className="text-white" />
                                </div>
                            </div>
                            <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 rounded text-[9px] text-white font-mono">
                                {formatDuration(item.duration)}
                            </div>
                        </div>
                    ))}
                    {loading ? (
                        <div className="col-span-2 flex justify-center py-4">
                            <Loader2 className="animate-spin text-primary-500" size={24} />
                        </div>
                    ) : (
                        results.length > 0 && hasMore && (
                            <div className="col-span-2 pt-2">
                                <Button variant="secondary" size="sm" className="w-full" onClick={handleLoadMore}>Load More</Button>
                            </div>
                        )
                    )}
                    {!loading && results.length === 0 && (
                        <div className="col-span-2 text-center text-xs text-gray-500 py-4">
                            No matching results found.<br/> <span className="opacity-70 mt-1 block">Try checking "All Orientations".</span>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};