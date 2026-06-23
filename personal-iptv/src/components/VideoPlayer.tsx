'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Channel {
  id: string;
  name: string;
  url: string;
  urls?: string[]; // fallback streams list
  logo?: string | null;
  category?: string;
  countryCode?: string;
  countryName?: string;
}

interface VideoPlayerProps {
  channel: Channel;
}

export default function VideoPlayer({ channel }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hlsError, setHlsError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [urlIndex, setUrlIndex] = useState(0);
  const [useProxy, setUseProxy] = useState(false);

  // Active URL to play
  const rawUrl = channel.urls && channel.urls.length > 0 ? channel.urls[urlIndex] : channel.url;
  const activeUrl = useProxy ? `/api/proxy?url=${encodeURIComponent(rawUrl)}` : rawUrl;

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    const video = videoRef.current;
    if (video && !video.paused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Reset play state when channel changes
  useEffect(() => {
    // Keep isPlaying as true if it was already playing, otherwise it remains false.
    // This allows seamless autoplay when switching channels.
    setHlsError(null);
    setUrlIndex(0);
    setUseProxy(false);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      const video = videoRef.current;
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch (e) {
        // Ignore reset-related exceptions
      }
    }
  }, [channel]);

  // Handle Playback Errors by trying proxy first, then switching to fallback urls
  const handlePlaybackError = (errorMessage: string) => {
    console.warn(`Stream playback failed on URL index ${urlIndex} (proxied: ${useProxy}) for ${channel.name}:`, errorMessage);
    
    // If we haven't tried proxying the current URL, try it now
    if (!useProxy) {
      console.warn(`Retrying active URL with CORS proxy...`);
      setUseProxy(true);
      return;
    }

    // If proxy failed, move to next fallback url if available
    const urls = channel.urls || [];
    if (urlIndex + 1 < urls.length) {
      const nextIdx = urlIndex + 1;
      console.warn(`Proxy failed. Trying next fallback stream URL index ${nextIdx}/${urls.length}...`);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setUseProxy(false);
      setUrlIndex(nextIdx);
    } else {
      setHlsError('Stream is offline, geo-blocked, or incompatible with your browser.');
    }
  };

  // Handle video playback and HLS loading
  useEffect(() => {
    if (!isPlaying || !activeUrl) return;

    const video = videoRef.current;
    if (!video) return;

    setHlsError(null);

    // Hls.js library (preferred for standard MSE support on Chrome, Firefox, Edge, etc.)
    if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 10,
        enableWorker: true,
      });
      hlsRef.current = hls;

      hls.loadSource(activeUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(err => {
          if (err.name !== 'AbortError') {
            handlePlaybackError(err.message || err.name);
          }
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('Fatal network HLS error. Attempting fallback stream...');
              handlePlaybackError(data.details);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('Fatal media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal HLS error:', data);
              handlePlaybackError(data.details);
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    } 
    // Safari / iOS Native HLS fallback (where MSE is not supported but native HLS is)
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.pause();
      video.src = activeUrl;
      video.play().catch(err => {
        if (err.name !== 'AbortError') {
          handlePlaybackError(err.message || err.name);
        }
      });
    } else {
      setHlsError('HLS streaming is not supported in your browser.');
    }
  }, [isPlaying, activeUrl]);

  // Volume control
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
    } else {
      const video = videoRef.current;
      if (video) {
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    }
  };

  const handlePlayPauseFromVideo = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    if (newVol > 0) setIsMuted(false);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error enabling fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const getChannelSymbol = () => {
    if (channel.category?.toLowerCase().includes('sport')) return '⚽';
    if (channel.category?.toLowerCase().includes('music')) return '🎵';
    if (channel.category?.toLowerCase().includes('movie')) return '🎬';
    if (channel.category?.toLowerCase().includes('news')) return '📰';
    if (channel.category?.toLowerCase().includes('kid')) return '👶';
    return '📡';
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => {
        const video = videoRef.current;
        if (video && !video.paused) {
          setShowControls(false);
        }
      }}
      className="group relative w-full aspect-video bg-neutral-950 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-md select-none"
    >
      {/* 1. idle Poster (Logo & Click-to-Play state) */}
      {!isPlaying && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center cursor-pointer bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 text-white"
        >
          {/* Logo / Symbol */}
          <div className="w-24 h-24 rounded-full bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all duration-300">
            {channel.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={channel.logo} 
                alt={channel.name} 
                className="w-16 h-16 object-contain rounded" 
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const parent = (e.target as HTMLElement).parentElement;
                  if (parent) {
                    const fallback = document.createElement('span');
                    fallback.innerText = getChannelSymbol();
                    fallback.className = 'text-4xl';
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <span className="text-4xl">{getChannelSymbol()}</span>
            )}
          </div>

          <div className="mt-4 text-center px-4">
            <h3 className="font-semibold text-lg">{channel.name}</h3>
            <p className="text-neutral-400 text-sm mt-1">{channel.category || 'General'} · {channel.countryName || 'International'}</p>
          </div>

          {/* Big Play Button */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors duration-300">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-lime-400 dark:bg-lime-400 text-black shadow-lg transform group-hover:scale-110 transition-all duration-300">
              <Play fill="currentColor" className="w-6 h-6 translate-x-0.5 text-neutral-900" />
            </div>
          </div>
        </div>
      )}

      {/* 2. Video Player Element */}
      {isPlaying && (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            onClick={handlePlayPauseFromVideo}
            onError={(e) => {
              const video = videoRef.current;
              const errorMsg = video?.error?.message || 'Video element playback error';
              handlePlaybackError(errorMsg);
            }}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
          />

          {/* Error Message */}
          {hlsError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 text-white z-20 p-4 text-center">
              <span className="text-3xl mb-2">⚠️</span>
              <p className="font-medium text-sm">{hlsError}</p>
              <Button 
                variant="outline"
                size="sm"
                className="mt-4 border-neutral-700 hover:bg-neutral-800 text-white"
                onClick={() => {
                  setIsPlaying(false);
                  setTimeout(() => setIsPlaying(true), 100);
                }}
              >
                Retry Stream
              </Button>
            </div>
          )}

          {/* Live Badge Top-Left */}
          <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600 text-white text-xs font-semibold uppercase tracking-wider select-none pointer-events-none transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            <Circle className="w-2 h-2 fill-white animate-pulse" />
            Live
          </div>

          {/* Stream Overlay Info Top-Right */}
          <div className={`absolute top-4 right-4 text-right pointer-events-none drop-shadow-md transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="text-xs text-white/90 font-medium">{channel.name}</div>
            <div className="text-[10px] text-white/60 mt-0.5">{channel.category || 'General'}</div>
          </div>

          {/* Controls Bar Overlay */}
          <div className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col gap-3 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            
            {/* Minimal Progress Bar (Purely Visual for Live Stream) */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full w-full bg-red-600"></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <button 
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/25 text-white transition-colors"
                  aria-label={videoRef.current?.paused ? 'Play' : 'Pause'}
                >
                  {videoRef.current?.paused ? (
                    <Play className="w-4 h-4 fill-white translate-x-0.5" />
                  ) : (
                    <Pause className="w-4 h-4 fill-white" />
                  )}
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/25 text-white transition-colors"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 accent-lime-400 h-1 bg-white/30 rounded-lg cursor-pointer"
                    aria-label="Volume"
                  />
                </div>

                {/* Live Indicator */}
                <span className="text-white text-xs font-semibold ml-2 select-none tracking-wider text-red-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  LIVE
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/25 text-white transition-colors"
                  aria-label="Fullscreen"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
