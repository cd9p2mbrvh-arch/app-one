import type { AudioPlayer, AudioStatus } from 'expo-audio';

/**
 * Plays short segments ("clips") out of audio sprites: one file holding many
 * lines separated by silence. A clip plays by seeking to its start and pausing
 * when playback passes its end. One player per sprite file, created once and
 * reused, so a sprite only loads once per session.
 */
export type SpriteClip = { source: number; start: number; end: number };

type PlayerLike = Pick<AudioPlayer, 'play' | 'pause' | 'seekTo' | 'remove' | 'setPlaybackRate'> & {
  volume: number;
  shouldCorrectPitch: boolean;
  addListener: (
    event: 'playbackStatusUpdate',
    listener: (status: Pick<AudioStatus, 'currentTime' | 'didJustFinish'>) => void,
  ) => { remove: () => void };
};

/** How often players report their position while a clip plays (ms). */
export const CLIP_UPDATE_INTERVAL_MS = 100;

export class SpritePlayer {
  private players = new Map<number, { player: PlayerLike; sub: { remove: () => void } }>();
  private active: { player: PlayerLike; end: number; onDone: () => void; token: number } | null =
    null;
  private token = 0;

  constructor(
    private create: (source: number) => PlayerLike,
    /** Playback speed; the pitch follows it (placeholder narrators sound different). */
    private rate = 1,
  ) {}

  /** Creates the player for a sprite ahead of time, so its first clip starts quickly. */
  preload(source: number) {
    this.playerFor(source);
  }

  play(clip: SpriteClip, onDone: () => void) {
    this.stop();
    const player = this.playerFor(clip.source);
    const token = ++this.token;
    this.active = { player, end: clip.end, onDone, token };
    player
      .seekTo(clip.start, 0, 0)
      .catch(() => {})
      .then(() => {
        if (this.active?.token === token) player.play();
      });
  }

  stop() {
    if (!this.active) return;
    this.active.player.pause();
    this.active = null;
  }

  release() {
    this.active = null;
    for (const { player, sub } of this.players.values()) {
      sub.remove();
      player.remove();
    }
    this.players.clear();
  }

  private playerFor(source: number): PlayerLike {
    const existing = this.players.get(source);
    if (existing) return existing.player;
    const player = this.create(source);
    player.shouldCorrectPitch = false;
    player.setPlaybackRate(this.rate);
    player.volume = 1;
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      const active = this.active;
      if (!active || active.player !== player) return;
      if (status.didJustFinish || status.currentTime >= active.end) {
        player.pause();
        this.active = null;
        active.onDone();
      }
    });
    this.players.set(source, { player, sub });
    return player;
  }
}
