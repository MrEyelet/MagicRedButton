let audioContext;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  return audioContext;
}

function playMagicWand(context) {
  const now = context.currentTime;
  const master = context.createGain();
  const delay = context.createDelay();
  const delayGain = context.createGain();

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1.3, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

  delay.delayTime.setValueAtTime(0.095, now);
  delayGain.gain.setValueAtTime(0.2, now);

  master.connect(context.destination);
  master.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(context.destination);

  const notes = [
    { frequency: 1046.5, start: 0.0, end: 0.2 },
    { frequency: 1318.51, start: 0.11, end: 0.35 },
    { frequency: 1567.98, start: 0.24, end: 0.56 },
    { frequency: 2093.0, start: 0.4, end: 0.78 }
  ];

  notes.forEach((note) => {
    const bodyOscillator = context.createOscillator();
    const sparkleOscillator = context.createOscillator();
    const bodyGain = context.createGain();
    const sparkleGain = context.createGain();

    bodyOscillator.type = "triangle";
    sparkleOscillator.type = "square";

    bodyOscillator.frequency.setValueAtTime(note.frequency, now + note.start);
    bodyOscillator.frequency.exponentialRampToValueAtTime(note.frequency * 1.08, now + note.end);
    sparkleOscillator.frequency.setValueAtTime(note.frequency * 2.4, now + note.start);

    bodyGain.gain.setValueAtTime(0.0001, now + note.start);
    bodyGain.gain.exponentialRampToValueAtTime(0.4, now + note.start + 0.025);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + note.end);

    sparkleGain.gain.setValueAtTime(0.0001, now + note.start);
    sparkleGain.gain.exponentialRampToValueAtTime(0.11, now + note.start + 0.012);
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + 0.11);

    bodyOscillator.connect(bodyGain);
    sparkleOscillator.connect(sparkleGain);
    bodyGain.connect(master);
    sparkleGain.connect(master);

    bodyOscillator.start(now + note.start);
    sparkleOscillator.start(now + note.start);
    bodyOscillator.stop(now + note.end + 0.02);
    sparkleOscillator.stop(now + note.start + 0.12);
  });
}

export default function App() {
  const handleClick = async () => {
    const context = getAudioContext();

    if (context.state === "suspended") {
      await context.resume();
    }

    playMagicWand(context);
  };

  return (
    <main className="page">
      <button className="red-button" onClick={handleClick} aria-label="Czerwony przycisk" />
    </main>
  );
}