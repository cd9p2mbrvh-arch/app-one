import { act, render, screen } from '@testing-library/react-native';

import { Airplane, Birds, FishJump, SceneEvents, Seagull, ShootingStar, Ufo } from '..';
import { EVENT_GAP_MS, FIRST_EVENT_MS } from '../schedule';

const size = { width: 390, height: 844, topInset: 47 };

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('SceneEvents', () => {
  it('plays an event after a short wait, then another later, never overlapping', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    await render(
      <SceneEvents events={{ airplane: Airplane, birds: Birds }} {...size} still={false} />,
    );
    expect(screen.queryByTestId(/^scene-event-/)).toBeNull();

    await act(() => jest.advanceTimersByTime(FIRST_EVENT_MS[1]));
    expect(screen.getByTestId('scene-event-airplane')).toBeTruthy();

    // (Native-driver animations finish instantly in tests, so only the order and
    // the one-at-a-time rule are checked, not exact durations.)
    await act(() => jest.advanceTimersByTime(10000 + EVENT_GAP_MS[1]));
    expect(screen.getAllByTestId(/^scene-event-/)).toHaveLength(1);
    expect(screen.getByTestId('scene-event-birds')).toBeTruthy();
  });

  it('plays nothing when motion is reduced', async () => {
    await render(<SceneEvents events={{ ufo: Ufo }} {...size} still />);
    await act(() => jest.advanceTimersByTime(60000));
    expect(screen.queryByTestId(/^scene-event-/)).toBeNull();
  });

  it.each([
    ['airplane', Airplane],
    ['birds', Birds],
    ['seagull', Seagull],
    ['fish', FishJump],
    ['ufo', Ufo],
    ['shooting star', ShootingStar],
  ])('the %s event finishes and reports it', async (_name, Event) => {
    const onDone = jest.fn();
    await render(<Event {...size} variant={0.3} onDone={onDone} />);
    await act(() => jest.advanceTimersByTime(15000));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
