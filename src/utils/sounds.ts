// Web Audio API sound utilities for wheel game
import { getSoundsEnabled } from '@/hooks/useSounds';

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Ticking sound - short click when passing segments
export const playTickSound = () => {
  if (!getSoundsEnabled()) return;
  
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.value = 1200;
  oscillator.type = 'square';
  
  gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.03);
};

// 100 points voice line
export const play100PointsSound = () => {
  if (!getSoundsEnabled()) return;
  
  const audio = new Audio('/sounds/100-points.ogg');
  audio.volume = 0.7;
  audio.play().catch(err => console.log('Audio play failed:', err));
};

// 200 points voice line
export const play200PointsSound = () => {
  if (!getSoundsEnabled()) return;
  
  const audio = new Audio('/sounds/200-points.ogg');
  audio.volume = 0.7;
  audio.play().catch(err => console.log('Audio play failed:', err));
};

// 500 points voice line
export const play500PointsSound = () => {
  if (!getSoundsEnabled()) return;
  
  const audio = new Audio('/sounds/500-points.ogg');
  audio.volume = 0.7;
  audio.play().catch(err => console.log('Audio play failed:', err));
};

// 1000 points voice line
export const play1000PointsSound = () => {
  if (!getSoundsEnabled()) return;
  
  const audio = new Audio('/sounds/1000-points.ogg');
  audio.volume = 0.7;
  audio.play().catch(err => console.log('Audio play failed:', err));
};

// 2000 points voice line
export const play2000PointsSound = () => {
  if (!getSoundsEnabled()) return;
  
  const audio = new Audio('/sounds/2000-points.ogg');
  audio.volume = 0.7;
  audio.play().catch(err => console.log('Audio play failed:', err));
};

// Win fanfare - ascending tones
export const playWinSound = () => {
  if (!getSoundsEnabled()) return;
  
  const ctx = getAudioContext();
  const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
  
  frequencies.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    
    const startTime = ctx.currentTime + index * 0.12;
    gainNode.gain.setValueAtTime(0.15, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.3);
  });
};

// Bankrupt sound - descending tones
export const playBankruptSound = () => {
  if (!getSoundsEnabled()) return;
  
  const ctx = getAudioContext();
  const frequencies = [400, 300, 200, 150]; // Descending
  
  frequencies.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'sawtooth';
    
    const startTime = ctx.currentTime + index * 0.15;
    gainNode.gain.setValueAtTime(0.1, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.2);
  });
};

// Nothing sound - single low tone
export const playNothingSound = () => {
  if (!getSoundsEnabled()) return;
  
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.value = 220;
  oscillator.type = 'triangle';
  
  gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.4);
};

// Bonus drumroll - suspenseful rolling sound
export const playBonusDrumroll = () => {
  if (!getSoundsEnabled()) return;
  
  const ctx = getAudioContext();
  const duration = 2;
  
  for (let i = 0; i < 40; i++) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 100 + Math.random() * 50;
    oscillator.type = 'triangle';
    
    const startTime = ctx.currentTime + (i * duration / 40);
    gainNode.gain.setValueAtTime(0.05 + (i / 40) * 0.1, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.05);
  }
};

// Jackpot sound - triumphant fanfare
export const playJackpotSound = () => {
  if (!getSoundsEnabled()) return;
  
  const ctx = getAudioContext();
  const frequencies = [523, 659, 784, 880, 1047, 1319, 1568]; // Extended scale
  
  frequencies.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    
    const startTime = ctx.currentTime + index * 0.1;
    gainNode.gain.setValueAtTime(0.2, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.5);
  });
};

// Reveal sound - swoosh effect
export const playRevealSound = () => {
  if (!getSoundsEnabled()) return;
  
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.setValueAtTime(200, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.2);
};

// Victory fanfare - extended celebration
export const playVictoryFanfare = () => {
  if (!getSoundsEnabled()) return;
  
  const ctx = getAudioContext();
  const melody = [
    { freq: 523, dur: 0.15 }, // C5
    { freq: 659, dur: 0.15 }, // E5
    { freq: 784, dur: 0.15 }, // G5
    { freq: 1047, dur: 0.3 }, // C6
    { freq: 784, dur: 0.1 }, // G5
    { freq: 1047, dur: 0.5 }, // C6 (hold)
  ];
  
  let time = 0;
  melody.forEach(({ freq, dur }) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    
    const startTime = ctx.currentTime + time;
    gainNode.gain.setValueAtTime(0.18, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + dur);
    
    time += dur * 0.8;
  });
};

// Buzzer sound - time's up warning
export const playBuzzerSound = () => {
  if (!getSoundsEnabled()) return;
  
  const ctx = getAudioContext();
  
  // Two-tone buzzer
  [200, 150].forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'square';
    
    const startTime = ctx.currentTime + index * 0.2;
    gainNode.gain.setValueAtTime(0.15, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.2);
  });
};
