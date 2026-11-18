// Synthesised sound only (WebAudio): no audio files, no network requests.
// Every effect is built from oscillators and filtered noise.

export function createAudio() {
  let ctx = null;
  let engineOsc = null;
  let engineGain = null;
  let sirenTimer = null;
  let musicTimer = null;
  const api = {
    ensure() {
      if (!ctx) {
        try {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
          ctx = null;
        }
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return ctx;
    },
    tone(freq, dur, type = 'sine', vol = 0.12, slideTo = 0) {
      if (!this.ensure()) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise(dur, vol = 0.15, freq = 1200) {
      if (!this.ensure()) return;
      const t = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = vol;
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(t);
    },
    punch() {
      this.noise(0.12, 0.2, 500);
      this.tone(140, 0.1, 'square', 0.08, 70);
    },
    shot() {
      this.noise(0.18, 0.25, 2400);
      this.tone(900, 0.12, 'sawtooth', 0.1, 120);
    },
    pickup() {
      this.tone(660, 0.09, 'sine', 0.12);
      setTimeout(() => this.tone(990, 0.12, 'sine', 0.12), 70);
    },
    coin() {
      this.tone(880, 0.08, 'triangle', 0.1);
      setTimeout(() => this.tone(1320, 0.14, 'triangle', 0.1), 60);
    },
    jingle() {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.16, 'triangle', 0.12), i * 110));
    },
    busted() {
      [392, 311, 233].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'sawtooth', 0.1), i * 160));
    },
    engineStart() {
      if (!this.ensure() || engineOsc) return;
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 55;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0.0;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 320;
      engineOsc.connect(f).connect(engineGain).connect(ctx.destination);
      engineOsc.start();
    },
    engineSet(speed01) {
      if (engineOsc && engineGain) {
        engineOsc.frequency.value = 55 + speed01 * 130;
        engineGain.gain.value = 0.02 + speed01 * 0.05;
      }
    },
    engineStop() {
      if (engineOsc) {
        try {
          engineOsc.stop();
        } catch (e) {}
        engineOsc = null;
        engineGain = null;
      }
    },
    sirenStart() {
      if (!this.ensure() || sirenTimer) return;
      let hi = true;
      sirenTimer = setInterval(() => {
        this.tone(hi ? 720 : 540, 0.28, 'sine', 0.045);
        hi = !hi;
      }, 300);
    },
    sirenStop() {
      if (sirenTimer) {
        clearInterval(sirenTimer);
        sirenTimer = null;
      }
    },
    // Procedural night-drive music: Am – F – C – G, quiet bass + soft arp.
    // No audio files, no network. Started on the first user gesture.
    musicStart() {
      if (!this.ensure() || musicTimer) return;
      const roots = [110, 87.31, 130.81, 98];
      const chords = [
        [220, 261.63, 329.63],
        [174.61, 220, 261.63],
        [196, 261.63, 329.63],
        [196, 246.94, 293.66],
      ];
      let step = 0;
      musicTimer = setInterval(() => {
        const bar = Math.floor(step / 8) % 4;
        const s = step % 8;
        if (s === 0 || s === 4) this.tone(roots[bar], 0.5, 'triangle', 0.055);
        if (s % 2 === 0) {
          const chord = chords[bar];
          this.tone(chord[(step / 2) % 3 | 0], 0.22, 'sine', 0.03);
        }
        step++;
      }, 240);
    },
    musicStop() {
      if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
    },
    musicToggle() {
      if (musicTimer) {
        this.musicStop();
        return false;
      }
      this.musicStart();
      return true;
    },
    musicPlaying() {
      return !!musicTimer;
    },
  };
  return api;
}
