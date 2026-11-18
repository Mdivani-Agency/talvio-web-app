/** Copy for the signed-in account area (MDI-589). Allowance strings live in `lib/allowance-copy.ts`. */

export type AccountNavLink = { name: string; href: string };

export const ACCOUNT_NAV_LABEL = 'Account';
export const ACCOUNT_NAV_LINKS: AccountNavLink[] = [
  { name: 'Account', href: '/account' },
  { name: 'Documents', href: '/account/documents' },
];

export const CREATE_RESUME_LABEL = 'Create resume';
export const CREATE_RESUME_HREF = '/resume';

export const SIGN_OUT_LABEL = 'Sign out';
export const SIGN_OUT_ERROR = 'Could not sign out. Try again.';

/** The theme switch names the theme it switches to. */
export const DARK_THEME_LABEL = 'Dark theme';
export const LIGHT_THEME_LABEL = 'Light theme';

export const ACCOUNT_MENU_OPEN_LABEL = 'Open menu';
export const ACCOUNT_MENU_TITLE = 'Account menu';

/** Shown only while `creditPurchaseUi` is on. */
export const PREMIUM_TITLE = 'Get premium features';
export const PREMIUM_BODY = 'Unlock pro resume features and stand out.';
export const PREMIUM_CTA_LABEL = 'Upgrade now';
export const PREMIUM_CTA_HREF = '/account/upgrade';

/** Up to two initials from the person's name, or the first letter of the email. */
export function accountInitials(name: string | null | undefined, email: string): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    return words
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  }
  return email.trim().charAt(0).toUpperCase() || '?';
}

/** The account page that a path belongs to; onboarding (`/account/create`) belongs to Account. */
export function activeAccountHref(pathname: string): string {
  return pathname.startsWith('/account/documents') ? '/account/documents' : '/account';
}

/** The dashboard's resume list (MDI-591). */
export const MY_RESUMES_TITLE = 'My resumes';
export const NO_RESUMES_TITLE = 'No resumes yet';
export const NO_RESUMES_BODY = 'Your profile is ready. Pick a template and your first resume starts from it.';
export const PDF_READY_BADGE = 'PDF ready';
export const DRAFT_BADGE = 'Draft';
export const UNPUBLISHED_DRAFT_BADGE = 'Unpublished draft';
export const DOWNLOAD_LABEL = 'Download';
export const LOAD_MORE_LABEL = 'Load more';
export const DELETE_RESUME_TITLE = 'Delete resume';
export const DELETE_RESUME_DESCRIPTION = 'This permanently removes the resume. This cannot be undone.';
export const DELETE_FAMILY_DESCRIPTION =
  'This permanently removes the generated resume and its unpublished draft. This cannot be undone.';
export const RESUME_DELETED_MESSAGE = 'Resume deleted';

const updatedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** "Updated Nov 18, 2026". */
export function updatedLine(date: Date): string {
  return `Updated ${updatedDate.format(date)}`;
}

export function editResumeLabel(title: string): string {
  return `Edit ${title}`;
}

export function deleteResumeLabel(title: string): string {
  return `Delete ${title}`;
}

/** The page heading: the profile name, else the session name, else the email. */
export function accountHeading(profileName: string | null | undefined, sessionName: string | null | undefined, email: string): string {
  return profileName?.trim() || sessionName?.trim() || email;
}

/** Profile section headings on the dashboard (MDI-592). */
export const PROFILE_SECTION_TITLES = {
  profile: 'Profile',
  experience: 'Experience',
  skills: 'Skills',
  education: 'Education',
  languages: 'Languages',
  projects: 'Projects',
  recommendations: 'Recommendations',
} as const;

export const PRESENT_LABEL = 'Present';

/** "full-time" → "Full-time", for employment and location types. */
export function sentenceCase(value: string | null | undefined): string {
  const text = (value ?? '').replace(/_/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : '';
}

/** "Company · Full-time · Remote", skipping empty parts. */
export function jobMetaLine(company: string | null | undefined, employmentType?: string | null, locationType?: string | null): string {
  return [company?.trim(), sentenceCase(employmentType), sentenceCase(locationType)].filter(Boolean).join(' · ');
}
