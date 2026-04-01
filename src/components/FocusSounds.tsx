import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

const SOUNDS = [
  { id: 'rain', label: '🌧️ Rain', freq: 200, type: 'brown' as const },
  { id: 'lofi', label: '🎵 Lo-Fi', freq: 300, type: 'pink' as const },
  { id: 'white', label: '⚪ White Noise', freq: 0, type: 'white' as const },
  { id: 'forest', label: '🌲 Forest', freq: 150, type: 'brown' as const },
  { id: 'ocean', label: '🌊 Ocean', freq: 100, type: 'brown' as const },
];

export function FocusSounds() {
  const [playing, setPlaying] = useState(false);
  const [selectedSound, setSelectedSound] = useState('rain');
  const [volume, setVolume] = useState(0.3);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const createNoise = (ctx: AudioContext, type: string) => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else {
      // Brown noise
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * w) / 1.02;
        last = data[i];
        data[i] *= 3.5;
      }
    }
    return buffer;
  };

  const startSound = () => {
    stopSound();
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const sound = SOUNDS.find(s => s.id === selectedSound);
    const buffer = createNoise(ctx, sound?.type || 'white');
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(ctx.destination);
    source.start();
    sourceRef.current = source;
    gainRef.current = gain;
    setPlaying(true);
  };

  const stopSound = () => {
    try { sourceRef.current?.stop(); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    sourceRef.current = null;
    audioCtxRef.current = null;
    gainRef.current = null;
    setPlaying(false);
  };

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  useEffect(() => {
    if (playing) { startSound(); }
  }, [selectedSound]);

  useEffect(() => () => stopSound(), []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xs mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Focus Sounds</h3>
      </div>
      <div className="glass rounded-xl p-3 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {SOUNDS.map(s => (
            <button key={s.id} onClick={() => setSelectedSound(s.id)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                selectedSound === s.id ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>{s.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={playing ? stopSound : startSound}
            className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center active:scale-95 transition-transform">
            {playing ? <Pause className="w-4 h-4 text-primary-foreground" /> : <Play className="w-4 h-4 text-primary-foreground" />}
          </button>
          <div className="flex items-center gap-2 flex-1">
            {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-muted-foreground" /> : <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />}
            <input type="range" min="0" max="1" step="0.05" value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 rounded-full appearance-none bg-secondary accent-primary" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
