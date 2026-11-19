import { describe, expect, it } from 'vitest';

import { dateRange, educationSummary, experienceSummary, projectSummary } from './entry-summaries';

describe('dateRange', () => {
  it('formats both ends, shows Present for a current entry and skips a missing end', () => {
    expect(dateRange({ startDate: '2020-03-01T00:00:00.000Z', endDate: '2023-12-01T00:00:00.000Z' }, 'MMM yyyy')).toBe(
      'Mar 2020 - Dec 2023',
    );
    expect(dateRange({ startDate: '2024-01-15T00:00:00.000Z', isPresent: true }, 'MMM yyyy')).toBe('Jan 2024 - Present');
    expect(dateRange({ startDate: '2009-09-01T00:00:00.000Z' }, 'yyyy')).toBe('2009');
    expect(dateRange({ startDate: 'not a date' }, 'yyyy')).toBe('');
  });
});

describe('row summaries', () => {
  it('titles experience by job title, with the company and dates below', () => {
    expect(
      experienceSummary({
        jobTitle: 'Staff Software Engineer',
        company: 'Northwind Health',
        startDate: '2024-01-15T00:00:00.000Z',
        isPresent: true,
      }),
    ).toEqual({
      title: 'Staff Software Engineer',
      subline: 'Northwind Health · Jan 2024 - Present',
      name: 'Staff Software Engineer at Northwind Health',
    });
    expect(experienceSummary({ company: 'Alpha Corp' })).toEqual({ title: 'Alpha Corp', subline: '', name: 'Alpha Corp' });
    expect(experienceSummary({}).title).toBe('Untitled entry');
  });

  it('titles education by school, with the degree and years below', () => {
    expect(
      educationSummary({
        name: 'University of Edinburgh',
        degreeType: "Bachelor's Degree",
        startDate: '2009-09-01T00:00:00.000Z',
        endDate: '2013-06-01T00:00:00.000Z',
      }),
    ).toEqual({
      title: 'University of Edinburgh',
      subline: "Bachelor's Degree · 2009 - 2013",
      name: 'University of Edinburgh',
    });
  });

  it('titles a project by name, with its link below', () => {
    expect(projectSummary({ name: 'Signal Board', url: 'https://example.com/board' })).toEqual({
      title: 'Signal Board',
      subline: 'https://example.com/board',
      name: 'Signal Board',
    });
  });
});
