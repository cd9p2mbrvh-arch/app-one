import { canStartLine, createLineQueue, gapMs, INTRO_MS } from '@/domain/linePlan';

/**
 * Runs one meditation session: background music, affirmations spoken one at a
 * time with 10–20 s of quiet in between, a clock that can be paused, and a gentle
 * fade-out at the end. Everything that touches the device (audio, speech, time)
 * is passed in, so the whole session can be tested with a fake clock.
 */

export const MUSIC_VOLUME = 0.35;
export const MUSIC_FADE_MS = 3000;
export const TICK_MS = 250;
/** If speech never reports that it finished, move on after this long. */
export const SPEECH_TIMEOUT_MS = 20000;

export type EngineLine = { id: string; text: string };

export type EngineDeps = {
  now: () => number;
  random: () => number;
  speak: (text: string, onDone: () => void) => void;
  stopSpeech: () => void;
  music: {
    play: () => void;
    pause: () => void;
    setVolume: (volume: number) => void;
    release: () => void;
  };
};

export type EngineState = {
  status: 'idle' | 'playing' | 'paused' | 'finished';
  elapsedMs: number;
  durationMs: number;
  /** Text of the line being spoken, if any. */
  currentLine: string | null;
  linesSpoken: number;
  /** Set when finished: true if the full time was reached. */
  completed: boolean | null;
};

type Timer = ReturnType<typeof setTimeout>;

export class SessionEngine {
  private state: EngineState;
  private queue;
  private byId: Map<string, string>;
  private accumulatedMs = 0;
  private resumedAt = 0;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private lineTimer: Timer | null = null;
  private speechGuard: Timer | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private lineToken = 0;
  private musicVolume = 0;

  constructor(
    lines: EngineLine[],
    durationMs: number,
    private deps: EngineDeps,
    private onChange: (state: EngineState) => void,
    private onFinish: (state: EngineState) => void = () => {},
  ) {
    this.byId = new Map(lines.map((l) => [l.id, l.text]));
    this.queue = createLineQueue(
      lines.map((l) => l.id),
      deps.random,
    );
    this.state = {
      status: 'idle',
      elapsedMs: 0,
      durationMs,
      currentLine: null,
      linesSpoken: 0,
      completed: null,
    };
  }

  getState(): EngineState {
    return this.state;
  }

  start() {
    if (this.state.status !== 'idle') return;
    this.resumedAt = this.deps.now();
    this.update({ status: 'playing' });
    this.musicVolume = 0;
    this.deps.music.setVolume(0);
    this.deps.music.play();
    this.fadeMusic(MUSIC_VOLUME);
    this.startTicking();
    this.scheduleLine(INTRO_MS);
  }

  pause() {
    if (this.state.status !== 'playing') return;
    this.accumulatedMs += this.deps.now() - this.resumedAt;
    this.stopTimers();
    this.cancelSpeech();
    this.deps.music.pause();
    this.update({ status: 'paused', elapsedMs: this.accumulatedMs, currentLine: null });
  }

  resume() {
    if (this.state.status !== 'paused') return;
    this.resumedAt = this.deps.now();
    this.update({ status: 'playing' });
    this.deps.music.play();
    this.startTicking();
    this.scheduleLine(INTRO_MS);
  }

  /**
   * Call when the app comes back to the foreground. If the system paused the
   * music while the app was away, start it again; the clock is based on real
   * time, so it is already correct (and finishes the session if time is up).
   */
  resync() {
    if (this.state.status !== 'playing') return;
    this.deps.music.play();
    const elapsedMs = Math.min(this.elapsed(), this.state.durationMs);
    if (elapsedMs >= this.state.durationMs) this.finish(true);
    else this.update({ elapsedMs });
  }

  /** Ends the session early, at the user's request. */
  end() {
    if (this.state.status === 'playing' || this.state.status === 'paused') this.finish(false);
  }

  /**
   * Stops everything (e.g. when the screen goes away). A finished session is left
   * alone so its music can complete the fade-out, which releases the player.
   */
  dispose() {
    if (this.state.status === 'finished') return;
    this.stopTimers();
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    this.cancelSpeech();
    this.deps.music.pause();
    this.deps.music.release();
  }

  private elapsed(): number {
    return this.state.status === 'playing'
      ? this.accumulatedMs + (this.deps.now() - this.resumedAt)
      : this.accumulatedMs;
  }

  private update(patch: Partial<EngineState>) {
    this.state = { ...this.state, ...patch };
    this.onChange(this.state);
  }

  private startTicking() {
    this.tickTimer = setInterval(() => {
      const elapsedMs = Math.min(this.elapsed(), this.state.durationMs);
      if (elapsedMs >= this.state.durationMs) this.finish(true);
      else this.update({ elapsedMs });
    }, TICK_MS);
  }

  private stopTimers() {
    if (this.tickTimer) clearInterval(this.tickTimer);
    if (this.lineTimer) clearTimeout(this.lineTimer);
    this.tickTimer = null;
    this.lineTimer = null;
  }

  private scheduleLine(delayMs: number) {
    if (this.lineTimer) clearTimeout(this.lineTimer);
    this.lineTimer = setTimeout(() => this.speakNext(), delayMs);
  }

  private speakNext() {
    if (this.state.status !== 'playing') return;
    if (!canStartLine(this.elapsed(), this.state.durationMs)) return;
    const id = this.queue.next();
    const text = id ? this.byId.get(id) : undefined;
    if (!text) return;
    const token = ++this.lineToken;
    const done = () => this.onLineDone(token);
    this.speechGuard = setTimeout(done, SPEECH_TIMEOUT_MS);
    this.update({ currentLine: text, linesSpoken: this.state.linesSpoken + 1 });
    this.deps.speak(text, done);
  }

  private onLineDone(token: number) {
    // Ignore late callbacks from a line that was already cut off.
    if (token !== this.lineToken || this.state.status !== 'playing') return;
    this.lineToken++;
    if (this.speechGuard) clearTimeout(this.speechGuard);
    this.speechGuard = null;
    this.update({ currentLine: null });
    this.scheduleLine(gapMs(this.deps.random));
  }

  private cancelSpeech() {
    this.lineToken++;
    if (this.speechGuard) clearTimeout(this.speechGuard);
    this.speechGuard = null;
    this.deps.stopSpeech();
  }

  private fadeMusic(target: number, then?: () => void) {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    const steps = MUSIC_FADE_MS / 100;
    const start = this.musicVolume;
    let step = 0;
    this.fadeTimer = setInterval(() => {
      step++;
      this.musicVolume = start + ((target - start) * step) / steps;
      this.deps.music.setVolume(this.musicVolume);
      if (step >= steps) {
        if (this.fadeTimer) clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        then?.();
      }
    }, 100);
  }

  private finish(completed: boolean) {
    const elapsedMs = completed ? this.state.durationMs : this.elapsed();
    this.accumulatedMs = elapsedMs;
    this.stopTimers();
    this.cancelSpeech();
    this.update({ status: 'finished', completed, elapsedMs, currentLine: null });
    this.fadeMusic(0, () => {
      this.deps.music.pause();
      this.deps.music.release();
    });
    this.onFinish(this.state);
  }
}
