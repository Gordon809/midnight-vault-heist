// Sound, synthesized live with WebAudio oscillators — no audio files.
// A soft footstep tick, a loot chime, an alarm swell, win and lose stings.

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type, vol, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  step() { this.tone(180 + Math.random() * 40, 0.05, 'sine', 0.04); }

  coin() { this.tone(1320, 0.09, 'triangle', 0.08); this.tone(1760, 0.12, 'triangle', 0.07, 0.07); }

  loot() {
    this.tone(660, 0.12, 'sine', 0.1);
    this.tone(880, 0.12, 'sine', 0.1, 0.09);
    this.tone(1320, 0.2, 'sine', 0.09, 0.18);
  }

  alarmBlip(level) {
    // level 0..1: faster, higher blips as the alarm climbs.
    this.tone(520 + level * 380, 0.09, 'square', 0.05);
  }

  emp() { this.tone(980, 0.25, 'sawtooth', 0.06); this.tone(320, 0.3, 'sawtooth', 0.05, 0.12); }

  win() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.1, i * 0.14));
  }

  lose() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.07, i * 0.16));
  }
}
