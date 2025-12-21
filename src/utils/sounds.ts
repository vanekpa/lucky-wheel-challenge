// Web Audio API sound utilities for wheel game
import { getSoundsEnabled } from '@/hooks/useSounds';

let audioContext: AudioContext | null = null;
let audioUnlocked = false;

// Audio pool for preloaded sounds
const audioPool: Map<string, HTMLAudioElement> = new Map();

// All sound file paths
const ALL_SOUND_PATHS = [
  '/sounds/100-points.ogg',
  '/sounds/100-points-2.ogg',
  '/sounds/100-points-3.ogg',
  '/sounds/200-points.ogg',
  '/sounds/200-points-2.ogg',
  '/sounds/500-points.ogg',
  '/sounds/500-points-2.ogg',
  '/sounds/1000-points.ogg',
  '/sounds/2000-points.ogg',
  '/sounds/bankrot.ogg',
  '/sounds/bankrot-2.ogg',
  '/sounds/nic.ogg',
  '/sounds/not-enough-points.ogg',
  '/sounds/not-enough-points-2.ogg',
  '/sounds/not-enough-points-3.ogg',
  '/sounds/time-warning.ogg',
  '/sounds/first-round-complete.ogg',
  '/sounds/intro-jingle.ogg',
  '/sounds/letters/b.ogg',
  '/sounds/letters/b-2.ogg',
  '/sounds/letters/d.ogg',
  '/sounds/letters/g.ogg',
  '/sounds/letters/j.ogg',
  '/sounds/letters/l.ogg',
  '/sounds/letters/o.ogg',
  '/sounds/letters/p.ogg',
  '/sounds/letters/s.ogg',
  '/sounds/letters/t.ogg',
  '/sounds/letters/u.ogg',
  '/sounds/letters/u-2.ogg',
];

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Resume AudioContext if suspended (iOS requirement)
const ensureAudioContextResumed = async (): Promise<void> => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
};

// Unlock audio on iOS - call on first user interaction
export const unlockAudio = async (): Promise<void> => {
  if (audioUnlocked) return;
  
  try {
    // Resume AudioContext
    await ensureAudioContextResumed();
    
    // Play silent buffer to unlock HTML5 Audio on iOS
    const ctx = getAudioContext();
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    
    audioUnlocked = true;
    console.log('Audio unlocked for iOS');
  } catch (err) {
    console.log('Audio unlock failed:', err);
  }
};

// Preload all sound files into audio pool
export const preloadAllSounds = (): void => {
  ALL_SOUND_PATHS.forEach(path => {
    if (!audioPool.has(path)) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = path;
      audio.load();
      audioPool.set(path, audio);
    }
  });
  console.log(`Preloaded ${ALL_SOUND_PATHS.length} sound files`);
};

// Check if audio is unlocked
export const isAudioUnlocked = (): boolean => audioUnlocked;

// Play preloaded sound from pool (with fallback to new Audio)
const playPooledSound = async (path: string, volume: number = 0.7): Promise<void> => {
  await ensureAudioContextResumed();
  
  // Try to use pooled audio first
  const pooledAudio = audioPool.get(path);
  
  if (pooledAudio) {
    // Clone the audio element so we can play multiple instances
    const audio = pooledAudio.cloneNode() as HTMLAudioElement;
    audio.volume = volume;
    audio.play().catch(err => console.log('Audio play failed:', err));
  } else {
    // Fallback to creating new Audio
    const audio = new Audio(path);
    audio.volume = volume;
    audio.play().catch(err => console.log('Audio play failed:', err));
  }
};

// Ticking sound - short click when passing segments
export const playTickSound = async () => {
  if (!getSoundsEnabled()) return;
  
  await ensureAudioContextResumed();
  
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

// 100 points voice line (multiple versions, random selection)
export const play100PointsSound = async () => {
  if (!getSoundsEnabled()) return;
  
  const versions = ['/sounds/100-points.ogg', '/sounds/100-points-2.ogg', '/sounds/100-points-3.ogg'];
  const randomVersion = versions[Math.floor(Math.random() * versions.length)];
  
  await playPooledSound(randomVersion);
};

// 200 points voice line (multiple versions)
export const play200PointsSound = async () => {
  if (!getSoundsEnabled()) return;
  
  const versions = ['/sounds/200-points.ogg', '/sounds/200-points-2.ogg'];
  const randomVersion = versions[Math.floor(Math.random() * versions.length)];
  
  await playPooledSound(randomVersion);
};

// 500 points voice line (multiple versions)
export const play500PointsSound = async () => {
  if (!getSoundsEnabled()) return;
  
  const versions = ['/sounds/500-points.ogg', '/sounds/500-points-2.ogg'];
  const randomVersion = versions[Math.floor(Math.random() * versions.length)];
  
  await playPooledSound(randomVersion);
};

// 1000 points voice line
export const play1000PointsSound = async () => {
  if (!getSoundsEnabled()) return;
  await playPooledSound('/sounds/1000-points.ogg');
};

// 2000 points voice line
export const play2000PointsSound = async () => {
  if (!getSoundsEnabled()) return;
  await playPooledSound('/sounds/2000-points.ogg');
};

// Win fanfare - ascending tones
export const playWinSound = async () => {
  if (!getSoundsEnabled()) return;
  
  await ensureAudioContextResumed();
  
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

// Bankrupt sound - voice line (multiple versions)
export const playBankruptSound = async () => {
  if (!getSoundsEnabled()) return;
  
  const versions = ['/sounds/bankrot.ogg', '/sounds/bankrot-2.ogg'];
  const randomVersion = versions[Math.floor(Math.random() * versions.length)];
  
  await playPooledSound(randomVersion);
};

// Nothing sound - voice line
export const playNothingSound = async () => {
  if (!getSoundsEnabled()) return;
  await playPooledSound('/sounds/nic.ogg');
};

// Bonus drumroll - suspenseful rolling sound
export const playBonusDrumroll = async () => {
  if (!getSoundsEnabled()) return;
  
  await ensureAudioContextResumed();
  
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
export const playJackpotSound = async () => {
  if (!getSoundsEnabled()) return;
  
  await ensureAudioContextResumed();
  
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
export const playRevealSound = async () => {
  if (!getSoundsEnabled()) return;
  
  await ensureAudioContextResumed();
  
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
export const playVictoryFanfare = async () => {
  if (!getSoundsEnabled()) return;
  
  await ensureAudioContextResumed();
  
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
export const playBuzzerSound = async () => {
  if (!getSoundsEnabled()) return;
  
  await ensureAudioContextResumed();
  
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

// Not enough points for vowel - voice line (multiple versions)
export const playNotEnoughPointsSound = async () => {
  if (!getSoundsEnabled()) return;
  
  const versions = ['/sounds/not-enough-points.ogg', '/sounds/not-enough-points-2.ogg', '/sounds/not-enough-points-3.ogg'];
  const randomVersion = versions[Math.floor(Math.random() * versions.length)];
  
  await playPooledSound(randomVersion);
};

// Letter-specific sound effects (e.g., "B jako Babička")
// Supports multiple versions per letter - files should be named: b.ogg, b-2.ogg, b-3.ogg, etc.
const letterSoundCache: Map<string, string[]> = new Map();

// Check which letter sounds exist (called on first use)
const getLetterSounds = (letter: string): string[] => {
  const lowerLetter = letter.toLowerCase();
  
  if (letterSoundCache.has(lowerLetter)) {
    return letterSoundCache.get(lowerLetter)!;
  }
  
  // For now, we define known letter sounds manually
  // As you add more sounds, add them here
  const knownLetterSounds: Record<string, string[]> = {
    'b': ['/sounds/letters/b.ogg', '/sounds/letters/b-2.ogg'],
    'd': ['/sounds/letters/d.ogg'],
    'g': ['/sounds/letters/g.ogg'],
    'j': ['/sounds/letters/j.ogg'],
    'l': ['/sounds/letters/l.ogg'],
    'o': ['/sounds/letters/o.ogg'],
    'p': ['/sounds/letters/p.ogg'],
    's': ['/sounds/letters/s.ogg'],
    't': ['/sounds/letters/t.ogg'],
    'u': ['/sounds/letters/u.ogg', '/sounds/letters/u-2.ogg'],
  };
  
  const sounds = knownLetterSounds[lowerLetter] || [];
  letterSoundCache.set(lowerLetter, sounds);
  return sounds;
};

// Time warning sound - plays when 5 seconds remaining on timer
export const playTimeWarningSound = async () => {
  if (!getSoundsEnabled()) return;
  await playPooledSound('/sounds/time-warning.ogg');
};

// First round complete - plays when transitioning from round 1 to round 2
export const playFirstRoundCompleteSound = async () => {
  if (!getSoundsEnabled()) return;
  await playPooledSound('/sounds/first-round-complete.ogg');
};

export const playLetterSound = async (letter: string): Promise<boolean> => {
  if (!getSoundsEnabled()) {
    console.log('Letter sound skipped - sounds disabled');
    return false;
  }
  
  const sounds = getLetterSounds(letter);
  console.log(`Letter sound for "${letter}":`, sounds);
  
  if (sounds.length === 0) {
    console.log(`No sound found for letter "${letter}"`);
    return false; // No sound for this letter
  }
  
  // Pick random version if multiple exist
  const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
  console.log(`Playing letter sound: ${randomSound}`);
  
  await playPooledSound(randomSound, 0.8);
  
  return true;
};
