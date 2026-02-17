import { useEffect, useRef, useState } from "react";

let audioContext;
let strikeNoiseBuffer;
const CLASSIC_AUDIO_SRC = `${import.meta.env.BASE_URL}audio/magicbuttonsound.wav`;

const BURST_PARTICLES = Array.from({ length: 12 }, (_, index) => ({
  angle: index * 30,
  distanceX: index % 2 === 0 ? 145 : 172,
  distanceY: index % 2 === 0 ? 68 : 82,
  delay: (index % 3) * 0.03
}));

function getStrikeNoiseBuffer(context) {
  if (strikeNoiseBuffer && strikeNoiseBuffer.sampleRate === context.sampleRate) {
    return strikeNoiseBuffer;
  }

  const duration = 0.085;
  const length = Math.floor(context.sampleRate * duration);
  const noise = context.createBuffer(1, length, context.sampleRate);
  const channelData = noise.getChannelData(0);

  for (let index = 0; index < length; index += 1) {
    const decay = Math.pow(1 - index / length, 2.3);
    channelData[index] = (Math.random() * 2 - 1) * decay;
  }

  strikeNoiseBuffer = noise;
  return strikeNoiseBuffer;
}

function triggerBellNote(context, master, startTime, frequency, pan, duration) {
  const noteGain = context.createGain();
  const panner = context.createStereoPanner ? context.createStereoPanner() : null;

  noteGain.gain.setValueAtTime(0.0001, startTime);
  noteGain.gain.exponentialRampToValueAtTime(0.78, startTime + 0.005);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  if (panner) {
    panner.pan.setValueAtTime(pan, startTime);
    noteGain.connect(panner);
    panner.connect(master);
  } else {
    noteGain.connect(master);
  }

  const partials = [
    { ratio: 1, gain: 0.5, decay: 1.0 },
    { ratio: 2.31, gain: 0.19, decay: 0.82 },
    { ratio: 2.92, gain: 0.13, decay: 0.7 },
    { ratio: 3.99, gain: 0.08, decay: 0.62 }
  ];

  partials.forEach((partial, index) => {
    const oscillator = context.createOscillator();
    const partialGain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency * partial.ratio, startTime);
    oscillator.detune.setValueAtTime(index * 2.4, startTime);

    partialGain.gain.setValueAtTime(0.0001, startTime);
    partialGain.gain.exponentialRampToValueAtTime(partial.gain, startTime + 0.004);
    partialGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * partial.decay);

    oscillator.connect(partialGain);
    partialGain.connect(noteGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  });

  const strikeSource = context.createBufferSource();
  const strikeFilter = context.createBiquadFilter();
  const strikeGain = context.createGain();

  strikeSource.buffer = getStrikeNoiseBuffer(context);
  strikeFilter.type = "bandpass";
  strikeFilter.frequency.setValueAtTime(3200, startTime);
  strikeFilter.Q.setValueAtTime(1.45, startTime);

  strikeGain.gain.setValueAtTime(0.0001, startTime);
  strikeGain.gain.exponentialRampToValueAtTime(0.13, startTime + 0.004);
  strikeGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.055);

  strikeSource.connect(strikeFilter);
  strikeFilter.connect(strikeGain);

  if (panner) {
    strikeGain.connect(panner);
  } else {
    strikeGain.connect(master);
  }

  strikeSource.start(startTime);
  strikeSource.stop(startTime + 0.07);
}

async function playFallbackGeneratedChime() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  const context = audioContext;

  if (context.state === "suspended") {
    await context.resume();
  }

  const now = context.currentTime;
  const limiter = context.createDynamicsCompressor();
  const master = context.createGain();
  const output = context.createGain();
  const earlyLeftDelay = context.createDelay();
  const earlyRightDelay = context.createDelay();
  const earlyLeftGain = context.createGain();
  const earlyRightGain = context.createGain();
  const earlyLeftPan = context.createStereoPanner ? context.createStereoPanner() : null;
  const earlyRightPan = context.createStereoPanner ? context.createStereoPanner() : null;

  limiter.threshold.setValueAtTime(-16, now);
  limiter.knee.setValueAtTime(10, now);
  limiter.ratio.setValueAtTime(9, now);
  limiter.attack.setValueAtTime(0.002, now);
  limiter.release.setValueAtTime(0.22, now);

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1.05, now + 0.01);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);

  output.gain.setValueAtTime(1.12, now);

  earlyLeftDelay.delayTime.setValueAtTime(0.085, now);
  earlyRightDelay.delayTime.setValueAtTime(0.13, now);
  earlyLeftGain.gain.setValueAtTime(0.16, now);
  earlyRightGain.gain.setValueAtTime(0.12, now);

  master.connect(limiter);
  limiter.connect(output);
  output.connect(context.destination);

  if (earlyLeftPan) {
    earlyLeftPan.pan.setValueAtTime(-0.45, now);
  }

  if (earlyRightPan) {
    earlyRightPan.pan.setValueAtTime(0.45, now);
  }

  master.connect(earlyLeftDelay);
  master.connect(earlyRightDelay);
  earlyLeftDelay.connect(earlyLeftGain);
  earlyRightDelay.connect(earlyRightGain);

  if (earlyLeftPan) {
    earlyLeftGain.connect(earlyLeftPan);
    earlyLeftPan.connect(output);
  } else {
    earlyLeftGain.connect(output);
  }

  if (earlyRightPan) {
    earlyRightGain.connect(earlyRightPan);
    earlyRightPan.connect(output);
  } else {
    earlyRightGain.connect(output);
  }

  triggerBellNote(context, master, now, 987.77, -0.06, 0.9);
  triggerBellNote(context, master, now + 0.37, 739.99, 0.06, 1.1);
}

export default function App() {
  const [burstVersion, setBurstVersion] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const burstTimeoutRef = useRef(null);
  const classicAudioRef = useRef(null);

  useEffect(() => {
    const classicAudio = new Audio(CLASSIC_AUDIO_SRC);
    classicAudio.preload = "auto";
    classicAudio.volume = 0.72;
    classicAudioRef.current = classicAudio;

    return () => {
      if (burstTimeoutRef.current) {
        clearTimeout(burstTimeoutRef.current);
      }

      if (classicAudioRef.current) {
        classicAudioRef.current.pause();
        classicAudioRef.current = null;
      }
    };
  }, []);

  const handleClick = async () => {
    const activeAudio = classicAudioRef.current;

    if (activeAudio) {
      activeAudio.currentTime = 0;

      try {
        await activeAudio.play();
      } catch {
        await playFallbackGeneratedChime();
      }
    } else {
      await playFallbackGeneratedChime();
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
      <div className="ui-shell">
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
      </div>
    </main>
  );
}