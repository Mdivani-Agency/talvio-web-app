import React from 'react';
import { Icon } from '../icons';

interface DetailsListProps {
  qa: readonly {
    question: string;
    answer: string;
  }[];
  /** Opens the first answer on load. Each row stays a native `<details>` toggle. */
  openFirst?: boolean;
}

export const DetailsList = ({ qa, openFirst = false }: DetailsListProps) => {
  return (
    <div className="w-full border-t border-input">
      {qa.map((faq, idx) => (
        <details key={faq.question} open={openFirst && idx === 0} className="group border-b border-input">
          <summary className="flex min-h-16 w-full cursor-pointer list-none items-center justify-between gap-4 rounded-sm py-4 text-left select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <span className="min-w-0 text-lg leading-[1.556] font-medium text-foreground">{faq.question}</span>
            <span className="shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180">
              <Icon className="size-5" type={'ChevronDown'} />
            </span>
          </summary>
          <p className="pr-10 pb-5 text-md text-muted-foreground">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
};
