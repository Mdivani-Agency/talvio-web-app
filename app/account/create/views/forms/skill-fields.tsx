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

function SkillGroupsField({ form, toggle }: { form: AppForm; toggle: React.ReactNode }) {
  const skills = useStore(form.store, (state) => ((state.values as { skills?: Skill[] }).skills ?? []));
  const template = useCurrentTemplate();
  const titleId = useId();
  const hintId = useId();
  // Groups without skills yet live only here: a group is stored on its skills.
  const [emptyGroups, setEmptyGroups] = useState<string[]>([]);
  const [error, setError] = useState<{ group: string; message: string } | null>(null);

  const used = groupNamesOf(skills);
  const groups = [...used, ...emptyGroups.filter((name) => !used.includes(name))];
  const ungrouped = skills.filter((skill) => skill.group === undefined);

  const setSkills = (next: Skill[]) => form.setFieldValue('skills', next);

  const addSkill = (group: string | undefined, name: string) => {
    const parsed = skillSchema.safeParse({ name, group });
    if (!parsed.success) {
      setError({ group: group ?? '', message: parsed.error.issues[0]?.message ?? '' });
      return;
    }
    if (skills.some((skill) => skill.name.trim().toLowerCase() === name.toLowerCase())) {
      setError({ group: group ?? '', message: COPY.duplicateSkill(name) });
      return;
    }
    setError(null);
    setSkills([...skills, { name, ...(group === undefined ? {} : { group }) }]);
    setEmptyGroups((current) => current.filter((item) => item !== group));
  };

  const removeSkill = (skill: Skill) => setSkills(skills.filter((item) => item !== skill));

  const renameGroup = (from: string, to: string) => {
    const name = to.slice(0, SKILL_GROUP_NAME_MAX);
    if (used.includes(from)) {
      setSkills(skills.map((skill) => (skill.group === from ? { ...skill, group: name } : skill)));
    }
    setEmptyGroups((current) => current.map((item) => (item === from ? name : item)));
  };

  const removeGroup = (name: string) => {
    // The skills stay, under Other.
    setSkills(skills.map((skill) => {
      if (skill.group !== name) return skill;
      const next = { ...skill };
      delete next.group;
      return next;
    }));
    setEmptyGroups((current) => current.filter((item) => item !== name));
  };

  const addGroup = () => {
    if (!groups.includes('')) {
      setEmptyGroups((current) => [...current, '']);
    }
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
        {groups.map((group, index) => (
          <li key={index} className="flex flex-col gap-2 rounded-md bg-background p-3">
            <div className="flex items-center gap-2">
              <Input
                aria-label={COPY.groupName.label(index + 1)}
                value={group}
                maxLength={SKILL_GROUP_NAME_MAX}
                placeholder={COPY.groupName.example}
                onChange={(event) => renameGroup(group, event.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={COPY.removeGroup(group || COPY.untitledGroup)}
                onClick={() => removeGroup(group)}
                className="size-12 shrink-0 text-destructive hover:text-destructive"
              >
                <Trash aria-hidden="true" className="size-4" strokeWidth={1.75} />
              </Button>
            </div>
            <GroupSkills
              skills={skills.filter((skill) => skill.group === group)}
              inputLabel={COPY.addSkill(group || COPY.untitledGroup)}
              error={error?.group === group ? error.message : undefined}
              onAdd={(name) => addSkill(group, name)}
              onRemove={removeSkill}
            />
          </li>
        ))}
        {ungrouped.length > 0 ? (
          <li className="flex flex-col gap-2 rounded-md bg-background p-3">
            <span className="text-sm font-medium text-foreground">{COPY.ungrouped}</span>
            <GroupSkills
              skills={ungrouped}
              inputLabel={COPY.addSkill(COPY.ungrouped)}
              error={error?.group === '' && !groups.includes('') ? error.message : undefined}
              onAdd={(name) => addSkill(undefined, name)}
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
