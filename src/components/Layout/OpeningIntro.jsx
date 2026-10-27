import { useEffect, useRef, useState } from 'react';
import introVideo from '../../../abertura do programa/1000131540.mp4';

export default function OpeningIntro({ onFinish, t }) {
  const videoRef = useRef(null);
  const transitionStartedRef = useRef(false);
  const pauseTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const introTimeoutRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const startFadeOut = () => {
    setIsClosing(true);
    closeTimeoutRef.current = window.setTimeout(onFinish, 300);
  };

  const handleVideoEnd = () => {
    if (transitionStartedRef.current) return;

    transitionStartedRef.current = true;
    window.clearTimeout(introTimeoutRef.current);
    videoRef.current?.pause();
    pauseTimeoutRef.current = window.setTimeout(startFadeOut, 500);
  };

  const handleSkip = () => {
    if (transitionStartedRef.current) return;

    transitionStartedRef.current = true;
    window.clearTimeout(introTimeoutRef.current);
    videoRef.current?.pause();
    startFadeOut();
  };

  const handleCanPlay = () => {
    const video = videoRef.current;

    if (!video || introTimeoutRef.current !== null || transitionStartedRef.current) return;

    video.playbackRate = 1.2;
    video.play().catch((error) => {
      console.error('Não foi possível iniciar o vídeo de abertura:', error);
    });
    introTimeoutRef.current = window.setTimeout(handleVideoEnd, 4500);
  };

  useEffect(() => {
    return () => {
      window.clearTimeout(introTimeoutRef.current);
      window.clearTimeout(pauseTimeoutRef.current);
      window.clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleAudioToggle = () => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div className={`abertura-overlay fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center bg-black ${isClosing ? 'sumir' : ''}`}>
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src={introVideo}
        muted={isMuted}
        playsInline
        preload="auto"
        onCanPlay={handleCanPlay}
        onEnded={handleVideoEnd}
        aria-label={t.openingVideoLabel}
      />
      <div className="absolute bottom-5 right-5 flex gap-2">
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-md bg-black/60 px-4 py-2 text-sm text-white transition hover:bg-black/80"
        >
          {t.skipOpening}
        </button>
        <button
          type="button"
          onClick={handleAudioToggle}
          className="rounded-md bg-black/60 px-3 py-2 text-lg text-white transition hover:bg-black/80"
          title={isMuted ? t.turnSoundOn : t.turnSoundOff}
          aria-label={isMuted ? t.turnSoundOn : t.turnSoundOff}
        >
          {isMuted ? '🔇' : '🎵'}
        </button>
      </div>
    </div>
  );
}