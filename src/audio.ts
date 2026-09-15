export class GameAudio {
  private ctx: AudioContext | null = null;

  unlock(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  eat(): void {
    this.beep(640, 0.08, "triangle", 0.08);
    this.beep(880, 0.1, "sine", 0.06, 0.05);
  }

  die(): void {
    this.beep(220, 0.28, "sawtooth", 0.08);
    this.beep(110, 0.35, "triangle", 0.07, 0.08);
  }

  start(): void {
    this.beep(392, 0.12, "sine", 0.06);
    this.beep(523, 0.14, "sine", 0.06, 0.08);
  }

  private beep(
    frequency: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    delay = 0,
  ): void {
    if (!this.ctx) return;
    const startAt = this.ctx.currentTime + delay;
    const oscillator = this.ctx.createOscillator();
    const volume = this.ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    volume.gain.setValueAtTime(0.0001, startAt);
    volume.gain.exponentialRampToValueAtTime(gain, startAt + 0.01);
    volume.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(volume);
    volume.connect(this.ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }
}
