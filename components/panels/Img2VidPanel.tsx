import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { ChevronsLeft, Upload, Loader2, Clapperboard, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../Button';
import { useApiKeys } from '../../context/ApiKeyContext';

const BASE_URL = window.location.origin;
const API_PROXY_BASE = `${BASE_URL}/social-media/openai`;

const MODELS = [
  { label: 'PixVerse V5', value: 'pixverse-v5' },
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
];

const PIXVERSE_STYLES = [
  { label: 'select style', value: '' },
  { label: 'Anime', value: 'anime' },
  { label: '3D - Animation', value: '3d_animation' },
  { label: '3D', value: 'clay' },
  { label: 'Cyberpunk', value: 'cyberpunk' },
  { label: 'Comic', value: 'comic' },
];

const RESOLUTIONS = ['360p', '540p', '720p', '1080p'];
const WAN_RESOLUTIONS = ['720p', '1080p'];
const MINIMAX_RESOLUTIONS = ['512P', '768P'];
const SORA_RESOLUTIONS = ['720p', '1080p'];

const ASPECT_RATIOS = [
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '1:1', value: '1:1' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
  { label: '3:2', value: '3:2' },
  { label: '2:3', value: '2:3' },
];

const GROK_RESOLUTIONS = ['480p', '720p'];

const GEMINI_RESOLUTIONS = ['720p'];

const WAN_ASPECT_RATIOS = [
  { label: '1:1', value: 'square_1_1' },
  { label: '4:3', value: 'classic_4_3' },
  { label: '16:9', value: 'widescreen_16_9' },
  { label: '9:16', value: 'social_story_9_16' },
];

const SORA_ASPECT_RATIOS = [
  { label: '16:9', value: '1280x720' },
  { label: '9:16', value: '720x1280' },
];

const GEMINI_ASPECT_RATIOS = [
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
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
    const response = await fetch(`${BASE_URL}/index.php/social-media/ai_video_editor/ai_video_editor/save_video`, {
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

function base64ToBlob(base64: any, mimeType: any): Blob {
  const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
}

async function urlToBase64(url: any) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: HTTP status ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader: any = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

interface Img2VidPanelProps {
  onAddMedia: (url: string, type: 'video') => void;
  onClose: () => void;
}

export const Img2VidPanel: React.FC<Img2VidPanelProps> = ({ onAddMedia, onClose }) => {
    const { apiKeys } = useApiKeys();
  const [model, setModel] = useState('pixverse-v5');
  const [inputMode, setInputMode] = useState<'start-end-frame' | 'three-images'>('start-end-frame');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedEndFrame, setUploadedEndFrame] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [seed, setSeed] = useState<string>('');
  const [style, setStyle] = useState('');
  const [resolution, setResolution] = useState('360p');
  const [duration, setDuration] = useState<string>('5');
  const [cfgScale, setCfgScale] = useState<number>(0.5);
  const [aspectRatio, setAspectRatio] = useState('16:9');

  const [addEndFrame, setAddEndFrame] = useState(false);
  const [promptOptimizer, setPromptOptimizer] = useState(true);
  const [showLessSettings, setShowLessSettings] = useState(true);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const endFrameInputRef = useRef<HTMLInputElement>(null);
  const referenceImageInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const showStyle = model === 'pixverse-v5';
  const showResolution = ['pixverse-v5', 'hailuo-standard', 'wan-v2-7', 'sora-2', 'grok-imagine-video', 'veo-3.1-lite-generate-preview'].includes(model);
  const showNegPrompt = ['pixverse-v5', 'kling-v2-6'].includes(model);
  const showCfgScale = false;
  const showAspectRatio = ['sora-2', 'grok-imagine-video', 'veo-3.1-lite-generate-preview'].includes(model);
  const showSeed = ['pixverse-v5', 'wan-v2-7'].includes(model);
  const showDuration = !['hailuo-pro'].includes(model);
  const showEndFrame = ['pixverse-v5', 'wan-v2-7', 'hailuo-standard', 'hailuo-pro', 'veo-3.1-lite-generate-preview'].includes(model) && model !== 'grok-imagine-video';
  const showPromptOptimizer = ['hailuo-standard', 'hailuo-pro'].includes(model);
  const showReferenceImages = model === 'grok-imagine-video';

  const activeStyles = model === 'pixverse-v5' ? PIXVERSE_STYLES : STYLES;
  const activeResolutions = model === 'hailuo-standard' ? MINIMAX_RESOLUTIONS : model === 'wan-v2-7' ? WAN_RESOLUTIONS : model === 'sora-2' ? SORA_RESOLUTIONS : model === 'veo-3.1-lite-generate-preview' ? GEMINI_RESOLUTIONS : model === 'grok-imagine-video' ? GROK_RESOLUTIONS : RESOLUTIONS;
  const activeAspectRatios = model === 'wan-v2-7' ? WAN_ASPECT_RATIOS : model === 'sora-2' ? SORA_ASPECT_RATIOS : model === 'veo-3.1-lite-generate-preview' ? GEMINI_ASPECT_RATIOS : ASPECT_RATIOS;

  useEffect(() => {
    setStyle(model === 'pixverse-v5' ? '' : 'realistic');

    if (model === 'hailuo-standard') {
      setResolution('768P');
      setDuration('6');
      setAspectRatio('16:9');
    }
    else if (model === 'hailuo-pro') {
      setDuration('5');
      setAspectRatio('16:9');
      setAddEndFrame(false);
    }
    else if (model === 'wan-v2-7') {
      setResolution('720p');
      setAspectRatio('widescreen_16_9');
      setDuration('5');
    }
    else if (model === 'sora-2') {
      setDuration('4');
      setResolution('720p');
      setAspectRatio('1280x720');
    }
    else if (model === 'grok-imagine-video') {
      setDuration('3');
      setResolution('480p');
      setAspectRatio('16:9');
      setAddEndFrame(false);
    }
    else if (model === 'veo-3.1-lite-generate-preview') {
      setDuration('8');
      setResolution('720p');
      setAspectRatio('16:9');
      setInputMode('start-end-frame');
      setAddEndFrame(false);
      setReferenceImages([]);
    }
    else if (model === 'pixverse-v5') { setDuration('5'); setResolution('360p'); setAspectRatio('16:9'); }
    else { setDuration('5'); setResolution('360p'); setAspectRatio('16:9'); }
  }, [model]);

  const convertImageToBase64 = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      fetch(imageUrl)
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Extract base64 part
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    });
  };

  const uploadImage = async (file: File, isEndFrame: boolean = false): Promise<string | null> => {
    setLoading(true);
    setStatus(`Uploading ${isEndFrame ? 'end frame' : 'image'}...`);
    const formData = new FormData();
    formData.append('imageFile', file);

    try {
        const response = await fetch(`${BASE_URL}/social-media/file_manager/upload_image_file`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        if (data.success && data.url) {
            setStatus('Image uploaded successfully.');
            return data.url;
        } else {
            throw new Error(data.error || 'Image upload failed.');
        }
    } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
    } finally {
        setLoading(false);
        setStatus('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        setUploadedImage(url);
      }
    }
  };

  const handleEndFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file, true);
      if (url) {
        setUploadedEndFrame(url);
      }
    }
  };

  const handleRemoveImage = () => { setUploadedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const handleRemoveEndFrame = () => { setUploadedEndFrame(null); if (endFrameInputRef.current) endFrameInputRef.current.value = ''; };

  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        const newImages = [...referenceImages];
        newImages[index] = url;
        setReferenceImages(newImages);
      }
    }
  };

  const handleRemoveReferenceImage = (index: number) => {
    const newImages = referenceImages.filter((_, i) => i !== index);
    setReferenceImages(newImages);
    if (referenceImageInputRefs.current[index]) {
      referenceImageInputRefs.current[index]!.value = '';
    }
  };

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

  const checkTaskStatusFreepik = useCallback(async (taskId: string, modalCreditName: string) => {
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
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const img_data = await handleResponse(response);

        if (img_data?.status === 'done' || img_data?.status === 'completed') {
          const videoUrl = img_data?.video?.url || img_data?.data?.generated;
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
            throw new Error('Video URL not found in response.');
          }
          return true;
        } else if (img_data?.status === 'failed') {
          throw new Error('Video generation failed.');
        } else {
          setStatus(img_data?.status || 'Pending (Grok)...');
          return false;
        }
      } catch (error) {
        console.error('Grok Polling Error:', error);
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

  const checkTaskStatusGemini = useCallback(async (taskName: string, modalCreditName: string) => {
    setStatus('In Progress...');
    const poll = async () => {
      try {
        const response = await fetch(`${API_PROXY_BASE}/generate_gemini_video?taskName=${taskName}`, {
          method: "GET",
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await handleResponse(response);

        if (data?.done === true) {
          const videoUrl = data?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
          if (videoUrl) {
            const localVideoUrl = await saveVideoFile(videoUrl+"&key="+apiKeys.GEMINI_API_KEY);
            onAddMedia(localVideoUrl, 'video');
            await updateVideoCredit(modalCreditName);
            toast.success('Video processing is complete.');
          } else {
            throw new Error("Video URL not found in response.");
          }
          return true;
        } else if (data?.status === "failed") {
          throw new Error("Video generation failed.");
        } else {
          setStatus(data?.status || 'Pending (Gemini)...');
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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt.");
      return;
    }

    // For Veo 3.1 three-images mode, starting image is not required
    const isVeo31ThreeImages = model === "veo-3.1-lite-generate-preview" && inputMode === "three-images";
    if (!uploadedImage && !isVeo31ThreeImages) {
      toast.error("Please upload a starting image.");
      return;
    }
    
    if (addEndFrame && !uploadedEndFrame) {
      toast.error("Please upload an end frame image.");
      return;
    }

    setLoading(true);
    setStatus('Checking credits...');

    let modalCreditName = "freepik_video_credits";
    let finalModel = model;
    let payload: any = { prompt: prompt.trim() };

    const seedInt = seed ? parseInt(seed) : undefined;

    if (model !== "sora-2") {
      payload.duration = duration;
      payload.resolution = resolution;
    }

    if (style && style !== "") {
      payload.style = style;
    }

    if (negativePrompt.trim()) {
      payload.negative_prompt = negativePrompt.trim();
    }

    if (seedInt) {
      payload.seed = seedInt;
    }

    switch (model) {
      case 'pixverse-v5':
        if (addEndFrame) {
          finalModel = "pixverse-v5-transition";
          payload.first_image_url = uploadedImage;
          payload.last_image_url = uploadedEndFrame;
        } else {
          payload.image_url = uploadedImage;
        }
        break;

      case 'kling-v2-6':
        payload = {};
        payload.model = "kling-2.6/image-to-video";
        payload.input = {
          prompt: prompt.trim(),
          image_urls: uploadedImage,
          duration: duration,
        };
        break;

      case 'hailuo-standard':
        payload = {};
        payload.model = 'hailuo/02-image-to-video-standard';
        payload.input = {
          prompt: prompt.trim(),
          image_url: uploadedImage,
          duration: duration,
          resolution: resolution,
          prompt_optimizer: promptOptimizer,
        };
        if (addEndFrame && uploadedEndFrame) {
          payload.input.end_image_url = uploadedEndFrame;
        }
        break;

      case 'hailuo-pro':
        payload = {};
        payload.model = 'hailuo/02-image-to-video-pro';
        payload.input = {
          prompt: prompt.trim(),
          image_url: uploadedImage,
          prompt_optimizer: promptOptimizer,
        };
        if (addEndFrame && uploadedEndFrame) {
          payload.input.end_image_url = uploadedEndFrame;
        }
        break;

      case 'wan-v2-7':
        payload = {};
        payload.model = 'wan/2-7-image-to-video';
        payload.input = {
          prompt: prompt.trim(),
          resolution: resolution,
          duration: parseInt(duration),
          prompt_extend: true,
          watermark: false,
        };
        if (negativePrompt.trim()) {
          payload.input.negative_prompt = negativePrompt.trim();
        }
        if (seedInt) {
          payload.input.seed = seedInt;
        }
        if (addEndFrame && uploadedEndFrame) {
          payload.input.first_frame_url = uploadedImage;
          payload.input.last_frame_url = uploadedEndFrame;
        } else {
          payload.input.first_frame_url = uploadedImage;
        }
        break;

      case 'sora-2':
        modalCreditName = "openai_video_credits";
        payload.model = finalModel;
        payload.seconds = duration;
        payload.size = aspectRatio;
        payload.input_reference = uploadedImage;
        delete payload.style;
        break;

      case 'veo-3.1-lite-generate-preview':
        if (!uploadedImage) {
          toast.error('Please upload a start frame.');
          setLoading(false);
          setStatus('');
          return;
        }
        modalCreditName = 'gemini_3_1_veo_video_credits';
        break;

      case 'grok-imagine-video':
        modalCreditName = "grok_video_credits";
        payload.model = "grok-imagine-video";
        payload.image = { url: uploadedImage };
        payload.duration = Number(duration);
        payload.resolution = resolution;
        payload.aspect_ratio = aspectRatio;
        if (referenceImages.length > 0) {
          payload.reference_image_urls = referenceImages;
        }
        delete payload.style;
        // no end frame support
        break;
    }

    const creditFormData = new URLSearchParams();
    creditFormData.append('modal_credit_name', modalCreditName);

    try {
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

      if (model === "sora-2") {
        const formData = new FormData();
        const inputReference = payload.input_reference;
        const imageMimeType = 'image/jpeg';

        if (inputReference && (inputReference.startsWith('http://' ) || inputReference.startsWith('https://' ))) {                                    
          const base64String = await urlToBase64(inputReference);
          const imageBlob = base64ToBlob(base64String, imageMimeType);
          formData.append('input_reference', imageBlob, 'input_reference_image.jpg');
        } else if (inputReference) {
          const imageBlob = base64ToBlob(inputReference, imageMimeType);
          formData.append('input_reference', imageBlob, 'input_reference_image.jpg');
        }

        for (const key in payload) {
          if (key !== 'input_reference' && payload.hasOwnProperty(key)) {
            formData.append(key, payload[key]);
          }
        }

        const response = await fetch(`https://api.openai.com/v1/videos`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKeys.OPENAI_API_KEY}`
          },
          body: formData,
        });
        const video_data = await handleResponse(response);

        if (video_data?.id) {
          checkTaskStatusOpenAI(video_data.id, modalCreditName);
        } else {
          throw new Error("Task ID not returned for Sora generation.");
        }
      } 
      else if (model === "grok-imagine-video") {
        payload.modal_credit_name = modalCreditName;

        const response = await fetch(`${API_PROXY_BASE}/generate_grok_video/videos`, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const img_data = await handleResponse(response);

        if (img_data?.request_id || img_data?.task_id) {
          const taskId = img_data?.request_id || img_data?.task_id;
          checkTaskStatusGrok(taskId, modalCreditName);
        } else {
          throw new Error("Task ID not returned for Grok generation.");
        }
      } 
      else if (model === "veo-3.1-lite-generate-preview") {
        try {
          // Convert images to base64 if they're URLs
          let imageBase64 = uploadedImage;
          let lastFrameBase64 = uploadedEndFrame;

          if (uploadedImage && uploadedImage.startsWith('http')) {
            imageBase64 = await convertImageToBase64(uploadedImage);
          }
          if (uploadedEndFrame && uploadedEndFrame.startsWith('http')) {
            lastFrameBase64 = await convertImageToBase64(uploadedEndFrame);
          }

          const instance: any = {
            prompt: prompt || 'Generate a video',
            image: {
              mimeType: 'image/png',
              bytesBase64Encoded: imageBase64,
            },
          };

          if (lastFrameBase64) {
            instance.lastFrame = {
              mimeType: 'image/png',
              bytesBase64Encoded: lastFrameBase64,
            };
          }

          const geminiPayload: any = {
            instances: [instance],
            parameters: {
              aspectRatio: aspectRatio,
              resolution: resolution,
              durationSeconds: 8,
            },
          };

          const response = await fetch(`${API_PROXY_BASE}/generate_gemini_video/${model}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload),
          });
          const gemini_data = await handleResponse(response);

          if (gemini_data?.name) {
            checkTaskStatusGemini(gemini_data.name, modalCreditName);
          } else {
            throw new Error("Operation name not returned for Gemini Veo 3.1 generation.");
          }
        } catch (err) {
          console.error('Gemini Veo 3.1 generation error:', err);
          throw err;
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
            checkTaskStatusFreepik(img_data.data.taskId, modalCreditName);
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
        <h2 className="font-semibold text-gray-900 dark:text-white">Image to Video AI</h2>
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
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{addEndFrame ? 'First Frame' : 'Image'}</label>
            {showEndFrame && (
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500 dark:text-gray-400">Add end frame</span>
                <div className="relative inline-block w-8 h-4 align-middle select-none transition duration-200 ease-in">
                  <input type="checkbox" checked={addEndFrame} onChange={(e) => setAddEndFrame(e.target.checked)} className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: addEndFrame ? '0' : 'auto', left: addEndFrame ? 'auto' : '0', borderColor: addEndFrame ? '#3b82f6' : '#d1d5db' }} />
                  <span className={`toggle-label block overflow-hidden h-4 rounded-full bg-gray-300 cursor-pointer ${addEndFrame ? 'bg-primary-500' : ''}`}></span>
                </div>
              </label>
            )}
          </div>
          {uploadedImage ? (
            <div className="relative w-full h-32 border border-gray-300 dark:border-[#3f3f46] rounded-lg overflow-hidden">
              <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
              <button onClick={handleRemoveImage} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-[#3f3f46] rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#27272a]" onClick={() => fileInputRef.current?.click()}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload size={24} className="text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP (MAX. 5MB)</p>
              </div>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        </div>

        {addEndFrame && showEndFrame && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">End Frame</label>
            {uploadedEndFrame ? (
              <div className="relative w-full h-32 border border-gray-300 dark:border-[#3f3f46] rounded-lg overflow-hidden">
                <img src={uploadedEndFrame} alt="End Frame" className="w-full h-full object-cover" />
                <button onClick={handleRemoveEndFrame} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-[#3f3f46] rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#27272a]" onClick={() => endFrameInputRef.current?.click()}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload size={24} className="text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP (MAX. 5MB)</p>
                </div>
              </div>
            )}
            <input type="file" ref={endFrameInputRef} onChange={handleEndFrameUpload} accept="image/*" className="hidden" />
          </div>
        )}

        {showReferenceImages && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Additional Reference Images (Optional)</label>
            <div className="space-y-2">
              {referenceImages.map((url, index) => (
                <div key={index} className="space-y-1">
                  {url ? (
                    <div className="relative w-full h-24 border border-gray-300 dark:border-[#3f3f46] rounded-lg overflow-hidden group">
                      <img src={url} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => handleRemoveReferenceImage(index)} 
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                      <button 
                        onClick={() => referenceImageInputRefs.current[index]?.click()} 
                        className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <span className="text-white text-xs font-semibold">Change</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-[#3f3f46] rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#27272a]" onClick={() => referenceImageInputRefs.current[index]?.click()}>
                      <div className="flex flex-col items-center justify-center">
                        <Upload size={20} className="text-gray-500 dark:text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Reference {index + 1}</p>
                      </div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={(el) => (referenceImageInputRefs.current[index] = el)}
                    onChange={(e) => handleReferenceImageUpload(e, index)}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ))}
              {referenceImages.length < 5 && (
                <button
                  onClick={() => setReferenceImages([...referenceImages, ''])}
                  className="w-full px-3 py-2 bg-blue-500 hover:bg-[#4f46e5] text-white rounded text-sm"
                >
                  + Add Reference Image
                </button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Prompt</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the video you want to generate..." className={`${inputClass} h-32 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-600`} />
        </div>

        {showStyle && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Styling</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className={inputClass}>
              {activeStyles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
            ) : model === 'veo-3.1-lite-generate-preview' ? (
              // MANDATORY: Google Veo 3.1 only supports 8 seconds - duration is fixed
              <label className="flex items-center gap-2 cursor-pointer opacity-75">
                <input type="radio" name="duration" value="8" checked={duration === '8'} className="accent-primary-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">8s</span>
              </label>
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

        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowLessSettings(!showLessSettings)}>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Advanced Settings</span>
          {showLessSettings ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </div>

        {!showLessSettings && (
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
                <input type="range" min="0.1" max="1.0" step="0.1" value={cfgScale} onChange={(e) => setCfgScale(parseFloat(e.target.value))} className="w-full accent-primary-600" />
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
