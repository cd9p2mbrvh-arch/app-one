import Entry from '@/app/index';
import HomeScreen from '@/app/home';
import EditProfileScreen from '@/app/profiles/[id]';
import ProfilesScreen from '@/app/profiles/index';
import NewProfileScreen from '@/app/profiles/new';
import SessionScreen from '@/app/session';
import SetupScreen from '@/app/setup';

/** All app routes, for renderRouter in integration tests. */
export const appRoutes = {
  index: Entry,
  home: HomeScreen,
  setup: SetupScreen,
  session: SessionScreen,
  'profiles/index': ProfilesScreen,
  'profiles/new': NewProfileScreen,
  'profiles/[id]': EditProfileScreen,
};
