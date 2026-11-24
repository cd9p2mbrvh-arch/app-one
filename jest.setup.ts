import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Haptics have no effect in tests; record calls so behaviour can be asserted.
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
  getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
  VoiceQuality: { Default: 'Default', Enhanced: 'Enhanced' },
}));

jest.mock('expo-audio', () => {
  const createAudioPlayer = jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    setActiveForLockScreen: jest.fn(),
    currentTime: 0,
    playing: true,
    clearLockScreenControls: jest.fn(),
    volume: 1,
    loop: false,
  }));
  return {
    createAudioPlayer,
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  };
});
