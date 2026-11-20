import { describe, expect, it } from 'vitest';
import { ember, talvio } from '@pdf-tlv/resume/dist/templates';

import {
  effectiveSectionOrder,
  moveSection,
  pdfSectionOrder,
  storedSectionOrder,
  templateSectionOrder,
} from './section-order';

describe('section order', () => {
  it('reads each template default, keeping the summary out of the movable list', () => {
    expect(templateSectionOrder(ember)).toEqual(['skills', 'experience', 'education', 'projects', 'recommendations']);
    expect(templateSectionOrder(talvio)).toEqual(['experience', 'projects', 'recommendations', 'skills', 'education']);
    expect(templateSectionOrder({})).toEqual(['experience', 'education', 'skills', 'projects', 'recommendations']);
  });

  it('completes a stored order with the sections it leaves out and drops unknown names', () => {
    expect(effectiveSectionOrder(['education', 'nope', 'education'], ember)).toEqual([
      'education',
      'skills',
      'experience',
      'projects',
      'recommendations',
    ]);
    expect(effectiveSectionOrder(undefined, talvio)).toEqual(templateSectionOrder(talvio));
  });

  it('moves a section one place and stays put at the ends', () => {
    const order = templateSectionOrder(ember);
    expect(moveSection(order, 2, -1).slice(0, 3)).toEqual(['skills', 'education', 'experience']);
    expect(moveSection(order, 0, -1)).toEqual(order);
    expect(moveSection(order, order.length - 1, 1)).toEqual(order);
  });

  it('stores nothing when the order is the template default, so a template change follows the new default', () => {
    expect(storedSectionOrder(templateSectionOrder(ember), ember)).toBeUndefined();
    const custom = moveSection(templateSectionOrder(ember), 1, -1);
    expect(storedSectionOrder(custom, ember)).toEqual(custom);
  });

  it('sends no order to the PDF without a custom one, and keeps the summary first with one', () => {
    expect(pdfSectionOrder(undefined)).toBeUndefined();
    expect(pdfSectionOrder([])).toBeUndefined();
    expect(pdfSectionOrder(['education', 'experience'])).toEqual(['summary', 'education', 'experience']);
  });
});
