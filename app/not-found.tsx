import { PublicShell, StatusView } from '@components/views';
import { PRIVATE_ROBOTS } from '@/lib/public-metadata';
import {
  GO_HOME_LABEL,
  HOME_HREF,
  NOT_FOUND_BODY,
  NOT_FOUND_CODE,
  NOT_FOUND_LINKS,
  NOT_FOUND_LINKS_INTRO,
  NOT_FOUND_LINKS_LABEL,
  NOT_FOUND_TEMPLATES_HREF,
  NOT_FOUND_TEMPLATES_LABEL,
  NOT_FOUND_TITLE,
} from '@/lib/status-copy';

export const metadata = { robots: PRIVATE_ROBOTS };

/** Every unknown URL: the public header and footer around the shared status layout. Next answers with 404. */
export default function NotFound() {
  return (
    <PublicShell>
      <StatusView
        as="main"
        code={NOT_FOUND_CODE}
        title={NOT_FOUND_TITLE}
        body={NOT_FOUND_BODY}
        primary={{ label: GO_HOME_LABEL, href: HOME_HREF }}
        secondary={{ label: NOT_FOUND_TEMPLATES_LABEL, href: NOT_FOUND_TEMPLATES_HREF }}
        links={{ label: NOT_FOUND_LINKS_LABEL, intro: NOT_FOUND_LINKS_INTRO, items: NOT_FOUND_LINKS }}
      />
    </PublicShell>
  );
}
