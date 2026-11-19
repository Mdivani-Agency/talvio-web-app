import { WifiOff } from 'lucide-react';

import { ERROR_BODY, ERROR_RETRY_LABEL, ERROR_TITLE, GO_HOME_LABEL, HOME_HREF } from '@/lib/status-copy';

import { StatusView, type StatusAction } from './status-view';

type ErrorViewProps = {
  /** Defaults to "This page didn't load". */
  title?: string;
  /** Defaults to the generic explanation. */
  body?: string;
  /** With `reset`, Try again is the primary action and Go to the homepage the secondary. */
  reset?: () => void;
};

const goHome: StatusAction = { label: GO_HOME_LABEL, href: HOME_HREF };

/** A failed load inside a page, on the shared status layout, with the support email. */
export function ErrorView({ title = ERROR_TITLE, body = ERROR_BODY, reset }: ErrorViewProps) {
  return (
    <StatusView
      icon={WifiOff}
      title={title}
      body={body}
      primary={reset ? { label: ERROR_RETRY_LABEL, onClick: reset } : goHome}
      secondary={reset ? goHome : undefined}
      help
      className="min-h-[60svh]"
    />
  );
}
