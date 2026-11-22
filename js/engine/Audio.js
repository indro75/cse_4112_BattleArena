/**
 * Web Audio API Retro-Cyberpunk Sound Synthesizer & Dynamic BGM Engine
 * Zero external audio dependencies - 100% reliable, zero CORS/load errors.
 */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    this.musicVolume = 0.65;
    this.sfxVolume = 0.8;
    this.isMuted = false;

    this.isPlayingBGM = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.tempo = 128; // BPM
    this.secondsPerBeat = 60.0 / this.tempo;
    this.secondsPer16th = this.secondsPerBeat / 4.0;
    this.nextNoteTime = 0.0;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  /* ==========================================================
     PROCEDURAL SOUND EFFECTS
     ========================================================== */
  
  // Sword / Katana swing whoosh
  playSwing(type = 1) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const startFreq = type === 3 ? 340 : (type === 2 ? 440 : 520);
    const endFreq = type === 3 ? 90 : 120;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.16);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Meaty attack impact sound
  playHit(isHeavy = false) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Noise component for crunchy impact
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(isHeavy ? 450 : 800, now);
    noiseFilter.Q.setValueAtTime(2.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isHeavy ? 0.7 : 0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.18 : 0.1));

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    // Tone component for punchy low-end punch
    const osc = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    osc.type = isHeavy ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isHeavy ? 180 : 240, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    toneGain.gain.setValueAtTime(isHeavy ? 0.8 : 0.5, now);
    toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(toneGain);
    toneGain.connect(this.sfxGain);

    noise.start(now);
    osc.start(now);
    noise.stop(now + 0.2);
    osc.stop(now + 0.2);
  }

  // Shield block metallic deflection
  playBlock() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(600, now + 0.18);

    osc2.frequency.setValueAtTime(1850, now);
    osc2.frequency.exponentialRampToValueAtTime(900, now + 0.14);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.24);
    osc2.stop(now + 0.24);
  }

  // Dash / Dodge swoosh
  playDodge() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.2);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  // Jump upward chirp
  playJump() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Special attack energy charge & release blast
  playSpecialBlast() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Laser / plasma blast synth
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.4);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.46);
  }

  // Victory fanfare (uplifting synth chords)
  playVictory() {
    this.ensureContext();
    if (!this.ctx) return;
    const notes = [440, 554.37, 659.25, 880]; // A major
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.7);
    });
  }

  // Defeat descending drone
  playDefeat() {
    this.ensureContext();
    if (!this.ctx) return;
    const notes = [330, 311.13, 293.66, 220];
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.18;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.8);
    });
  }

  playUIHover() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.04);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playUIClick() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.08);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /* ==========================================================
     CYBERPUNK PROCEDURAL BGM ENGINE
     4-bar driving electro-synthwave combat track!
     ========================================================== */
  startBGM() {
    this.ensureContext();
    if (this.isPlayingBGM || !this.ctx) return;
    this.isPlayingBGM = true;
    this.bgmStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.scheduleBGM();
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  scheduleBGM() {
    if (!this.isPlayingBGM || !this.ctx) return;

    // Look ahead 0.1s and schedule notes
    while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
      this.playStep(this.bgmStep, this.nextNoteTime);
      this.nextNoteTime += this.secondsPer16th;
      this.bgmStep = (this.bgmStep + 1) % 64; // 4 bars of 16ths
    }

    this.bgmTimer = setTimeout(() => this.scheduleBGM(), 40);
  }

  playStep(step, time) {
    // Kick drum on beats 1, 5, 9, 13 (every quarter note)
    if (step % 4 === 0) {
      this.synthKick(time);
    }

    // Snare / clap on beats 4 and 12 (backbeat)
    if (step % 8 === 4) {
      this.synthSnare(time);
    }

    // Hi-hat on every 16th or offbeats
    if (step % 2 === 1) {
      this.synthHiHat(time, step % 4 === 2 ? 0.15 : 0.08);
    }

    // Cyberpunk saw bassline arpeggio (in D minor: D2, F2, G2, A2, C3)
    const bassline = [
      73.42, 73.42, 146.83, 73.42,  87.31, 87.31, 146.83, 87.31,
      98.00, 98.00, 146.83, 98.00,  110.0, 110.0, 130.81, 110.0,
      73.42, 73.42, 146.83, 73.42,  87.31, 87.31, 146.83, 87.31,
      98.00, 98.00, 130.81, 98.00,  87.31, 87.31, 73.42, 87.31,
      73.42, 73.42, 146.83, 73.42,  110.0, 110.0, 146.83, 110.0,
      130.81, 130.81, 146.83, 130.81, 110.0, 110.0, 98.00, 87.31,
      73.42, 73.42, 146.83, 73.42,  87.31, 87.31, 146.83, 87.31,
      98.00, 98.00, 110.0, 98.00,   130.81, 110.0, 98.00, 87.31
    ];

    const bassFreq = bassline[step % bassline.length];
    if (bassFreq) {
      this.synthBass(bassFreq, time);
    }

    // Lead cyber synth melody riffs (bars 2 & 4)
    if (step >= 16) {
      const melodyPattern = {
        16: 587.33, 19: 698.46, 22: 659.25, 24: 587.33,
        28: 440.00, 30: 523.25, 48: 880.00, 52: 783.99,
        56: 698.46, 60: 659.25, 62: 587.33
      };
      if (melodyPattern[step]) {
        this.synthLead(melodyPattern[step], time);
      }
    }
  }

  synthKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.1);
    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.13);
  }

  synthSnare(time) {
    // Noise
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    noise.start(time);
    noise.stop(time + 0.1);
  }

  synthHiHat(time, vol = 0.08) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(9500, time);
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  synthBass(freq, time) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, time);
    filter.frequency.exponentialRampToValueAtTime(150, time + 0.1);
    filter.Q.setValueAtTime(3.0, time);

    gain.gain.setValueAtTime(0.32, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  synthLead(freq, time) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, time);
    filter.Q.setValueAtTime(2.0, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.24);
  }
}

// Global instance
window.audioManager = new AudioManager();
