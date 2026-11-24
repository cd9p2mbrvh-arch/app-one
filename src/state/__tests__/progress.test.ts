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
      now: day(1, 20),
    });
    expect(second.xp.dailyBonus).toBe(0);
    expect(second.xpAfter).toBe(140 + 55);

    const nextDay = await record('p1', {
      completed: true,
      plannedMinutes: 3,
      listenedMs: 180000,
      themeId: 'peace',
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
      now: day(1),
    });
    const later = await record('p1', {
      completed: true,
      plannedMinutes: 3,
      listenedMs: 180000,
      themeId: 'peace',
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
      now: day(1),
    });
    const raw = (await AsyncStorage.getItem(PROGRESS_STORAGE_KEY))!;
    await act(() => useProgress.setState({ byProfile: {} }));
    await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, raw);
    await act(() => useProgress.persist.rehydrate());
    expect(progressOf(useProgress.getState().byProfile, 'p1').totalXp).toBe(90);
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
      now: day(1),
    });
    await act(() => useProfiles.getState().deleteProfile('p1'));
    expect(useProgress.getState().byProfile.p1).toBeUndefined();
  });
});
