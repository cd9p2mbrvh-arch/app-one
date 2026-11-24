import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import type { Profile } from '@/domain/profiles';
import { useProfiles } from '@/state/profiles';
import { themeWrapper } from '@/test/render';
import { appRoutes } from '@/test/routes';

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const type = (text: string) => fireEvent.changeText(screen.getByLabelText('Name'), text);

const profile = (id: string, name: string): Profile => ({
  id,
  name,
  avatar: 'leaf',
  createdAt: '2026-01-01T00:00:00Z',
});

async function seed(profiles: Profile[], activeId: string | null) {
  await act(() => useProfiles.setState({ profiles, activeId }));
}

const launch = () => renderRouter(appRoutes, { wrapper: themeWrapper() });

beforeEach(async () => {
  await AsyncStorage.clear();
  await seed([], null);
});

describe('First launch', () => {
  it('asks the user to create a profile, then shows their home', async () => {
    await launch();

    expect(await screen.findByText('Welcome to App One')).toBeTruthy();
    expect(screen).toHavePathname('/profiles/new');
    // No way back from first-time setup.
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();

    await type('  Anna ');
    await press('Star');
    await press('Create profile');

    expect(screen).toHavePathname('/home');
    expect(screen.getByRole('button', { name: 'Switch profile, currently Anna' })).toBeTruthy();
    expect(useProfiles.getState().profiles[0]).toMatchObject({ name: 'Anna', avatar: 'star' });
  });

  it('shows a helpful error for an invalid name', async () => {
    await launch();
    await screen.findByText('Welcome to App One');

    await press('Create profile');
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a name.');

    await type('<b>hi</b>');
    await press('Create profile');
    expect(screen.getByRole('alert')).toHaveTextContent(/Use letters, numbers/);
    expect(useProfiles.getState().profiles).toHaveLength(0);
  });
});

describe('Returning user', () => {
  it('opens straight on the last-used profile', async () => {
    await seed([profile('a', 'Anna'), profile('b', 'Tomek')], 'b');
    await launch();

    expect(
      await screen.findByRole('button', { name: 'Switch profile, currently Tomek' }),
    ).toBeTruthy();
    expect(screen).toHavePathname('/home');
  });

  it('switches profile from the picker', async () => {
    await seed([profile('a', 'Anna'), profile('b', 'Tomek')], 'b');
    await launch();
    await screen.findByRole('button', { name: 'Switch profile, currently Tomek' });

    await press(/^Switch profile/);
    expect(screen).toHavePathname('/profiles');
    expect(screen.getByText("Who's meditating?")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tomek' })).toBeSelected();

    await press('Anna');
    expect(screen).toHavePathname('/home');
    expect(screen.getByRole('button', { name: 'Switch profile, currently Anna' })).toBeTruthy();
    expect(useProfiles.getState().activeId).toBe('a');
  });

  it('adds a second profile from the picker', async () => {
    await seed([profile('a', 'Anna')], 'a');
    await launch();
    await screen.findByRole('button', { name: 'Switch profile, currently Anna' });

    await press(/^Switch profile/);
    await press('Add profile');
    expect(screen.getByText('New profile')).toBeTruthy();

    await type('anna');
    await press('Create profile');
    expect(screen.getByRole('alert')).toHaveTextContent('Another profile already has this name.');

    await type('Ola');
    await press('Create profile');
    expect(screen).toHavePathname('/home');
    expect(screen.getByRole('button', { name: 'Switch profile, currently Ola' })).toBeTruthy();
  });

  it('hides "Add profile" when 4 profiles exist', async () => {
    await seed([profile('a', 'A'), profile('b', 'B'), profile('c', 'C'), profile('d', 'D')], 'a');
    await launch();
    await screen.findByRole('button', { name: 'Switch profile, currently A' });

    await press(/^Switch profile/);
    expect(screen.queryByRole('button', { name: 'Add profile' })).toBeNull();
  });

  it('edits a profile name and symbol', async () => {
    await seed([profile('a', 'Anna')], 'a');
    await launch();
    await screen.findByRole('button', { name: 'Switch profile, currently Anna' });

    await press(/^Switch profile/);
    await press('Edit Anna');
    expect(screen.getByText('Edit profile')).toBeTruthy();
    expect(screen.getByLabelText('Name')).toHaveDisplayValue('Anna');

    await type('Ania');
    await press('Moon');
    await press('Save');

    expect(screen).toHavePathname('/profiles');
    expect(screen.getByRole('button', { name: 'Ania' })).toBeTruthy();
    expect(useProfiles.getState().profiles[0]).toMatchObject({ name: 'Ania', avatar: 'moon' });
  });

  it('deletes a profile only after confirmation', async () => {
    await seed([profile('a', 'Anna'), profile('b', 'Tomek')], 'a');
    await launch();
    await screen.findByRole('button', { name: 'Switch profile, currently Anna' });

    await press(/^Switch profile/);
    await press('Edit Tomek');
    await press('Delete profile');
    expect(screen.getByText('Delete Tomek?')).toBeTruthy();

    await press('Cancel');
    expect(useProfiles.getState().profiles).toHaveLength(2);

    await press('Delete profile');
    await press('Yes, delete');
    expect(screen).toHavePathname('/profiles');
    expect(screen.queryByRole('button', { name: 'Tomek' })).toBeNull();
    expect(useProfiles.getState().profiles.map((p) => p.name)).toEqual(['Anna']);
  });

  it('goes back to first-time setup when the last profile is deleted', async () => {
    await seed([profile('a', 'Anna')], 'a');
    await launch();
    await screen.findByRole('button', { name: 'Switch profile, currently Anna' });

    await press(/^Switch profile/);
    await press('Edit Anna');
    await press('Delete profile');
    await press('Yes, delete');

    expect(screen).toHavePathname('/profiles/new');
    expect(screen.getByText('Welcome to App One')).toBeTruthy();
  });
});
