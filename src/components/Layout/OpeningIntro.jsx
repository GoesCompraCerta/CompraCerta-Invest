import { useEffect, useRef, useState } from 'react';

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

    video.play().catch((error) => {
      console.error('Não foi possível iniciar o vídeo de abertura:', error);
    });
    introTimeoutRef.current = window.setTimeout(handleVideoEnd, 5200);
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

  const videoSrc = '/1000131540.mp4';
  console.log('Vídeo de abertura src:', videoSrc);

  return (
    <div className={`abertura-overlay fixed inset-0 z-[100] ${isClosing ? 'sumir' : ''}`}>
      <div className="relative h-screen w-screen overflow-hidden bg-black">
        <video
          className="absolute inset-0 h-full w-full object-cover blur-md opacity-60 md:hidden z-0"
          autoPlay
          muted
          playsInline
          preload="auto"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-contain md:object-cover z-10"
          autoPlay
          muted={isMuted}
          playsInline
          preload="auto"
          onCanPlay={handleCanPlay}
          onEnded={handleVideoEnd}
          onError={(event) => console.error('Erro no vídeo:', event.currentTarget.error)}
          aria-label={t.openingVideoLabel}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        <div className="absolute z-50 bottom-5 right-5 flex gap-2">
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
    </div>
  );
}