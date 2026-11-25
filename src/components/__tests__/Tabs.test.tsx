import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithTheme as render } from '@/test/render';

import { Tabs } from '../Tabs';

const tabs = [
  { key: 'a', label: 'Alpha', done: true },
  { key: 'b', label: 'Beta' },
] as const;

describe('Tabs', () => {
  it('marks the active tab as selected and announces done tabs', async () => {
    await render(<Tabs tabs={[...tabs]} active="b" onChange={() => {}} />);

    expect(screen.getByRole('tab', { name: 'Beta' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Alpha, done' })).not.toBeSelected();
  });

  it('reports the tapped tab', async () => {
    const onChange = jest.fn();
    await render(<Tabs tabs={[...tabs]} active="b" onChange={onChange} />);

    await fireEvent.press(screen.getByRole('tab', { name: 'Alpha, done' }));
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('works the same in the glass look', async () => {
    const onChange = jest.fn();
    await render(<Tabs tabs={[...tabs]} active="b" onChange={onChange} variant="glass" />);
    expect(screen.getByRole('tab', { name: 'Beta' })).toBeSelected();
    await fireEvent.press(screen.getByRole('tab', { name: 'Alpha, done' }));
    expect(onChange).toHaveBeenCalledWith('a');
  });
});
