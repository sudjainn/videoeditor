import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useLayoutEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { toast } from "react-toastify";
import {
  Track,
  TrackType,
  Clip,
  LayerProperties,
  CanvasSettings,
  ExportFormat,
  TransitionType,
} from "../types";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { formatTime } from "../utils/time";
import { VideoRenderer } from "./player/VideoRenderer";
import { FabricOverlay, FabricOverlayRef } from "./player/FabricOverlay";

export interface PlayerRef {
  exportVideo: (format: ExportFormat) => Promise<void>;
}

interface PlayerProps {
  tracks: Track[];
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onTogglePlay: () => void;
  duration: number;
  selectedClipId: string | null;
  onSelectClip: (id: string | null, showPanel?: boolean) => void;
  onUpdateClip: (id: string, updates: Partial<Clip>) => void;
  playheadRef: React.RefObject<HTMLDivElement>;
  timeDisplayRef: React.RefObject<HTMLSpanElement>;
  zoom: number;
  canvasSettings: CanvasSettings;
  isMobile: boolean;
}

export const Player = forwardRef<PlayerRef, PlayerProps>(
  (
    {
      tracks,
      currentTime,
      isPlaying,
      onTimeUpdate,
      onTogglePlay,
      duration,
      selectedClipId,
      onSelectClip,
      onUpdateClip,
      playheadRef,
      timeDisplayRef,
      zoom,
      canvasSettings,
      isMobile
    },
    ref
  ) => {
    const mediaRefs = useRef<
      Record<string, HTMLVideoElement | HTMLAudioElement | HTMLImageElement>
    >({});
    const fabricRef = useRef<FabricOverlayRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const exportCanvasRef = useRef<HTMLCanvasElement>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const audioNodesRef = useRef<Map<string, MediaElementAudioSourceNode>>(
      new Map()
    );

    const isExportingRef = useRef(false);
    const exportFormatRef = useRef<ExportFormat>("webm");
    const gifFramesRef = useRef<string[]>([]);
    const [exportProgress, setExportProgress] = useState(0);

    const onTimeUpdateRef = useRef(onTimeUpdate);
    const onTogglePlayRef = useRef(onTogglePlay);

    useEffect(() => {
      onTimeUpdateRef.current = onTimeUpdate;
      onTogglePlayRef.current = onTogglePlay;
    }, [onTimeUpdate, onTogglePlay]);

    const stateRef = useRef({
      currentTime,
      isPlaying,
      tracks,
      duration,
      zoom,
      canvasSettings,
    });

    useEffect(() => {
      stateRef.current = {
        currentTime,
        isPlaying,
        tracks,
        duration,
        zoom,
        canvasSettings,
      };
    }, [currentTime, isPlaying, tracks, duration, zoom, canvasSettings]);

    const getAudioContext = () => {
      if (!audioContextRef.current) {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        audioContextRef.current = ctx;
        masterGainRef.current = gain;
      }
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current
          .resume()
          .catch((e: any) => console.warn("Audio resume failed", e));
      }
      return {
        ctx: audioContextRef.current,
        masterGain: masterGainRef.current!,
      };
    };

    useImperativeHandle(ref, () => ({
      exportVideo: async (format: ExportFormat) => {
        if (isExportingRef.current) return;
        if (isPlaying) onTogglePlay();
        return new Promise<void>(async (resolve, reject) => {
          isExportingRef.current = true;
          exportFormatRef.current = format;
          setExportProgress(0);
          gifFramesRef.current = [];
          // Initialize _lastGif to ensure the first frame is captured immediately
          (stateRef.current as any)._lastGif = 0;

          try {
            const canvas = exportCanvasRef.current;
            if (!canvas) throw new Error("No export canvas found");
            let recorder: MediaRecorder | null = null;
            const chunks: Blob[] = [];
            const { ctx, masterGain } = getAudioContext();
            if (format !== "gif") {
              masterGain.gain.setValueAtTime(0, ctx.currentTime);
              const dest = ctx.createMediaStreamDestination();
              Object.entries(mediaRefs.current).forEach(([id, el]) => {
                if (
                  el instanceof HTMLVideoElement ||
                  el instanceof HTMLAudioElement
                ) {
                  try {
                    let sourceNode = audioNodesRef.current.get(id);
                    if (sourceNode && sourceNode.mediaElement !== el) {
                      sourceNode.disconnect();
                      sourceNode = undefined;
                    }
                    if (!sourceNode) {
                      sourceNode = ctx.createMediaElementSource(el);
                      audioNodesRef.current.set(id, sourceNode);
                      sourceNode.connect(masterGain);
                    }
                    const track = stateRef.current.tracks.find((t: any) =>
                      t.clips.some((c: any) => c.id === id)
                    );
                    const clip = track?.clips.find((c: any) => c.id === id);
                    const isMuted = track?.isMuted;
                    const exportGain = ctx.createGain();
                    exportGain.gain.value = isMuted
                      ? 0
                      : clip?.properties.volume ?? 1;
                    sourceNode.connect(exportGain);
                    exportGain.connect(dest);
                  } catch (e) {
                    console.warn("Could not connect audio node", id, e);
                  }
                }
              });
              const canvasStream = canvas.captureStream(30);
              const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...dest.stream.getAudioTracks(),
              ]);
              let mimeType = format === "mp4" ? "video/mp4" : "video/webm";
              if (format === "mp4") {
                mimeType =
                  [
                    'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
                    "video/mp4",
                  ].find((t) => MediaRecorder.isTypeSupported(t)) ||
                  "video/mp4";
              }
              recorder = new MediaRecorder(combinedStream, {
                mimeType,
                videoBitsPerSecond: 5000000,
              });
              recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
              };
              recorder.onstop = () => {
                masterGain.gain.setValueAtTime(1, ctx.currentTime);
                audioNodesRef.current.forEach((node: any) => {
                  try {
                    node.disconnect();
                    node.connect(masterGain);
                  } catch (e) {}
                });
                const blob = new Blob(chunks, { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `video_project_${Date.now()}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                isExportingRef.current = false;
                setExportProgress(0);
                resolve();
              };
              recorder.start();
            }
            onTimeUpdate(0);
            await new Promise((r) => setTimeout(r, 200));
            onTogglePlay();
            const checkCompletion = setInterval(() => {
              if (
                !stateRef.current.isPlaying &&
                stateRef.current.currentTime >= stateRef.current.duration
              ) {
                clearInterval(checkCompletion);
                if (format === "gif") finishGifExport(resolve);
                else if (recorder?.state === "recording") recorder.stop();
              }
            }, 100);
          } catch (err) {
            isExportingRef.current = false;
            if (masterGainRef.current)
              masterGainRef.current.gain.setValueAtTime(
                1,
                audioContextRef.current!.currentTime
              );
            reject(err);
          }
        });
      },
    }));

    const finishGifExport = (resolveCallback: () => void) => {
      const gifshot = (window as any).gifshot;
      if (!gifshot || gifFramesRef.current.length === 0) {
        toast.error("GIF generation failed");
        isExportingRef.current = false;
        setExportProgress(0);
        resolveCallback();
        return;
      }
      setExportProgress(98);

      const { width, height } = stateRef.current.canvasSettings;
      const targetWidth = 480; // Standard optimized width for shared GIFs
      const targetHeight = Math.round((height / width) * targetWidth);

      gifshot.createGIF(
        {
          images: gifFramesRef.current,
          gifWidth: targetWidth,
          gifHeight: targetHeight,
          interval: 0.1, // 10 FPS
          numWorkers: 2,
        },
        (obj: any) => {
          if (!obj.error) {
            const a = document.createElement("a");
            a.href = obj.image;
            a.download = `animation_${Date.now()}.gif`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } else {
            console.error("Gifshot error:", obj.error);
          }
          isExportingRef.current = false;
          setExportProgress(0);
          resolveCallback();
        }
      );
    };

    useEffect(() => {
      if (!containerRef.current) return;
      const calculateScale = () => {
        if (!containerRef.current) return;
        const { width, height } = stateRef.current.canvasSettings;
        const fitScale = Math.min(
          containerRef.current.clientWidth / width,
          containerRef.current.clientHeight / height
        );
        setScale(fitScale * 0.95);
      };
      const resizeObserver = new ResizeObserver(calculateScale);
      resizeObserver.observe(containerRef.current);
      calculateScale();
      return () => resizeObserver.disconnect();
    }, [canvasSettings]);

    const updateUI = useCallback(
      (time: number) => {
        if (playheadRef.current)
          playheadRef.current.style.transform = `translateX(${
            time * stateRef.current.zoom
          }px)`;
        if (timeDisplayRef.current)
          timeDisplayRef.current.innerText = `${formatTime(
            time
          )} / ${formatTime(stateRef.current.duration)}`;
      },
      [playheadRef, timeDisplayRef]
    );

    const calculateTransitionProps = useCallback((time: number, clip: Clip) => {
      const props = clip.properties;
      let opacity = props.opacity !== undefined ? props.opacity : 1;
      let scale = 1;
      let rotation = props.rotation || 0;
      let translateX = 0;
      let clipPath: string | null = null;
      let filter: string | null = null;

      // Transition In
      if (props.transitionIn && props.transitionIn !== "none") {
        const d = props.transitionInDuration || 0.5;
        const progress = Math.min(1, (time - clip.startOffset) / d);

        if (progress < 1) {
          if (props.transitionIn === "fade") {
            opacity = progress;
          } else if (props.transitionIn === "swirl") {
            opacity = progress;
            scale = 0.1 + progress * 0.9;
            rotation = -180 * progress;
          } else if (props.transitionIn === "wipe") {
            translateX = (1 - progress) * 100; // shift
          } else if (props.transitionIn === "radial") {
            clipPath = `circle(${progress * 150}% at center)`;
          } else if (props.transitionIn === "zoom_cinematic") {
            opacity = progress;
            scale = 5 - progress * 4; // Start at 5x, end at 1x
          } else if (props.transitionIn === "blinds") {
            const numStrips = 8;
            const stripH = 100 / numStrips;
            let poly = "polygon(";
            for (let i = 0; i < numStrips; i++) {
              const stripProgress = Math.min(
                1,
                Math.max(0, progress - i * 0.05) / 0.6
              );
              const p = stripProgress * 100;
              const top = i * stripH;
              const bottom = (i + 1) * stripH;
              poly += `0 ${top}, ${p} ${top}, ${p} ${bottom}, 0 ${bottom}, `;
            }
            clipPath = poly.slice(0, -2) + ")";
          } else if (props.transitionIn === "flash") {
            opacity = Math.min(1, progress * 2);
            filter = `brightness(${1 + (1 - progress) * 5})`;
          } else if (props.transitionIn === "push") {
            translateX = (1 - progress) * 50;
          } else if (props.transitionIn === "dissolve") {
            const glitchIntensity = 1 - progress;
            translateX = Math.sin(time * 20) * 4 * glitchIntensity;
            filter = `hue-rotate(${360 * glitchIntensity}deg)`;
          } else if (props.transitionIn === "leak_flash") {
            opacity = progress;
            filter = `brightness(${1 + (1 - progress) * 3})`;
          } else if (props.transitionIn === "wave_warp") {
            translateX = Math.sin(progress * Math.PI) * 20;
            scale = 1 + Math.sin(time * 10) * 0.1 * (1 - progress);
          } else if (props.transitionIn === "spin_blur") {
            rotation = 360 * progress;
            filter = `blur(${5 * (1 - progress)}px)`;
          } else if (props.transitionIn === "cube_spin") {
            scale = 0.1 + progress * 0.9;
            rotation = 180 * progress;
          } else if (props.transitionIn === "shake_zoom") {
            scale = 1.5 - progress * 0.5;
            translateX = (Math.random() - 0.5) * 10 * (1 - progress);
          } else if (props.transitionIn === "flipside") {
            scale = 1 - Math.cos(progress * Math.PI) * 0.5;
            rotation = progress * 180;
          }
        }
      }

      // Transition Out
      if (props.transitionOut && props.transitionOut !== "none") {
        const d = props.transitionOutDuration || 0.5;
        const remaining = clip.startOffset + clip.duration - time;
        const progress = Math.min(1, remaining / d); // 1=start, 0=end

        if (progress < 1) {
          if (props.transitionOut === "fade") {
            opacity = progress;
          } else if (props.transitionOut === "swirl") {
            opacity = progress;
            scale = 1 - (1 - progress) * 0.1;
            rotation = (1 - progress) * 180;
          } else if (props.transitionOut === "wipe") {
            translateX = (progress - 1) * 100;
          } else if (props.transitionOut === "radial") {
            clipPath = `circle(${progress * 150}% at center)`;
          } else if (props.transitionOut === "zoom_cinematic") {
            opacity = progress;
            scale = 1 + (1 - progress) * 0.9; // Starts 1, ends 0.1
          } else if (props.transitionOut === "blinds") {
            const numStrips = 8;
            const stripH = 100 / numStrips;
            let poly = "polygon(";
            for (let i = 0; i < numStrips; i++) {
              const stripProgress = Math.min(
                1,
                Math.max(0, progress - i * 0.05) / 0.6
              );
              const p = stripProgress * 100;
              const top = i * stripH;
              const bottom = (i + 1) * stripH;
              poly += `0 ${top}, ${p} ${top}, ${p} ${bottom}, 0 ${bottom}, `;
            }
            clipPath = poly.slice(0, -2) + ")";
          } else if (props.transitionOut === "flash") {
            opacity = progress;
            filter = `brightness(${1 + (1 - progress) * 5})`;
          } else if (props.transitionOut === "push") {
            translateX = progress * 50;
          } else if (props.transitionOut === "dissolve") {
            const glitchIntensity = progress;
            translateX = Math.sin(time * 20) * 4 * glitchIntensity;
            filter = `hue-rotate(${360 * glitchIntensity}deg)`;
          } else if (props.transitionOut === "leak_flash") {
            opacity = progress;
            filter = `brightness(${1 + progress * 3})`;
          } else if (props.transitionOut === "wave_warp") {
            translateX = Math.sin(progress * Math.PI) * -20;
            scale = 1 + Math.sin(time * 10) * 0.1 * progress;
          } else if (props.transitionOut === "spin_blur") {
            rotation = -360 * (1 - progress);
            filter = `blur(${5 * progress}px)`;
          } else if (props.transitionOut === "cube_spin") {
            scale = 0.1 + progress * 0.9;
            rotation = -180 * (1 - progress);
          } else if (props.transitionOut === "shake_zoom") {
            scale = 1 + (1 - progress) * 0.5;
            translateX = (Math.random() - 0.5) * 10 * progress;
          } else if (props.transitionOut === "flipside") {
            scale = 1 - Math.cos((1 - progress) * Math.PI) * 0.5;
            rotation = -180 * (1 - progress);
          }
        }
      }

      return { opacity, scale, rotation, translateX, clipPath, filter };
    }, []);

    const drawCompositeFrame = useCallback(() => {
      const canvas = exportCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { width, height, backgroundColor } =
        stateRef.current.canvasSettings;
      const { tracks, currentTime } = stateRef.current;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      tracks.forEach((track) => {
        if (
          track.isHidden ||
          [
            TrackType.AUDIO,
            TrackType.VOICE,
            TrackType.TEXT,
            TrackType.OBJECT,
            TrackType.VISUALIZER,
            TrackType.IMAGE
          ].includes(track.type as any)
        )
          return;
        track.clips.forEach((clip) => {
          const el = mediaRefs.current[clip.id];
          if (
            currentTime >= clip.startOffset &&
            currentTime < clip.startOffset + clip.duration
          ) {
            if (
              el instanceof HTMLVideoElement ||
              el instanceof HTMLImageElement
            ) {
              const {
                opacity,
                scale: tScale,
                rotation: tRotation,
                translateX,
                clipPath,
                filter,
              } = calculateTransitionProps(currentTime, clip);
              const props = clip.properties;
              let x =
                ((props.x || 50) / 100) * width + (translateX / 100) * width;
              let y = ((props.y || 50) / 100) * height;
              let scaleX = (props.scaleX || 1) * tScale;
              let scaleY = (props.scaleY || 1) * tScale;
              let naturalWidth =
                el instanceof HTMLVideoElement
                  ? el.videoWidth
                  : (el as HTMLImageElement).naturalWidth;
              let naturalHeight =
                el instanceof HTMLVideoElement
                  ? el.videoHeight
                  : (el as HTMLImageElement).naturalHeight;
              const baseScale = Math.min(
                width / naturalWidth,
                height / naturalHeight
              );
              const drawWidth = naturalWidth * baseScale * scaleX;
              const drawHeight = naturalHeight * baseScale * scaleY;
              ctx.save();
              ctx.globalAlpha = opacity;
              if (filter) ctx.filter = filter;

              if (props.blendMode && props.blendMode !== "normal") {
                ctx.globalCompositeOperation =
                  props.blendMode as GlobalCompositeOperation;
              }

              if (clipPath && clipPath.includes("circle")) {
                const radiusPercent = parseFloat(
                  clipPath.match(/circle\((.*)%\)/)?.[1] || "100"
                );
                ctx.beginPath();
                ctx.arc(
                  x,
                  y,
                  (radiusPercent / 100) * Math.max(width, height),
                  0,
                  Math.PI * 2
                );
                ctx.clip();
              } else if (clipPath && clipPath.includes("polygon")) {
                const points = clipPath
                  .match(/polygon\((.*)\)/)?.[1]
                  .split(",")
                  .map((p) => p.trim().split(" "));
                if (points) {
                  ctx.beginPath();
                  points.forEach((p, idx) => {
                    const px = (parseFloat(p[0]) / 100) * width;
                    const py = (parseFloat(p[1]) / 100) * height;
                    if (idx === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                  });
                  ctx.clip();
                }
              }
              ctx.translate(x, y);
              ctx.rotate((tRotation * Math.PI) / 180);
              try {
                ctx.drawImage(
                  el,
                  -drawWidth / 2,
                  -drawHeight / 2,
                  drawWidth,
                  drawHeight
                );
              } catch (e) {}
              ctx.restore();
            }
          }
        });
      });

      const fabricCanvas = containerRef.current?.querySelector(
        "canvas.lower-canvas"
      ) as HTMLCanvasElement;
      if (fabricCanvas) {
        ctx.drawImage(fabricCanvas, 0, 0, width, height);
      }
    }, [calculateTransitionProps]);

    const syncMedia = useCallback(
      (time: number, playing: boolean) => {
        const { tracks } = stateRef.current;
        if (fabricRef.current) fabricRef.current.update(time);
        if (playing && audioContextRef.current?.state === "suspended")
          audioContextRef.current.resume();

        tracks.forEach((track) => {
          if (track.isHidden || track.type === TrackType.TEXT) return;
          track.clips.forEach((clip) => {
            const el = mediaRefs.current[clip.id];
            if (!el) return;
            const isActive =
              time >= clip.startOffset &&
              time < clip.startOffset + clip.duration;
            const isMedia =
              el instanceof HTMLVideoElement || el instanceof HTMLAudioElement;
            const clipInternalTime =
              time - clip.startOffset + clip.mediaStartOffset;
            if (isActive) {
              if (
                track.type === TrackType.VIDEO ||
                track.type === TrackType.IMAGE
              ) {
                const {
                  opacity,
                  scale: tScale,
                  rotation: tRotation,
                  translateX,
                  clipPath,
                  filter,
                } = calculateTransitionProps(time, clip);
                el.style.opacity = String(opacity);
                const sx = (clip.properties.scaleX || 1) * tScale;
                const sy = (clip.properties.scaleY || 1) * tScale;

                const tx = (clip.properties.x ?? 50) - 50 + translateX;
                const ty = (clip.properties.y ?? 50) - 50;
                el.style.transform = `translate(${tx}%, ${ty}%) rotate(${tRotation}deg) scale(${sx}, ${sy})`;

                if (clipPath) el.style.clipPath = clipPath;
                else el.style.clipPath = "none";
                if (filter) el.style.filter = filter;
                else el.style.filter = "none";
              }
              if (isMedia) {
                const mediaEl = el as HTMLMediaElement;
                let vol = clip.properties.volume ?? 1;
                const playTime = time - clip.startOffset;
                const remaining = clip.duration - playTime;
                if (
                  clip.properties.audioFadeIn &&
                  playTime < clip.properties.audioFadeIn
                )
                  vol *= playTime / clip.properties.audioFadeIn;
                if (
                  clip.properties.audioFadeOut &&
                  remaining < clip.properties.audioFadeOut
                )
                  vol *= remaining / clip.properties.audioFadeOut;
                mediaEl.volume = Math.max(0, Math.min(1, vol));
                const drift = Math.abs(mediaEl.currentTime - clipInternalTime);

                // old code
                // if (
                //   Math.abs(mediaEl.currentTime - clipInternalTime) > 0.25 ||
                //   !playing
                // ) {
                //   try {
                //     mediaEl.currentTime = clipInternalTime;
                //   } catch (e) {}
                // }
                // if (playing && mediaEl.paused) mediaEl.play().catch(() => {});
                // else if (!playing && !mediaEl.paused) mediaEl.pause();
                
                // added this to work with IOS device
                if (!playing) {
                  if (drift > 0.01) {
                    mediaEl.currentTime = clipInternalTime;
                  }
                  if (!mediaEl.paused) mediaEl.pause();
                } else {
                  if (drift > 0.5) {
                    mediaEl.currentTime = clipInternalTime;
                  }
                  if (mediaEl.paused) {
                    mediaEl.play().catch(err => console.warn("Playback blocked", err));
                  }
                }
              }
            } else {
              if (
                track.type === TrackType.VIDEO ||
                track.type === TrackType.IMAGE
              ) {
                el.style.opacity = "0";
                el.style.filter = "none";
              }
              if (isMedia) {
                const mediaEl = el as HTMLMediaElement;
                if (!mediaEl.paused) mediaEl.pause();
              }
            }
          });
        });
      },
      [calculateTransitionProps]
    );

    useLayoutEffect(() => {
      if (!isPlaying) {
        syncMedia(currentTime, false);
        updateUI(currentTime);
      }
    }, [currentTime, isPlaying, syncMedia, updateUI]);

    useLayoutEffect(() => {
      let animationFrameId: number;
      let lastTimestamp = 0;
      const animate = (timestamp: number) => {
        try {
          const { isPlaying, duration, currentTime } = stateRef.current;
          if (!isPlaying) return;
          if (!lastTimestamp) lastTimestamp = timestamp;
          const nextTime = Math.min(
            currentTime + (timestamp - lastTimestamp) / 1000,
            duration
          );
          stateRef.current.currentTime = nextTime;
          lastTimestamp = timestamp;
          updateUI(nextTime);
          syncMedia(nextTime, true);

          if (window.innerWidth < 768) {
            onTimeUpdateRef.current(nextTime);
          }

        if (isExportingRef.current) {
          drawCompositeFrame();
          if (exportFormatRef.current === "gif") {
            const lastGif = (stateRef.current as any)._lastGif || 0;
            // Capture frame every 100ms (10 FPS)
            if (timestamp - lastGif >= 100 || lastGif === 0) {
              if (exportCanvasRef.current) {
                gifFramesRef.current.push(
                  exportCanvasRef.current.toDataURL("image/jpeg", 0.7)
                );
              }
              (stateRef.current as any)._lastGif = timestamp;
            }
          }
          setExportProgress((nextTime / duration) * 100);
        }

        if (nextTime >= duration) {
          onTimeUpdateRef.current(duration);
          onTogglePlayRef.current();

          syncMedia(duration, false);
          if (isExportingRef.current) {
            drawCompositeFrame();
            if (
              exportFormatRef.current === "gif" &&
              exportCanvasRef.current
            ) {
              gifFramesRef.current.push(
                exportCanvasRef.current.toDataURL("image/jpeg", 0.8)
              );
            }
          }
          return;
        }
        animationFrameId = requestAnimationFrame(animate);
        } catch (e) {
          console.error("Playback Error:", e);
          onTogglePlayRef.current();
        }
      };
      if (isPlaying) animationFrameId = requestAnimationFrame(animate);
      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (stateRef.current.isPlaying)
          onTimeUpdateRef.current(stateRef.current.currentTime);
      };
    }, [isPlaying, syncMedia, updateUI, drawCompositeFrame]);

    // old code before making it wokring with IOS voice fix
    // const handleTogglePlay = () => {
    //   if (!isPlaying) {
    //     Object.values(mediaRefs.current).forEach((el) => {
    //       if (el instanceof HTMLMediaElement) {
    //         el.play().catch(() => {});
    //       }
    //     });
    //     if (audioContextRef.current?.state === "suspended") {
    //       audioContextRef.current.resume();
    //     }
    //   }
    //   onTogglePlay();
    // };
  
    // new code work with IOS device
    const handleTogglePlay = () => {
      if (!isPlaying) {
        if (audioContextRef.current?.state === "suspended") {
          audioContextRef.current.resume();
        }
      } else {
        Object.values(mediaRefs.current).forEach((el) => {
          if (el instanceof HTMLMediaElement) {
            el.pause();
          }
        });
      }
      onTogglePlay();
    };

    return (
      <div className="flex flex-col h-full w-full p-0 md:p-4 relative overflow-hidden group select-none">
        {exportProgress > 0 && isExportingRef.current && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center flex-col gap-4">
            <div className="text-white font-medium text-lg">
              {exportProgress > 95 && exportFormatRef.current === "gif"
                ? "Encoding GIF..."
                : `Exporting ${exportFormatRef.current.toUpperCase()}...`}
            </div>
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-all duration-100 ease-linear"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <div className="text-gray-400 text-sm">
              {Math.round(exportProgress)}%
            </div>
          </div>
        )}
        <canvas
          ref={exportCanvasRef}
          width={canvasSettings.width}
          height={canvasSettings.height}
          className="hidden pointer-events-none"
        />
        <div
          ref={containerRef}
          className="flex-1 relative w-full h-full rounded-none md:rounded-lg overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-[#09090b] shadow-inner"
          onClick={() => onSelectClip(null)}
        >
          <div
            style={{
              width: canvasSettings.width,
              height: canvasSettings.height,
              backgroundColor: canvasSettings.backgroundColor,
              transform: `scale(${scale})`,
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
            className="relative overflow-hidden transition-transform duration-100 ease-out origin-center flex-shrink-0"
          >
            <VideoRenderer tracks={tracks} ref={mediaRefs} />
            <FabricOverlay
              ref={fabricRef}
              tracks={tracks}
              width={canvasSettings.width}
              height={canvasSettings.height}
              selectedClipId={selectedClipId}
              onSelectClip={onSelectClip}
              onUpdateClip={onUpdateClip}
              isMobile={isMobile}
            />
          </div>
        </div>
        <div className="h-14 flex items-center justify-between px-4 mt-2 bg-white dark:bg-[#18181b] rounded-none md:rounded-lg border-t md:border border-gray-200 dark:border-[#27272a] shadow-sm z-20 shrink-0">
          <div className="flex items-center gap-2 w-48">
            <span
              ref={timeDisplayRef}
              className="text-sm md:text-xl font-mono font-medium text-gray-700 dark:text-gray-200"
            >
              {formatTime(currentTime)} /{" "}
              {formatTime(stateRef.current.duration)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                onTimeUpdate(0);
                updateUI(0);
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-white transition-colors"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={handleTogglePlay}
              className="p-2 md:p-3 rounded-full bg-primary-600 hover:bg-primary-50 text-white shadow-lg transition-transform active:scale-95"
            >
              {isPlaying ? (
                <Pause size={24} fill="currentColor" />
              ) : (
                <Play size={24} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button
              onClick={() => {
                onTimeUpdate(duration);
                updateUI(duration);
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-white transition-colors"
            >
              <SkipForward size={20} />
            </button>
          </div>
          <div className="w-48 flex justify-end"></div>
        </div>
      </div>
    );
  }
);
