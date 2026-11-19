import { featureFlags, type FeatureFlags } from './flags';

/** `current` marks the page the visitor is on (`aria-current="page"`). */
export type NavLink = { name: string; href: string; current?: boolean };

export const SIGN_IN_HREF = '/auth/sign-in';
export const SIGN_IN_LABEL = 'Sign in';

/** Tag beside the logo in the header while beta mode is on (`featureFlags().betaMode`). */
export const BETA_TAG = 'Beta';

export const PRICING_LINK: NavLink = { name: 'Pricing', href: '/pricing' };

/** Links to the other public pages. Pricing is listed only while the `plansPage` flag serves it. */
export function publicPageLinks(flags: Pick<FeatureFlags, 'plansPage'> = featureFlags()): NavLink[] {
  return [
    { name: 'Templates', href: '/templates' },
    ...(flags.plansPage ? [PRICING_LINK] : []),
    { name: 'Blog', href: '/blog' },
  ];
}

/** Shown in the header on every public page, and in the footer. */
export const PUBLIC_PAGE_LINKS: NavLink[] = publicPageLinks();

/** The same links with `href` marked as the current page. */
export function withCurrentPage(links: NavLink[], href: string): NavLink[] {
  return links.map((link) => (link.href === href ? { ...link, current: true } : link));
}

/** In-page anchors, shown before the page links on the homepage only. */
export const HOME_SECTION_LINKS: NavLink[] = [
  { name: 'Workflow', href: '#workflow' },
  { name: 'Benefits', href: '#benefits' },
  { name: "What's free", href: '#whats-free' },
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
