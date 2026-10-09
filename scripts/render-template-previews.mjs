// Renders every template key with the real @pdf-tlv/resume engine and
// rasterises page 1 to PNG for the template picker (public/templates/<key>.png).
// Uses macOS Quick Look (qlmanage) for the PDF to PNG step. Run from the repo root:
//   yarn templates:previews
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, renameSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const require = createRequire(resolve(process.cwd(), 'package.json'));
const { ResumePDFService, formatUrl } = require('@pdf-tlv/resume');
const { ember, mint, talvio } = require('@pdf-tlv/resume/dist/templates');
const { PDFDocument } = createRequire(require.resolve('@pdf-tlv/resume/package.json'))('pdf-lib');

const COLORS = { mint: '#015408', ember: '#670000', talvio: '#005BA2', grayLight: '#7A7A7A' };
// Type scales to try, largest first. Each preview uses the largest scale that
// still fits on one page, so short sample resumes fill the page with bigger type.
const TYPE_CANDIDATES = [
  { fontSize: 'xl', leading: 'lg' },
  { fontSize: 'xl', leading: 'md' },
  { fontSize: 'xl', leading: 'sm' },
  { fontSize: 'lg', leading: 'lg' },
  { fontSize: 'lg', leading: 'md' },
  { fontSize: 'lg', leading: 'sm' },
  { fontSize: 'md', leading: 'lg' },
  { fontSize: 'md', leading: 'md' },
  { fontSize: 'md', leading: 'sm' },
  { fontSize: 'sm', leading: 'md' },
];
const STYLES = [
  { suffix: 'modern', template: ember, color: COLORS.grayLight },
  { suffix: 'ember', template: ember, color: COLORS.ember },
  { suffix: 'mint', template: mint, color: COLORS.mint },
  { suffix: 'talvio', template: talvio, color: COLORS.talvio },
];

const p = (text) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const bullets = (items) => ({
  type: 'doc',
  content: [{ type: 'bulletList', content: items.map((text) => ({ type: 'listItem', content: [p(text)] })) }],
});
const para = (text) => ({ type: 'doc', content: [p(text)] });

const exp = (company, employmentType, jobTitle, dateRange, items) => ({
  company,
  employmentType,
  companyWithEmploymentType: `${company} • ${employmentType}`,
  jobTitle,
  dateRange,
  description: bullets(items),
  kind: 'experience',
});
const edu = (school, degree, dateRange, text) => ({
  school,
  degree,
  dateRange,
  // Narrow sidebars (Talvio) use the short form: years only.
  dateRangeShort: dateRange.replace(/[A-Za-z]{3} /g, ''),
  description: text ? para(text) : undefined,
  kind: 'education',
});
const project = (projectName, url, text) => ({
  projectName,
  url,
  formattedUrl: formatUrl(url),
  description: para(text),
  kind: 'project',
});
const link = (url, icon) => ({ url: formatUrl(url), icon });
const rec = (recommendeeName, url, text) => ({
  recommendeeName,
  url,
  formattedUrl: formatUrl(url),
  description: para(text),
  kind: 'recommendation',
});

const base = {
  email: 'maya@lindqvist.dev',
  phone: '+44 20 7946 0958',
  location: 'London, United Kingdom',
  primaryProfile: formatUrl('https://linkedin.com/in/mayalq'),
  links: [link('https://github.com/mayalq', 'link')],
  languages: ['English - Native', 'Swedish - Fluent', 'German - Intermediate'],
};

const DATA = {
  entry: {
    ...base,
    name: 'Maya Lindqvist',
    role: 'Junior Frontend Developer',
    description:
      'Recent computer science graduate who builds accessible web interfaces in React and TypeScript. Shipped two production features during a six-month internship and contributes to open-source component libraries.',
    skills: ['TypeScript', 'React', 'HTML & CSS', 'Accessibility', 'Testing Library', 'Git'],
    tools: ['VS Code', 'Figma', 'GitHub Actions', 'Storybook'],
    experience: [
      exp('Brightline Studio', 'Internship', 'Frontend Developer Intern', 'Jan 2026 - Jun 2026', [
        'Built the onboarding checklist used by 4,000 monthly sign-ups, with keyboard navigation and screen-reader labels.',
        'Reduced bundle size by 18% by replacing a date library and lazy-loading the settings page.',
        'Wrote component tests that caught three regressions before release.',
        'Presented the checklist redesign to the product team and shipped two follow-up improvements from their feedback.',
      ]),
      exp('University Web Society', 'Volunteer', 'Web Lead', 'Sep 2024 - Dec 2025', [
        'Ran weekly workshops on React fundamentals for 30 members.',
        'Rebuilt the society site with a static generator, cutting hosting costs to zero.',
        'Organised a 48-hour hackathon with 60 participants and three sponsor companies.',
      ]),
    ],
    education: [
      edu('University of Edinburgh', 'BSc Computer Science, First Class', 'Sep 2022 - Jun 2026', 'Dissertation on measuring interface accessibility with automated audits.'),
      edu('freeCodeCamp', 'Responsive Web Design Certification', 'Jan 2023 - Mar 2023'),
    ],
    projects: [
      project('Pocket Budget', 'https://github.com/mayalq/pocket-budget', 'Offline-first budgeting app with sync; 1,200 downloads.'),
      project('A11y Lint', 'https://github.com/mayalq/a11y-lint', 'ESLint rules that flag missing labels and colour contrast issues.'),
      project('Study Buddy', 'https://studybuddy.lindqvist.dev', 'Flashcard web app with spaced repetition, built with Next.js and used by 150 students.'),
    ],
    recommendations: [
      rec('Priya Shah, Engineering Manager at Brightline Studio', 'https://linkedin.com/in/priyashah', 'Maya shipped production features in her first month and raised accessibility questions before anyone else on the team did.'),
    ],
  },
  mid: {
    ...base,
    name: 'Maya Lindqvist',
    role: 'Software Engineer',
    description:
      'Full-stack engineer with five years building and running customer-facing products in TypeScript, Node.js and Postgres. Owns features end to end, from discovery with product to monitoring in production.',
    skills: ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'GraphQL', 'AWS', 'System design', 'Mentoring'],
    tools: ['Next.js', 'Terraform', 'Docker', 'Datadog', 'Playwright', 'Figma'],
    experience: [
      exp('Northwind Health', 'Full-time', 'Software Engineer', 'Mar 2023 - Present', [
        'Lead developer on the appointment booking service handling 60,000 bookings a month across three clinics.',
        'Cut p95 API latency from 1.4s to 380ms by adding read replicas and query-level caching.',
        'Introduced contract tests between the web app and the scheduling API, removing a weekly class of release bugs.',
        'Mentor two junior engineers and run the team\'s design review.',
        'Ran the on-call rota and wrote the incident playbook that cut mean time to recovery by 40%.',
      ]),
      exp('Brightline Studio', 'Full-time', 'Frontend Developer', 'Jul 2021 - Feb 2023', [
        'Shipped the self-serve billing flow that moved 70% of invoices off manual processing.',
        'Built the shared component library used by four product teams.',
        'Raised Lighthouse accessibility scores from 61 to 97 across the marketing site.',
        'Paired with design on the component API; adopted by every product team within a quarter.',
      ]),
      exp('Brightline Studio', 'Internship', 'Frontend Developer Intern', 'Jan 2021 - Jun 2021', [
        'Built the onboarding checklist with keyboard navigation and screen-reader labels.',
        'Reduced bundle size by 18% by replacing a date library and lazy-loading the settings page.',
      ]),
    ],
    education: [edu('University of Edinburgh', 'BSc Computer Science, First Class', 'Sep 2017 - Jun 2021')],
    projects: [
      project('A11y Lint', 'https://github.com/mayalq/a11y-lint', 'ESLint rules for missing labels and contrast issues; 900 weekly installs.'),
      project('Pocket Budget', 'https://github.com/mayalq/pocket-budget', 'Offline-first budgeting app with sync; 1,200 downloads.'),
    ],
    recommendations: [
      rec('Tom Okafor, Head of Engineering at Northwind Health', 'https://linkedin.com/in/tomokafor', 'Maya owns problems end to end and leaves every system better documented than she found it.'),
    ],
  },
  senior: {
    ...base,
    name: 'Maya Lindqvist',
    role: 'Staff Software Engineer',
    description:
      'Staff engineer with twelve years of experience leading platform and product teams. Sets technical direction across multiple squads, has run two zero-downtime migrations of core systems, and has grown engineers into senior and lead roles.',
    skills: ['Distributed systems', 'TypeScript', 'Go', 'PostgreSQL', 'Kafka', 'AWS', 'Technical strategy', 'Hiring', 'Mentoring', 'Incident management'],
    tools: ['Kubernetes', 'Terraform', 'Datadog', 'GitHub', 'Figma', 'Linear'],
    experience: [
      exp('Northwind Health', 'Full-time', 'Staff Software Engineer', 'Jan 2024 - Present', [
        'Own the technical roadmap for the patient platform used by 1.2 million patients across 40 clinics.',
        'Led the migration from a monolith to six services with zero downtime over nine months, then retired the legacy database.',
        'Designed the event pipeline that cut data-latency for clinical dashboards from hours to under a minute.',
        'Established the engineering ladder and interview loop; hired 14 engineers in 18 months.',
      ]),
      exp('Northwind Health', 'Full-time', 'Engineering Lead, Scheduling', 'Mar 2020 - Dec 2023', [
        'Managed a team of seven building the appointment booking service, 60,000 bookings a month.',
        'Cut p95 API latency from 1.4s to 380ms and reduced incident volume by half with SLO-driven alerting.',
        'Introduced contract testing across four teams, removing a weekly class of release bugs.',
      ]),
      exp('Brightline Studio', 'Full-time', 'Senior Frontend Developer', 'Jul 2016 - Feb 2020', [
        'Shipped the self-serve billing flow that moved 70% of invoices off manual processing.',
        'Built the design system used by four product teams and 30 engineers.',
        'Introduced trunk-based development and feature flags; deploys went from weekly to daily.',
        'Raised Lighthouse accessibility scores from 61 to 97 across the marketing site.',
      ]),
      exp('Fjord Analytics', 'Full-time', 'Software Engineer', 'Sep 2013 - Jun 2016', [
        'Built real-time reporting for 200 enterprise customers in Node.js and Postgres.',
        'Led the migration from MySQL to Postgres with no customer-visible downtime.',
      ]),
    ],
    education: [edu('University of Edinburgh', 'BSc Computer Science, First Class', 'Sep 2009 - Jun 2013')],
    projects: [
      project('A11y Lint', 'https://github.com/mayalq/a11y-lint', 'Open-source ESLint rules for accessibility; 900 weekly installs.'),
      project('Pocket Budget', 'https://github.com/mayalq/pocket-budget', 'Offline-first budgeting app with sync; 1,200 downloads.'),
    ],
    recommendations: [
      rec('Dr Elena Marsh, CTO at Northwind Health', 'https://linkedin.com/in/elenamarsh', 'Maya turned a fragile monolith into a platform the whole company builds on, and did it while raising the bar for every engineer around her.'),
      rec('Tom Okafor, Head of Engineering at Northwind Health', 'https://linkedin.com/in/tomokafor', 'Maya owns problems end to end and leaves every system better documented than she found it.'),
    ],
  },
};

const outDir = resolve(process.argv[2] ?? 'public/templates');
const tmp = join(outDir, '.render-tmp');
mkdirSync(tmp, { recursive: true });

async function render(level, style, type) {
  const service = new ResumePDFService();
  await service.create({ color: style.color, fontSize: type.fontSize, leading: type.leading, isPreview: false });
  const bytes = await service.generate({
    data: DATA[level],
    template: style.template,
    options: { color: style.color, fontSize: type.fontSize, leading: type.leading, isPreview: false },
  });
  const pages = (await PDFDocument.load(bytes)).getPageCount();
  return { bytes, pages };
}

for (const level of ['entry', 'mid', 'senior']) {
  for (const style of STYLES) {
    const key = `${level}-level-${style.suffix}`;
    let chosen = null;
    for (const type of TYPE_CANDIDATES) {
      const result = await render(level, style, type);
      if (result.pages === 1) {
        chosen = { type, bytes: result.bytes };
        break;
      }
    }
    if (!chosen) throw new Error(`${key} does not fit on one page at any type scale; trim the sample data`);
    const pdfPath = join(tmp, `${key}.pdf`);
    writeFileSync(pdfPath, Buffer.from(chosen.bytes));
    execFileSync('qlmanage', ['-t', '-s', '1000', '-o', tmp, pdfPath], { stdio: 'ignore' });
    const thumb = join(tmp, `${key}.pdf.png`);
    if (!existsSync(thumb)) throw new Error(`No thumbnail for ${key}`);
    renameSync(thumb, join(outDir, `${key}.png`));
    console.log('rendered', key, `(${chosen.type.fontSize}/${chosen.type.leading})`);
  }
}
rmSync(tmp, { recursive: true, force: true });
