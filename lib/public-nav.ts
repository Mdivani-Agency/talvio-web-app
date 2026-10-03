export type NavLink = { name: string; href: string };

export const SIGN_IN_HREF = '/auth/sign-in';
export const SIGN_IN_LABEL = 'Sign in';

/** Links to other public pages. Shown in the header on every public page. A blog link is added here when `/blog` exists (MDI-249). */
export const PUBLIC_PAGE_LINKS: NavLink[] = [
  { name: 'Templates', href: '/templates' },
  { name: 'ATS-friendly resume', href: '/ats-friendly-resume' },
];

/** In-page anchors, shown before the page links on the homepage only. */
export const HOME_SECTION_LINKS: NavLink[] = [
  { name: 'Workflow', href: '#workflow' },
  { name: 'Benefits', href: '#benefits' },
  { name: 'Price', href: '#plans' },
  { name: 'FAQ', href: '#faq' },
];

export const HOME_NAV_LINKS: NavLink[] = [...HOME_SECTION_LINKS, ...PUBLIC_PAGE_LINKS];

export const LEGAL_LINKS: NavLink[] = [
  { name: 'Privacy Policy', href: '/privacy-policy' },
  { name: 'Terms of Service', href: '/terms' },
];

/** Footer links to every public page. */
export const FOOTER_PAGE_LINKS: NavLink[] = [{ name: 'Home', href: '/' }, ...PUBLIC_PAGE_LINKS, ...LEGAL_LINKS];

export const SOCIAL_LINKS: NavLink[] = [
  { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61574246154502' },
  { name: 'Twitter', href: 'https://twitter.com/talvio25' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/talvio-co' },
];

export const FOOTER_POWERED_BY_LEAD = 'Powered by';
export const FOOTER_POWERED_BY_NAME = 'MDIVANI AGENCY';
export const FOOTER_POWERED_BY_HREF = 'https://mdivani.agency';

export function footerCopyright(year: number) {
  return `© ${year} Talvio. All rights reserved.`;
}
