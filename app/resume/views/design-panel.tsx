'use client';

import { ColorPaletteSelector } from '@components/ui';
import type { TemplateKey, TemplateList } from '@lib/types';
import { cn } from '@lib/utils';
import { DESIGN_PANEL } from '@/lib/resume-editor-copy';

import TemplatesView from './templates-view';

type DesignPanelProps = {
  templates?: TemplateList;
  level: 'entry' | 'mid' | 'senior';
  template: TemplateKey;
  color: string;
  fontSize: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onTemplate: (key: TemplateKey) => void;
  onColor: (color: string) => void;
  onFontSize: (size: 'sm' | 'md' | 'lg') => void;
};

const CARD = 'flex flex-col gap-3 rounded-[1.2rem] bg-card p-4 md:p-5';
const HEADING = 'text-md font-semibold text-primary';

/**
 * The Design tab: template, accent colour and text size, which used to sit in the preview toolbar. MDI-604 restyles
 * the template gallery and the colour swatches.
 */
export function DesignPanel({
  templates,
  level,
  template,
  color,
  fontSize,
  disabled = false,
  onTemplate,
  onColor,
  onFontSize,
}: DesignPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <section aria-labelledby="design-template" className={CARD}>
        <h2 id="design-template" className={HEADING}>
          {DESIGN_PANEL.template}
        </h2>
        <TemplatesView templates={templates} initialLevel={level} selectedTemplate={template} onChange={(_, key) => onTemplate(key)} />
      </section>
      <section aria-labelledby="design-accent" className={CARD}>
        <h2 id="design-accent" className={HEADING}>
          {DESIGN_PANEL.accent}
        </h2>
        <ColorPaletteSelector value={color} onSelect={onColor} disabled={disabled} className="h-[4.4rem] max-h-none w-[4.4rem]" />
      </section>
      <section aria-labelledby="design-size" className={CARD}>
        <h2 id="design-size" className={HEADING}>
          {DESIGN_PANEL.textSize}
        </h2>
        <div role="radiogroup" aria-labelledby="design-size" className="flex gap-1 rounded-[1rem] bg-accent p-1">
          {DESIGN_PANEL.sizes.map((size) => {
            const checked = fontSize === size.value;
            return (
              <button
                key={size.value}
                type="button"
                role="radio"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onFontSize(size.value)}
                className={cn(
                  'h-[4rem] flex-1 rounded-md text-sm font-medium text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50',
                  checked && 'bg-background font-semibold text-foreground shadow-[0_1px_3px_rgba(13,13,13,0.15)]',
                )}
              >
                {size.name}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
