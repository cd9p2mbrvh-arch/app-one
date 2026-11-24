import { linesFor } from '../lines';
import { THEMES, VOICES } from '../manifest';
import { narrationClip, narrationSprites } from '../narration';
import { NARRATION, type ThemeNarration } from '../narration.generated';

describe('narration clips', () => {
  it.each(THEMES.map((t) => t.id))(
    'exist for every line of theme "%s", for every narrator, with a sensible window',
    (theme) => {
      for (const voice of VOICES) {
        for (const line of linesFor(theme, voice.id)) {
          const clip = narrationClip(theme, voice.id, line.id);
          expect(clip).toBeDefined();
          expect(clip!.end).toBeGreaterThan(clip!.start + 0.3);
          expect(clip!.end - clip!.start).toBeLessThan(15);
        }
      }
    },
  );

  it('never overlaps two lines in the same sprite', () => {
    for (const theme of Object.values(NARRATION)) {
      for (const group of [theme.shared, ...Object.values(theme.voices)]) {
        const clips = Object.values(group).sort((a, b) => a.start - b.start);
        for (let i = 1; i < clips.length; i++) {
          expect(clips[i].start).toBeGreaterThanOrEqual(clips[i - 1].end);
        }
      }
    }
  });

  it("prefers a narrator's own recording of a shared line over the placeholder", () => {
    const narration: Record<string, ThemeNarration> = {
      peace: {
        shared: { s001: { sprite: 'p/shared', start: 1, end: 2 } },
        voices: {
          voice2: {
            s001: { sprite: 'p/voice2', start: 5, end: 6 },
            v001: { sprite: 'p/voice2', start: 7, end: 8 },
          },
        },
      },
    };
    const sprites = { 'p/shared': 10, 'p/voice2': 20 };
    expect(narrationClip('peace', 'voice2', 's001', narration, sprites)).toEqual({
      source: 20,
      start: 5,
      end: 6,
    });
    expect(narrationClip('peace', 'voice1', 's001', narration, sprites)?.source).toBe(10);
    expect(narrationClip('peace', 'voice2', 'voice2-v001', narration, sprites)?.start).toBe(7);
    expect(narrationClip('peace', 'voice1', 'voice1-v001', narration, sprites)).toBeUndefined();
    expect(narrationSprites('peace', 'voice2', narration, sprites).sort()).toEqual([10, 20]);
  });

  it('uses two sprites per session: shared lines and the narrator’s own', () => {
    expect(narrationSprites('peace', 'voice3')).toHaveLength(2);
  });
});
