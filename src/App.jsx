import { useEffect, useRef, useState } from "react";

let audioContext;
const DOORBELL_AUDIO_SRC = `${import.meta.env.BASE_URL}audio/doorbell-dingdong.ogg`;

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

  const playFallbackDingDong = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const context = audioContext;
    const now = context.currentTime;

    const playTone = (frequency, start, duration, gainValue) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    };

    playTone(659.25, now, 0.35, 0.24);
    playTone(523.25, now + 0.38, 0.65, 0.26);
  };

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
        playFallbackDingDong();
      }
    } else {
      playFallbackDingDong();
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