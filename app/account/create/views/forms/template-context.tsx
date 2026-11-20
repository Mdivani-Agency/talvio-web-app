'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { CurrentTemplate } from '@lib/template-fields';

const CurrentTemplateContext = createContext<CurrentTemplate | null>(null);

/** The resume's template, so the optional fields can say whether it prints them. Onboarding has none. */
export function CurrentTemplateProvider({ template, children }: { template: CurrentTemplate | null; children: ReactNode }) {
  return <CurrentTemplateContext.Provider value={template}>{children}</CurrentTemplateContext.Provider>;
}

export function useCurrentTemplate() {
  return useContext(CurrentTemplateContext);
}
