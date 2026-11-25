import { shade, withAlpha } from '../color';

describe('shade', () => {
  it('mixes towards white or black', () => {
    expect(shade('#808080', 0)).toBe('#808080');
    expect(shade('#000000', 0.5)).toBe('#808080');
    expect(shade('#FFFFFF', -1)).toBe('#000000');
    expect(shade('#123456', 1)).toBe('#FFFFFF');
  });
});

describe('withAlpha', () => {
  it('adds an alpha channel', () => {
    expect(withAlpha('#7FB3B0', 1)).toBe('#7FB3B0FF');
    expect(withAlpha('#7FB3B0', 0)).toBe('#7FB3B000');
  });
});
