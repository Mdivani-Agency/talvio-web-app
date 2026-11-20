import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useStore } from '@tanstack/react-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@components/icons', () => ({ Icon: () => null }));

import { useAppForm } from '@lib/forms/use-form';
import { accountSchema } from '@lib/schema/account.schema';
import { DEFAULT_ACCOUNT_DTO } from '@lib/models/account-defaults';
import type { AccountDto } from '@lib/types';

import { SkillFieldsForm } from './skill-fields';
import { CurrentTemplateProvider } from './template-context';

// The Manage modal picks a dialog or a drawer by viewport; jsdom has no matchMedia.
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
})) as typeof window.matchMedia;


afterEach(cleanup);

function Harness({ initial }: { initial: AccountDto }) {
  const form = useAppForm<AccountDto>({ defaultValues: initial, schema: accountSchema, validateOn: 'submit' });
  const skills = useStore(form.store, (state) => state.values.skills);
  return (
    <CurrentTemplateProvider template={{ key: 'mid-level-mint', name: 'Mint' }}>
      <SkillFieldsForm form={form} />
      <output aria-label="skills">{JSON.stringify(skills)}</output>
    </CurrentTemplateProvider>
  );
}

const skillsValue = () => JSON.parse(screen.getByLabelText('skills').textContent ?? '[]');

function addTag(label: string, value: string) {
  const input = screen.getByLabelText(label);
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

describe('SkillFieldsForm skill groups', () => {
  it('groups skills, keeps the groups while switched off, and moves a removed group to Other', async () => {
    render(<Harness initial={{ ...DEFAULT_ACCOUNT_DTO, skills: [{ name: 'Docker' }] }} />);
    expect(screen.getByText(/Your template, Mint, lists skills together\./)).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: 'Group skills' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add group' }));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Group 1 name'), { target: { value: 'Languages' } });
    });
    await act(async () => addTag('Add a skill to Languages', 'TypeScript'));
    expect(skillsValue()).toEqual([{ name: 'Docker' }, { name: 'TypeScript', group: 'Languages' }]);

    // A skill already in the list is refused.
    await act(async () => addTag('Add a skill to Languages', 'docker'));
    expect(screen.getByText('docker is already in your skills')).toBeTruthy();

    // Off keeps the groups on the skills; on brings the cards back.
    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: 'Group skills' }));
    });
    expect(screen.queryByLabelText('Group 1 name')).toBeNull();
    expect(skillsValue()[1]).toEqual({ name: 'TypeScript', group: 'Languages' });
    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: 'Group skills' }));
    });
    expect((screen.getByLabelText('Group 1 name') as HTMLInputElement).value).toBe('Languages');

    // Renaming a group renames it on its skills; removing it keeps them, under Other.
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Group 1 name'), { target: { value: 'Code' } });
    });
    expect(skillsValue()[1]).toEqual({ name: 'TypeScript', group: 'Code' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove group Code' }));
    });
    expect(skillsValue()).toEqual([{ name: 'Docker' }, { name: 'TypeScript' }]);
  });
});
