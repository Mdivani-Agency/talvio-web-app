import { describe, expect, it } from 'vitest';

import { optionalFieldUse, templateShowsField } from './template-fields';

describe('optionalFieldUse', () => {
  it('says the selected template shows the field', () => {
    expect(optionalFieldUse('stack', { key: 'technical', name: 'Technical' })).toBe('Shown in your template, Technical.');
    expect(optionalFieldUse('headlineAchievements', { key: 'executive', name: 'Executive' })).toBe(
      'Shown in your template, Executive.',
    );
  });

  it('names the templates that show it when the selected one leaves it out', () => {
    expect(optionalFieldUse('stack', { key: 'senior-level-talvio', name: 'Talvio' })).toBe(
      'Shown in the Technical template. Your template, Talvio, leaves it out.',
    );
    expect(optionalFieldUse('headlineAchievements', { key: 'mid-level-mint', name: 'Mint' })).toBe(
      'Shown in the Executive template. Your template, Mint, leaves them out.',
    );
    expect(optionalFieldUse('skillGroups', { key: 'mid-level-mint', name: 'Mint' })).toBe(
      'Shown in Skills first and Technical. Your template, Mint, lists skills together.',
    );
  });

  it('names the templates only when no template is chosen yet', () => {
    expect(optionalFieldUse('skillGroups')).toBe('Shown in Skills first and Technical.');
  });

  it('knows which templates print which field', () => {
    expect(templateShowsField('technical', 'skillGroups')).toBe(true);
    expect(templateShowsField('skills-first', 'stack')).toBe(false);
    expect(templateShowsField(undefined, 'stack')).toBe(false);
  });
});
