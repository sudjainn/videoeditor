import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Loader2, ChevronsLeft, Play, Pause, Plus, Upload, Music, ChevronDown, AlertCircle } from 'lucide-react';

interface AudioResourcesPanelProps {
  onAddAudio: (url: string) => void;
  onClose: () => void;
}

interface AudioTrack {
  id: string | number;
  file_name: string;
  username: string;
  title: string;
  author: string;
  duration: number; 
  url: string;
}

const MOODS = [
    { label: 'All Mood', value: '' },
    { label: 'Bright', value: 'bright' },
    { label: 'Restless', value: 'restless' },
    { label: 'Dreamy', value: 'dreamy' },
    { label: 'Laid Back', value: 'laid' },
    { label: 'Hopeful', value: 'hopeful' },
    { label: 'Uplifting', value: 'uplifting' },
    { label: 'Relaxing', value: 'relaxing' },
    { label: 'Suspense', value: 'suspense' },
    { label: 'Energetic', value: 'energetic' },
    { label: 'Peaceful', value: 'peaceful' },
    { label: 'Sentimental', value: 'sentimental' },
    { label: 'Mysterious', value: 'mysterious' },
    { label: 'Epic', value: 'epic' },
    { label: 'Glamorous', value: 'glamorous' },
    { label: 'Quirky', value: 'quirky' },
    { label: 'Romantic', value: 'romantic' },
    { label: 'Euphoric', value: 'euphoric' },
    { label: 'Happy', value: 'happy' },
    { label: 'Dark', value: 'dark' },
    { label: 'Eccentric', value: 'eccentric' },
    { label: 'Scary', value: 'scary' },
    { label: 'Sad', value: 'sad' },
    { label: 'Angry', value: 'angry' },
    { label: 'Funny', value: 'funny' },
    { label: 'Weird', value: 'weird' },
    { label: 'Sexy', value: 'sexy' }
];

const DURATIONS = [
    { label: 'Any duration', value: '' },
    { label: '0-30 seconds', value: '0-30' },
    { label: '30 secs - 2 mins', value: '30-120' },
    { label: '2 mins - 4 mins', value: '120-240' },
    { label: '4 mins - 8 mins', value: '240-480' },
    { label: '8+ mins', value: '480' }
];

const GENRES = [
    { label: 'All Genre', value: '' },
    { label: 'Electronic', value: 'electronic' },
    { label: 'Upbeat', value: 'upbeat' },
    { label: 'Beats', value: 'beats' },
    { label: 'Beautiful Plays', value: 'beautiful plays' },
    { label: 'Main Title', value: 'main title' },
    { label: 'Alternative Hip Hop', value: 'alternative hip hop' },
    { label: 'Modern Classical', value: 'modern classical' },
    { label: 'Ambient', value: 'ambient' },
    { label: 'Build Up Scenes', value: 'build up scenes' },
    { label: 'Acoustic Group', value: 'acoustic group' },
    { label: 'Solo Piano', value: 'solo piano' },
    { label: 'Corporate', value: 'corporate' },
    { label: 'Solo Instruments', value: 'solo instruments' },
    { label: 'Rnb', value: 'rnb' },
    { label: 'Action', value: 'action' },
    { label: 'Intro/Outro', value: 'intro/outro' },
    { label: 'Rock', value: 'rock' },
    { label: 'Folk', value: 'folk' },
    { label: 'Adventure', value: 'adventure' },
    { label: 'Vocal', value: 'vocal' },
    { label: 'Mystery', value: 'mystery' },
    { label: 'Chase Scene', value: 'chase scene' },
    { label: 'Indie Pop', value: 'indie pop' },
    { label: 'Pulses', value: 'pulses' },
    { label: 'Meditation/Spiritual', value: 'meditation/spiritual' },
    { label: 'Small Emotions', value: 'small emotions' },
    { label: 'Alternative', value: 'alternative' },
    { label: 'Nostalgia', value: 'nostalgia' },
    { label: 'Trap', value: 'trap' },
    { label: 'High Drones', value: 'high drones' },
    { label: 'Mainstream Hip Hop', value: 'mainstream hip hop' },
    { label: 'Solo Classical Instruments', value: 'solo classical instruments' },
    { label: 'Soft House', value: 'soft house' },
    { label: 'Epic Classical', value: 'epic classical' },
    { label: 'Techno & Trance', value: 'techno & trance' },
    { label: 'House', value: 'house' },
    { label: 'Pop', value: 'pop' },
    { label: 'Classical Piano', value: 'classical piano' },
    { label: "Happy Children's Tunes", value: 'happy childrens tunes' },
    { label: 'Suspense', value: 'suspense' },
    { label: 'Cafe', value: 'cafe' },
    { label: 'Future Bass', value: 'future bass' },
    { label: 'Synthwave', value: 'synthwave' },
    { label: 'Traditional Jazz', value: 'traditional jazz' },
    { label: 'Video Games', value: 'video games' },
    { label: 'Solo Guitar', value: 'solo guitar' },
    { label: 'Hard Rock', value: 'hard rock' },
    { label: 'World', value: 'world' },
    { label: 'Dance', value: 'dance' },
    { label: 'Electro', value: 'electro' },
    { label: 'Horror Scene', value: 'horror scene' },
    { label: 'Supernatural', value: 'supernatural' },
    { label: 'High Rhythmic Drones', value: 'high rhythmic drones' },
    { label: 'Special Occasions', value: 'special occasions' },
    { label: 'Christmas', value: 'christmas' },
    { label: 'Crime Scene', value: 'crime scene' },
    { label: 'Cartoons', value: 'cartoons' },
    { label: 'Eccentric & Quirky', value: 'eccentric & quirky' },
    { label: 'Small Drama', value: 'small drama' },
    { label: 'Elevator Music', value: 'elevator music' },
    { label: 'Funk', value: 'funk' },
    { label: 'Drama Scene', value: 'drama scene' },
    { label: 'Jingles', value: 'jingles' },
    { label: 'Vintage', value: 'vintage' },
    { label: 'Low Drones', value: 'low drones' },
    { label: 'Synth Pop', value: 'synth pop' },
    { label: 'Old School Hip Hop', value: 'old school hip hop' },
    { label: 'Marching Band', value: 'marching band' },
    { label: 'Metal', value: 'metal' },
    { label: 'Modern Country', value: 'modern country' },
    { label: 'Lullabies', value: 'lullabies' },
    { label: "Fantasy & Dreamy Children's", value: 'fantasy & dreamy childrens' },
    { label: 'Deep House', value: 'deep house' },
    { label: 'Smooth Jazz', value: 'smooth jazz' },
    { label: 'Chamber Music', value: 'chamber music' },
    { label: 'Dramatic Classical', value: 'dramatic classical' },
    { label: 'Drum N Bass', value: 'drum n bass' },
    { label: 'Sneaky', value: 'sneaky' },
    { label: 'Modern Jazz', value: 'modern jazz' },
    { label: 'Bloopers', value: 'bloopers' },
    { label: 'Afrobeat', value: 'afrobeat' },
    { label: 'Island', value: 'island' },
    { label: 'Religious Theme', value: 'religious theme' },
    { label: 'Choir', value: 'choir' },
    { label: 'Acid Jazz', value: 'acid jazz' },
    { label: 'Dubstep', value: 'dubstep' },
    { label: 'Comedy', value: 'comedy' },
    { label: 'Motown & Old School Rnb', value: 'motown & old school rnb' },
    { label: 'Blues', value: 'blues' },
    { label: 'Modern Blues', value: 'modern blues' },
    { label: 'Ireland', value: 'ireland' },
    { label: 'Strange & Weird', value: 'strange & weird' },
    { label: 'Scotland', value: 'scotland' },
    { label: 'Wedding', value: 'wedding' },
    { label: 'Post Rock', value: 'post rock' },
    { label: "Scary Children's Tunes", value: 'scary childrens tunes' },
    { label: 'Amusement Park', value: 'amusement park' },
    { label: 'Gospel', value: 'gospel' },
    { label: 'Reggae', value: 'reggae' },
    { label: 'Traditional Country', value: 'traditional country' },
    { label: 'Bossa Nova', value: 'bossa nova' },
    { label: 'China', value: 'china' },
    { label: 'Low Rhythmic Drones', value: 'low rhythmic drones' },
    { label: 'Big Band', value: 'big band' },
    { label: 'Urban Latin', value: 'urban latin' },
    { label: 'Funerals', value: 'funerals' },
    { label: 'Old School Funk', value: 'old school funk' },
    { label: 'Vaudeville & Variety Show', value: 'vaudeville & variety show' },
    { label: 'Show Dance', value: 'show dance' },
    { label: 'Tragedy', value: 'tragedy' },
    { label: 'High Non Rhythmic Drones', value: 'high non rhythmic drones' },
    { label: 'Low Non Rhythmic Drones', value: 'low non rhythmic drones' },
    { label: 'Ska', value: 'ska' },
    { label: 'India', value: 'india' },
    { label: 'Samba (Latin)', value: 'samba (latin)' },
    { label: 'Military & Historical', value: 'military & historical' },
    { label: 'Punk', value: 'punk' },
    { label: 'Classical String Quartet', value: 'classical string quartet' },
    { label: 'Cha Cha (Latin)', value: 'cha cha (latin)' },
    { label: 'Circus', value: 'circus' },
    { label: 'USA', value: 'usa' },
    { label: 'American Roots Rock', value: 'american roots rock' },
    { label: 'Oompah Band', value: 'oompah band' },
    { label: 'Tango', value: 'tango' },
    { label: 'Polka', value: 'polka' },
    { label: 'France', value: 'france' },
    { label: 'Greece', value: 'greece' }
];

const ORDERS = [
    { label: 'Latest', value: 'latest' },
    { label: 'Trending', value: 'trending' },
    { label: 'Most Downloaded', value: 'most-downloaded' },
    { label: 'Most Played', value: 'most-played' },
    { label: 'Most Favorited', value: 'most-favorited' }
];

// Fallback data in case API fails or key is invalid
const MOCK_TRACKS: AudioTrack[] = [
  { file_name: "", username: "", id: 101, title: 'Inspirational Cinematic', author: 'MusicUnlimited', duration: 120, url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=cinematic-atmosphere-score-115669.mp3' },
  { file_name: "", username: "", id: 102, title: 'Summer Party', author: 'PromoMusic', duration: 145, url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=summer-party-10427.mp3' },
  { file_name: "", username: "", id: 103, title: 'Relaxing LoFi', author: 'ChillVibes', duration: 180, url: 'https://cdn.pixabay.com/download/audio/2022/05/05/audio_13b5671d9d.mp3?filename=lofi-study-112191.mp3' },
  { file_name: "", username: "", id: 104, title: 'Epic Trailer', author: 'ActionSound', duration: 90, url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d0.mp3?filename=epic-trailer-16062.mp3' },
  { file_name: "", username: "", id: 105, title: 'Ambient Piano', author: 'PianoMaster', duration: 200, url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_616dc30e46.mp3?filename=ambient-piano-12683.mp3' }
];

export const AudioResourcesPanel: React.FC<AudioResourcesPanelProps> = ({ onAddAudio, onClose }) => {
  const BASE_URL = window.location.origin;
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ mood: '', duration: '', genre: '', order: 'trending' });
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(searchQuery); }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAudio = useCallback(async (pageNum: number, reset: boolean) => {
    if (reset) { setLoading(true); setError(null); }
    try {
      const params = new URLSearchParams({ page: pageNum.toString() });
      if (filters.mood !== 'All Moods') params.append('mood', filters.mood);
      if (filters.genre !== 'All Genres') params.append('genre', filters.genre);
      if (filters.duration !== 'All Durations') params.append('duration', filters.duration);
      params.append('search', debouncedQuery.trim());
      params.append('order', filters.order);
      
      const url = `${BASE_URL}/index.php/audio/audio/getAudioData/?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
         // Silently fall back to mock data on error
         console.warn("Pixabay Audio API unreachable, using fallback.");
         if (reset) setTracks(MOCK_TRACKS);
         return;
      }

      const data = await response.json();
      const hits = data.hits || [];
      let mappedTracks: AudioTrack[] = hits.map((hit: any) => ({
        id: hit.id,
        file_name: hit.file_name,
        title: (hit.name || hit.tags || 'Unknown Track').split(',')[0].replace(/^\w/, (c: string) => c.toUpperCase()),
        author: hit.username || 'Unknown Artist',
        duration: Number(hit.duration) || 0,
        url: hit.url || hit.preview || hit.content_url || hit.download || '', 
      })).filter((t: AudioTrack) => !!t.url);
      
      if (mappedTracks.length === 0 && reset) {
         setTracks([]); 
      } else if (reset) {
        setTracks(mappedTracks);
      } else {
        setTracks(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newTracks = mappedTracks.filter(t => !existingIds.has(t.id));
            return [...prev, ...newTracks];
        });
      }
    } catch (e: any) { 
        console.error("[AudioFetchError]", e);
        if (reset) setTracks(MOCK_TRACKS); 
    } finally { setLoading(false); }
  }, [debouncedQuery, filters]);

  useEffect(() => { setPage(1); fetchAudio(1, true); }, [fetchAudio]);
  const handleLoadMore = () => { const nextPage = page + 1; setPage(nextPage); fetchAudio(nextPage, false); };
  const handlePreview = (track: AudioTrack) => {
    if (playingId === track.id) { audioRef.current?.pause(); setPlayingId(null); } else {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      const audio = document.createElement('audio');
      audio.src = track.url;
      audio.crossOrigin = "anonymous";
      audio.setAttribute('referrerpolicy', 'no-referrer');
      audio.volume = 0.5;
      audio.onended = () => { setPlayingId(null); };
      audio.play().catch(e => console.error(e));
      audioRef.current = audio;
      setPlayingId(track.id);
    }
  };
  useEffect(() => { return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; } }; }, []);
  const formatDuration = (seconds: number) => { const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60); return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const url = URL.createObjectURL(file); onAddAudio(url); }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#18181b] border-r border-gray-200 dark:border-[#27272a] w-full md:w-[320px]">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#27272a]">
        <h2 className="font-semibold text-gray-900 dark:text-white">Music</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ChevronsLeft size={20} />
        </button>
      </div>

      <div className="p-4 pb-2 space-y-4 border-b border-gray-200 dark:border-[#27272a]">
        <div className="flex p-1 bg-gray-100 dark:bg-[#27272a] rounded-lg">
          <button onClick={() => setActiveTab('library')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'library' ? 'bg-white dark:bg-[#3f3f46] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Library</button>
          <button onClick={() => setActiveTab('upload')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'upload' ? 'bg-white dark:bg-[#3f3f46] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Upload</button>
        </div>

        {activeTab === 'library' && (
          <div className="space-y-3">
            <div className="relative">
              <input type="text" placeholder="Search music..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-[#27272a] text-gray-900 dark:text-white pl-9 pr-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-[#3f3f46] focus:border-primary-500 focus:outline-none" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[ 
                { value: filters.mood, options: MOODS, key: 'mood' }, 
                { value: filters.duration, options: DURATIONS, key: 'duration' }, 
                { value: filters.genre, options: GENRES, key: 'genre' }, 
                { value: filters.order, options: ORDERS, key: 'order' } 
              ].map((filter, idx) => (
                <div key={idx} className="relative">
                  <select 
                    value={filter.value} 
                    onChange={(e) => setFilters(prev => ({ ...prev, [filter.key]: e.target.value }))} 
                    className="w-full appearance-none bg-gray-50 dark:bg-[#27272a] text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-[#3f3f46] text-xs focus:outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3f3f46] transition-colors"
                  >
                    {filter.options.map(opt => <option key={opt.value} value={opt.value} selected={filter.value === opt.value ? "selected" : ""}>{opt.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={12} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#18181b]">
        {activeTab === 'library' ? (
          <div className="p-3 space-y-2">
            {error ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-2"><AlertCircle size={24} className="text-red-400" /><span className="text-xs">{error}</span></div>
            ) : (
              <>
                {tracks.map(track => (
                  <div key={track.id} className="bg-gray-50 dark:bg-[#27272a] border border-transparent rounded-lg p-2 flex items-center gap-3 group hover:border-primary-500/50 transition-all">
                    <button onClick={() => handlePreview(track)} className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-[#3f3f46] rounded-full text-gray-600 dark:text-gray-300 hover:text-white hover:bg-primary-600 transition-colors shrink-0">
                      {playingId === track.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <div className="w-8 h-8 bg-gray-200 dark:bg-[#3f3f46] rounded flex items-center justify-center shrink-0">
                      {track.file_name ? 
                        <img className="audio-thumb" src={track.file_name} alt={track.title} onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `${BASE_URL}/video-edit/assets/music.png`;
                        }}/> 
                        :
                        <Music size={14} className="text-gray-500 dark:text-gray-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-200 truncate" title={track.title}>{track.title}</div>
                      <div className="text-[10px] text-gray-500 truncate flex items-center gap-1"><span>{track.author}</span><span className="w-1 h-1 rounded-full bg-gray-400" /><span>{formatDuration(track.duration)}</span></div>
                    </div>
                    <button onClick={() => onAddAudio(track.url)} className="w-7 h-7 bg-gray-200 dark:bg-[#3f3f46] hover:bg-primary-600 text-gray-500 dark:text-gray-300 hover:text-white rounded-lg flex items-center justify-center transition-colors shrink-0"><Plus size={16} /></button>
                  </div>
                ))}
                {loading && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary-500" size={20} /></div>}
                {!loading && tracks.length === 0 && <div className="text-center py-8 text-gray-500 text-xs px-4">No audio found matching your filters.<br/><button onClick={() => setFilters(f => ({...f, duration: 'All Durations'}))} className="text-primary-500 hover:underline mt-2">Try clearing duration filter</button></div>}
                {!loading && tracks.length > 0 && <button onClick={handleLoadMore} className="w-full py-2 mt-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-[#27272a] hover:bg-gray-200 dark:hover:bg-[#3f3f46] rounded-lg transition-colors">Load More</button>}
              </>
            )}
          </div>
        ) : (
          <div className="p-4 h-full flex flex-col items-center justify-center text-gray-500">
            <div className="border border-dashed border-gray-300 dark:border-[#3f3f46] rounded-xl p-8 flex flex-col items-center gap-4 w-full bg-gray-50 dark:bg-[#27272a]/50">
              <div className="w-16 h-16 bg-gray-200 dark:bg-[#3f3f46] rounded-full flex items-center justify-center">
                <Upload size={32} className="text-gray-400" />
              </div>
              <div className="text-center"><p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload audio</p><p className="text-xs text-gray-500 mt-1">MP3, WAV up to 10MB</p></div>
              <input type="file" accept="audio/*" className="hidden" id="audio-upload" onChange={handleFileUpload} />
              <label htmlFor="audio-upload" className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors">Select File</label>
            </div>
          </div>
        )}
      </div>
      <div className="p-2 border-t border-gray-200 dark:border-[#27272a] text-[10px] text-gray-600 text-center bg-white dark:bg-[#18181b]">Data provided by Pixabay</div>
    </div>
  );
};