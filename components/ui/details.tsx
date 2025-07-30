import React from 'react';
import { Icon } from '../icons';

interface DetailsListProps {
  qa: {
    question: string;
    answer: string;
  }[];
}

export const DetailsList = ({ qa }: DetailsListProps) => {
  return (
    <div className="w-full bg-card rounded-lg px-5 py-8 mx-auto">
      {qa.map((faq, idx) => (
        <details key={idx} className="group border-b border-muted px-4 last:border-b-0">
          <summary className="w-full flex justify-between items-center py-4 text-left cursor-pointer list-none select-none text-primary focus:outline-none focus:text-primary hover:text-primary active:text-primary">
            <span className="text-lg font-medium text-primary">{faq.question}</span>
            <span className="ml-2 transition-transform duration-200 group-open:rotate-180 text-muted-foreground">
              <Icon className="size-6" type={'ChevronDown'} />
            </span>
          </summary>
          <p className="px-2 pb-4 text-md text-muted-foreground">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
};
