const RESUME_PATH = /^\/resume\/[^/]+/;

/** Replaces the resume id in a private /resume/<id> URL so analytics never stores it. */
export function redactAnalyticsUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.pathname = parsed.pathname.replace(RESUME_PATH, '/resume/[resumeId]');
    parsed.search = '';
    return parsed.toString();
  } catch {
    return url;
  }
}
