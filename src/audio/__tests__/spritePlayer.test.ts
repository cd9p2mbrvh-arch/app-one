import { SpritePlayer } from '../spritePlayer';

type Listener = (s: { currentTime: number; didJustFinish: boolean }) => void;

function fakePlayer() {
  let listener: Listener = () => {};
  return {
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    remove: jest.fn(),
    setPlaybackRate: jest.fn(),
    volume: 0,
    shouldCorrectPitch: true,
    addListener: jest.fn((_e: string, l: Listener) => {
      listener = l;
      return { remove: jest.fn() };
    }),
    emit: (currentTime: number, didJustFinish = false) => listener({ currentTime, didJustFinish }),
  };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('SpritePlayer', () => {
  it('seeks to the clip, plays it, and stops at its end', async () => {
    const p = fakePlayer();
    const sprites = new SpritePlayer(() => p, 0.9);
    const done = jest.fn();

    sprites.play({ source: 1, start: 12.5, end: 15 }, done);
    expect(p.seekTo).toHaveBeenCalledWith(12.5, 0, 0);
    await flush();
    expect(p.play).toHaveBeenCalled();
    expect(p.setPlaybackRate).toHaveBeenCalledWith(0.9);
    expect(p.shouldCorrectPitch).toBe(false);

    p.emit(14.9);
    expect(done).not.toHaveBeenCalled();
    p.emit(15.05);
    expect(p.pause).toHaveBeenCalled();
    expect(done).toHaveBeenCalledTimes(1);
    p.emit(15.2); // late updates are ignored
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('reuses one player per sprite and creates another for a different sprite', () => {
    const create = jest.fn(() => fakePlayer());
    const sprites = new SpritePlayer(create);
    sprites.preload(1);
    sprites.play({ source: 1, start: 0, end: 1 }, () => {});
    sprites.play({ source: 2, start: 0, end: 1 }, () => {});
    sprites.play({ source: 1, start: 3, end: 4 }, () => {});
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('does not report a clip that was stopped', async () => {
    const p = fakePlayer();
    const sprites = new SpritePlayer(() => p);
    const done = jest.fn();
    sprites.play({ source: 1, start: 0, end: 2 }, done);
    sprites.stop();
    await flush();
    expect(p.play).not.toHaveBeenCalled(); // the seek finished after stop
    p.emit(3);
    expect(done).not.toHaveBeenCalled();
  });

  it('releases all players', () => {
    const a = fakePlayer();
    const b = fakePlayer();
    const players = [a, b];
    const sprites = new SpritePlayer(() => players.shift()!);
    sprites.preload(1);
    sprites.preload(2);
    sprites.release();
    expect(a.remove).toHaveBeenCalled();
    expect(b.remove).toHaveBeenCalled();
  });
});
