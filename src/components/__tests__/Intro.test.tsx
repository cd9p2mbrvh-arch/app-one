import { act, screen } from '@testing-library/react-native';

import { renderWithTheme as render } from '@/test/render';

import { Intro, INTRO } from '../Intro';

describe('Intro', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows the studio logo, then reveals the app within about 2 seconds', async () => {
    const onReveal = jest.fn();
    const onDone = jest.fn();
    await render(<Intro onReveal={onReveal} onDone={onDone} />);
    expect(screen.getByLabelText('Michael apps')).toBeTruthy();
    expect(onReveal).not.toHaveBeenCalled();

    await act(() => jest.advanceTimersByTime(INTRO.fadeAt));
    expect(onReveal).toHaveBeenCalledTimes(1);

    await act(() => jest.advanceTimersByTime(INTRO.fadeOut + 50));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(INTRO.fadeAt + Math.max(INTRO.fadeOut, INTRO.appZoom)).toBeLessThanOrEqual(2000);
  });
});
