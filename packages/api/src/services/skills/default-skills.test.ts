import { describe, expect, it } from 'vitest';
import { DEFAULT_SKILLS } from './default-skills';

describe('DEFAULT_SKILLS', () => {
  it('contains the three required default skills in order', () => {
    expect(DEFAULT_SKILLS.map((item) => item.id)).toEqual([
      'english_learning',
      'cooking',
      'chat',
    ]);
    expect(DEFAULT_SKILLS.map((item) => item.sortOrder)).toEqual([0, 1, 2]);
  });
});
