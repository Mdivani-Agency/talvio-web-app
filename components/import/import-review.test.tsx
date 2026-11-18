import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ImportReviewList, importReviewTitle } from './import-review';

describe('ImportReviewList', () => {
  it('lists every review line, however many there are', () => {
    const items = Array.from({ length: 9 }, (_, index) => ({ section: 'Experience', message: `Entry ${index + 1} was left out.` }));
    const html = renderToStaticMarkup(<ImportReviewList review={{ partial: false, items } as never} />);
    for (const item of items) {
      expect(html).toContain(item.message);
    }
    expect(html).not.toContain('more to check');
  });

  it('titles a partial read differently', () => {
    expect(importReviewTitle({ partial: true, items: [] } as never)).toBe('Part of your resume could not be read');
  });
});
