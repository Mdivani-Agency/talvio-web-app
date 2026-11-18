import { describe, expect, it } from 'vitest';

import { pageText, type PdfTextItem } from './page-text';

const at = (str: string, x: number, y: number, width: number, hasEOL = false): PdfTextItem => ({
  str,
  hasEOL,
  transform: [10, 0, 0, 10, x, y],
  width,
  height: 10,
});

describe('pageText', () => {
  // Items as pdf.js 4 reports them for a Chromium-printed resume with wrapped lines.
  const items = [
    at('Summary', 6, 748, 82),
    at('', 6, 718, 0, true),
    at('Backend engineer with eight years of experience building payment', 6, 718, 353, true),
    at('and data platforms, leading small teams', 6, 705, 200, false),
    at('', 6, 690, 0, true),
    at('Acme Payments', 6, 627, 93),
    at(' ', 99, 627, 4),
    at('— Senior Backend Engineer, Mar 2020 – Present', 102, 627, 263, true),
    at('Led the migration of the billing system from a monolith to event-', 36, 601, 337, true),
    at('driven services on AWS.', 36, 588, 297, false),
  ];

  it('keeps each line on its own line, never glued with commas', () => {
    expect(pageText(items)).toBe(
      [
        'Summary',
        'Backend engineer with eight years of experience building payment',
        'and data platforms, leading small teams',
        'Acme Payments — Senior Backend Engineer, Mar 2020 – Present',
        'Led the migration of the billing system from a monolith to event-',
        'driven services on AWS.',
      ].join('\n'),
    );
    expect(pageText(items)).not.toContain('payment,and');
  });

  it('breaks a line when the baseline moves without an end-of-line mark', () => {
    expect(pageText([at('First line', 6, 700, 50), at('Second line', 6, 686, 55)])).toBe('First line\nSecond line');
  });

  it('adds a space between items on one line that are apart, and none between touching ones', () => {
    expect(pageText([at('Senior', 6, 700, 30), at('Engineer', 40, 700, 40)])).toBe('Senior Engineer');
    expect(pageText([at('Engi', 6, 700, 20), at('neer', 26, 700, 20)])).toBe('Engineer');
  });

  it('reads items without position as plain text', () => {
    expect(pageText([{ str: 'Ada' }, { str: ' Owner', hasEOL: true }, { str: 'Engineer' }])).toBe(
      'Ada Owner\nEngineer',
    );
  });
});
