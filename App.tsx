import React, { useState, useRef, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Player, PlayerRef } from "./components/Player";
import { Timeline } from "./components/timeline/Timeline";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { SettingsPanel } from "./components/panels/SettingsPanel";
import { TemplatesPanel } from './components/panels/TemplatesPanel';
import { SubtitlesPanel } from './components/panels/SubtitlesPanel';
import { VisualizersPanel } from './components/panels/VisualizersPanel';
import { UploadsPanel } from "./components/panels/UploadsPanel";
import { TextResourcesPanel } from "./components/panels/TextResourcesPanel";
import { AudioResourcesPanel } from "./components/panels/AudioResourcesPanel";
import { Img2VidPanel } from "./components/panels/Img2VidPanel";
import { Txt2VidPanel } from "./components/panels/Txt2VidPanel";
import { OverlaysPanel } from "./components/panels/OverlaysPanel";
import { ObjectsPanel } from "./components/panels/ObjectsPanel";
import { VoicePanel } from "./components/panels/VoicePanel";
import {
  Track,
  TrackType,
  Clip,
  LayerProperties,
  CanvasSettings,
  ExportFormat,
} from "./types";
import { Button } from "./components/Button";
import {
  Type,
  Music,
  Video,
  Download,
  Settings,
  UploadCloud,
  Loader2,
  Languages,
  Sparkles,
  Clapperboard,
  Layers,
  Moon,
  Sun,
  Shapes,
  Mic,
  Edit2,
  Layout,
  Waves
} from "lucide-react";
import { generateId } from "./utils/time";
import { DEFAULT_DURATION } from "./constants";
import { useApiKeys } from "./context/ApiKeyContext";

type SidebarTab =
  | "settings"
  | "templates"
  | "uploads"
  | "voice"
  | "video"
  | "audio"
  | "text"
  | "img2vid"
  | "txt2vid"
  | "overlays"
  | "objects"
  | null;

const App: React.FC = () => {
  const { apiKeys, loadApiKeys, isLoading, error } = useApiKeys();
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    loadApiKeys();
  }, []);
  
  const [zoom, setZoom] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return window.innerWidth / 8;
    }
    return 50;
  });
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [showPropPanel, setShowPropPanel] = useState(false);
  const [propPanelTab, setPropPanelTab] = useState<"general" | "transitions" | "animation">(
    "general"
  );
  const [propPanelSide, setPropPanelSide] = useState<"in" | "out">("in");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("mp4");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<SidebarTab>("settings");
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
    width: 1080,
    height: 1080,
    backgroundColor: "#000000",
  });
  const playheadRef = useRef<HTMLDivElement>(null);
  const timeDisplayRef = useRef<HTMLSpanElement>(null);
  const playerRef = useRef<PlayerRef>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isSidebarDragging = useRef(false);
  const sidebarStartX = useRef(0);
  const sidebarScrollLeft = useRef(0);

  const onSidebarMouseDown = (e: React.MouseEvent) => {
    if (!sidebarRef.current) return;
    isSidebarDragging.current = true;
    sidebarStartX.current = e.pageX - sidebarRef.current.offsetLeft;
    sidebarScrollLeft.current = sidebarRef.current.scrollLeft;
  };
  const onSidebarMouseLeave = () => {
    isSidebarDragging.current = false;
  };
  const onSidebarMouseUp = () => {
    isSidebarDragging.current = false;
  };
  const onSidebarMouseMove = (e: React.MouseEvent) => {
    if (!isSidebarDragging.current || !sidebarRef.current) return;
    e.preventDefault();
    const x = e.pageX - sidebarRef.current.offsetLeft;
    const walk = (x - sidebarStartX.current) * 2;
    sidebarRef.current.scrollLeft = sidebarScrollLeft.current - walk;
  };
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [tracks, setTracks] = useState<Track[]>([
    {
      id: 'track-1',
      name: 'Video',
      type: TrackType.VIDEO,
      clips: [],
      isMuted: false,
      isHidden: false
    },
    {
      id: 'track-effects',
      name: 'Effects',
      type: TrackType.VIDEO,
      clips: [],
      isMuted: true,
      isHidden: false
    },
    {
      id: 'track-image',
      name: 'Images',
      type: TrackType.IMAGE,
      clips: [],
      isMuted: false,
      isHidden: false
    },
    {
      id: 'track-2',
      name: 'Music',
      type: TrackType.AUDIO,
      clips: [],
      isMuted: false,
      isHidden: false
    },
    {
      id: 'track-objects',
      name: 'Objects',
      type: TrackType.OBJECT,
      clips: [],
      isMuted: false,
      isHidden: false
    },
    {
      id: 'track-3',
      name: 'Overlays',
      type: TrackType.TEXT,
      clips: [],
      isMuted: false,
      isHidden: false
    },
    {
      id: 'track-voice',
      name: 'Voice',
      type: TrackType.VOICE,
      clips: [],
      isMuted: false,
      isHidden: false
    },
    // { 
    //   id: 'track-visualizer', 
    //   name: 'Waves', 
    //   type: TrackType.VISUALIZER, 
    //   clips: [] 
    // }
  ]);


  const handleSelectClip = (id: string | null, openPanel: boolean = true) => {
    setSelectedClipId(id);
    setShowPropPanel(!!id && openPanel);
    if (!id) setPropPanelTab("general");
  };

  const handleOpenTransition = (clipId: string, side: "in" | "out") => {
    setSelectedClipId(clipId);
    setPropPanelTab("transitions");
    setPropPanelSide(side);
    setShowPropPanel(true);
  };

  const handleExport = async () => {
    if (playerRef.current) {
      setIsExporting(true);
      handleSelectClip(null);
      try {
        await playerRef.current.exportVideo(exportFormat);
      } catch (e) {
        console.error("Export failed", e);
        toast.error("Export failed. See console for details.");
      } finally {
        setIsExporting(false);
      }
    }
  };

  const handleLoadProject = (project: any) => {
    if (project.canvasSettings) setCanvasSettings(project.canvasSettings);
    if (project.tracks) setTracks(project.tracks);
    if (project.duration) setDuration(project.duration);
    if (project.title) setProjectName(project.title);
    setCurrentTime(0);
    setSelectedClipId(null);
    setShowPropPanel(false);
  };

  const loadMediaResource = (url: string, type: 'video' | 'audio'): Promise<{ duration: number, width?: number, height?: number }> => {
    return new Promise((resolve, reject) => {
      console.log(`[ReactVideoEdit] 1. Loading ${type} resource:`, url);
      const element = document.createElement(type);
      element.crossOrigin = "anonymous"; // Important for external URLs

      // Try to block referrer for privacy and hotlinking protection logic on stock sites
      element.setAttribute('referrerpolicy', 'no-referrer');

      const source = document.createElement('source');
      source.src = url;
      element.appendChild(source);
      element.preload = 'auto';
      element.muted = true;
      let attempts = 0;
      const maxAttempts = 100;

      const waitLoad = () => {
        const readyState = element.readyState;
        if (readyState >= 1) { // 1 = Metadata loaded (dimensions available)
          const d = element.duration;
          let w, h;
          if (type === 'video') {
            w = (element as HTMLVideoElement).videoWidth;
            h = (element as HTMLVideoElement).videoHeight;
          }

          if (Number.isFinite(d)) {
            resolve({ duration: d, width: w, height: h });
          } else {
            attempts++;
            if (attempts > maxAttempts) {
              resolve({ duration: 10, width: w, height: h });
            } else {
              setTimeout(waitLoad, 100);
            }
          }
        } else {
          attempts++;
          if (attempts > maxAttempts) {
            if (Number.isFinite(element.duration) && element.duration > 0) {
              resolve({ duration: element.duration });
            } else {
              reject(new Error("Media load timeout"));
            }
          } else {
            setTimeout(waitLoad, 100);
          }
        }
      };

      element.addEventListener('loadedmetadata', waitLoad);
      element.addEventListener('loadeddata', () => {
        if (type === 'video') element.currentTime = 0;
        setTimeout(waitLoad, 100);
      });

      element.onerror = (e) => reject(new Error("Error loading media"));

      try {
        element.load();
        if (type === 'video') element.currentTime = 0;
        setTimeout(waitLoad, 500);
      } catch (e) {
        reject(e);
      }
    });
  };

  const addClipToTrack = (
    type: TrackType,
    clip: Clip,
    targetTrackId?: string
  ) => {
    setTracks((prev: any) => {
      let idx = -1;
      if (targetTrackId) {
        idx = prev.findIndex((t: any) => t.id === targetTrackId);
      }
      if (idx === -1) {
        idx = prev.findIndex((t: any) => t.type === type);
      }

      if (idx >= 0) {
        const nt = [...prev];
        nt[idx] = { ...nt[idx], clips: [...nt[idx].clips, clip] };
        return nt;
      }
      // Fallback if track doesn't exist
      return [
        ...prev,
        { id: generateId(), name: `${type} Track`, type, clips: [clip] },
      ];
    });
  };

  const checkAutoResizeCanvas = (width?: number, height?: number) => {
    // PREVENT "THIN STRIP" BUG ON MOBILE:
    // if (isMobile) return;

    // If this is the first video clip being added, resize canvas to match it
    const hasClips = tracks.some((t: any) => t.type === TrackType.VIDEO && t.clips.length > 0);
    if (!hasClips && width && height) {
      setCanvasSettings((prev: any) => ({ ...prev, width, height }));
    }
  };

  const handleAddObject = (url: string, name: string) => {
    const id = generateId();
    const clip: Clip = {
      id,
      name,
      source: url,
      startOffset: currentTime,
      mediaStartOffset: 0,
      duration: 5,
      type: TrackType.OBJECT,
      properties: {
        x: 50, y: 50,
        scaleX: 1, scaleY: 1,
        rotation: 0,
        opacity: 1,
        width: 100, height: 100 // Defaults, will be updated by fabric load
      }
    };
    addClipToTrack(TrackType.OBJECT, clip);
    handleSelectClip(id, true);
    if (isMobile) setActiveTab(null);
  };

  const handleAddVecteezyObject = (url: string, name: string) => {
    const id = generateId();
    const clip: Clip = {
      id,
      name,
      source: url,
      startOffset: currentTime,
      mediaStartOffset: 0,
      duration: 5,
      type: TrackType.OBJECT,
      properties: {
        x: 50, y: 50,
        scaleX: 1, scaleY: 1,
        rotation: 0,
        opacity: 1,
        width: 100, height: 100 // Defaults, will be updated by fabric load
      }
    };
    addClipToTrack(TrackType.OBJECT, clip);
    handleSelectClip(id, true);
    if (isMobile) setActiveTab(null);
  };

  const handleAddOverlay = async (url: string, name: string) => {
    const id = generateId();
    let clipDuration = 5;
    try {
      const meta = await loadMediaResource(url, 'video');
      if (Number.isFinite(meta.duration)) clipDuration = meta.duration;
    } catch (e) { console.warn("Could not determine duration, using default"); }

    const clip: Clip = {
      id,
      name: name,
      source: url,
      startOffset: currentTime,
      mediaStartOffset: 0,
      duration: clipDuration,
      type: TrackType.VIDEO,
      properties: {
        volume: 0,
        blendMode: 'screen'
      }
    };

    setTracks(prev => {
      const effectTrackIndex = prev.findIndex(t => t.name === 'Effects' && t.type === TrackType.VIDEO);
      if (effectTrackIndex >= 0) {
        const newTracks = [...prev];
        newTracks[effectTrackIndex] = {
          ...newTracks[effectTrackIndex],
          clips: [...newTracks[effectTrackIndex].clips, clip]
        };
        return newTracks;
      } else {
        let lastVideoIndex = -1;
        prev.forEach((t, i) => { if (t.type === TrackType.VIDEO) lastVideoIndex = i; });
        const newTrack: Track = {
          id: generateId(),
          name: 'Effects',
          type: TrackType.VIDEO,
          clips: [clip],
          isMuted: true,
          isHidden: false
        };
        const newTracks = [...prev];
        if (lastVideoIndex >= 0) {
          newTracks.splice(lastVideoIndex + 1, 0, newTrack);
        } else {
          newTracks.unshift(newTrack);
        }
        return newTracks;
      }
    });

    if (currentTime + clipDuration > duration) {
      setDuration(Math.ceil(currentTime + clipDuration + 5));
    }
    if (isMobile) setActiveTab(null);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: TrackType
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const url = URL.createObjectURL(file);
    try {
      const meta = await loadMediaResource(
        url,
        type === TrackType.VIDEO ? "video" : "audio"
      );

      if (type === TrackType.VIDEO) {
        checkAutoResizeCanvas(meta.width, meta.height);
      }

      addClipToTrack(type, {
        id: generateId(),
        name: file.name,
        source: url,
        startOffset: currentTime,
        mediaStartOffset: 0,
        duration: meta.duration || 10,
        type,
        properties: { volume: 1, x: 50, y: 50 },
      });
      if (currentTime + (meta.duration || 10) > duration)
        setDuration(Math.ceil(currentTime + meta.duration + 5));
    } catch (e) {
      alert("Failed to load");
    }
  };

  const handleStockMediaAdd = async (
    url: string,
    type: TrackType,
    targetTrackId?: string
  ) => {
    const id = generateId();
    const trackType = type.toUpperCase() === TrackType.VIDEO ? TrackType.VIDEO : TrackType.IMAGE;
    let clipDuration = 5;
    let loaded = false;
    try {
      if (trackType === TrackType.VIDEO) {
        const meta = await loadMediaResource(url, 'video');
        if (Number.isFinite(meta.duration)) { clipDuration = meta.duration; loaded = true; }
        checkAutoResizeCanvas(meta.width, meta.height);
      } else { loaded = true; }

      const properties: LayerProperties = {
        volume: 1,
        x: 50,
        y: 50,
        scaleX: 1,
        scaleY: 1,
      };
      if (targetTrackId === "track-effects") {
        properties.blendMode = "screen";
      }

      if (loaded) {
        addClipToTrack(trackType, {
          id,
          name: trackType === TrackType.VIDEO ? 'Stock Video' : 'Stock Image',
          source: url,
          startOffset: currentTime,
          mediaStartOffset: 0,
          duration: clipDuration,
          type: trackType,
          properties
        });
        if (currentTime + clipDuration > duration) setDuration(Math.ceil(currentTime + clipDuration + 5));
      }
    } catch (e) {
      addClipToTrack(trackType, { id, name: 'Stock Media', source: url, startOffset: currentTime, mediaStartOffset: 0, duration: 10, type: trackType, properties: { volume: 1, x: 50, y: 50 }, });
    }
    if (isMobile) setActiveTab(null);
  };

  const handleAudioAdd = async (url: string) => {
    try {
      const meta = await loadMediaResource(url, "audio");
      addClipToTrack(TrackType.AUDIO, {
        id: generateId(),
        name: "Audio",
        source: url,
        startOffset: currentTime,
        mediaStartOffset: 0,
        duration: meta.duration || 10,
        type: TrackType.AUDIO,
        properties: {
          volume: 1,
          x: 50,
          y: 50,
          fontSize: 60,
          color: "#ffffff",
          scaleX: 1,
          scaleY: 1,
          shadowColor: "#000000",
          stroke: "#000000",
          lyricOffset: 1,
          customDuration: 0,
        },
      });
      if (currentTime + (meta.duration || 10) > duration)
        setDuration(Math.ceil(currentTime + meta.duration + 5));
    } catch (e) { }
    if (isMobile) setActiveTab(null);
  };

  const handleVoiceAdd = async (url: string, recordingTime: number) => {
    const id = generateId();
    let clipDuration = recordingTime + 1 || 5;
    try {
      addClipToTrack(TrackType.VOICE, {
        id,
        name: 'Voice',
        source: url,
        startOffset: currentTime,
        mediaStartOffset: 0,
        duration: clipDuration,
        type: TrackType.VOICE,
        properties: { 
          volume: 1, 
          audioEffect: 'none', 
          customDuration: 0,
        }
      });
      if (currentTime + clipDuration > duration) setDuration(Math.ceil(currentTime + clipDuration + 5));
    } catch (e) { alert("Failed to add Voice"); }
    if (isMobile) setActiveTab(null);
  };

  const handleAddText = (opt?: any) => {
    const id = generateId();
    addClipToTrack(TrackType.TEXT, {
      id,
      name: opt?.text || "Text",
      source: "",
      startOffset: currentTime,
      mediaStartOffset: 0,
      duration: 5,
      type: TrackType.TEXT,
      properties: {
        text: opt?.text || "Text",
        x: 50,
        y: 50,
        fontSize: opt?.fontSize || 60,
        fontFamily: opt?.fontFamily || 'Inter',
        fontWeight: opt?.fontWeight || 600,
        color: "#ffffff",
        scaleX: 1,
        scaleY: 1,
        animation: opt?.animation,
          shadowColor: "#000000",
          stroke: "#000000"
      },
    });
    handleSelectClip(id, true);
    if (isMobile) setActiveTab(null);
  };

  const handleAddVisualizer = (type: 'bars' | 'wave' | 'circle' | 'dots' | 'mirror' | 'blocks') => {
    const existing = tracks.find(t => t.id === 'track-visualizer')?.clips.find(c => c.properties.visualizerType === type);
    if (existing) {
      handleDeleteClip(existing.id);
      return;
    }

    const id = generateId();
    addClipToTrack(TrackType.VISUALIZER, {
      id,
      name: `Visualizer (${type})`,
      source: '',
      startOffset: currentTime,
      mediaStartOffset: 0,
      duration: 5,
      type: TrackType.VISUALIZER,
      properties: {
        x: 50, y: 80,
        visualizerType: type,
        visualizerColor: '#4f46e5',
        visualizerCount: type === 'circle' ? 60 : 30,
        opacity: 0.8,
        scaleX: 1,
        scaleY: 1,
        visualizerSpeed: 1,
        visualizerThickness: 4,
        visualizerGap: 4
      }
    });
    handleSelectClip(id, true); if (isMobile) setActiveTab(null);
  };

  const handleUpdateClip = (clipId: string, updates: Partial<Clip>) => {
    setTracks((prev: any) =>
      prev.map((t: any) => ({
        ...t,
        clips: t.clips.map((c: any) =>
          c.id !== clipId
            ? c
            : {
              ...c,
              ...updates,
              properties: { ...c.properties, ...updates.properties },
            }
        ),
      }))
    );
  };

  const handleDeleteClip = (clipId: string) => {
    setTracks((prev: any) =>
      prev.map((t: any) =>
        t.id === "track-effects"
          ? { ...t, clips: t.clips.filter((c: any) => c.id !== clipId) }
          : { ...t, clips: t.clips.filter((c: any) => c.id !== clipId) }
      )
    );
    handleSelectClip(null);
  };
  const handleToggleTrackMute = (id: string) => {
    setTracks((prev: any) =>
      prev.map((t: any) => (t.id === id ? { ...t, isMuted: !t.isMuted } : t))
    );
  };
  const handleToggleTrackHide = (id: string) => {
    setTracks((prev: any) =>
      prev.map((t: any) => (t.id === id ? { ...t, isHidden: !t.isHidden } : t))
    );
  };

  const selectedClip =
    tracks.flatMap((t: any) => t.clips).find((c: any) => c.id === selectedClipId) || null;

  if (isLoading || error) {
    return "";
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-white dark:bg-[#09090b] text-gray-900 dark:text-white overflow-hidden font-sans">
      <ToastContainer aria-label="alert" position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      <header className="h-14 border-b border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#09090b] flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-2">
          {/* <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-white">
            V
          </div> */}
          <span className="font-semibold text-lg hidden sm:block">
            Video Editor
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#18181b] rounded-lg p-1 border border-gray-200 h-10 md:h-auto dark:border-[#27272a]">
            <button
              onClick={() => setZoom(Math.max(10, zoom - 10))}
              className="px-2 py-1 text-s text-gray-400"
            >
              -
            </button>
            <span className="text-s text-gray-900 dark:text-white w-8 text-center">
              {Math.round(zoom)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="px-2 py-1 text-s text-gray-400"
            >
              +
            </button>
          </div>

          <Button size="s" variant="ghost" className="hidden lg:flex p-2" icon={<Layout size={14} />} onClick={() => setActiveTab('templates')}>Templates</Button>

          <div className="flex items-center bg-gray-100 dark:bg-[#18181b] rounded-lg p-0.5 border border-gray-200 dark:border-[#3f3f46]">
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)} className="bg-gray-100 dark:bg-[#18181b] text-s px-2 h-7 outline-none border-none focus:ring-0 cursor-pointer mr-2">
              <option value="webm">WEBM</option>
              <option value="mp4">MP4</option>
              <option value="gif">GIF</option>
            </select>
            <Button size="" className="h-7 text-s rounded-md px-3" icon={isExporting ? <Loader2 className="animate-spin" size={12} /> : <Download size={14} />} onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'Exporting' : 'Export'}
            </Button>
            <button
              onClick={() => setActiveTab('templates')}
              className="block p-2 text-gray-400 ml-2"
            >
              <Layout size={20} />
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="block p-2 text-gray-400"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

        </div>
      </header>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        <div
          ref={sidebarRef}
          onMouseDown={onSidebarMouseDown}
          onMouseLeave={onSidebarMouseLeave}
          onMouseUp={onSidebarMouseUp}
          onMouseMove={onSidebarMouseMove}
          className="order-last md:order-first w-full md:w-[70px] h-16 md:h-full flex flex-row md:flex-col items-center justify-start md:justify-start md:py-4 gap-4 md:gap-6 border-t md:border-r border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#18181b] z-30 shrink-0 overflow-x-auto"
        >
          <button
            onClick={() =>
              setActiveTab(activeTab === "settings" ? null : "settings")
            }
            className={`flex flex-col items-center ml-2 ${isMobile ? "" : "gap-1" } transition-colors ${activeTab === "settings" ? "text-primary-600" : "text-gray-400"
              }`}
          >
            <div
              className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-colors ${activeTab === "settings"
                  ? "bg-primary-50 dark:bg-[#27272a]"
                  : "hover:bg-gray-100 dark:hover:bg-[#27272a]"
                }`}
            >
              <Settings size={20} />
            </div>
            <span className="text-[9px] font-medium">Settings</span>
          </button>
          <div className={`flex flex-col items-center ${isMobile ? "" : "gap-1" } group cursor-pointer md:w-full relative`}>
            <label className="w-8 h-8 md:w-10 md:h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-[#27272a] flex items-center justify-center cursor-pointer transition-colors">
              <Video size={20} className="text-gray-400" />
              <input
                type="file"
                accept="video/mp4,video/webm"
                className="hidden"
                onChange={(e) => handleFileUpload(e, TrackType.VIDEO)}
              />
            </label>
            <span className="text-[9px] text-gray-400 font-medium">Video</span>
          </div>
          {[
            // { id: 'templates', icon: Layout, label: 'Templates' }, 
            { id: 'subtitles', icon: Languages, label: 'Subtitles' }, 
            // { id: 'visualizers', icon: Waves, label: 'Waves' },
            { id: "img2vid", icon: Sparkles, label: "Img2Vid" },
            { id: "txt2vid", icon: Clapperboard, label: "Txt2Vid" },
            { id: "audio", icon: Music, label: "Audio" },
            { id: "text", icon: Type, label: "Text" },
            { id: "objects", icon: Shapes, label: "Objects" },
            { id: "overlays", icon: Layers, label: "Effects" },
            { id: "uploads", icon: UploadCloud, label: "Uploads" },
            { id: "voice", icon: Mic, label: "Voice" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() =>
                setActiveTab(activeTab === item.id ? null : (item.id as any))
              }
              className={`flex flex-col items-center ${isMobile ? "" : "gap-1"} transition-colors ${activeTab === item.id ? "text-primary-600" : "text-gray-400"
                } ${item.id === 'voice' ? 'mr-2 ' : ''}`}
            >
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-colors ${activeTab === item.id
                    ? "bg-primary-50 dark:bg-[#27272a]"
                    : "hover:bg-gray-100 dark:hover:bg-[#27272a]"
                  }`}
              >
                <item.icon size={20} />
              </div>
              <span className="text-[9px] font-medium whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </div>
        {activeTab && (
          <div className="absolute inset-0 z-50 md:static md:z-0 md:inset-auto h-full w-full md:w-auto bg-white dark:bg-[#18181b] flex flex-col">
            {activeTab === "settings" && (
              <SettingsPanel
                settings={canvasSettings}
                duration={duration}
                onUpdateSettings={(newSettings) => setCanvasSettings(prev => ({ ...prev, ...newSettings }))}
                onUpdateDuration={setDuration}
                onClose={() => setActiveTab(null)}
              />
            )}
            {activeTab === 'templates' && (
              <TemplatesPanel 
                tracks={tracks} 
                settings={canvasSettings} 
                duration={duration} 
                projectName={projectName} 
                onLoadProject={handleLoadProject} 
                onClose={() => setActiveTab(null)} 
              />
            )}
            {activeTab === "uploads" && (
              <UploadsPanel
                onAddMedia={handleStockMediaAdd}
                onClose={() => setActiveTab(null)}
              />
            )}
            {activeTab === "voice" && (
              <VoicePanel
                onAddVoice={(url, time) => handleVoiceAdd(url, time)}
                onClose={() => setActiveTab(null)}
              />
            )}
            {activeTab === "objects" && (
              <ObjectsPanel
                onAddObject={handleAddObject}
                onVecteezyAddObject={handleStockMediaAdd}
                onClose={() => setActiveTab(null)}
              />
            )}
            {activeTab === "overlays" && (
              <OverlaysPanel
                onAddOverlay={handleAddOverlay}
                onClose={() => setActiveTab(null)}
              />
            )}
            {activeTab === "img2vid" && (
              <Img2VidPanel
                onAddMedia={handleStockMediaAdd}
                onClose={() => setActiveTab(null)}
              />
            )}
            {activeTab === "txt2vid" && (
              <Txt2VidPanel
                onAddMedia={handleStockMediaAdd}
                onClose={() => setActiveTab(null)}
              />
            )}
            {activeTab === "text" && (
              <TextResourcesPanel
                onAddText={handleAddText}
                onClose={() => setActiveTab(null)}
              />
            )}
            {activeTab === "audio" && (
              <AudioResourcesPanel
                onAddAudio={handleAudioAdd}
                onClose={() => setActiveTab(null)}
              />
            )}
            {activeTab === 'subtitles' && (
              <SubtitlesPanel 
                tracks={tracks} 
                onAddSubtitles={(subs, trackId) => handleUpdateClip(trackId, { properties: { lyrics: subs } })} 
                onUpdateClip={handleUpdateClip} 
                onClose={() => setActiveTab(null)} 
              />
            )}
            {activeTab === 'visualizers' && (
              <VisualizersPanel 
                tracks={tracks} 
                onAddVisualizer={handleAddVisualizer} 
                onSelectClip={handleSelectClip} 
                onClose={() => setActiveTab(null)} 
              />
            )}
          </div>
        )}
        <div className="flex-1 bg-gray-50 dark:bg-[#09090b] flex items-center justify-center relative overflow-hidden min-h-0">
          <div className="absolute inset-0 flex items-center justify-center p-0 md:p-8">
            <Player
              ref={playerRef}
              tracks={tracks}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onTimeUpdate={setCurrentTime}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              selectedClipId={selectedClipId}
              onSelectClip={handleSelectClip}
              onUpdateClip={handleUpdateClip}
              playheadRef={playheadRef}
              timeDisplayRef={timeDisplayRef}
              zoom={zoom}
              canvasSettings={canvasSettings}
              isMobile={isMobile}
            />
          </div>
          {isMobile && selectedClip && !showPropPanel && (
            <button
              onClick={() => setShowPropPanel(true)}
              className="absolute bottom-2 right-2 z-40 bg-white dark:bg-[#18181b] px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-[#3f3f46] text-sm flex items-center gap-2"
            >
              <Edit2 size={16} /> Edit
            </button>
          )}
        </div>
        {selectedClip && (showPropPanel || !isMobile) && (
          <div className="absolute inset-0 z-50 md:static md:z-0 md:inset-auto h-full w-full md:w-[300px] shrink-0 border-l border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#18181b]">
            <PropertiesPanel
              clip={selectedClip}
              onUpdateClip={handleUpdateClip}
              onDeleteClip={handleDeleteClip}
              onClose={() => handleSelectClip(null)}
              initialTab={propPanelTab}
              initialTransitionSide={propPanelSide}
            />
          </div>
        )}
      </div>
      <div className="h-[150px] md:h-[320px] shrink-0 z-20 shadow-lg relative">
        <Timeline
          tracks={tracks}
          duration={duration}
          zoom={zoom}
          onSeek={setCurrentTime}
          currentTime={currentTime}
          selectedClipId={selectedClipId}
          onSelectClip={handleSelectClip}
          onUpdateClip={handleUpdateClip}
          onToggleTrackMute={handleToggleTrackMute}
          onToggleTrackHide={handleToggleTrackHide}
          onPause={() => setIsPlaying(false)}
          onZoomChange={setZoom}
          onOpenTransition={handleOpenTransition}
          playheadRef={playheadRef}
        />
      </div>
    </div>
  );
};

export default App;
