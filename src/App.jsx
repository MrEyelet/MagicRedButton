import { useEffect, useRef, useState } from "react";

const DOORBELL_AUDIO_SRC = "/audio/doorbell-dingdong.ogg";

const BURST_PARTICLES = Array.from({ length: 12 }, (_, index) => ({
  angle: index * 30,
  distanceX: index % 2 === 0 ? 145 : 172,
  distanceY: index % 2 === 0 ? 68 : 82,
  delay: (index % 3) * 0.03
}));

export default function App() {
  const [burstVersion, setBurstVersion] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const burstTimeoutRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(DOORBELL_AUDIO_SRC);
    audio.preload = "auto";
    audio.volume = 0.72;
    audioRef.current = audio;

    return () => {
      if (burstTimeoutRef.current) {
        clearTimeout(burstTimeoutRef.current);
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleClick = async () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;

      try {
        await audioRef.current.play();
      } catch {
      }
    }

    if (burstTimeoutRef.current) {
      clearTimeout(burstTimeoutRef.current);
    }

    setShowBurst(false);

    requestAnimationFrame(() => {
      setBurstVersion((version) => version + 1);
      setShowBurst(true);
      burstTimeoutRef.current = setTimeout(() => {
        setShowBurst(false);
      }, 760);
    });
  };

  return (
    <main className="page">
      <div className="button-stage">
        {showBurst && (
          <div className="magic-burst" key={burstVersion} aria-hidden="true">
            {BURST_PARTICLES.map((particle, index) => (
              <span
                key={`${burstVersion}-${index}`}
                className="magic-spark"
                style={{
                  "--angle": `${particle.angle}deg`,
                  "--distance-x": `${particle.distanceX}px`,
                  "--distance-y": `${particle.distanceY}px`,
                  "--delay": `${particle.delay}s`
                }}
              />
            ))}
          </div>
        )}
        <button className="red-button" onClick={handleClick} aria-label="Czerwony przycisk" />
      </div>
    </main>
  );
}