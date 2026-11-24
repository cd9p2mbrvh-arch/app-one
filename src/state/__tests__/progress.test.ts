import AsyncStorage from '@react-native-async-storage/async-storage';
import { act } from '@testing-library/react-native';

import { useProfiles } from '../profiles';
import { PROGRESS_STORAGE_KEY, progressOf, useProgress } from '../progress';

const day = (d: number, h = 10) => new Date(2026, 0, d, h);
const record = async (
  profileId: string,
  s: Parameters<ReturnType<typeof useProgress.getState>['recordSession']>[1],
) => {
  let result!: ReturnType<ReturnType<typeof useProgress.getState>['recordSession']>;
  await act(() => {
    result = useProgress.getState().recordSession(profileId, s);
  });
  return result;
};

beforeEach(async () => {
  await AsyncStorage.clear();
  await act(() => useProgress.setState({ byProfile: {} }));
});

describe('progress store', () => {
  it('adds XP for a completed session, with the daily bonus once per day', async () => {
    const first = await record('p1', {
      completed: true,
      plannedMinutes: 10,
      listenedMs: 600000,
      themeId: 'peace',
      voiceId: 'voice1',
      musicId: 'music1',
      now: day(1),
    });
    expect(first.xp.total).toBe(140);
    expect(first.levelBefore).toBe(1);
    expect(first.levelAfter).toBe(2);

    const second = await record('p1', {
      completed: true,
      plannedMinutes: 3,
      listenedMs: 180000,
      themeId: 'peace',
      voiceId: 'voice1',
      musicId: 'music1',
      now: day(1, 20),
    });
    expect(second.xp.dailyBonus).toBe(0);
    expect(second.xpAfter).toBe(140 + 55);

    const nextDay = await record('p1', {
      completed: true,
      plannedMinutes: 3,
      listenedMs: 180000,
      themeId: 'peace',
      voiceId: 'voice1',
      musicId: 'music1',
      now: day(2),
    });
    expect(nextDay.xp.dailyBonus).toBe(15);

    const p = progressOf(useProgress.getState().byProfile, 'p1');
    expect(p.sessions).toBe(3);
    expect(p.totalMinutes).toBe(16);
    expect(p.lastResult).toEqual(nextDay);
  });

  it('keeps profiles separate', async () => {
    await record('a', {
      completed: true,
      plannedMinutes: 5,
      listenedMs: 300000,
      themeId: 'peace',
      voiceId: 'voice1',
      musicId: 'music1',
      now: day(1),
    });
    expect(progressOf(useProgress.getState().byProfile, 'b').totalXp).toBe(0);
  });

  it('does not spend the daily bonus on a session that earned nothing', async () => {
    await record('p1', {
      completed: false,
      plannedMinutes: 10,
      listenedMs: 30000,
      themeId: 'peace',
      voiceId: 'voice1',
      musicId: 'music1',
      now: day(1),
    });
    const later = await record('p1', {
      completed: true,
      plannedMinutes: 3,
      listenedMs: 180000,
      themeId: 'peace',
      voiceId: 'voice1',
      musicId: 'music1',
      now: day(1, 12),
    });
    expect(later.xp.dailyBonus).toBe(15);
  });

  it('is saved on the device and loaded back', async () => {
    await record('p1', {
      completed: true,
      plannedMinutes: 5,
      listenedMs: 300000,
      themeId: 'peace',
      voiceId: 'voice1',
      musicId: 'music1',
      now: day(1),
    });
    const raw = (await AsyncStorage.getItem(PROGRESS_STORAGE_KEY))!;
    await act(() => useProgress.setState({ byProfile: {} }));
    await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, raw);
    await act(() => useProgress.persist.rehydrate());
    expect(progressOf(useProgress.getState().byProfile, 'p1').totalXp).toBe(90);
  });

  it('awards +50 once a day for completing morning, noon and night', async () => {
    const s = {
      completed: true,
      plannedMinutes: 3,
      listenedMs: 180000,
      themeId: 'peace',
      voiceId: 'voice1',
      musicId: 'music1',
    };
    const morning = await record('p1', { ...s, now: day(3, 8) });
    expect(morning.periodsToday).toEqual(['morning']);
    expect(morning.xp.allPeriodsBonus).toBe(0);

    const noon = await record('p1', { ...s, now: day(3, 13) });
    expect(noon.periodsToday).toEqual(['morning', 'noon']);

    // 1:30 am still belongs to the same meditation day (night).
    const night = await record('p1', { ...s, now: day(4, 1) });
    expect(night.periodsToday).toEqual(['morning', 'noon', 'night']);
    expect(night.xp.allPeriodsBonus).toBe(50);

    const again = await record('p1', { ...s, now: day(4, 2) });
    expect(again.xp.allPeriodsBonus).toBe(0);

    // A new day starts at 05:00.
    const next = await record('p1', { ...s, now: day(4, 9) });
    expect(next.periodsToday).toEqual(['morning']);
    expect(next.xp.dailyBonus).toBe(15);
  });

  it('only counts completed sessions towards the times of day', async () => {
    const s = {
      plannedMinutes: 3,
      listenedMs: 120000,
      themeId: 'peace',
      voiceId: 'voice1',
      musicId: 'music1',
    };
    const early = await record('p1', { ...s, completed: false, now: day(5, 8) });
    expect(early.periodsToday).toEqual([]);
  });

  it('keeps a history, newest first', async () => {
    const s = {
      completed: true,
      plannedMinutes: 3,
      listenedMs: 180000,
      themeId: 'peace',
      voiceId: 'voice2',
      musicId: 'music3',
    };
    await record('p1', { ...s, now: day(6, 8) });
    await record('p1', {
      ...s,
      themeId: 'health',
      completed: false,
      listenedMs: 61000,
      now: day(6, 20),
    });
    const { history } = progressOf(useProgress.getState().byProfile, 'p1');
    expect(history.map((h) => h.themeId)).toEqual(['health', 'peace']);
    expect(history[0]).toMatchObject({
      completed: false,
      period: 'night',
      xp: 5,
      voiceId: 'voice2',
    });
    expect(history[1]).toMatchObject({ completed: true, period: 'morning', plannedMinutes: 3 });
  });

  it('upgrades progress saved by the previous version', async () => {
    await AsyncStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        state: {
          byProfile: {
            p1: {
              totalXp: 120,
              sessions: 2,
              totalMinutes: 13,
              lastXpDay: '2026-01-01',
              lastResult: null,
            },
          },
        },
        version: 1,
      }),
    );
    await act(() => useProgress.persist.rehydrate());
    expect(progressOf(useProgress.getState().byProfile, 'p1')).toMatchObject({
      totalXp: 120,
      sessions: 2,
      history: [],
      today: null,
    });
  });

  it('survives corrupted data', async () => {
    await AsyncStorage.setItem(
      PROGRESS_STORAGE_KEY,
      '{"state":{"byProfile":{"p1":{"totalXp":"lots"}}},"version":1}',
    );
    await act(() => useProgress.persist.rehydrate());
    expect(progressOf(useProgress.getState().byProfile, 'p1').totalXp).toBe(0);
  });

  it('is removed together with its profile', async () => {
    await act(() =>
      useProfiles.setState({
        profiles: [{ id: 'p1', name: 'Anna', avatar: 'moon', createdAt: '2026-01-01T00:00:00Z' }],
        activeId: 'p1',
      }),
    );
    await record('p1', {
      completed: true,
      plannedMinutes: 5,
      listenedMs: 300000,
      themeId: 'peace',
      voiceId: 'voice1',
      musicId: 'music1',
      now: day(1),
    });
    await act(() => useProfiles.getState().deleteProfile('p1'));
    expect(useProgress.getState().byProfile.p1).toBeUndefined();
  });
});
