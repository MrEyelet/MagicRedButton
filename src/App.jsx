import { useEffect, useRef, useState } from "react";

let audioContext;

const BURST_PARTICLES = Array.from({ length: 12 }, (_, index) => ({
  angle: index * 30,
  distanceX: index % 2 === 0 ? 145 : 172,
  distanceY: index % 2 === 0 ? 68 : 82,
  delay: (index % 3) * 0.03
}));

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  return audioContext;
}

function playDeepStereoMagic(context) {
  const now = context.currentTime;
  const limiter = context.createDynamicsCompressor();
  const outputGain = context.createGain();
  const master = context.createGain();
  const delay = context.createDelay();
  const delayGain = context.createGain();
  const feedback = context.createGain();
  const leftPan = context.createStereoPanner ? context.createStereoPanner() : null;
  const rightPan = context.createStereoPanner ? context.createStereoPanner() : null;
  const centerPan = context.createStereoPanner ? context.createStereoPanner() : null;

  limiter.threshold.setValueAtTime(-24, now);
  limiter.knee.setValueAtTime(10, now);
  limiter.ratio.setValueAtTime(14, now);
  limiter.attack.setValueAtTime(0.0015, now);
  limiter.release.setValueAtTime(0.16, now);

  outputGain.gain.setValueAtTime(1.28, now);

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(2.05, now + 0.025);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.05);

  delay.delayTime.setValueAtTime(0.25, now);
  delayGain.gain.setValueAtTime(0.45, now);
  feedback.gain.setValueAtTime(0.38, now);

  if (leftPan) {
    leftPan.pan.setValueAtTime(-0.7, now);
  }

  if (rightPan) {
    rightPan.pan.setValueAtTime(0.7, now);
  }

  if (centerPan) {
    centerPan.pan.setValueAtTime(0, now);
  }

  master.connect(limiter);
  limiter.connect(outputGain);
  outputGain.connect(context.destination);
  master.connect(delay);
  delay.connect(delayGain);
  delay.connect(feedback);
  feedback.connect(delay);
  delayGain.connect(context.destination);

  const subOscillator = context.createOscillator();
  const subGain = context.createGain();
  subOscillator.type = "sine";
  subOscillator.frequency.setValueAtTime(98, now);
  subOscillator.frequency.exponentialRampToValueAtTime(69, now + 1.8);
  subGain.gain.setValueAtTime(0.0001, now);
  subGain.gain.exponentialRampToValueAtTime(0.45, now + 0.06);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.95);
  subOscillator.connect(subGain);

  if (centerPan) {
    subGain.connect(centerPan);
    centerPan.connect(master);
  } else {
    subGain.connect(master);
  }

  subOscillator.start(now);
  subOscillator.stop(now + 1.98);

  const stereoNotes = [
    { frequency: 220.0, start: 0.0, end: 0.72 },
    { frequency: 277.18, start: 0.16, end: 1.04 },
    { frequency: 329.63, start: 0.38, end: 1.42 }
  ];

  stereoNotes.forEach((note) => {
    const leftOscillator = context.createOscillator();
    const rightOscillator = context.createOscillator();
    const leftGain = context.createGain();
    const rightGain = context.createGain();
    const shimmerOscillator = context.createOscillator();
    const shimmerGain = context.createGain();

    leftOscillator.type = "triangle";
    rightOscillator.type = "triangle";
    shimmerOscillator.type = "sine";

    leftOscillator.frequency.setValueAtTime(note.frequency, now + note.start);
    leftOscillator.frequency.exponentialRampToValueAtTime(note.frequency * 0.94, now + note.end);

    rightOscillator.frequency.setValueAtTime(note.frequency * 1.006, now + note.start + 0.03);
    rightOscillator.frequency.exponentialRampToValueAtTime(note.frequency * 0.965, now + note.end + 0.03);

    shimmerOscillator.frequency.setValueAtTime(note.frequency * 2, now + note.start + 0.06);

    leftGain.gain.setValueAtTime(0.0001, now + note.start);
    leftGain.gain.exponentialRampToValueAtTime(0.38, now + note.start + 0.04);
    leftGain.gain.exponentialRampToValueAtTime(0.0001, now + note.end);

    rightGain.gain.setValueAtTime(0.0001, now + note.start + 0.03);
    rightGain.gain.exponentialRampToValueAtTime(0.38, now + note.start + 0.07);
    rightGain.gain.exponentialRampToValueAtTime(0.0001, now + note.end + 0.03);

    shimmerGain.gain.setValueAtTime(0.0001, now + note.start + 0.06);
    shimmerGain.gain.exponentialRampToValueAtTime(0.16, now + note.start + 0.1);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + note.end + 0.32);

    leftOscillator.connect(leftGain);
    rightOscillator.connect(rightGain);
    shimmerOscillator.connect(shimmerGain);

    if (leftPan) {
      leftGain.connect(leftPan);
      leftPan.connect(master);
    } else {
      leftGain.connect(master);
    }

    if (rightPan) {
      rightGain.connect(rightPan);
      rightPan.connect(master);
    } else {
      rightGain.connect(master);
    }

    shimmerGain.connect(master);

    leftOscillator.start(now + note.start);
    rightOscillator.start(now + note.start + 0.03);
    shimmerOscillator.start(now + note.start + 0.06);

    leftOscillator.stop(now + note.end + 0.04);
    rightOscillator.stop(now + note.end + 0.1);
    shimmerOscillator.stop(now + note.end + 0.34);
  });
}

export default function App() {
  const [burstVersion, setBurstVersion] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const burstTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (burstTimeoutRef.current) {
        clearTimeout(burstTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = async () => {
    const context = getAudioContext();

    if (context.state === "suspended") {
      await context.resume();
    }

    playDeepStereoMagic(context);

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