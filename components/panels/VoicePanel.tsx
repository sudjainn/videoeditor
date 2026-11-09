import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Plus, ChevronsLeft, AlertCircle, RefreshCw, Sparkles, Cpu, ChevronDown } from 'lucide-react';
import { Button } from '../Button';
import { generateAudioFromText } from '../../services/geminiService';

interface VoicePanelProps {
  onAddVoice: (url: string) => void;
  onClose: () => void;
}

const VOICES = [
  { name: 'Zephyr', label: 'Zephyr (Cool & Calm)' },
  { name: 'Puck', label: 'Puck (Cheerful & High)' },
  { name: 'Charon', label: 'Charon (Deep & Professional)' },
  { name: 'Kore', label: 'Kore (Warm & Kind)' },
  { name: 'Fenrir', label: 'Fenrir (Strong & Clear)' },
];

export const VoicePanel: React.FC<VoicePanelProps> = ({ onAddVoice, onClose }) => {
  const [activeTab, setActiveTab] = useState<'record' | 'ai'>('record');
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI Voice State
  const [ttsText, setTtsText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [isGenerating, setIsGenerating] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeMimeTypeRef = useRef<string>('audio/webm');

  // useEffect(() => {
  //   return () => {
  //     if (timerRef.current) window.clearInterval(timerRef.current);
  //     if (audioUrl && audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
  //     if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
  //         mediaRecorderRef.current.stop();
  //     }
  //   };
  // }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Helper: Convert raw PCM to WAV for browser playback
  const pcmToWav = (pcmData: Uint8Array, sampleRate: number = 24000): Blob => {
    const buffer = new ArrayBuffer(44 + pcmData.length);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcmData.length, true);

    const pcmUint8 = new Uint8Array(buffer, 44);
    pcmUint8.set(pcmData);

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const handleGenerateAI = async () => {
    if (!ttsText.trim()) return;
    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {      
      // Call backend endpoint which handles authentication and credits
      const base64Audio = await generateAudioFromText(ttsText, selectedVoice);

      if (!base64Audio) throw new Error("No audio data returned from AI");

      const pcmData = decodeBase64(base64Audio);
      const wavBlob = pcmToWav(pcmData);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
    } catch (err: any) {
      console.error(err);
      setError("AI generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    setAudioUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
          ? 'audio/mp4' 
          : 'audio/aac';
      
      activeMimeTypeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: activeMimeTypeRef.current });
        
        //did this change for voice testing 
        if (audioUrl && audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl);
        }
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error(err);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch (e) {
      console.error("Error stopping recording:", e);
    } finally {
      setIsRecording(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePreview = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => {
        console.error("Playback failed", e);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleAddToTimeline = () => {
    if (audioUrl) {
      onAddVoice(audioUrl, recordingTime);
      onClose();
    }
  };

  const handleReset = () => {
      if(audioUrl && audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setRecordingTime(0);
      setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#18181b] border-r border-gray-200 dark:border-[#27272a] w-full md:w-[320px]">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#27272a]">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Mic size={18} className="text-primary-500" /> Voiceover
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ChevronsLeft size={20} />
        </button>
      </div>

      <div className="flex border-b border-gray-200 dark:border-[#27272a]">
        <button
          onClick={() => setActiveTab('record')}
          className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${activeTab === 'record' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/5' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          Record
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${activeTab === 'ai' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/5' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          AI Voice
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {activeTab === 'record' ? (
          <div className="flex flex-col items-center justify-center gap-8 py-8">
            <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white tabular-nums">
              {formatTime(recordingTime)}
            </div>

            <div className="relative">
                 {isRecording && (
                     <div className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-20"></div>
                 )}
                 {!isRecording && !audioUrl ? (
                     <button 
                        onClick={startRecording}
                        className="relative w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                     >
                        <Mic size={32} />
                     </button>
                 ) : isRecording ? (
                     <button 
                        onClick={stopRecording}
                        className="relative w-20 h-20 rounded-full bg-white border-4 border-red-500 flex items-center justify-center text-red-500 shadow-lg transition-all hover:scale-105 active:scale-95"
                     >
                        <Square size={32} fill="currentColor" />
                     </button>
                 ) : (
                    <div className="flex gap-4">
                        <button 
                            onClick={togglePreview}
                            className="w-16 h-16 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center text-white shadow-lg transition-all"
                        >
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                        </button>
                        <button 
                            onClick={handleReset}
                            className="w-16 h-16 rounded-full bg-gray-200 dark:bg-[#3f3f46] hover:bg-gray-300 dark:hover:bg-[#52525b] flex items-center justify-center text-gray-600 dark:text-gray-200 shadow-lg transition-all"
                        >
                            <RefreshCw size={24} />
                        </button>
                    </div>
                 )}
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {isRecording ? "Recording in progress..." : audioUrl ? "Recording complete!" : "Press the mic to start recording"}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-100 dark:border-primary-800 flex items-center gap-3">
                <Sparkles size={20} className="text-primary-500 shrink-0" />
                <p className="text-[11px] text-primary-700 dark:text-primary-300">Convert your script into a natural-sounding AI voiceover in seconds.</p>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Voice Style</label>
                <div className="relative">
                    <select 
                        value={selectedVoice} 
                        onChange={(e) => {
                          handleReset();
                          setSelectedVoice(e.target.value)
                        }}
                        className="w-full appearance-none bg-gray-50 dark:bg-[#27272a] text-gray-900 dark:text-white px-3 py-2.5 rounded-lg border border-gray-300 dark:border-[#3f3f46] text-sm focus:outline-none focus:border-primary-500 cursor-pointer"
                    >
                        {VOICES.map(v => <option key={v.name} value={v.name}>{v.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Script</label>
                <textarea 
                    value={ttsText}
                    onChange={(e) => {
                      handleReset();
                      setTtsText(e.target.value)
                    }}
                    placeholder="Enter the text you want the AI to speak..."
                    className="w-full h-32 bg-gray-50 dark:bg-[#27272a] text-gray-900 dark:text-white p-3 rounded-lg border border-gray-300 dark:border-[#3f3f46] text-sm focus:outline-none focus:border-primary-500 resize-none placeholder:text-gray-400"
                />
            </div>

            {!audioUrl ? (
                <Button 
                    onClick={handleGenerateAI} 
                    disabled={isGenerating || !ttsText.trim()} 
                    className="w-full"
                    variant="primary"
                    icon={isGenerating ? <Cpu className="animate-spin" size={16} /> : <Sparkles size={16} />}
                >
                    {isGenerating ? "Generating..." : "Generate AI Voice"}
                </Button>
            ) : (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-[#27272a] rounded-lg border border-gray-200 dark:border-[#3f3f46] animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary-500 flex items-center gap-1"><Sparkles size={12}/> AI Audio Ready</span>
                        <button onClick={handleReset} className="text-[10px] text-gray-500 hover:text-red-500 transition-colors">Discard</button>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={togglePreview}
                            className="flex-1 py-2 bg-white dark:bg-[#3f3f46] border border-gray-200 dark:border-[#52525b] rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-[#52525b] transition-colors"
                        >
                            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                            {isPlaying ? "Pause" : "Preview"}
                        </button>
                    </div>
                </div>
            )}
          </div>
        )}

        {/* Global Action: Add to Timeline */}
        {audioUrl && (
            <div className="mt-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Button onClick={handleAddToTimeline} className="w-full" size="lg" icon={<Plus size={18} />}>
                    Add to Timeline
                </Button>
            </div>
        )}

        {error && (
            <div className="flex items-start gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/10 p-3 rounded border border-red-200 dark:border-red-900/20">
                <AlertCircle size={14} className="shrink-0 mt-0.5" /> 
                <div className="space-y-1">
                  <p className="font-semibold">Error:</p>
                  <p className="font-mono text-[10px] break-words">{error}</p>
                  <p className="text-[9px] text-gray-500 mt-2">Check browser console for more details</p>
                </div>
            </div>
        )}

        <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setIsPlaying(false)} className="hidden" />
      </div>
    </div>
  );
};
