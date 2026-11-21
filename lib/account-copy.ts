/** Copy for the signed-in account area (MDI-589). Allowance strings live in `lib/allowance-copy.ts`. */

export type AccountNavLink = { name: string; href: string };

export const ACCOUNT_NAV_LABEL = 'Account';
export const ACCOUNT_NAV_LINKS: AccountNavLink[] = [
  { name: 'Account', href: '/account' },
  { name: 'Documents', href: '/account/documents' },
];

/** The application tracker's page (MDI-656), listed under Documents while `applicationTracker` is on. */
export const APPLICATIONS_NAV_LINK: AccountNavLink = { name: 'Applications', href: '/account/applications' };

/** The sidebar's account pages, with Applications when the tracker is on. */
export function accountNavLinks(applicationTracker: boolean): AccountNavLink[] {
  return applicationTracker ? [...ACCOUNT_NAV_LINKS, APPLICATIONS_NAV_LINK] : ACCOUNT_NAV_LINKS;
}

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
  if (pathname.startsWith('/account/documents')) {
    return '/account/documents';
  }
  if (pathname.startsWith(APPLICATIONS_NAV_LINK.href)) {
    return APPLICATIONS_NAV_LINK.href;
  }
  return '/account';
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

// Documents page (`/account/documents`).
export const DOCUMENTS_TITLE = 'Your resumes';
export const DOCUMENTS_INTRO = 'Every resume PDF you have generated. Downloads are always free.';
export const DOCUMENTS_LOADING = 'Loading your resumes...';
export const DOCUMENTS_EMPTY_TITLE = 'No resume PDFs yet';
export const DOCUMENTS_EMPTY_BODY = 'Generate a PDF from one of your resumes and it appears here.';
/** The failed-list texts stay as before: `e2e/documents.spec.ts` checks them. */
export const DOCUMENTS_ERROR_TITLE = 'Could not load your resumes';
export const DOCUMENTS_ERROR_BODY = 'This is not an empty library. Check your connection and try again.';
export const DOCUMENTS_RETRY_LABEL = 'Try again';
export const DOCUMENTS_TAILOR_LABEL = 'Tailor to a job';
export const DOCUMENTS_TAILOR_HREF = '/resume/tailor';
/** Shown under a file name when the media service returns no `createdAt`. */
export const DOCUMENT_FALLBACK_META = 'PDF';

/** "Added Nov 6, 2026". */
export function addedLine(date: Date): string {
  return `Added ${updatedDate.format(date)}`;
}

/** The line under a file name: when it was added, or "PDF" when the date is missing or unreadable. */
export function documentMetaLine(createdAt: string | null | undefined): string {
  if (!createdAt) return DOCUMENT_FALLBACK_META;
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? DOCUMENT_FALLBACK_META : addedLine(date);
}

export function openDocumentLabel(name: string): string {
  return `Open ${name}`;
}

export function downloadDocumentLabel(name: string): string {
  return `Download ${name}`;
}

/** The file name shown on a card: the stored name plus the extension from its MIME type ("Resume.pdf"). */
export function documentFileName(name: string, type: string): string {
  const extension = type.split('/')[1];
  if (!extension || name.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) return name;
  return `${name}.${extension}`;
}

/** Preview states inside a document's A4 area. */
export const DOCUMENT_PREVIEW_LOADING = 'Loading preview';
export const DOCUMENT_PREVIEW_UNAVAILABLE = 'Preview not available';

/** The preview image's alt text on a card: "First page of Resume". */
export function documentPreviewAlt(name: string): string {
  return `First page of ${name}`;
}

/** Shown under the loaded documents when the next page fails; the loaded ones stay. */
export const DOCUMENTS_MORE_ERROR = 'Could not load more resumes. Check your connection and try again.';

/* Page-load skeletons (MDI-671): the status line read out while the page draws its shape. */
export const ACCOUNT_LOADING_LABEL = 'Loading your account';
export const PROFILE_FORM_LOADING_LABEL = 'Loading your profile';
