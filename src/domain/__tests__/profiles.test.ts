import {
  canAddProfile,
  isAvatar,
  MAX_PROFILES,
  newProfileId,
  normalizeName,
  validateName,
} from '../profiles';

const existing = [
  { id: 'a', name: 'Anna' },
  { id: 'b', name: 'Tomek' },
];

describe('normalizeName', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeName('  Mary   Jane  ')).toBe('Mary Jane');
  });
});

describe('validateName', () => {
  it.each(['Ola', 'Zoë', 'Łukasz', 'Gżegżółka', "O'Neil", 'Anne-Marie', 'J.R.', 'Player 2'])(
    'accepts %s',
    (name) => {
      expect(validateName(name, existing)).toBeNull();
    },
  );

  it.each([
    ['', 'empty'],
    ['    ', 'empty'],
    ['x'.repeat(21), 'tooLong'],
    ['<script>', 'invalidCharacters'],
    ['😀 Smile', 'invalidCharacters'],
    ['a/b', 'invalidCharacters'],
    ['anna', 'duplicate'],
    ['  TOMEK ', 'duplicate'],
  ])('rejects %p as %s', (name, error) => {
    expect(validateName(name, existing)).toBe(error);
  });

  it('allows exactly the maximum length', () => {
    expect(validateName('x'.repeat(20), existing)).toBeNull();
  });

  it('lets a profile keep its own name when editing', () => {
    expect(validateName('Anna', existing, 'a')).toBeNull();
    expect(validateName('Tomek', existing, 'a')).toBe('duplicate');
  });
});

describe('canAddProfile', () => {
  it(`allows up to ${MAX_PROFILES} profiles`, () => {
    expect(canAddProfile([1, 2, 3])).toBe(true);
    expect(canAddProfile([1, 2, 3, 4])).toBe(false);
  });
});

describe('isAvatar', () => {
  it('accepts known avatars only', () => {
    expect(isAvatar('moon')).toBe(true);
    expect(isAvatar('skull')).toBe(false);
    expect(isAvatar(undefined)).toBe(false);
  });
});

describe('newProfileId', () => {
  it('is deterministic for a given clock and random source', () => {
    expect(
      newProfileId(
        () => 0.5,
        () => 1000,
      ),
    ).toBe(
      newProfileId(
        () => 0.5,
        () => 1000,
      ),
    );
  });

  it('differs for different random values', () => {
    expect(
      newProfileId(
        () => 0.1,
        () => 1,
      ),
    ).not.toBe(
      newProfileId(
        () => 0.2,
        () => 1,
      ),
    );
  });
});
