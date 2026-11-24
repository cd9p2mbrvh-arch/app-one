import AsyncStorage from '@react-native-async-storage/async-storage';
import { act } from '@testing-library/react-native';

import {
  PROFILES_SCHEMA_VERSION,
  PROFILES_STORAGE_KEY,
  sanitizeProfiles,
  useProfiles,
} from '../profiles';

const store = () => useProfiles.getState();

async function add(name: string) {
  let result: ReturnType<ReturnType<typeof store>['addProfile']> | undefined;
  await act(() => {
    result = store().addProfile(name, 'moon');
  });
  return result!;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await act(() => useProfiles.setState({ profiles: [], activeId: null }));
});

describe('profiles store', () => {
  it('adds a profile and makes it active', async () => {
    const r = await add('  Anna  ');
    expect(r.ok).toBe(true);
    expect(store().profiles).toHaveLength(1);
    expect(store().profiles[0].name).toBe('Anna');
    expect(store().activeId).toBe(store().profiles[0].id);
  });

  it('allows at most 4 profiles', async () => {
    for (const n of ['A', 'B', 'C', 'D']) expect((await add(n)).ok).toBe(true);
    expect(await add('E')).toEqual({ ok: false, error: 'limitReached' });
    expect(store().profiles).toHaveLength(4);
  });

  it('rejects invalid and duplicate names', async () => {
    await add('Anna');
    expect(await add('anna')).toEqual({ ok: false, error: 'duplicate' });
    expect(await add('')).toEqual({ ok: false, error: 'empty' });
  });

  it('updates name and avatar', async () => {
    const r = await add('Anna');
    if (!r.ok) throw new Error('setup failed');
    await act(() => {
      store().updateProfile(r.id, { name: 'Ania', avatar: 'sunny' });
    });
    expect(store().profiles[0]).toMatchObject({ name: 'Ania', avatar: 'sunny' });
  });

  it('switches to another profile when the active one is deleted', async () => {
    const a = await add('Anna');
    const b = await add('Tomek');
    if (!a.ok || !b.ok) throw new Error('setup failed');
    expect(store().activeId).toBe(b.id);

    await act(() => store().deleteProfile(b.id));
    expect(store().activeId).toBe(a.id);

    await act(() => store().deleteProfile(a.id));
    expect(store().activeId).toBeNull();
    expect(store().profiles).toEqual([]);
  });

  it('ignores selecting an unknown profile', async () => {
    const a = await add('Anna');
    await act(() => store().selectProfile('nope'));
    expect(store().activeId).toBe(a.ok ? a.id : null);
  });

  it('saves to device storage and loads it back', async () => {
    await add('Anna');
    await add('Tomek');
    const raw = (await AsyncStorage.getItem(PROFILES_STORAGE_KEY))!;
    const saved = JSON.parse(raw);
    expect(saved.version).toBe(PROFILES_SCHEMA_VERSION);
    expect(saved.state.profiles.map((p: { name: string }) => p.name)).toEqual(['Anna', 'Tomek']);

    // Simulate an app restart: wipe memory, keep what was saved on the device.
    await act(() => useProfiles.setState({ profiles: [], activeId: null }));
    await AsyncStorage.setItem(PROFILES_STORAGE_KEY, raw);
    await act(() => useProfiles.persist.rehydrate());
    expect(store().profiles.map((p) => p.name)).toEqual(['Anna', 'Tomek']);
  });

  it('survives corrupted storage', async () => {
    await AsyncStorage.setItem(PROFILES_STORAGE_KEY, '{"state":{"profiles":"oops"},"version":1}');
    await act(() => useProfiles.persist.rehydrate());
    expect(store().profiles).toEqual([]);
    expect(store().activeId).toBeNull();
  });
});

describe('sanitizeProfiles', () => {
  const ok = (id: string, name: string) => ({
    id,
    name,
    avatar: 'moon',
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  it('drops malformed, duplicate and excess profiles', async () => {
    const result = sanitizeProfiles({
      profiles: [
        ok('1', 'Anna'),
        { id: '2', name: 'NoAvatar' },
        ok('3', 'anna'),
        ok('1', 'Same Id'),
        ok('4', 'B'),
        ok('5', 'C'),
        ok('6', 'D'),
        ok('7', 'E'),
      ],
      activeId: '7',
    });
    expect(result.profiles.map((p) => p.name)).toEqual(['Anna', 'B', 'C', 'D']);
    expect(result.activeId).toBe('1');
  });

  it('handles empty or junk input', async () => {
    expect(sanitizeProfiles(undefined)).toEqual({ profiles: [], activeId: null });
    expect(sanitizeProfiles('junk')).toEqual({ profiles: [], activeId: null });
  });
});
