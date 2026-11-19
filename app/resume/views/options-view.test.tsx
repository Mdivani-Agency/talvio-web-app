import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const context = { selectImport: vi.fn(), selectManual: vi.fn() };
let session: object | null = { user: { id: 'u1' } };

vi.mock('../providers/state-provider', () => ({ useResumeContext: () => context }));
vi.mock('@lib/providers', () => ({ useUserSession: () => ({ session }) }));

import OptionsView from './options-view';

afterEach(cleanup);

describe('OptionsView', () => {
  it('offers import and the editor as whole-card buttons', () => {
    render(<OptionsView />);
    expect(screen.getByRole('heading', { level: 1, name: 'Start a new resume' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Import a resume/ }));
    fireEvent.click(screen.getByRole('button', { name: /Fill it in yourself/ }));
    expect(context.selectImport).toHaveBeenCalledTimes(1);
    expect(context.selectManual).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Start from your profile and edit it section by section.')).toBeTruthy();
  });

  it('tells a guest the editor starts blank', () => {
    session = null;
    render(<OptionsView />);
    expect(screen.getByText('Start from a blank resume and edit it section by section.')).toBeTruthy();
    session = { user: { id: 'u1' } };
  });
});
