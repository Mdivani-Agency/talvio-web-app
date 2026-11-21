import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { NoteContent } from './note-content';

describe('NoteContent', () => {
  afterEach(cleanup);

  it('keeps paragraphs, bullet and numbered lists', () => {
    const { container } = render(
      <NoteContent html="<p>First call went well. They asked about:</p><ul><li><p>the migration</p></li></ul><ol><li><p>on-call</p></li></ol>" />,
    );
    expect(container.querySelector('p')?.textContent).toBe('First call went well. They asked about:');
    expect(container.querySelector('ul li')?.textContent).toBe('the migration');
    expect(container.querySelector('ol li')?.textContent).toBe('on-call');
  });

  it('drops scripts, attributes, links and images, keeping only text', () => {
    const { container } = render(
      <NoteContent html={'<p onclick="alert(1)" style="color:red">Hi <a href="javascript:alert(1)">there</a><img src=x onerror="alert(1)"></p><script>alert(1)</script>'} />,
    );
    expect(container.innerHTML).toBe('<div><p>Hi there</p></div>');
  });
});
