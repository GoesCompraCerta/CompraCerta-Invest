import { useEffect, useRef, useState } from 'react';
import introVideo from '../../../abertura do programa/1000131540.mp4';

export default function OpeningIntro({ onFinish }) {
  const videoRef = useRef(null);
  const transitionStartedRef = useRef(false);
  const pauseTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const startFadeOut = () => {
    setIsClosing(true);
    closeTimeoutRef.current = window.setTimeout(onFinish, 300);
  };

  const handleVideoEnd = () => {
    if (transitionStartedRef.current) return;

    transitionStartedRef.current = true;
    videoRef.current?.pause();
    pauseTimeoutRef.current = window.setTimeout(startFadeOut, 500);
  };

  const handleSkip = () => {
    if (transitionStartedRef.current) return;

    transitionStartedRef.current = true;
    videoRef.current?.pause();
    startFadeOut();
  };

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = false;
    const introTimeout = window.setTimeout(handleVideoEnd, 5000);

    video.play().catch(() => {
      // Browsers may block autoplay with audio until the user interacts.
      video.muted = true;
      setIsMuted(true);
      video.play().catch(() => {});
    });

    return () => {
      window.clearTimeout(introTimeout);
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
        autoPlay
        muted={isMuted}
        playsInline
        preload="auto"
        onEnded={handleVideoEnd}
        aria-label="Abertura do Compra Certa Investe"
      />
      <div className="absolute bottom-5 right-5 flex gap-2">
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-md bg-black/60 px-4 py-2 text-sm text-white transition hover:bg-black/80"
        >
          Pular abertura
        </button>
        <button
          type="button"
          onClick={handleAudioToggle}
          className="rounded-md bg-black/60 px-3 py-2 text-lg text-white transition hover:bg-black/80"
          title={isMuted ? 'Ligar som' : 'Desligar som'}
          aria-label={isMuted ? 'Ligar som' : 'Desligar som'}
        >
          {isMuted ? '🔇' : '🎵'}
        </button>
      </div>
    </div>
  );
}