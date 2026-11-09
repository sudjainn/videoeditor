import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ChevronsLeft, Download, Upload, Save, AlertCircle, Layout, Loader2, Trash2, FileJson, Archive, Edit2, Check, X as CloseIcon } from 'lucide-react';
import { Track, CanvasSettings, Clip } from '../../types';

interface TemplatesPanelProps {
  tracks: Track[];
  settings: CanvasSettings;
  duration: number;
  projectName: string;
  onLoadProject: (data: any) => void;
  onClose: () => void;
}

const LIBRARY_TEMPLATES = [
  { id: 't1', title: 'Black Friday Sale', thumb: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80' },
  { id: 't2', title: 'Daily Quote', thumb: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&q=80' },
  { id: 't3', title: 'Fashion Collection', thumb: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80' },
  { id: 't4', title: 'Social Media Tips', thumb: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&q=80' },
  { id: 't5', title: 'Valentine\'s Day', thumb: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=80' },
  { id: 't6', title: 'Data Analyst', thumb: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80' },
];

const DB_NAME = 'VideoEditorDB';
const STORE_NAME = 'projects';
const DB_VERSION = 2;

const BASE_URL = window.location.origin;
const API_BASE_URL = `${BASE_URL}/index.php/social-media/ai_project/ai_project`;

async function compressData(text: string): Promise<ArrayBuffer> {
  const stream = new Blob([text]).stream().pipeThrough(new (window as any).CompressionStream('gzip'));
  return await new Response(stream).arrayBuffer();
}

async function decompressData(buffer: ArrayBuffer): Promise<string> {
  const stream = new Blob([buffer]).stream().pipeThrough(new (window as any).DecompressionStream('gzip'));
  return await new Response(stream).text();
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function smartLoadTemplate(data: ArrayBuffer | string): Promise<any> {
  let buffer: ArrayBuffer;

  // 1. Check if data is a Base64 string (from API) and convert to ArrayBuffer
  if (typeof data === 'string') {
    try {
      buffer = base64ToArrayBuffer(data);
    } catch (e) {
      console.error("Failed to decode base64 data", e);
      // If it's a string but not base64, it might be raw JSON string
      return JSON.parse(data);
    }
  } else {
    buffer = data;
  }

  // 2. Original logic to handle compression and parsing
  const uint8 = new Uint8Array(buffer);
  const isCompressed = uint8.length > 2 && uint8[0] === 0x1f && uint8[1] === 0x8b;
  
  try {
    const jsonText = isCompressed 
      ? await decompressData(buffer) 
      : new TextDecoder().decode(buffer);
    return JSON.parse(jsonText);
  } catch (e) {
    // Fallback for non-standard encoding
    const jsonText = new TextDecoder('utf-8').decode(buffer);
    return JSON.parse(jsonText);
  }
}

const dbService_old = {
  async getAll(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/get_all_projects`);
      if (response.ok) {
        const remoteProjects = await response.json();
        return remoteProjects;
      }
    } catch (error) {
      console.error('Failed to fetch from API, falling back to local:', error);
    }
  },

  async save(id: string, title: string, exportedAt: string, data: ArrayBuffer, project_id?: string): Promise<void> {
    const base64Data = btoa(
      new Uint8Array(data).reduce((acc, byte) => acc + String.fromCharCode(byte), '')
    );

    const formData = new FormData();
    formData.append('id', id);
    formData.append('title', title);
    formData.append('exportedAt', exportedAt);
    formData.append('data', base64Data);
    if (project_id) {
      formData.append('project_id', project_id);
    }

    const response = await fetch(`${API_BASE_URL}/save_project`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to sync with server');
    }
  },

  async updateProject(id: string, updates: Partial<{ title: string }>): Promise<void> {
    const formData = new FormData();
    formData.append('id', id);
    if (updates.title) formData.append('title', updates.title);

    await fetch(`${API_BASE_URL}/update_project`, {
      method: 'POST',
      body: formData
    });
  },

  async delete(id: string): Promise<void> {
    const formData = new FormData();
    formData.append('id', id);
    await fetch(`${API_BASE_URL}/delete_project`, {
      method: 'POST',
      body: formData
    });
  }
};

const dbService = {
  open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event: any) => {
        const db = request.result;
        if (db.objectStoreNames.contains(STORE_NAME)) {
           db.deleteObjectStore(STORE_NAME);
        }
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAll(): Promise<any[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result || [];
        results.sort((a, b) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async save(id: string, title: string, exportedAt: string, data: ArrayBuffer): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id, title, exportedAt, data });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async updateProject(id: string, updates: Partial<{ title: string }>): Promise<void> {
    const db = await this.open();
    const record: any = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (!record) throw new Error("Record not found");
    let updatedData = record.data;
    if (updates.title) {
      try {
        const jsonText = await decompressData(record.data);
        const json = JSON.parse(jsonText);
        if (json.project) {
          json.project.title = updates.title;
          updatedData = await compressData(JSON.stringify(json));
        }
      } catch(e) { console.error("Rename internal failed", e); }
    }
    const updatedRecord = { ...record, ...updates, data: updatedData };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(updatedRecord);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async delete(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
};

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  tracks,
  settings,
  duration,
  projectName,
  onLoadProject,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'mine'>('library');
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSavedProjects = async () => {
    try {
      const updated = await dbService.getAll();
      setSavedProjects(updated);
    } catch (e) { console.error("Fetch projects failed", e); }
  };

  useEffect(() => { fetchSavedProjects(); }, []);

  // Aggressive serialization cleanup to prevent circular reference errors
  const sanitizeValue = (val: any): any => {
    if (val === null || val === undefined) return val;
    const type = typeof val;
    if (type !== 'object') return val;
    if (Array.isArray(val)) return val.map(sanitizeValue);
    
    // Check for DOM elements or standard circular culprits
    if (val.nodeType || val instanceof Window || val instanceof Document) return undefined;
    if (val.constructor && ['HTMLAudioElement', 'HTMLVideoElement', 'HTMLImageElement', 'HTMLElement'].includes(val.constructor.name)) {
      return undefined;
    }

    const clean: any = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        // Skip React internals and circular pointers
        if (key.startsWith('__react') || key.startsWith('__fiber') || key === 'stateNode' || key === 'updater') continue;
        
        const sanitized = sanitizeValue(val[key]);
        if (sanitized !== undefined) {
          clean[key] = sanitized;
        }
      }
    }
    return clean;
  };

  const urlToBase64 = async (url: string): Promise<string> => {
    if (!url || url.startsWith('data:')) return url;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) { return url; }
  };

  const generateProjectObject = async () => {
    const encodedTracks = await Promise.all(tracks.map(async (track) => {
      const sanitizedTrack = sanitizeValue(track);
      const encodedClips = await Promise.all(track.clips.map(async (clip) => {
        const sanitizedClip = sanitizeValue(clip);
        const encodedSource = await urlToBase64(clip.source);
        return { ...sanitizedClip, source: encodedSource };
      }));
      return { ...sanitizedTrack, clips: encodedClips };
    }));
    return {
      project: {
        id: Date.now().toString(),
        title: projectName || `Project_${Date.now()}`,
        canvasSettings: sanitizeValue(settings),
        tracks: encodedTracks,
        duration: duration,
        exportedAt: new Date().toISOString()
      }
    };
  };

  const handleSave = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const projectObj = await generateProjectObject();
      const json = JSON.stringify(projectObj);
      const compressed = await compressData(json);
      await dbService.save(projectObj.project.id, projectObj.project.title, projectObj.project.exportedAt, compressed);
      await fetchSavedProjects();
      toast.success("Template saved!");
    } catch (e: any) {
      console.error(e);
      toast.error(`Image upload failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally { setIsProcessing(false); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (window.confirm("Delete this template?")) {
      setIsProcessing(true);
      try {
        await dbService.delete(id);
        await fetchSavedProjects();
      } catch (err) { 
        toast.error("Delete failed.");
      } finally { setIsProcessing(false); }
    }
  };

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); setEditingId(id); setTempTitle(currentTitle);
  };

  const handleFinishRename = async (id: string) => {
    if (!tempTitle.trim()) { setEditingId(null); return; }
    setIsProcessing(true);
    try {
      await dbService.updateProject(id, { title: tempTitle.trim() });
      await fetchSavedProjects();
    } catch (e) { toast.error("Rename failed."); } finally { setEditingId(null); setIsProcessing(false); }
  };

  const handleExport = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const projectObj = await generateProjectObject();
      const json = JSON.stringify(projectObj);
      const compressed = await compressData(json);
      const blob = new Blob([compressed], { type: 'application/x-gzip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectObj.project.title}.rvc.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { toast.error("Export failed."); } finally { setIsProcessing(false); }
  };

  const handleImportClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const json = await smartLoadTemplate(buffer);
        if (json.project) {
          onLoadProject(json.project);
          const compressed = await compressData(JSON.stringify(json));
          const importId = Date.now().toString() + "_" + Math.floor(Math.random() * 1000);
          await dbService.save(importId, json.project.title + " (Imported)", new Date().toISOString(), compressed);
          await fetchSavedProjects();
          toast.success("Import successful!");
        } else { throw new Error("Invalid template format."); }
      } catch (err: any) { toast.error(`Error importing: ${err.message}`); } finally { setIsProcessing(false); }
    };
    reader.readAsArrayBuffer(file); e.target.value = '';
  };

  const handleLoadFromStorage = async (record: any) => {
    setIsProcessing(true);
    try {
      const projectObj = await smartLoadTemplate(record.data);
      onLoadProject(projectObj.project);
    } catch (e) { 
      console.error("Load error:", e);
      toast.error("Error loading project."); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#18181b] border-r border-gray-200 dark:border-[#27272a] w-full md:w-[320px]">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#27272a]">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Layout size={18} className="text-primary-500" /> Templates
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ChevronsLeft size={20} />
        </button>
      </div>

      <div className="flex border-b border-gray-200 dark:border-[#27272a]">
        <button onClick={() => setActiveTab('library')} className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${activeTab === 'library' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/5' : 'border-transparent text-gray-500'}`}>Library</button>
        <button onClick={() => setActiveTab('mine')} className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${activeTab === 'mine' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/5' : 'border-transparent text-gray-500'}`}>My Templates</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 relative">
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-white/80 dark:bg-black/60 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
             <Loader2 className="animate-spin text-primary-500 mb-3" size={32} />
             <p className="text-sm font-bold text-gray-900 dark:text-white">Processing...</p>
          </div>
        )}

        {activeTab === 'library' ? (
          <div className="grid grid-cols-2 gap-3">
            {LIBRARY_TEMPLATES.map((item) => (
              <div key={item.id} className="group relative aspect-square bg-gray-100 dark:bg-[#27272a] rounded-lg overflow-hidden border border-transparent hover:border-primary-500 transition-all cursor-pointer">
                <img src={item.thumb} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold px-2 py-1 bg-primary-600 rounded shadow-sm">Apply</span>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1.5 backdrop-blur-sm">
                  <p className="text-[10px] text-white truncate font-medium">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              <button disabled={isProcessing} onClick={handleImportClick} className="flex flex-col items-center justify-center p-2 bg-gray-100 dark:bg-[#27272a] rounded-lg border border-gray-300 dark:border-[#3f3f46] hover:bg-gray-200 dark:hover:bg-[#3f3f46] transition-colors disabled:opacity-50">
                <Upload size={16} className="mb-1 text-gray-500" /><span className="text-[9px] font-bold uppercase">Import</span>
              </button>
              <button disabled={isProcessing} onClick={handleExport} className="flex flex-col items-center justify-center p-2 bg-gray-100 dark:bg-[#27272a] rounded-lg border border-gray-300 dark:border-[#3f3f46] hover:bg-gray-200 dark:hover:bg-[#3f3f46] transition-colors disabled:opacity-50">
                <Download size={16} className="mb-1 text-gray-500" /><span className="text-[9px] font-bold uppercase">Export</span>
              </button>
              <button disabled={isProcessing} onClick={handleSave} className="flex flex-col items-center justify-center p-2 bg-primary-600 rounded-lg text-white hover:bg-primary-500 transition-colors disabled:opacity-50 shadow-sm">
                <Save size={16} className="mb-1" /><span className="text-[9px] font-bold uppercase">Save New</span>
              </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>My Projects ({savedProjects.length})
              </h3>
              {savedProjects.length > 0 ? (
                <div className="space-y-2">
                  {savedProjects.map((p) => (
                    <div key={p.id} className="group flex flex-col p-3 bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#3f3f46] rounded-xl hover:border-primary-500 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          {editingId === p.id ? (
                            <div className="flex items-center gap-1 mb-1">
                              <input 
                                autoFocus
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFinishRename(p.id)}
                                onBlur={() => handleFinishRename(p.id)}
                                className="w-full bg-white dark:bg-[#09090b] border border-primary-500 rounded px-1.5 py-0.5 text-xs text-gray-900 dark:text-white"
                              />
                              <button onClick={() => handleFinishRename(p.id)} className="text-green-500 hover:scale-110"><Check size={14}/></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mb-1 group/title">
                              <p className="text-xs font-bold text-gray-900 dark:text-gray-200 truncate" title={p.title}>{p.title}</p>
                              <button onClick={(e) => handleStartRename(p.id, p.title, e)} className="opacity-0 group-hover/title:opacity-100 text-gray-400 hover:text-primary-500 transition-all"><Edit2 size={10}/></button>
                            </div>
                          )}
                          <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                            <Archive size={10} className="text-green-500" />
                            {p.exportedAt ? new Date(p.exportedAt).toLocaleString() : 'Recently saved'}
                          </p>
                        </div>
                        <button type="button" onClick={(e) => handleDelete(p.id, e)} className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Delete Template"><Trash2 size={14} /></button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleLoadFromStorage(p)} className="flex-1 py-1.5 bg-white dark:bg-[#3f3f46] border border-gray-200 dark:border-[#52525b] text-[10px] font-bold rounded-lg hover:bg-primary-500 hover:text-white transition-all shadow-sm">Load Project</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-6 bg-gray-50 dark:bg-[#27272a] rounded-xl border border-dashed border-gray-300 dark:border-[#3f3f46] text-center">
                  <Layout size={24} className="text-gray-300 mb-2" /><p className="text-xs text-gray-500">No saved templates yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-gray-200 dark:border-[#27272a] bg-gray-50/50 dark:bg-[#09090b]/50">
          <div className="flex items-start gap-2 text-[10px] text-gray-500"><AlertCircle size={12} className="shrink-0 mt-0.5" /><p>Templates are stored in browser IndexedDB. Manual "Delete" removes them permanently from this device.</p></div>
      </div>
    </div>
  );
};