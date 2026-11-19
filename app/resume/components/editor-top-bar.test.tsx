import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@components/icons', () => ({ Icon: () => null }));
vi.mock('next-themes', () => ({ useTheme: () => ({ theme: 'light', setTheme: vi.fn() }) }));

import { EditorTopBar } from './editor-top-bar';

afterEach(cleanup);

const base = {
  title: 'Maya Lindqvist',
  label: '',
  guest: false,
  draft: false,
  readOnly: false,
  onRename: vi.fn(),
  onDownload: vi.fn(),
};

describe('EditorTopBar', () => {
  it('links back to documents, says where the resume is saved and downloads', () => {
    const onDownload = vi.fn();
    render(<EditorTopBar {...base} saveStatus="saved" onDownload={onDownload} />);
    expect(screen.getByRole('link', { name: 'Back to documents' }).getAttribute('href')).toBe('/account/documents');
    expect(screen.getByRole('status').textContent).toContain('Saved to your account');
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull();
  });

  it('sends a guest home and offers Sign in', () => {
    render(<EditorTopBar {...base} guest saveStatus="saved-locally" signInHref="/auth/sign-in?callbackURL=%2Fresume" />);
    expect(screen.getByRole('link', { name: 'Back to home' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('/auth/sign-in?callbackURL=%2Fresume');
    expect(screen.getByRole('status').textContent).toContain('Saved on this device. Sign in to keep it in your account.');
  });

  it('renames from the title and keeps an unchanged name', () => {
    const onRename = vi.fn();
    render(<EditorTopBar {...base} label="Board copy" onRename={onRename} />);
    fireEvent.click(screen.getByRole('button', { name: 'Rename resume: Maya Lindqvist' }));
    const field = screen.getByLabelText('Resume label');
    fireEvent.change(field, { target: { value: 'Board copy' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onRename).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Rename resume: Maya Lindqvist' }));
    fireEvent.change(screen.getByLabelText('Resume label'), { target: { value: 'Platform roles' } });
    fireEvent.blur(screen.getByLabelText('Resume label'));
    expect(onRename).toHaveBeenCalledWith('Platform roles');
  });

  it('shows Retry after a failed save and Improve with AI only when it is offered', () => {
    const onRetrySave = vi.fn();
    const onImprove = vi.fn();
    render(<EditorTopBar {...base} saveStatus="failed" onRetrySave={onRetrySave} onImprove={onImprove} improveDisabled />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetrySave).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Improve with AI' }).hasAttribute('disabled')).toBe(true);
    cleanup();

    render(<EditorTopBar {...base} />);
    expect(screen.queryByRole('button', { name: 'Improve with AI' })).toBeNull();
  });

  it('shows a read-only title without the rename control', () => {
    render(<EditorTopBar {...base} readOnly />);
    expect(screen.getByRole('heading', { name: 'Maya Lindqvist' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Rename resume/ })).toBeNull();
  });
});
