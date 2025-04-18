import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Play, Pause, Volume2, VolumeX, Loader2, Maximize2, Minimize2, PictureInPicture2 } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';

interface VideoPlayerProps {
  videoUrl: string;
  isHost: boolean;
  qualities?: { label: string; url: string }[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, isHost, qualities }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverVolume, setHoverVolume] = useState<number | null>(null);
  const { socket } = useSocket();

  // Keyboard shortcuts
  useHotkeys('space', () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  useHotkeys('m', () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  useHotkeys('arrowleft', () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
    }
  }, []);

  useHotkeys('arrowright', () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5);
    }
  }, []);

  useHotkeys('arrowup', () => {
    if (videoRef.current) {
      const newVolume = Math.min(1, videoRef.current.volume + 0.1);
      handleVolumeChange(newVolume);
    }
  }, []);

  useHotkeys('arrowdown', () => {
    if (videoRef.current) {
      const newVolume = Math.max(0, videoRef.current.volume - 0.1);
      handleVolumeChange(newVolume);
    }
  }, []);

  useHotkeys('f', () => {
    toggleFullscreen();
  }, []);

  useHotkeys('p', () => {
    togglePictureInPicture();
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  const togglePictureInPicture = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPip(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPip(true);
      }
    } catch (err) {
      console.error('Picture-in-Picture error:', err);
    }
  }, []);

  const handlePlay = useCallback(async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
        if (isHost && socket) {
          socket.emit('play', { time: videoRef.current.currentTime });
        }
      } catch (err) {
        setError('Failed to play video. Please try again.');
        console.error('Playback error:', err);
      }
    }
  }, [isHost, socket]);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (isHost && socket) {
        socket.emit('pause', { time: videoRef.current.currentTime });
      }
    }
  }, [isHost, socket]);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      if (isHost && socket) {
        socket.emit('seek', { time });
      }
    }
  }, [isHost, socket]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  }, []);

  const formatTime = useCallback((time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const handleProgressHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    setHoverTime(percentage * videoRef.current.duration);
  }, []);

  const handleVolumeHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    setHoverVolume(percentage);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    const handleError = () => {
      setError('Failed to load video. Please check the URL and try again.');
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handlePlayEvent = (data: { time: number }) => {
      if (!isHost && videoRef.current) {
        videoRef.current.currentTime = data.time;
        videoRef.current.play();
        setIsPlaying(true);
      }
    };

    const handlePauseEvent = (data: { time: number }) => {
      if (!isHost && videoRef.current) {
        videoRef.current.currentTime = data.time;
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };

    const handleSeekEvent = (data: { time: number }) => {
      if (!isHost && videoRef.current) {
        videoRef.current.currentTime = data.time;
      }
    };

    socket.on('play', handlePlayEvent);
    socket.on('pause', handlePauseEvent);
    socket.on('seek', handleSeekEvent);

    return () => {
      socket.off('play', handlePlayEvent);
      socket.off('pause', handlePauseEvent);
      socket.off('seek', handleSeekEvent);
    };
  }, [socket, isHost]);

  if (error) {
    return (
      <div className="relative w-full max-w-4xl mx-auto bg-black rounded-lg p-8 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => {
            setError(null);
            setIsLoading(true);
            if (videoRef.current) {
              videoRef.current.load();
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full rounded-lg shadow-lg"
        preload="metadata"
        playsInline
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="text-white hover:text-gray-300"
                disabled={isLoading}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleVolumeChange(isMuted ? 1 : 0)}
                  className="text-white hover:text-gray-300"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div 
                  className="relative w-24"
                  onMouseMove={handleVolumeHover}
                  onMouseLeave={() => setHoverVolume(null)}
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  {hoverVolume !== null && (
                    <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-black/80 text-white text-sm rounded">
                      {Math.round(hoverVolume * 100)}%
                    </div>
                  )}
                </div>
              </div>
              
              <select
                value={playbackRate}
                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                className="bg-black/50 text-white rounded px-2 py-1"
                disabled={isLoading}
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>

              {qualities && qualities.length > 1 && (
                <select
                  value={videoUrl}
                  onChange={(e) => {
                    if (videoRef.current) {
                      videoRef.current.src = e.target.value;
                      videoRef.current.load();
                    }
                  }}
                  className="bg-black/50 text-white rounded px-2 py-1"
                >
                  {qualities.map((quality) => (
                    <option key={quality.url} value={quality.url}>
                      {quality.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePictureInPicture}
                className="text-white hover:text-gray-300"
                disabled={!document.pictureInPictureEnabled}
              >
                <PictureInPicture2 size={20} />
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300"
              >
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              
              <div className="text-white">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>
          
          <div 
            className="relative mt-2"
            onMouseMove={handleProgressHover}
            onMouseLeave={() => setHoverTime(null)}
          >
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full absolute top-0 left-0 z-10"
              disabled={isLoading}
            />
            <div
              className="absolute top-0 left-0 h-1 bg-gray-600"
              style={{ width: `${(buffered / duration) * 100}%` }}
            />
            {hoverTime !== null && (
              <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-black/80 text-white text-sm rounded">
                {formatTime(hoverTime)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;