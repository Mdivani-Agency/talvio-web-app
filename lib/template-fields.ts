import { OPTIONAL_FIELD_SHOWN_IN, shownElsewhere, shownInYourTemplate } from '@/lib/onboarding-copy';

/** Profile and resume fields that only some templates print. Every template falls back cleanly when they are empty. */
export type OptionalTemplateField = keyof typeof OPTIONAL_FIELD_SHOWN_IN;

/**
 * The optional fields each template prints, by template key. The keys are those of the new templates (MDI-660); they
 * join the registry in `lib/templates.ts` with MDI-666. The existing templates print none of them.
 */
export const TEMPLATE_OPTIONAL_FIELDS: Readonly<Record<string, readonly OptionalTemplateField[]>> = {
  executive: ['headlineAchievements'],
  'skills-first': ['skillGroups'],
  technical: ['skillGroups', 'stack'],
};

export function templateShowsField(templateKey: string | undefined, field: OptionalTemplateField): boolean {
  return Boolean(templateKey && TEMPLATE_OPTIONAL_FIELDS[templateKey]?.includes(field));
}

export type CurrentTemplate = { key: string; name: string };

/**
 * The end of an optional field's hint. In the resume editor it says whether the selected template prints the field;
 * in onboarding, where no template is chosen yet, it names the templates that do.
 */
export function optionalFieldUse(field: OptionalTemplateField, template?: CurrentTemplate | null): string {
  if (template && templateShowsField(template.key, field)) {
    return shownInYourTemplate(template.name);
  }
  const { where, omitted } = OPTIONAL_FIELD_SHOWN_IN[field];
  return shownElsewhere(where, template?.name, omitted);
}
