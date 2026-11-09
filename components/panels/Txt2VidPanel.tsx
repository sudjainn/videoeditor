import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { ChevronsLeft, Loader2, Clapperboard, Video, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../Button';
import { useApiKeys } from '../../context/ApiKeyContext';

interface Txt2VidPanelProps {
  onAddMedia: (url: string, type: 'video') => void;
  onClose: () => void;
}

const BASE_URL = window.location.origin;
const API_PROXY_BASE = `${BASE_URL}/social-media/openai`;
const API_PROXY_BASE_VIDEO = `${BASE_URL}/index.php/social-media/ai_video_editor/ai_video_editor`;

const MODELS = [
  { label: 'Kling 2.6', value: 'kling-v2-6' },
  { label: 'Hailuo Standard', value: 'hailuo-standard' },
  { label: 'Hailuo Pro', value: 'hailuo-pro' },
  { label: 'Wan v2.7', value: 'wan-v2-7' },
  // { label: 'Sora 2', value: 'sora-2' },
  { label: 'Google Veo 3.1 Lite', value: 'veo-3.1-lite-generate-preview' },
  { label: 'Grok Imagine Video', value: 'grok-imagine-video' },
];

const STYLES = [
  { label: 'Realistic', value: 'realistic' },
  { label: 'Anime', value: 'anime' },
  { label: '3D Render', value: '3d-render' },
  { label: 'Cyberpunk', value: 'cyberpunk' },
  { label: 'Cinematic', value: 'cinematic' },
];

const RESOLUTIONS = ['360p', '540p', '720p', '1080p'];
const MINIMAX_RESOLUTIONS = ['512P', '768P'];
const SORA_RESOLUTIONS = ['720p', '1080p'];
const VEO_RESOLUTIONS = ['720p', '1080p'];
const GROK_RESOLUTIONS = ['480p', '720p'];
const WAN_RESOLUTIONS = ['720p', '1080p'];

const ASPECT_RATIOS = [
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '1:1', value: '1:1' },
  { label: '4:3', value: '4:3' },
];

const KLING_ASPECT_RATIOS = [
  { label: '1:1', value: 'square_1_1' },
  { label: '16:9', value: 'widescreen_16_9' },
  { label: '9:16', value: 'social_story_9_16' },
];

const SORA_ASPECT_RATIOS = [
  { label: '16:9', value: '1280x720' },
  { label: '9:16', value: '720x1280' },
];

const VEO_ASPECT_RATIOS = [
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
];

const GROK_ASPECT_RATIOS = [
  { label: '1:1', value: '1:1' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
  { label: '3:2', value: '3:2' },
  { label: '2:3', value: '2:3' },
];

const WAN_ASPECT_RATIOS = [
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '1:1', value: '1:1' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
];

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }
  return response.json();
};

const updateVideoCredit = async (modalCreditName: string) => {
  const formData = new URLSearchParams();
  formData.append('modal_credit_name', modalCreditName);
  formData.append('usage', '1');

  try {
    const response = await fetch(`${BASE_URL}/social-media/file_manager/updateVideoCredit`, {
      method: 'POST',
      body: formData,
    });
    await handleResponse(response);
    console.log("Credit updated successfully.");
  } catch (error) {
    console.error("Failed to update credit:", error);
  }
};

const saveVideoFile = async (videoUrl: string): Promise<string> => {
  try {
    const response = await fetch(`${API_PROXY_BASE_VIDEO}/save_video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_url: videoUrl }),
    });

    const data = await handleResponse(response);

    if (data.success && data.video_url) {
      return data.video_url;
    } else {
      throw new Error(data.error || 'Failed to save video');
    }
  } catch (error) {
    console.error("Failed to save video file:", error);
    throw error;
  }
};

export const Txt2VidPanel: React.FC<Txt2VidPanelProps> = ({ onAddMedia, onClose }) => {
  const { apiKeys } = useApiKeys();
  const [model, setModel] = useState('kling-v2-6');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState<string>('');
  const [style, setStyle] = useState('realistic');
  const [resolution, setResolution] = useState('720p');
  const [duration, setDuration] = useState<string>('5');
  const [cfgScale, setCfgScale] = useState<number>(0.5);
  const [aspectRatio, setAspectRatio] = useState('square_1_1');
  const [promptOptimizer, setPromptOptimizer] = useState(true);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(true);

  const showNegPrompt = ['wan-v2-7'].includes(model);
  const showCfgScale = [].includes(model);
  const showAspectRatio = !['hailuo-standard', 'hailuo-pro'].includes(model);
  const showSeed = !['hailuo-standard', 'hailuo-pro', 'veo-3.1-lite-generate-preview'].includes(model);
  const showResolution = ['veo-3.1-lite-generate-preview', 'sora-2', 'grok-imagine-video', 'wan-v2-7'].includes(model);
  const showStyle = false;
  const showAdvancedToggle = ['kling-v2-6'].includes(model);
  const showDuration = !['hailuo-pro'].includes(model);
  const showPromptOptimizer = ['veo-3.1-lite-generate-preview', 'hailuo-pro'].includes(model);

  const activeAspectRatios = model === 'kling-v2-6' ? KLING_ASPECT_RATIOS : model === 'sora-2' ? SORA_ASPECT_RATIOS : model === 'veo-3.1-lite-generate-preview' ? VEO_ASPECT_RATIOS : model === 'grok-imagine-video' ? GROK_ASPECT_RATIOS : model === 'wan-v2-7' ? WAN_ASPECT_RATIOS : ASPECT_RATIOS;
  const activeResolutions = model === 'hailuo-standard' ? MINIMAX_RESOLUTIONS : model === 'sora-2' ? SORA_RESOLUTIONS : model === 'veo-3.1-lite-generate-preview' ? VEO_RESOLUTIONS : model === 'grok-imagine-video' ? GROK_RESOLUTIONS : model === 'wan-v2-7' ? WAN_RESOLUTIONS : RESOLUTIONS;

  useEffect(() => {
    if (model === 'hailuo-standard') {
      setDuration('10');
      setResolution('720p');
      setAspectRatio('16:9');
    }
    else if (model === 'hailuo-pro') {
      setDuration('5');
      setAspectRatio('16:9');
    }
    else if (model === 'sora-2') {
      setDuration('4');
      setResolution('720p');
      setAspectRatio('1280x720');
    }
    else if (model === 'veo-3.1-lite-generate-preview') {
      setDuration('6');
      setResolution('720p');
      setAspectRatio('16:9');
      setPromptOptimizer(true);
    }
    else if (model === 'grok-imagine-video') {
      setDuration('3');
      setResolution('480p');
      setAspectRatio('16:9');
    }
    else if (model === 'wan-v2-7') {
      setDuration('5');
      setResolution('720p');
      setAspectRatio('16:9');
    }
    else if (model === 'kling-v2-6') {
      setDuration('5');
      setAspectRatio('square_1_1');
    }
    else { setDuration('5'); }
  }, [model]);

  const checkTaskStatusGemini = useCallback(async (taskName: string, modalCreditName: string) => {
    setStatus('In Progress...');
    const poll = async () => {
      try {
        const response = await fetch(`${API_PROXY_BASE}/generate_gemini_video?taskName=${taskName}`, {
          method: "GET",
          headers: { 'Content-Type': 'application/json' },
        });
        const img_data = await handleResponse(response);

        if (img_data?.done === true) {
          const videoUrl = img_data?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
          if (videoUrl) {
            const videoResponse = await fetch(videoUrl, {
              headers: {
                'x-goog-api-key': apiKeys.GEMINI_API_KEY || '',
              }
            });

            if (!videoResponse.ok) {
              throw new Error(`Network response was not ok: ${videoResponse.statusText}`);
            }

            const videoBlob = await videoResponse.blob();
            const videoObjectUrl = URL.createObjectURL(videoBlob);

            onAddMedia(videoObjectUrl, 'video');
            await updateVideoCredit(modalCreditName);
            toast.success('Video processing is complete.');
          } else {
            throw new Error("Video URL not found in response.");
          }
          return true;
        } else if (img_data?.status === "failed") {
          throw new Error("Video generation failed.");
        } else {
          setStatus(img_data?.status || 'Pending (Gemini)...');
          return false;
        }
      } catch (error) {
        console.error("Gemini Polling Error:", error);
        toast.error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return true;
      }
    };

    let intervalId: NodeJS.Timeout | null = null;
    const startPolling = () => {
      intervalId = setInterval(async () => {
        const finished = await poll();
        if (finished && intervalId) {
          clearInterval(intervalId);
          setLoading(false);
          setStatus('');
        }
      }, 5000);
    };
    startPolling();
  }, [onAddMedia]);

  const checkTaskStatusOpenAI = useCallback(async (taskId: string, modalCreditName: string) => {
    setStatus('In Progress...');
    const poll = async () => {
      try {
        const response = await fetch(`${API_PROXY_BASE}/generate_openai_video/videos/${taskId}`, {
          method: "GET",
          headers: { 'Content-Type': 'application/json' },
        });
        const img_data = await handleResponse(response);

        if (img_data?.status === "completed") {
          const videoApiUrl = `https://api.openai.com/v1/videos/${taskId}/content`;
          const videoResponse = await fetch(videoApiUrl, {
            headers: { 'Authorization': `Bearer ${apiKeys.OPENAI_API_KEY}` }
          });

          if (!videoResponse.ok) {
            throw new Error(`Failed to fetch video content: ${videoResponse.statusText}`);
          }

          const videoBlob = await videoResponse.blob();
          const videoObjectUrl = URL.createObjectURL(videoBlob);

          onAddMedia(videoObjectUrl, 'video');
          await updateVideoCredit(modalCreditName);
          toast.success('Video processing is complete.');

          return true;
        } else if (img_data?.data?.status === "failed") {
          throw new Error("Video generation failed.");
        } else {
          setStatus('In Progress...');
          return false;
        }
      } catch (error) {
        console.error("Sora Polling Error:", error);
        toast.error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return true;
      }
    };

    let intervalId: NodeJS.Timeout | null = null;
    const startPolling = () => {
      intervalId = setInterval(async () => {
        const finished = await poll();
        if (finished && intervalId) {
          clearInterval(intervalId);
          setLoading(false);
          setStatus('');
        }
      }, 5000);
    };
    startPolling();
  }, [onAddMedia]);

  const checkTaskStatusFreepik = useCallback(async (taskId: string, finalModel: string, modalCreditName: string) => {
    setStatus('In Progress...');
    const poll = async () => {
      try {
        const response = await fetch(`${API_PROXY_BASE}/generate_freepik_video/recordInfo/${taskId}`, {
          method: "GET",
          headers: {
            'Content-Type': 'application/json'
          },
        });
        const img_data = await handleResponse(response);

        if (img_data?.data?.state === "success") {
          let videoUrl = null;
          
          // Try to extract URL from resultJson (KIE API format)
          if (img_data?.data?.resultJson) {
            try {
              const resultJson = JSON.parse(img_data.data.resultJson);
              videoUrl = resultJson?.resultUrls?.[0];
            } catch (parseError) {
              console.warn("Failed to parse resultJson:", parseError);
            }
          }
          
          // Fallback to direct generated field
          if (!videoUrl) {
            videoUrl = img_data?.data?.generated;
          }
          
          if (videoUrl) {
            try {
              const localVideoUrl = await saveVideoFile(videoUrl);
              onAddMedia(localVideoUrl, 'video');
              await updateVideoCredit(modalCreditName);
              toast.success('Video processing is complete.');
            } catch (saveError) {
              console.warn("Video save failed, using external URL:", saveError);
              onAddMedia(videoUrl, 'video');
              await updateVideoCredit(modalCreditName);
              toast.success('Video processing is complete.');
            }
          } else {
            throw new Error("Video URL not found in response.");
          }
          return true;
        } else if (img_data?.data?.state === "failed") {
          throw new Error(img_data?.data?.failMsg || "Video generation failed.");
        } else {
          setStatus(`In Progress (${img_data?.data?.progress || 0}%)...`);
          return false;
        }
      } catch (error) {
        console.error("Freepik Polling Error:", error);
        toast.error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return true;
      }
    };

    let intervalId: NodeJS.Timeout | null = null;
    const startPolling = () => {
      intervalId = setInterval(async () => {
        const finished = await poll();
        if (finished && intervalId) {
          clearInterval(intervalId);
          setLoading(false);
          setStatus('');
        }
      }, 5000);
    };
    startPolling();
  }, [onAddMedia]);

  const checkTaskStatusGrok = useCallback(async (taskId: string, modalCreditName: string) => {
    setStatus('In Progress...');
    const poll = async () => {
      try {
        const response = await fetch(`${API_PROXY_BASE}/generate_grok_video/videos/${taskId}`, {
          method: "GET",
          headers: { 'Content-Type': 'application/json' },
        });
        const img_data = await handleResponse(response);

        if (img_data?.status === "done") {
          const videoUrl = img_data?.video?.url;
          if (videoUrl) {
            try {
              const localVideoUrl = await saveVideoFile(videoUrl);
              onAddMedia(localVideoUrl, 'video');
              await updateVideoCredit(modalCreditName);
              toast.success('Video processing is complete.');
            } catch (saveError) {
              console.warn("Video save failed, using external URL:", saveError);
              onAddMedia(videoUrl, 'video');
              await updateVideoCredit(modalCreditName);
              toast.success('Video processing is complete.');
            }
          } else {
            throw new Error("Video URL not found in response.");
          }
          return true;
        } else if (img_data?.status === "failed") {
          throw new Error("Video generation failed.");
        } else {
          setStatus(img_data?.status || 'Pending (Grok)...');
          return false;
        }
      } catch (error) {
        console.error("Grok Polling Error:", error);
        toast.error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return true;
      }
    };

    let intervalId: NodeJS.Timeout | null = null;
    const startPolling = () => {
      intervalId = setInterval(async () => {
        const finished = await poll();
        if (finished && intervalId) {
          clearInterval(intervalId);
          setLoading(false);
          setStatus('');
        }
      }, 5000);
    };
    startPolling();
  }, [onAddMedia]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt.");
      return;
    }

    setLoading(true);
    setStatus('Checking credits...');

    let modalCreditName = "freepik_video_credits";
    let finalModel = model;
    let payload: any = { prompt: prompt.trim(), duration: duration };

    switch (model) {
      case 'kling-v2-6':
        payload = {};
        payload.model = "kling-2.6/text-to-video";
        payload.input = {
          aspect_ratio: aspectRatio,
          prompt: prompt.trim(),
          duration: duration,
        };
        break;

      case 'hailuo-standard':
        payload = {};
        payload.model = 'hailuo/02-text-to-video-standard';
        payload.input = {
          prompt: prompt.trim(),
          duration: duration,
          prompt_optimizer: promptOptimizer,
        };
        break;

      case 'hailuo-pro':
        payload = {};
        payload.model = 'hailuo/02-text-to-video-pro';
        payload.input = {
          prompt: prompt.trim(),
          prompt_optimizer: promptOptimizer,
        };
        break;

      case 'sora-2':
        modalCreditName = "openai_video_credits";
        payload.model = finalModel;
        payload.aspect_ratio = aspectRatio;
        break;

      case 'grok-imagine-video':
        modalCreditName = "grok_video_credits";
        payload.model = "grok-imagine-video";
        payload.resolution = resolution;
        payload.aspect_ratio = aspectRatio;
        payload.duration = Number(duration);
        break;

      case 'wan-v2-7':
        payload = {};
        payload.model = 'wan/2-7-text-to-video';
        payload.input = {
          prompt: prompt.trim(),
          resolution: resolution,
          ratio: aspectRatio,
          duration: parseInt(duration),
        };
        if (negativePrompt.trim()) {
          payload.input.negative_prompt = negativePrompt.trim();
        }
        if (seed) {
          payload.input.seed = parseInt(seed);
        }
        break;

      case 'veo-3.1-lite-generate-preview':
        modalCreditName = 'gemini_3_1_veo_video_credits';
        payload.prompt_optimizer = promptOptimizer;
        break;
    }

    payload.modal_credit_name = modalCreditName;

    try {
      const creditFormData = new URLSearchParams();
      creditFormData.append('modal_credit_name', modalCreditName);

      const creditResponse = await fetch(`${BASE_URL}/social-media/file_manager/getVideoCredit`, {
        method: 'POST',
        body: creditFormData,
      });
      const creditData = await handleResponse(creditResponse);

      if (!creditData.count || creditData.count <= 0) {
        toast.error('You don\'t have enough credit.');
        setLoading(false);
        setStatus('');
        return;
      }

      setStatus('Initiating video generation...');

      if (model === "veo-3.1-lite-generate-preview") {
        const veoPayload = {
          instances: [{ prompt: prompt.trim() }],
          parameters: {
            sampleCount: 1,
            resolution: resolution,
            aspectRatio: aspectRatio,
            durationSeconds: parseInt(duration)
          }
        };

        const response = await fetch(`${API_PROXY_BASE}/generate_gemini_video/${model}`, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(veoPayload),
        });
        const img_data = await handleResponse(response);

        if (img_data?.name) {
          checkTaskStatusGemini(img_data.name, modalCreditName);
        } else {
          throw new Error("Task ID not returned for Veo generation.");
        }
      }
      else if (model === "sora-2") {
        const soraPayload = {
          "model": payload.model,
          "prompt": payload.prompt,
          "seconds": payload.duration,
          "size": payload.aspect_ratio
        };

        const response = await fetch(`${API_PROXY_BASE}/generate_openai_video/videos`, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(soraPayload),
        });
        const video_data = await handleResponse(response);

        if (video_data?.id) {
          checkTaskStatusOpenAI(video_data.id, modalCreditName);
        } else {
          throw new Error("Task ID not returned for Sora generation.");
        }
      }
      else if (model === "grok-imagine-video") {
        const response = await fetch(`${API_PROXY_BASE}/generate_grok_video/videos`, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const img_data = await handleResponse(response);

        if (img_data?.request_id) {
          checkTaskStatusGrok(img_data.request_id, modalCreditName);
        } else {
          throw new Error("Request ID not returned for Grok generation.");
        }
      }
      else {
        try {
          const response = await fetch(`${API_PROXY_BASE}/generate_freepik_video/createTask`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const img_data = await handleResponse(response);

          if (img_data?.data?.taskId) {
            checkTaskStatusFreepik(img_data.data.taskId, finalModel, modalCreditName);
          } else {
            throw new Error("Task ID not returned for KIE model generation.");
          }
        } catch (err) {
          console.error('KIE model generation error:', err);
          toast.error(`Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setLoading(false);
          setStatus('');
        }
      }

    } catch (e: any) {
      console.error("Generation failed:", e);
      toast.error(`Generation failed: ${e.message}`);
      setLoading(false);
      setStatus('');
    }
  };

  const inputClass = "w-full bg-gray-50 dark:bg-[#27272a] text-gray-900 dark:text-white border border-gray-300 dark:border-[#3f3f46] rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none";

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#18181b] border-r border-gray-200 dark:border-[#27272a] w-full md:w-[320px] overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#27272a]">
        <h2 className="font-semibold text-gray-900 dark:text-white">Text to Video AI</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ChevronsLeft size={20} />
        </button>
      </div>

      <div className="p-4 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Model</label>
          <select value={model} onChange={(e) => setModel(e.target.value)} className={inputClass}>
            {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Prompt</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the video you want to generate..." className={`${inputClass} h-32 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-600`} />
        </div>

        {showStyle && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Styling</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className={inputClass}>
              {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}

        {showDuration && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Length</label>
          <div className="flex gap-4">
            {model === 'hailuo-standard' ? (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="duration" value="6" checked={duration === '6'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">6s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="duration" value="10" checked={duration === '10'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">10s</span>
                </label>
              </>
            ) : model === 'sora-2' ? (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="duration" value="4" checked={duration === '4'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">4s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="duration" value="8" checked={duration === '8'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">8s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="duration" value="12" checked={duration === '12'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">12s</span>
                </label>
              </>
            ) : model === 'veo-3.1-lite-generate-preview' ? (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="duration" value="4" checked={duration === '4'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">4s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="duration" value="6" checked={duration === '6'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">6s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="duration" value="8" checked={duration === '8'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">8s</span>
                </label>
              </>
            ) : model === 'grok-imagine-video' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full">
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="3" checked={duration === '3'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">3s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="5" checked={duration === '5'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">5s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="8" checked={duration === '8'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">8s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="10" checked={duration === '10'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">10s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="12" checked={duration === '12'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">12s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="15" checked={duration === '15'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">15s</span>
                </label>
              </div>
            ) : model === 'wan-v2-7' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="2" checked={duration === '2'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">2s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="3" checked={duration === '3'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">3s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="4" checked={duration === '4'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">4s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="5" checked={duration === '5'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">5s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="6" checked={duration === '6'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">6s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="7" checked={duration === '7'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">7s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="8" checked={duration === '8'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">8s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="9" checked={duration === '9'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">9s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="10" checked={duration === '10'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">10s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="11" checked={duration === '11'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">11s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="12" checked={duration === '12'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">12s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="13" checked={duration === '13'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">13s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="14" checked={duration === '14'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">14s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input type="radio" name="duration" value="15" checked={duration === '15'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">15s</span>
                </label>
              </div>
            ) : (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="duration" value="5" checked={duration === '5'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">5s</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="duration" value="10" checked={duration === '10'} onChange={(e) => setDuration(e.target.value)} className="accent-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">10s</span>
                </label>
              </>
            )}
          </div>
        </div>
        )}

        {showAspectRatio && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Aspect Ratio</label>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className={inputClass}>
              {activeAspectRatios.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        )}

        {showResolution && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Resolution</label>
            <select value={resolution} onChange={(e) => setResolution(e.target.value)} className={inputClass}>
              {activeResolutions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}

        {showAdvancedToggle && (
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Advanced Settings</span>
            {showAdvanced ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </div>
        )}

        {showAdvanced && (
          <div className="space-y-5 border-t border-gray-200 dark:border-[#27272a] pt-5">
            {showNegPrompt && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Negative Prompt</label>
                <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Describe what you don't want to see..." className={`${inputClass} h-20 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-600`} />
              </div>
            )}

            {showCfgScale && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex justify-between"><span>CFG Scale</span><span>{cfgScale}</span></label>
                <input type="range" min="0" max="1" step="0.1" value={cfgScale} onChange={(e) => setCfgScale(parseFloat(e.target.value))} className="w-full accent-primary-600" />
              </div>
            )}

            {showSeed && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Seed (Optional)</label>
                <input type="text" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="Leave blank for random" className={inputClass} />
              </div>
            )}

            {showPromptOptimizer && (
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="prompt-optimizer" checked={promptOptimizer} onChange={(e) => setPromptOptimizer(e.target.checked)} className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600" />
                <label htmlFor="prompt-optimizer" className="text-sm font-medium text-gray-900 dark:text-gray-300">Enable Prompt Optimizer</label>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full py-2.5 flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {status || 'Generating...'}
            </>
          ) : (
            <>
              <Clapperboard className="mr-2 h-4 w-4" />
              Generate Video
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
