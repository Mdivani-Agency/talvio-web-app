'use client';

import { useId, useState } from 'react';
import { Plus, Trash } from 'lucide-react';
import { useStore } from '@tanstack/react-form';

import { Button, Form, Input, Switch, TagField } from '@components/ui';
import { cn } from '@lib/utils';
import type { AppForm } from '@lib/forms/use-form';
import { SKILL_GROUP_NAME_MAX, skillSchema } from '@lib/schema/account.schema';
import { optionalFieldUse, templateShowsField } from '@lib/template-fields';
import type { Skill } from '@lib/types';
import { HIGHLIGHT_FIELDS, SKILL_GROUP_COPY as COPY, TAG_REMOVE_LABEL } from '@/lib/onboarding-copy';

import { SkillsFormField } from './skill.field';
import { useCurrentTemplate } from './template-context';

type SkillFieldsFormProps = {
  className?: string;
  form: AppForm;
};

export const SkillFieldsForm = ({ className, form }: SkillFieldsFormProps) => {
  const grouped = useStore(form.store, (state) => Boolean((state.values as { profile?: { groupSkills?: boolean } }).profile?.groupSkills));
  const template = useCurrentTemplate();
  const toggle = (
    <Switch
      label={COPY.switchLabel}
      checked={grouped}
      onCheckedChange={(next) => form.setFieldValue('profile.groupSkills', next)}
    />
  );

  return (
    <Form className={cn('grid grid-cols-1 gap-4', className)}>
      {grouped ? (
        <SkillGroupsField form={form} toggle={toggle} />
      ) : (
        <div className="flex min-w-0 flex-col gap-1.5">
          <SkillsFormField form={form} name="skills" labelAside={toggle} />
          <p data-allow-small-text className="text-[1.3rem] text-muted-foreground">
            {COPY.offHint} {optionalFieldUse('skillGroups', template)}
          </p>
        </div>
      )}
      <SkillsFormField form={form} name="tools" />
    </Form>
  );
};

/** Group names in order of first use; `''` is a group still being named. Skills without a group go under Other. */
function groupNamesOf(skills: Skill[]): string[] {
  const names: string[] = [];
  for (const skill of skills) {
    if (skill.group !== undefined && !names.includes(skill.group)) {
      names.push(skill.group);
    }
  }
  return names;
}

/**
 * A group card. `committed` is the name its skills carry; `name` is what the input shows while it is being edited. A
 * rename reaches the skills on blur, and only when no other group already has that name, so typing never merges groups.
 */
type GroupCard = { key: string; name: string; committed: string };

function SkillGroupsField({ form, toggle }: { form: AppForm; toggle: React.ReactNode }) {
  const skills = useStore(form.store, (state) => ((state.values as { skills?: Skill[] }).skills ?? []));
  const template = useCurrentTemplate();
  const titleId = useId();
  const hintId = useId();
  // Cards being edited, and groups without skills yet: a group is stored only on its skills.
  const [cards, setCards] = useState<GroupCard[]>(() =>
    groupNamesOf(skills).map((name, index) => ({ key: `group-${index}`, name, committed: name })),
  );
  const [nextKey, setNextKey] = useState(() => cards.length);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);

  // Groups that arrive with the skills (an import, a draft restore) and have no card yet.
  const known = new Set(cards.map((card) => card.committed));
  const groups: GroupCard[] = [
    ...cards,
    ...groupNamesOf(skills)
      .filter((name) => !known.has(name))
      .map((name) => ({ key: `skills-${name}`, name, committed: name })),
  ];
  const ungrouped = skills.filter((skill) => skill.group === undefined);

  const setSkills = (next: Skill[]) => form.setFieldValue('skills', next);
  const saveCard = (card: GroupCard) =>
    setCards((current) =>
      current.some((item) => item.key === card.key)
        ? current.map((item) => (item.key === card.key ? card : item))
        : [...current, card],
    );

  const addSkill = (card: GroupCard | null, name: string) => {
    const key = card?.key ?? UNGROUPED_KEY;
    const group = card?.committed;
    const parsed = skillSchema.safeParse({ name, group });
    if (!parsed.success) {
      setError({ key, message: parsed.error.issues[0]?.message ?? '' });
      return;
    }
    if (skills.some((skill) => skill.name.trim().toLowerCase() === name.toLowerCase())) {
      setError({ key, message: COPY.duplicateSkill(name) });
      return;
    }
    setError(null);
    setSkills([...skills, { name, ...(group === undefined ? {} : { group }) }]);
    if (card) saveCard(card);
  };

  const removeSkill = (skill: Skill) => setSkills(skills.filter((item) => item !== skill));

  const commitName = (card: GroupCard) => {
    const name = card.name.trim();
    if (name === card.committed) {
      if (card.name !== name) saveCard({ ...card, name });
      return;
    }
    const taken = groups.some(
      (other) => other.key !== card.key && other.committed.trim().toLowerCase() === name.toLowerCase(),
    );
    if (taken && name) {
      setError({ key: card.key, message: COPY.duplicateGroup(name) });
      return;
    }
    setError(null);
    setSkills(skills.map((skill) => (skill.group === card.committed ? { ...skill, group: name } : skill)));
    saveCard({ ...card, name, committed: name });
  };

  const removeGroup = (card: GroupCard) => {
    // The skills stay, under Other.
    setSkills(skills.map((skill) => {
      if (skill.group !== card.committed) return skill;
      const next = { ...skill };
      delete next.group;
      return next;
    }));
    setCards((current) => current.filter((item) => item.key !== card.key));
    if (error?.key === card.key) setError(null);
  };

  const addGroup = () => {
    if (groups.some((card) => card.committed === '')) return;
    setCards((current) => [...current, { key: `group-${nextKey}`, name: '', committed: '' }]);
    setNextKey((value) => value + 1);
  };

  return (
    <div role="group" aria-labelledby={titleId} aria-describedby={hintId} className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span id={titleId} className="text-sm font-medium text-foreground">
          {HIGHLIGHT_FIELDS.skills.label}
        </span>
        {toggle}
      </div>
      <p id={hintId} data-allow-small-text className="text-[1.3rem] text-muted-foreground">
        {optionalFieldUse('skillGroups', template)}
        {/* A template that leaves groups out already says it lists skills together. */}
        {!template || templateShowsField(template.key, 'skillGroups') ? ` ${COPY.onHint}` : null}
      </p>
      <ul className="flex flex-col gap-2">
        {groups.map((card, index) => {
          const label = card.committed || COPY.untitledGroup;
          return (
            <li key={card.key} className="flex flex-col gap-2 rounded-md bg-background p-3">
              <div className="flex items-center gap-2">
                <Input
                  aria-label={COPY.groupName.label(index + 1)}
                  value={card.name}
                  maxLength={SKILL_GROUP_NAME_MAX}
                  placeholder={COPY.groupName.example}
                  onChange={(event) => saveCard({ ...card, name: event.target.value })}
                  onBlur={() => commitName(card)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      commitName(card);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={COPY.removeGroup(label)}
                  onClick={() => removeGroup(card)}
                  className="size-12 shrink-0 text-destructive hover:text-destructive"
                >
                  <Trash aria-hidden="true" className="size-4" strokeWidth={1.75} />
                </Button>
              </div>
              <GroupSkills
                skills={skills.filter((skill) => skill.group === card.committed)}
                inputLabel={COPY.addSkill(label)}
                error={error?.key === card.key ? error.message : undefined}
                onAdd={(name) => addSkill(card, name)}
                onRemove={removeSkill}
              />
            </li>
          );
        })}
        {ungrouped.length > 0 ? (
          <li className="flex flex-col gap-2 rounded-md bg-background p-3">
            <span className="text-sm font-medium text-foreground">{COPY.ungrouped}</span>
            <GroupSkills
              skills={ungrouped}
              inputLabel={COPY.addSkill(COPY.ungrouped)}
              error={error?.key === UNGROUPED_KEY ? error.message : undefined}
              onAdd={(name) => addSkill(null, name)}
              onRemove={removeSkill}
            />
            <p data-allow-small-text className="text-[1.3rem] text-muted-foreground">
              {COPY.ungroupedHint}
            </p>
          </li>
        ) : null}
      </ul>
      <Button type="button" variant="outline" className="h-10 self-start" onClick={addGroup}>
        <Plus aria-hidden="true" className="size-4" />
        {COPY.addGroup}
      </Button>
    </div>
  );
}

const UNGROUPED_KEY = 'ungrouped';

function GroupSkills({
  skills,
  inputLabel,
  error,
  onAdd,
  onRemove,
}: {
  skills: Skill[];
  inputLabel: string;
  error?: string;
  onAdd: (name: string) => void;
  onRemove: (skill: Skill) => void;
}) {
  const errorId = useId();
  return (
    <div className="flex flex-col gap-1">
      <TagField
        items={skills.map((skill) => skill.name)}
        inputLabel={inputLabel}
        placeholder={HIGHLIGHT_FIELDS.skills.example}
        removeLabel={TAG_REMOVE_LABEL}
        invalid={Boolean(error)}
        describedBy={error ? errorId : undefined}
        onAdd={onAdd}
        onRemove={(index) => {
          const skill = skills[index];
          if (skill) onRemove(skill);
        }}
      />
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
