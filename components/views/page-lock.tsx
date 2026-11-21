'use client';

import { Check, CircleAlert, Clock, Sparkles } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@components/ui';
import { cn } from '@lib/utils';
import {
  ELAPSED_LABEL,
  OFFLINE_TITLE,
  SLOW_AFTER_MS,
  STEP_STATUS,
  STILL_WORKING_TITLE,
  elapsedText,
} from '@/lib/page-lock-copy';

export type PageLockAction = { label: string; onClick: () => void };

export type PageLockFailure = {
  title: string;
  /** What happened and what to do. Announced as an alert. */
  body: string;
  /** What was kept, such as "Your changes are saved." */
  kept?: string;
  primary: PageLockAction;
  secondary?: PageLockAction;
};

export type PageLockProps = {
  /** The flow, above the title, such as "Save profile". */
  context: string;
  title: string;
  /** Steps that follow the work's real phases. Leave out for short work and pass `line` instead. */
  steps?: readonly string[];
  /** Index of the step in progress; earlier steps show as done. */
  currentStep?: number;
  /** The single line for short work without steps. */
  line?: string;
  note: string;
  /** The flow's words after "Still working.", shown once the work has run for a minute. */
  slowNote?: string;
  /**
   * Turns on the offline state for work that pauses while the browser is offline (LLM jobs): the title becomes
   * "Waiting for a connection", the current step shows as paused and this replaces the note.
   */
  offlineNote?: string;
  /** Stop or Cancel, only for work that can really stop. */
  cancel?: PageLockAction;
  /** Shows the failure instead of the progress, in the same card. */
  failure?: PageLockFailure;
  /** Asks before the tab closes, for work that cannot resume after a reload (save, PDF). */
  warnOnLeave?: boolean;
  /** When the work started (ms since epoch), so a lock restored after a reload keeps counting from the start. */
  startedAt?: number;
};

type StepState = keyof typeof STEP_STATUS;

function subscribeNothing() {
  return () => undefined;
}

function subscribeOnline(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

function useBrowserOffline() {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine === false,
    () => false,
  );
}

/** Seconds since `startedAt`, ticking once a second. */
function useElapsedSeconds(startedAt: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

/**
 * Attaches `container` to `<body>` and makes everything else there inert while mounted: each other child of `<body>`
 * (the app, open toasts) that was not inert already. On unmount it restores them, removes the container and gives
 * focus back to the element that had it before the lock, in that order, so the element is no longer inert.
 */
function useLockedBody(container: HTMLElement | null) {
  useLayoutEffect(() => {
    if (!container) {
      return;
    }
    // Before the card takes focus, so this is the element the person used to start the work.
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    container.setAttribute('data-page-lock', '');
    document.body.appendChild(container);
    const changed: Element[] = [];
    for (const child of Array.from(document.body.children)) {
      if (child === container || child.hasAttribute('inert')) {
        continue;
      }
      child.setAttribute('inert', '');
      changed.push(child);
    }
    return () => {
      for (const element of changed) {
        element.removeAttribute('inert');
      }
      container.remove();
      if (previous?.isConnected) {
        previous.focus();
      }
    };
  }, [container]);
}

function useWarnOnLeave(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers show the prompt only when `returnValue` is set.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [enabled]);
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <span className="flex size-5 flex-none items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Check aria-hidden className="size-3" strokeWidth={3.5} />
      </span>
    );
  }
  if (state === 'active') {
    return <Spinner />;
  }
  if (state === 'paused') {
    return (
      <span
        aria-hidden
        className="flex size-5 flex-none items-center justify-center gap-[3px] rounded-full border-[1.5px] border-muted-foreground"
      >
        <span className="h-2 w-[2px] bg-muted-foreground" />
        <span className="h-2 w-[2px] bg-muted-foreground" />
      </span>
    );
  }
  return <span aria-hidden className="size-5 flex-none rounded-full border-[1.5px] border-input" />;
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-5 flex-none animate-spin rounded-full border-[2.5px] border-popover border-t-secondary motion-reduce:animate-none"
    />
  );
}

/**
 * The page lock (MDI-670): while work that changes data or runs AI is in progress, a scrim covers the page, the app
 * behind it is `inert`, a thin bar runs along the top and one card says what is happening. Plain page loads use
 * skeletons instead, and quick actions keep their inline spinners.
 *
 * Render it while the work runs and remove it when it ends. Focus moves to the card's heading and returns to where it
 * was when the lock ends. Escape does nothing. The card is drawn in a portal on `<body>`, so it works from any page.
 */
export function PageLock(props: PageLockProps) {
  // No portal during server rendering or hydration; the lock appears on the client's next render.
  const isClient = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [container] = useState(() => (typeof document === 'undefined' ? null : document.createElement('div')));

  useLockedBody(container);
  useWarnOnLeave(!!props.warnOnLeave && !props.failure);

  return isClient && container ? createPortal(<PageLockCard {...props} />, container) : null;
}

function PageLockCard({
  context,
  title,
  steps,
  currentStep = 0,
  line,
  note,
  slowNote,
  offlineNote,
  cancel,
  failure,
  startedAt,
}: PageLockProps) {
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [mountedAt] = useState(() => Date.now());
  const seconds = useElapsedSeconds(startedAt ?? mountedAt);
  const browserOffline = useBrowserOffline();
  const offline = !!offlineNote && browserOffline && !failure;
  const slow = !failure && !offline && !!slowNote && seconds * 1000 >= SLOW_AFTER_MS;

  // Focus the heading when the card opens and when it turns into the failure. `PageLock` gives focus back.
  const failed = !!failure;
  useEffect(() => {
    headingRef.current?.focus();
  }, [failed]);

  const heading = failure ? failure.title : offline ? OFFLINE_TITLE : title;

  return (
    <div
      data-testid="page-lock"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(246,246,254,0.78)] p-4 backdrop-blur-[3px] md:p-6 dark:bg-[rgba(13,13,13,0.72)]"
    >
      {failure ? null : (
        <div aria-hidden className="absolute inset-x-0 top-0 h-[3px] overflow-hidden bg-popover">
          <span className="block h-full w-2/5 animate-[page-lock-bar_1.4s_ease-in-out_infinite] bg-secondary motion-reduce:animate-none" />
        </div>
      )}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={failure ? undefined : true}
        className="flex w-full max-w-[48rem] flex-col gap-5 rounded-[1.6rem] border border-input bg-background p-6 shadow-[0_24px_64px_rgba(13,13,13,0.18)] md:p-8"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="m-0 flex items-center gap-2 text-sm font-semibold text-secondary">
            <Sparkles aria-hidden className="size-4" />
            {context}
          </p>
          {!failure && steps ? (
            <span aria-label={ELAPSED_LABEL} className="text-sm font-medium text-muted-foreground tabular-nums">
              {elapsedText(seconds)}
            </span>
          ) : null}
        </div>

        {failure ? (
          <>
            <div className="flex flex-col gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <CircleAlert aria-hidden className="size-[2.2rem]" />
              </span>
              <h2 id={titleId} ref={headingRef} tabIndex={-1} className="m-0 text-[2.2rem] leading-[1.35] font-semibold text-primary outline-none">
                {heading}
              </h2>
              <p role="alert" className="m-0 text-[1.5rem]">
                {failure.body}
              </p>
              {failure.kept ? <p className="m-0 text-sm text-muted-foreground">{failure.kept}</p> : null}
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <Button type="button" size="lg" className="h-[4.8rem] text-[1.5rem]" onClick={failure.primary.onClick}>
                {failure.primary.label}
              </Button>
              {failure.secondary ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-[4.8rem] text-[1.5rem]"
                  onClick={failure.secondary.onClick}
                >
                  {failure.secondary.label}
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <h2 id={titleId} ref={headingRef} tabIndex={-1} className="m-0 text-[2.2rem] leading-[1.35] font-semibold text-primary outline-none">
              {heading}
            </h2>
            {steps ? (
              <ol role="status" aria-live="polite" className="m-0 flex list-none flex-col gap-[1.4rem] p-0">
                {steps.map((label, index) => {
                  const state: StepState =
                    index < currentStep ? 'done' : index > currentStep ? 'todo' : offline ? 'paused' : 'active';
                  return (
                    <li
                      key={label}
                      data-state={state}
                      className={cn(
                        'flex items-center gap-3 text-[1.5rem]',
                        state === 'todo' && 'text-muted-foreground',
                        (state === 'active' || state === 'paused') && 'font-semibold',
                      )}
                    >
                      <StepIcon state={state} />
                      <span>
                        {label}
                        {STEP_STATUS[state] ? <span className="sr-only">{STEP_STATUS[state]}</span> : null}
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p role="status" className="m-0 flex items-center gap-3 text-[1.5rem]">
                <Spinner />
                {line}
              </p>
            )}
            {slow ? (
              <p role="status" className="m-0 flex gap-2.5 rounded-[1rem] bg-card px-3.5 py-3 text-sm leading-normal">
                <Clock aria-hidden className="mt-px size-[1.8rem] flex-none text-secondary" />
                <span>
                  <strong className="font-semibold">{STILL_WORKING_TITLE}</strong> {slowNote}
                </span>
              </p>
            ) : null}
            <p className="m-0 text-sm text-muted-foreground">{offline ? offlineNote : note}</p>
            {cancel ? (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-[4.8rem] w-full text-[1.5rem] md:w-auto"
                  onClick={cancel.onClick}
                >
                  {cancel.label}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
