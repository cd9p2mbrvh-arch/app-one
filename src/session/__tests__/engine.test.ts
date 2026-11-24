import { seededRandom } from '@/components/background/motion';
import { GAP_MS, INTRO_MS } from '@/domain/linePlan';

import {
  MUSIC_FADE_MS,
  MUSIC_VOLUME,
  SessionEngine,
  SPEECH_TIMEOUT_MS,
  type EngineLine,
} from '../engine';

const lines: EngineLine[] = Array.from({ length: 130 }, (_, i) => ({
  id: `l${i}`,
  text: `Line ${i}`,
}));
const MIN = 60000;

function setup({ durationMs = 10 * MIN, speechMs = 4000, autoFinishSpeech = true } = {}) {
  const spoken: string[] = [];
  let pendingDone: (() => void) | null = null;
  const music = { play: jest.fn(), pause: jest.fn(), setVolume: jest.fn(), release: jest.fn() };
  const deps = {
    now: () => Date.now(),
    random: seededRandom(9),
    speak: jest.fn((text: string, onDone: () => void) => {
      spoken.push(text);
      pendingDone = onDone;
      if (autoFinishSpeech) setTimeout(onDone, speechMs);
    }),
    stopSpeech: jest.fn(),
    music,
  };
  const onFinish = jest.fn();
  const engine = new SessionEngine(lines, durationMs, deps, () => {}, onFinish);
  return { engine, deps, music, spoken, onFinish, finishSpeech: () => pendingDone?.() };
}

beforeEach(() => jest.useFakeTimers({ now: new Date(2026, 0, 1, 9) }));
afterEach(() => jest.useRealTimers());

describe('SessionEngine', () => {
  it('fades the music in and speaks the first line after a short intro', () => {
    const { engine, music, spoken } = setup();
    engine.start();
    expect(music.play).toHaveBeenCalled();
    expect(music.setVolume).toHaveBeenCalledWith(0);

    jest.advanceTimersByTime(MUSIC_FADE_MS);
    expect(music.setVolume).toHaveBeenLastCalledWith(MUSIC_VOLUME);

    jest.advanceTimersByTime(INTRO_MS - MUSIC_FADE_MS - 1);
    expect(spoken).toHaveLength(0);
    jest.advanceTimersByTime(1);
    expect(spoken).toHaveLength(1);
  });

  it('waits 10–20 seconds after each line ends before the next one', () => {
    const { engine, spoken } = setup({ speechMs: 4000 });
    engine.start();
    jest.advanceTimersByTime(INTRO_MS + 4000); // first line spoken and finished
    expect(spoken).toHaveLength(1);
    jest.advanceTimersByTime(GAP_MS[0] - 1);
    expect(spoken).toHaveLength(1);
    jest.advanceTimersByTime(GAP_MS[1] - GAP_MS[0] + 1);
    expect(spoken).toHaveLength(2);
  });

  it('never repeats a line within a session', () => {
    const { engine, spoken } = setup({ durationMs: 30 * MIN });
    engine.start();
    jest.advanceTimersByTime(30 * MIN);
    expect(spoken.length).toBeGreaterThan(60);
    expect(new Set(spoken).size).toBe(spoken.length);
  });

  it('finishes at the chosen time, fades the music out and reports completion', () => {
    const { engine, music, onFinish } = setup({ durationMs: 3 * MIN });
    engine.start();
    jest.advanceTimersByTime(3 * MIN + 300);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0]).toMatchObject({
      status: 'finished',
      completed: true,
      elapsedMs: 3 * MIN,
    });
    expect(music.release).not.toHaveBeenCalled();
    jest.advanceTimersByTime(MUSIC_FADE_MS);
    expect(music.setVolume).toHaveBeenLastCalledWith(0);
    expect(music.release).toHaveBeenCalled();
  });

  it('does not start a new line in the last seconds', () => {
    const { engine, deps } = setup({ durationMs: INTRO_MS + 5000 });
    engine.start();
    jest.advanceTimersByTime(INTRO_MS + 5000);
    expect(deps.speak).not.toHaveBeenCalled();
  });

  it('pauses the clock, speech and music, and resumes where it left off', () => {
    const { engine, deps, music, spoken } = setup({ autoFinishSpeech: false });
    engine.start();
    jest.advanceTimersByTime(INTRO_MS + 1000); // a line is being spoken
    expect(spoken).toHaveLength(1);

    engine.pause();
    expect(deps.stopSpeech).toHaveBeenCalled();
    expect(music.pause).toHaveBeenCalled();
    const pausedAt = engine.getState().elapsedMs;
    jest.advanceTimersByTime(5 * MIN);
    expect(engine.getState().elapsedMs).toBe(pausedAt);
    expect(spoken).toHaveLength(1);

    engine.resume();
    expect(music.play).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(INTRO_MS);
    expect(spoken).toHaveLength(2);
    expect(engine.getState().elapsedMs).toBeGreaterThanOrEqual(pausedAt + INTRO_MS - 250);
  });

  it('ignores a late "finished" from a line that was cut off by pausing', () => {
    const { engine, spoken, finishSpeech } = setup({ autoFinishSpeech: false });
    engine.start();
    jest.advanceTimersByTime(INTRO_MS);
    engine.pause();
    finishSpeech(); // late callback for the cut-off line
    engine.resume();
    jest.advanceTimersByTime(INTRO_MS);
    expect(spoken).toHaveLength(2); // exactly one new line, no double scheduling
  });

  it('moves on if speech never reports that it finished', () => {
    const { engine, spoken } = setup({ autoFinishSpeech: false });
    engine.start();
    jest.advanceTimersByTime(INTRO_MS);
    expect(spoken).toHaveLength(1);
    jest.advanceTimersByTime(SPEECH_TIMEOUT_MS + GAP_MS[1]);
    expect(spoken).toHaveLength(2);
  });

  it('can be ended early and reports how long was listened', () => {
    const { engine, onFinish } = setup();
    engine.start();
    jest.advanceTimersByTime(4 * MIN + 30000);
    engine.end();
    expect(onFinish.mock.calls[0][0].completed).toBe(false);
    expect(onFinish.mock.calls[0][0].elapsedMs).toBeCloseTo(4.5 * MIN, -3);
  });

  it('lets the music finish fading out when disposed after the end', () => {
    const { engine, music } = setup({ durationMs: 3 * MIN });
    engine.start();
    jest.advanceTimersByTime(3 * MIN + 300);
    engine.dispose(); // e.g. the completion screen replaced the session screen
    expect(music.release).not.toHaveBeenCalled();
    jest.advanceTimersByTime(MUSIC_FADE_MS);
    expect(music.release).toHaveBeenCalledTimes(1);
  });

  it('cleans everything up when disposed', () => {
    const { engine, deps, music, spoken } = setup();
    engine.start();
    engine.dispose();
    jest.advanceTimersByTime(10 * MIN);
    expect(spoken).toHaveLength(0);
    expect(deps.stopSpeech).toHaveBeenCalled();
    expect(music.release).toHaveBeenCalled();
  });
});

describe('SessionEngine.resync (back from the lock screen)', () => {
  beforeEach(() => jest.useFakeTimers({ now: new Date(2026, 0, 1, 9) }));
  afterEach(() => jest.useRealTimers());

  it('restarts the music and catches the clock up', () => {
    const { engine, music } = setup({ durationMs: 10 * MIN });
    engine.start();
    // Simulate the app being frozen: time passes without timers running.
    jest.setSystemTime(Date.now() + 3 * MIN);
    engine.resync();
    expect(music.play).toHaveBeenCalledTimes(2);
    expect(engine.getState().elapsedMs).toBeGreaterThanOrEqual(3 * MIN);
  });

  it('finishes the session if its time ran out meanwhile', () => {
    const { engine, onFinish } = setup({ durationMs: 3 * MIN });
    engine.start();
    jest.setSystemTime(Date.now() + 5 * MIN);
    engine.resync();
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ completed: true }));
  });

  it('does nothing while paused', () => {
    const { engine, music } = setup();
    engine.start();
    engine.pause();
    engine.resync();
    expect(music.play).toHaveBeenCalledTimes(1);
  });
});
