import { describe, expect, it } from 'vitest';

import { CONTACT_EMAIL } from './legal-copy';
import {
  ERROR_BODY,
  ERROR_TITLE,
  GLOBAL_ERROR_BODY,
  GLOBAL_ERROR_TITLE,
  NOT_FOUND_BODY,
  NOT_FOUND_CODE,
  NOT_FOUND_LINKS,
  NOT_FOUND_TITLE,
  RESUME_NOT_FOUND_TITLE,
  RESUME_SIGN_IN_BODY,
  RESUME_SIGN_IN_TITLE,
  SUPPORT_EMAIL,
} from './status-copy';

describe('status copy', () => {
  it('uses the approved headings and lines', () => {
    expect(NOT_FOUND_CODE).toBe('404');
    expect(NOT_FOUND_TITLE).toBe("We can't find that page");
    expect(NOT_FOUND_BODY).toBe('The link may be old or mistyped, or the page has moved.');
    expect(ERROR_TITLE).toBe("This page didn't load");
    expect(ERROR_BODY).toContain('Your saved work is safe.');
    expect(GLOBAL_ERROR_TITLE).toBe('Talvio hit a problem');
    expect(GLOBAL_ERROR_BODY).toBe('Reload the page. Your saved work is safe.');
    expect(RESUME_SIGN_IN_TITLE).toBe('Sign in to open this resume');
    expect(RESUME_SIGN_IN_BODY).toContain('bring you straight back here');
    expect(RESUME_NOT_FOUND_TITLE).toBe("We can't find this resume");
  });

  it('points at the one support address and at real routes', () => {
    expect(SUPPORT_EMAIL).toBe(CONTACT_EMAIL);
    expect(NOT_FOUND_LINKS.map((link) => link.href)).toEqual(['/blog', '/auth/sign-in']);
  });

  it('keeps headings in sentence case', () => {
    for (const title of [NOT_FOUND_TITLE, ERROR_TITLE, GLOBAL_ERROR_TITLE, RESUME_SIGN_IN_TITLE, RESUME_NOT_FOUND_TITLE]) {
      const [, ...rest] = title.split(' ');
      for (const word of rest) {
        if (word !== 'Talvio') expect(word).toBe(word.toLowerCase());
      }
    }
  });
});
