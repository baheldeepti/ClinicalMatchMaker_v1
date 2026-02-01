import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react';

// ============================================================================
// Props
// ============================================================================

interface AudioPlayerProps {
  audioUrl: string;
  transcript: string;
  duration?: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// Component
// ============================================================================

export function AudioPlayer({ audioUrl, transcript, duration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setTotalDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('Failed to load audio. Please try again or read the transcript below.');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || error) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, error]);

  // Mute toggle
  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Seek on progress bar click
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const progress = progressRef.current;
      if (!audio || !progress) return;

      const rect = progress.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * totalDuration;

      audio.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [totalDuration]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          audio.currentTime = Math.min(audio.currentTime + 5, totalDuration);
          break;
        case 'ArrowLeft':
          audio.currentTime = Math.max(audio.currentTime - 5, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, totalDuration]);

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // If no audio URL, show transcript only
  if (!audioUrl) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-2">Audio not available. Read the transcript below:</p>
        <div className="bg-white rounded p-4 text-sm text-gray-700 leading-relaxed">
          {transcript}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Error state */}
      {error && (
        <div className="text-sm text-red-600 mb-4 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      {/* Player controls */}
      <div className="flex items-center gap-4">
        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          disabled={isLoading || !!error}
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        {/* Progress section */}
        <div className="flex-1">
          {/* Progress bar */}
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="h-2 bg-gray-200 rounded-full cursor-pointer"
            role="progressbar"
            aria-valuenow={currentTime}
            aria-valuemin={0}
            aria-valuemax={totalDuration}
          >
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Time display */}
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Volume button */}
        <button
          onClick={toggleMute}
          className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Transcript toggle */}
      <div className="mt-4">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          {showTranscript ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Transcript
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show Transcript
            </>
          )}
        </button>

        {/* Transcript content */}
        {showTranscript && (
          <div className="mt-3 p-4 bg-white rounded border border-gray-200 text-sm text-gray-700 leading-relaxed">
            <p className="sr-only">Transcript:</p>
            {transcript}
          </div>
        )}
      </div>

      {/* Accessibility note */}
      <p className="mt-2 text-xs text-gray-500">
        Press Space to play/pause, Arrow keys to seek
      </p>
    </div>
  );
}
