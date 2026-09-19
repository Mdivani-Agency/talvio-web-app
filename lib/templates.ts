import { ember, mint, talvio } from '@pdf-tlv/resume/dist/templates';
import type { Template } from '@pdf-tlv/resume';

import type { TemplateItem, TemplateKey, TemplateList } from '@lib/types';
import { RESUME_COLORS_MAP } from '@lib/utils/tailwind';

const STYLES = [
  // Modern reuses the Ember layout; only the default colour differs.
  { suffix: 'modern', name: 'Modern', template: ember, color: RESUME_COLORS_MAP.grayLight, description: 'Clean modern layout' },
  { suffix: 'ember', name: 'Ember', template: ember, color: RESUME_COLORS_MAP.ember, description: 'Warm accent layout' },
  { suffix: 'mint', name: 'Mint', template: mint, color: RESUME_COLORS_MAP.mint, description: 'Fresh accent layout' },
  { suffix: 'talvio', name: 'Talvio', template: talvio, color: RESUME_COLORS_MAP.talvio, description: 'Talvio brand layout' },
] as const;

type TemplateLevel = 'entry' | 'mid' | 'senior';

function item(level: TemplateLevel, style: (typeof STYLES)[number]): TemplateItem {
  const key = `${level}-level-${style.suffix}` as TemplateKey;
  return {
    name: style.name,
    template: style.template as Template,
    color: style.color,
    imageUrl: `/templates/${key}.svg`,
    description: style.description,
    key,
  };
}

export const TEMPLATE_LIST: TemplateList = {
  entry: STYLES.map((style) => item('entry', style)),
  mid: STYLES.map((style) => item('mid', style)),
  senior: STYLES.map((style) => item('senior', style)),
};

export function listResumeTemplates(): TemplateList {
  return TEMPLATE_LIST;
}

export function findTemplate(key?: TemplateKey | null) {
  if (!key) {
    return undefined;
  }
  return [...TEMPLATE_LIST.entry, ...TEMPLATE_LIST.mid, ...TEMPLATE_LIST.senior].find(
    (template) => template.key === key,
  );
}
