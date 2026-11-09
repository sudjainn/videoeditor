import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, ChevronsLeft, AlertCircle, ChevronDown, ChevronUp, Image as ImageIcon, Film, Upload } from 'lucide-react';
import { Button } from '../Button';
import { useApiKeys } from '../../context/ApiKeyContext';

interface UploadsPanelProps {
  onAddMedia: (url: string, type: 'video' | 'image') => void;
  onClose: () => void;
}

interface StockMedia {
  id: string | number;
  type: 'video' | 'image';
  url: string;
  thumbnail: string;
  duration?: number;
  width: number;
  height: number;
  author: string;
  authorUrl?: string;
}

const CATEGORIES = [
  'backgrounds', 'fashion', 'nature', 'science', 'education', 
  'feelings', 'health', 'people', 'religion', 'places', 
  'animals', 'industry', 'computer', 'food', 'sports', 
  'transportation', 'travel', 'buildings', 'business', 'music'
];

const COLORS = [
  'red', 'orange', 'yellow', 'green', 'turquoise', 'blue', 
  'violet', 'pink', 'brown', 'black', 'gray', 'white'
];

const ORIENTATIONS = [
  { value: 'landscape', label: 'Landscape' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'square', label: 'Square' }
];

export const UploadsPanel: React.FC<UploadsPanelProps> = ({ onAddMedia, onClose }) => {
    const { apiKeys } = useApiKeys();
  const [activeTab, setActiveTab] = useState<'pixabay' | 'pexels'>('pixabay');
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<StockMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);
  
  const [showFilters, setShowFilters] = useState(false);
  const [orientation, setOrientation] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 800); 
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchPixabay = useCallback(async (pageNum: number, isLoadMore: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const searchTerm = debouncedQuery.trim();
      const params = new URLSearchParams({
        key: apiKeys.PIXABAY_API_KEY,
        page: pageNum.toString(),
        safesearch: 'true'
      });

      if (searchTerm) params.append('q', searchTerm);
      else if (category) params.append('category', category);
      else params.append('q', 'background'); 
      
      if (color) params.append('colors', color);
      
      let endpoint = '';
      if (mediaType === 'image') {
        params.append('image_type', 'photo');
        if (orientation) params.append('orientation', orientation === 'landscape' ? 'horizontal' : orientation === 'portrait' ? 'vertical' : 'all');
        endpoint = `https://pixabay.com/api/?${params.toString()}`;
      } else {
        params.append('video_type', 'all');
        if(orientation) params.append('per_page', orientation === 'portrait' ? '200' : '24');
        endpoint = `https://pixabay.com/api/videos/?${params.toString()}`;
      }

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`Pixabay API Error: ${response.status}`);
      const data = await response.json();
      if (!data.hits) { setResults([]); return; }

      var mapped = data.hits.map((hit: any) => {
        if (mediaType === 'image') {
          return {
            id: hit.id,
            type: 'image' as const,
            url: hit.largeImageURL || hit.webformatURL,
            thumbnail: hit.webformatURL || hit.previewURL,
            width: hit.imageWidth,
            height: hit.imageHeight,
            author: hit.user,
            authorUrl: hit.userImageURL
          };
        } else {
          const v = hit.videos;
          if (!v) return null;
          const sizes = ['large', 'medium', 'small', 'tiny'];
          const available = sizes.map(size => v[size]).filter(obj => obj && obj.url && obj.width > 0);
          if (available.length === 0) return null;
          available.sort((a, b) => Math.abs(a.width - 1280) - Math.abs(b.width - 1280));
          const bestVideo = available[0];
          let thumb = '';
          if (bestVideo.thumbnail) thumb = bestVideo.thumbnail;
          return {
            id: hit.id,
            type: 'video' as const,
            url: bestVideo.url,
            thumbnail: thumb,
            duration: hit.duration,
            width: bestVideo.width,
            height: bestVideo.height,
            author: hit.user,
            authorUrl: hit.userImageURL
          };
        }
      }).filter((item: StockMedia | null): item is StockMedia => item !== null);
      
      if(orientation && orientation === 'portrait' && mediaType !== 'image') {
        mapped = mapped.filter((item: any) => {
          if (orientation === 'portrait') return item.height > item.width;
          if (orientation === 'landscape') return item.width > item.height;
          return true;
        });
      }
      setHasMore(true);
      if (isLoadMore) {
        setResults(prev => [...prev, ...mapped]); 
      } else {
        setResults(mapped);
      }
    } catch (e) { console.error("Pixabay fetch error", e); setError("Failed to load Pixabay results."); } finally { setLoading(false); }
  }, [debouncedQuery, category, color, orientation, mediaType]);

  const searchPexels = useCallback(async (pageNum: number, isLoadMore: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const keyword = debouncedQuery.trim(); 
      const effectiveOrientation = orientation;
      const effectiveColor = color;
      const locale = 'en-US';
      const pagination = 24;
      let url = '';

      if (mediaType === 'image') {
        if (effectiveOrientation === '' && effectiveColor === '' && keyword === '') {
           url = `https://api.pexels.com/v1/curated?locale=${locale}&page=${pageNum.toString()}&per_page=${pagination}`;
        } else {
           url = `https://api.pexels.com/v1/search?locale=${locale}&`;
           if (keyword !== '') url += `query=${encodeURIComponent(keyword)}&`;
           else url += `query=background&`; 
           if (effectiveOrientation !== '') url += `orientation=${effectiveOrientation}&`;
           if (effectiveColor !== '') url += `color=${effectiveColor}&`;
           url += `page=${pageNum.toString()}&per_page=${pagination}`;
        }
      } else {
        if (effectiveOrientation === '' && keyword === '') {
           url = `https://api.pexels.com/videos/popular?locale=${locale}&page=${pageNum.toString()}&size=medium&per_page=${pagination}`;
        } else {
           url = `https://api.pexels.com/videos/search?locale=${locale}&size=medium&`;
           if (keyword !== '') url += `query=${encodeURIComponent(keyword)}&`;
           else url += `query=background&`; 
           if (effectiveOrientation !== '') url += `orientation=${effectiveOrientation}&`;
           url += `page=${pageNum.toString()}&per_page=${pagination}`;
        }
      }

      const response = await fetch(url, { method: 'GET', headers: { 'Authorization': apiKeys.PEXELS_API_KEY } });
      if (!response.ok) throw new Error(`Pexels Error: ${response.status}`);
      const data = await response.json();
      const items = mediaType === 'image' ? data.photos : data.videos;
      if (!items || !Array.isArray(items)) { setResults([]); return; }

      const mapped = items.map((item: any) => {
        if (mediaType === 'image') {
          return {
            id: item.id,
            type: 'image' as const,
            url: item.src?.original || item.src?.large2x || item.src?.large || '',
            thumbnail: item.src?.tiny || item.src?.medium || '',
            width: item.width,
            height: item.height,
            author: item.photographer,
            authorUrl: item.photographer_url
          };
        } else {
          const files = item.video_files || [];
          if (files.length === 0) return null;
          let full = files[0].link;
          let width = files[0].width;
          let height = files[0].height;
          let sizeFound = false;
          for (let i = 0; i < files.length; i++) {
             if (!sizeFound && files[i].width === 1280) {
                 full = files[i].link; width = files[i].width; height = files[i].height; sizeFound = true;
             }
          }
          const thumb = item.image || (item.video_pictures && item.video_pictures[0] ? item.video_pictures[0].picture : '');
          return {
            id: item.id,
            type: 'video' as const,
            url: full,
            thumbnail: thumb, 
            duration: item.duration,
            width: width || item.width,
            height: height || item.height,
            author: item.user?.name || 'Pexels User',
            authorUrl: item.user?.url
          };
        }
      }).filter((item: StockMedia | null): item is StockMedia => item !== null);
      setHasMore(true);
      if (isLoadMore) {
        setResults((prev: any) => [...prev, ...mapped]); 
      } else {
        setResults(mapped);
      }
    } catch (e: any) { console.error("Pexels fetch error", e); setError(e.message || "Failed to load Pexels results."); } finally { setLoading(false); }
  }, [debouncedQuery, orientation, color, mediaType]);

  useEffect(() => {
    setPage(1);
    setHasMore(false);
    if (activeTab === 'pixabay') searchPixabay(1, false); else searchPexels(1, false);
  }, [activeTab, debouncedQuery, category, color, orientation, mediaType, searchPixabay, searchPexels]);
  
  const handleLoadMore = () => { const nextPage = page + 1; setPage(nextPage); searchPixabay(nextPage, true); };

  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video') ? 'video' : 'image';
    onAddMedia(url, type);
    // Reset file input so same file can be uploaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const inputClass = "w-full bg-gray-50 dark:bg-[#27272a] text-gray-900 dark:text-white border border-gray-300 dark:border-[#3f3f46] rounded-lg text-sm focus:border-primary-500 focus:outline-none";
  const selectClass = "w-full appearance-none bg-white dark:bg-[#27272a] text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer";

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#18181b] border-r border-gray-200 dark:border-[#27272a] w-full md:w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#27272a]">
        <h2 className="font-semibold text-gray-900 dark:text-white">Stock Media</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ChevronsLeft size={20} />
        </button>
      </div>

      <div className="p-4 pb-2 space-y-4 border-b border-gray-200 dark:border-[#27272a]">
        {/* Local Computer Upload Button */}
        <div className="w-full">
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            onChange={handleLocalUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
          >
            <Upload size={16} /> Upload from Device
          </button>
        </div>
        {/* Source Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-[#27272a] rounded-lg">
          <button 
            onClick={() => setActiveTab('pixabay')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'pixabay' ? 'bg-white dark:bg-[#3f3f46] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            Pixabay
          </button>
          <button 
            onClick={() => setActiveTab('pexels')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'pexels' ? 'bg-white dark:bg-[#3f3f46] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            Pexels
          </button>
        </div>

        {/* Media Type Tabs */}
        <div className="flex gap-2">
          <button 
            onClick={() => setMediaType('video')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center gap-2 ${mediaType === 'video' ? 'bg-primary-50 dark:bg-primary-600/10 border-primary-500/50 text-primary-600 dark:text-primary-400' : 'bg-gray-50 dark:bg-[#27272a] border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            <Film size={14} /> Video
          </button>
          <button 
            onClick={() => setMediaType('image')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center gap-2 ${mediaType === 'image' ? 'bg-primary-50 dark:bg-primary-600/10 border-primary-500/50 text-primary-600 dark:text-primary-400' : 'bg-gray-50 dark:bg-[#27272a] border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            <ImageIcon size={14} /> Image
          </button>
        </div>

        {/* Search Input */}
        <div className="flex gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${inputClass} pl-9 pr-4 py-2`}
                />
            </div>
        </div>
        
        {/* Collapsible Filters */}
        <div className={`space-y-2 overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
             <div className="relative">
                <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className={selectClass}>
                    <option value="">All Orientations</option>
                    {ORIENTATIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
             </div>

             {!(activeTab === 'pexels' && mediaType === 'video') && !(activeTab === 'pixabay' && mediaType === 'video') && (
                 <div className="relative">
                    <select value={color} onChange={(e) => setColor(e.target.value)} className={selectClass}>
                        <option value="">All Colors</option>
                        {COLORS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                 </div>
             )}

             {activeTab === 'pixabay' && (
                <div className="relative">
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                        <option value="">All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                </div>
             )}
        </div>

        {/* Filter Toggle */}
        <button 
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-white transition-colors pt-1"
        >
            {showFilters ? 'Less Settings' : 'More Settings'}
            {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#18181b]">
        {loading && !hasMore ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-primary-500" size={24} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500 gap-2 px-4 text-center">
            <AlertCircle size={24} className="text-red-400" />
            <span className="text-xs">{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {results.map((item) => (
              <div 
                key={item.id} 
                className={`group relative aspect-video bg-gray-200 dark:bg-[#27272a] rounded-lg overflow-hidden cursor-pointer border border-transparent hover:border-primary-500 transition-all shadow-sm
                  ${orientation === 'portrait' ? 'aspect-[9/16]' : orientation === 'square' ? 'aspect-[1/1]' : 'aspect-video'}
                `}
                onClick={() => onAddMedia(item.url, item.type)}
              >
                <img 
                    src={item.thumbnail} 
                    alt="thumbnail" 
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('placehold.co')) {
                           target.src = 'https://placehold.co/640x360/27272a/666666?text=No+Preview';
                        }
                    }}
                />
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-primary-600 rounded-full p-2 hover:bg-primary-500 transition-colors">
                    <span className="text-white text-xs font-bold shadow-sm">+ Add</span>
                  </div>
                </div>

                {item.type === 'video' && item.duration && (
                  <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white font-mono backdrop-blur-sm">
                    {formatDuration(item.duration)}
                  </div>
                )}
                
                <div className="absolute top-1 left-1 bg-black/40 px-1.5 py-0.5 rounded text-[8px] text-gray-300 uppercase backdrop-blur-sm flex items-center gap-1">
                  {item.type === 'image' ? <ImageIcon size={8} /> : <Film size={8} />} {activeTab}
                </div>
              </div>
            ))}
            
            {results.length === 0 && !loading && (
              <div className="col-span-2 text-center py-10 text-gray-500 text-sm">
                No results found. <br/> Try searching for 'background' or 'nature'.
              </div>
            )}

            {loading && hasMore ? (
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
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200 dark:border-[#27272a] text-[10px] text-gray-500 text-center bg-white dark:bg-[#18181b]">
        Data provided by {activeTab === 'pixabay' ? 'Pixabay' : 'Pexels'}
      </div>
    </div>
  );
};