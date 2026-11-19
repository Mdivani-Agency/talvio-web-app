import { CircleAlert, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@components/ui';
import {
  CREATE_RESUME_HREF,
  CREATE_RESUME_LABEL,
  DOCUMENTS_EMPTY_BODY,
  DOCUMENTS_EMPTY_TITLE,
  DOCUMENTS_ERROR_BODY,
  DOCUMENTS_ERROR_TITLE,
  DOCUMENTS_RETRY_LABEL,
} from '@/lib/account-copy';

type DocumentsPanelProps = { kind: 'empty' } | { kind: 'error'; onRetry: () => void };

/** The empty library and the failed list share one panel, so a failed list never looks like an empty one. */
export function DocumentsPanel(props: DocumentsPanelProps) {
  const error = props.kind === 'error';
  const Icon = error ? CircleAlert : FileText;
  return (
    <div
      role={error ? 'alert' : 'status'}
      className="flex flex-col items-center gap-3 rounded-lg bg-card px-5 py-10 text-center md:px-10 md:py-16"
    >
      <span
        aria-hidden="true"
        className={
          error
            ? 'flex size-[5.6rem] items-center justify-center rounded-lg bg-popover text-destructive dark:bg-accent'
            : 'flex size-[5.6rem] items-center justify-center rounded-lg bg-popover text-secondary dark:bg-accent dark:text-secondary-hover'
        }
      >
        <Icon className="size-[2.6rem]" strokeWidth={1.75} />
      </span>
      <h2 className="text-[2rem] leading-[1.4] font-semibold text-primary">
        {error ? DOCUMENTS_ERROR_TITLE : DOCUMENTS_EMPTY_TITLE}
      </h2>
      <p className="max-w-[42rem] text-sm leading-[1.4286] text-muted-foreground">
        {error ? DOCUMENTS_ERROR_BODY : DOCUMENTS_EMPTY_BODY}
      </p>
      {props.kind === 'error' ? (
        <Button type="button" onClick={props.onRetry} className="mt-1 h-[4.4rem] px-5 text-sm">
          {DOCUMENTS_RETRY_LABEL}
        </Button>
      ) : (
        <Button asChild className="mt-1 h-[4.4rem] gap-2 px-5 text-sm">
          <Link href={CREATE_RESUME_HREF}>
            <Plus aria-hidden="true" className="size-4" />
            {CREATE_RESUME_LABEL}
          </Link>
        </Button>
      )}
    </div>
  );
}
