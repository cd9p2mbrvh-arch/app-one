import CompleteScreen from '@/app/complete';
import Entry from '@/app/index';
import AboutScreen from '@/app/about';
import HistoryScreen from '@/app/history';
import HomeScreen from '@/app/home';
import EditProfileScreen from '@/app/profiles/[id]';
import ProfilesScreen from '@/app/profiles/index';
import NewProfileScreen from '@/app/profiles/new';
import PrivacyScreen from '@/app/privacy';
import SessionScreen from '@/app/session';

/** All app routes, for renderRouter in integration tests. */
export const appRoutes = {
  index: Entry,
  home: HomeScreen,
  session: SessionScreen,
  complete: CompleteScreen,
  history: HistoryScreen,
  about: AboutScreen,
  privacy: PrivacyScreen,
  'profiles/index': ProfilesScreen,
  'profiles/new': NewProfileScreen,
  'profiles/[id]': EditProfileScreen,
};
