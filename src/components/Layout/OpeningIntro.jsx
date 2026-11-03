import { useEffect, useRef, useState } from 'react';

export default function OpeningIntro({ onFinish, t }) {
  const videoRef = useRef(null);
  const transitionStartedRef = useRef(false);
  const introTimeoutRef = useRef(null);
  const fadeFrameRef = useRef(null);
  const [hideVideo, setHideVideo] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const startFadeOut = () => {
    if (transitionStartedRef.current) return;

    transitionStartedRef.current = true;
    window.clearTimeout(introTimeoutRef.current);
    videoRef.current?.pause();
    setHideVideo(true);
    fadeFrameRef.current = window.requestAnimationFrame(() => {
      fadeFrameRef.current = null;
      setIsFadingOut(true);
    });
  };

  const handleVideoEnd = () => {
    startFadeOut();
  };

  const handleSkip = () => {
    startFadeOut();
  };

  const handleCanPlay = () => {
    const video = videoRef.current;

    if (!video || introTimeoutRef.current !== null || transitionStartedRef.current) return;

    video.play().catch((error) => {
      console.error('Não foi possível iniciar o vídeo de abertura:', error);
    });
    introTimeoutRef.current = window.setTimeout(handleVideoEnd, 5500);
  };

  useEffect(() => {
    return () => {
      window.clearTimeout(introTimeoutRef.current);
      if (fadeFrameRef.current !== null) {
        window.cancelAnimationFrame(fadeFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMobile = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateMobile);
    return () => mediaQuery.removeEventListener('change', updateMobile);
  }, []);

  const handleAudioToggle = () => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const videoSrc = isMobile ? '/abertura-mobile.mp4' : '/abertura-desktop.mp4';
  console.log('Vídeo de abertura src:', videoSrc);

  return (
    <div className="abertura-overlay fixed inset-0 z-[100]">
      <div className="relative h-screen w-screen overflow-hidden">
        <div
          className={`absolute inset-0 z-0 bg-[#0f172a] transition-opacity duration-500 ${
            isFadingOut ? 'opacity-0' : 'opacity-100'
          }`}
          onTransitionEnd={(event) => {
            if (
              event.target === event.currentTarget &&
              event.propertyName === 'opacity' &&
              isFadingOut
            ) {
              onFinish();
            }
          }}
        />
        {!isVideoLoaded && (
          <div className="absolute inset-0 z-20 bg-[#0f172a]" aria-hidden="true" />
        )}
        <video
          ref={videoRef}
          key={videoSrc}
          fetchpriority="high"
          className={`absolute inset-0 z-10 h-full w-full object-cover ${
            hideVideo ? 'hidden' : ''
          }`}
          autoPlay
          muted={isMuted}
          playsInline
          preload="auto"
          onLoadedData={() => setIsVideoLoaded(true)}
          onCanPlay={handleCanPlay}
          onEnded={handleVideoEnd}
          onError={(event) => console.error('Erro no vídeo:', event.currentTarget.error)}
          aria-label={t.openingVideoLabel}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        <div className={`absolute z-50 bottom-5 right-5 flex gap-2 ${hideVideo ? 'hidden' : ''}`}>
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