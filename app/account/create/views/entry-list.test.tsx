import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@components/icons', () => ({ Icon: () => null }));

import { ENTRY_LISTS } from '@/lib/onboarding-copy';

import { EntryList, moveEntry, type EntryFormProps } from './entry-list';

afterEach(cleanup);

// The confirm modal picks a dialog or a drawer by viewport; jsdom has no matchMedia.
window.matchMedia ??= ((query: string) => ({
  matches: true,
  media: query,
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

type Item = { id: string; name: string };

function NameForm({ defaultValues, submitLabel, onSubmit, onCancel }: EntryFormProps<Item>) {
  const [name, setName] = useState(defaultValues?.name ?? '');
  return (
    <div>
      <label htmlFor="entry-name">Name</label>
      <input id="entry-name" value={name} onChange={(event) => setName(event.target.value)} />
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
      <button type="button" onClick={() => onSubmit({ id: defaultValues?.id ?? `new-${name}`, name })}>
        {submitLabel}
      </button>
    </div>
  );
}

function Harness({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  return (
    <>
      <EntryList
        items={items}
        copy={ENTRY_LISTS.projects}
        summarize={(item) => ({ title: item.name, subline: '', name: item.name })}
        renderForm={(props) => <NameForm {...props} />}
        onAdd={(item) => setItems((current) => [...current, item])}
        onUpdate={(index, item) => setItems((current) => current.map((entry, i) => (i === index ? item : entry)))}
        onRemove={(index) => setItems((current) => current.filter((_, i) => i !== index))}
        onReorder={setItems}
      />
      <output data-testid="order">{items.map((item) => item.name).join(',')}</output>
    </>
  );
}

const order = () => screen.getByTestId('order').textContent;

describe('moveEntry', () => {
  it('moves an item and ignores moves past either end', () => {
    expect(moveEntry(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    const items = ['a', 'b'];
    expect(moveEntry(items, 0, -1)).toBe(items);
    expect(moveEntry(items, 1, 2)).toBe(items);
  });
});

describe('EntryList', () => {
  it('shows the empty line, then adds an entry from the inline form', () => {
    render(<Harness initial={[]} />);
    expect(screen.getByText('No projects added yet.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Add project' }));
    expect(screen.getByRole('heading', { name: 'New project' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Signal Board' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add project' }));

    expect(order()).toBe('Signal Board');
    expect(screen.queryByRole('heading', { name: 'New project' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Signal Board' })).toBeTruthy();
  });

  it('cancels a new entry without adding it', () => {
    render(<Harness initial={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add project' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(order()).toBe('');
    expect(screen.getByRole('button', { name: 'Add project' })).toBeTruthy();
  });

  it('edits an entry in place of its row', () => {
    render(<Harness initial={[{ id: '1', name: 'Alpha' }, { id: '2', name: 'Beta' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Beta' }));
    expect(screen.getByRole('heading', { name: 'Edit Beta' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Beta Edited' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(order()).toBe('Alpha,Beta Edited');
  });

  it('asks before removing and names the entry', async () => {
    render(<Harness initial={[{ id: '1', name: 'Alpha' }, { id: '2', name: 'Beta' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Alpha' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remove project' });
    expect(within(dialog).getByText('Alpha will be removed. You can add it again later.')).toBeTruthy();
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
    });
    expect(order()).toBe('Beta');
  });

  it('moves an entry with the arrow keys on its handle and announces the new position', () => {
    render(<Harness initial={[{ id: '1', name: 'Alpha' }, { id: '2', name: 'Beta' }, { id: '3', name: 'Gamma' }]} />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Reorder Alpha' }), { key: 'ArrowDown' });
    expect(order()).toBe('Beta,Alpha,Gamma');
    expect(screen.getByText('Alpha moved to position 2 of 3.')).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Reorder Beta' }), { key: 'ArrowUp' });
    expect(order()).toBe('Beta,Alpha,Gamma');
  });
});
