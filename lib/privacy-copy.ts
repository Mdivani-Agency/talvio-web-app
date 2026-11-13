import { featureFlags, type FeatureFlags } from './flags';
import {
  PRIVACY_LAST_MODIFIED,
  PRIVACY_LAST_UPDATED,
  PRIVACY_LLM_SERVICE_LAST_MODIFIED,
  PRIVACY_LLM_SERVICE_LAST_UPDATED,
  contactLink,
  operatorLink,
  p,
  strong,
  ul,
  type LegalDocument,
} from './legal-copy';

/** Privacy Policy, published as written in the Linear document attached to MDI-322. */
export const PRIVACY: LegalDocument = {
  title: 'Privacy Policy',
  lastUpdated: PRIVACY_LAST_UPDATED,
  sections: [
    {
      heading: '1. Who is responsible for your data',
      blocks: [
        p(
          'Talvio is operated by ',
          operatorLink(),
          ', a company based in Georgia. MDIO decides how and why your personal data is used. In this policy, "Talvio", "we" and "us" mean MDIO. You can reach us at ',
          contactLink(),
          '.',
        ),
      ],
    },
    {
      heading: '2. What we collect',
      blocks: [
        p(
          strong('Account details.'),
          ' Your email address. If you sign in with Google, we also receive the name, email address and profile picture Google shares with us.',
        ),
        p(
          strong('Profile and resume content.'),
          ' What you choose to add: your name, role, tagline, experience level, city and country, contact details and links, work experience, education, projects, recommendations, skills, tools and languages, and the resumes and drafts you build from them.',
        ),
        p(
          strong('Imported resumes.'),
          ' When you import a resume PDF, its text is read in your browser and sent to our servers to be turned into profile fields.',
        ),
        p(strong('Generated PDFs.'), ' We store each resume PDF you create so that you can download it again.'),
        p(
          strong('Usage records.'),
          ' How many resume PDFs you have created this month, and how often you use AI features.',
        ),
        p(
          strong('Usage statistics.'),
          ' The pages you visit on Talvio, your referrer, and your approximate country, browser and device type, recorded as anonymous page-view counts.',
        ),
        p(
          strong('Error and session reports.'),
          ' On our production website, when an error occurs we send Sentry the error details, the page address, your browser and device type, and your IP address. We also record a replay of some visits (about one in ten, and every visit in which an error occurs). The replay masks the text you type and the text shown on the page by default, but it captures how the page is laid out and how you click and scroll.',
        ),
        p(
          strong('Technical data.'),
          ' Your IP address, browser type and request logs, which our hosting providers record to run and protect the service.',
        ),
      ],
    },
    {
      heading: '3. Cookies and browser storage',
      blocks: [
        p(
          "We use cookies only to keep you signed in. Your browser's local storage holds unsaved drafts and your display theme on your own device. We do not use advertising cookies. We measure how the website is used with Vercel Web Analytics, which counts page views without cookies and without following you across other websites. Sentry's error reporting and session replay may use your browser's storage to link the events of one visit.",
        ),
      ],
    },
    {
      heading: '4. How we use your data',
      blocks: [
        ul(
          ['To create and run your account and sign you in.'],
          ['To store your profile, build your resumes and create your PDFs.'],
          ['To run AI features when you choose to use them.'],
          ['To apply the monthly and daily limits and prevent abuse.'],
          ['To fix problems, monitor errors and keep the service secure.'],
          ['To send emails needed to run your account, such as sign-in codes.'],
          ['To meet legal obligations.'],
        ),
        p('We do not sell your personal data, and we do not use it for advertising.'),
        p(
          'We process your data to provide the service you asked for, with your consent where we ask for it, and where we have a legitimate interest in keeping Talvio secure and working.',
        ),
      ],
    },
    {
      heading: '5. AI features',
      blocks: [
        p(
          'When you import a resume or answer the optional setup questions, the relevant text from your resume or profile is sent to our AI provider, OpenAI, to produce profile fields or suggested edits. This happens only when you use those features. You can build a resume without them.',
        ),
      ],
    },
    {
      heading: '6. Who we share data with',
      blocks: [
        p('We share personal data only with the providers that help us run Talvio:'),
        ul(
          [strong('Supabase:'), ' sign-in, database and storage of your profile and resumes.'],
          [strong('Vercel:'), ' website hosting and anonymous page-view statistics.'],
          [strong('Amazon Web Services:'), ' storage of generated PDF files and delivery of account emails.'],
          [strong('Sentry:'), ' error monitoring and session replay on our production website.'],
          [strong('OpenAI:'), ' AI features, when you use them.'],
          [strong('Google:'), ' sign-in, if you choose to sign in with it.'],
        ),
        p(
          'We may also disclose data when the law requires it, or to a successor if Talvio is transferred to another company, under the same protections.',
        ),
      ],
    },
    {
      heading: '7. Where your data is processed',
      blocks: [p('Our providers may process data outside Georgia, including in the United States and the European Union.')],
    },
    {
      heading: '8. How long we keep your data',
      blocks: [
        p(
          'We keep your account, profile, resumes and PDFs for as long as you have an account. When you ask us to delete your account, we delete them. Technical logs are kept for a shorter period by our hosting providers. Copies in backups are removed as those backups expire.',
        ),
      ],
    },
    {
      heading: '9. Your rights',
      blocks: [
        p('You can ask us to:'),
        ul(
          ['tell you what personal data we hold about you and give you a copy;'],
          ['correct data that is wrong;'],
          ['delete your account and your data;'],
          ['stop a use of your data that you object to, or withdraw a consent you gave.'],
        ),
        p(
          'Talvio does not yet have a self-service tool for these requests. Email ',
          contactLink(),
          ' and we will handle your request within the time the law requires. You also have the right to complain to the Personal Data Protection Service of Georgia or to the data protection authority in your own country.',
        ),
      ],
    },
    {
      heading: '10. Security',
      blocks: [
        p(
          'Your data is sent over encrypted connections, and each account can read only its own profile and resumes. Generated PDF files are stored at their own web addresses, and anyone who has an address can open that file, so share your PDF links with care. No online service can promise complete security, but we work to protect your data and will tell you if a breach affects you, as the law requires.',
        ),
      ],
    },
    {
      heading: '11. Children',
      blocks: [p('Talvio is not intended for anyone under 16, and we do not knowingly collect their data.')],
    },
    {
      heading: '12. Changes to this policy',
      blocks: [
        p(
          'We may update this policy. We will post the new version on this page and change the date at the top. If a change is significant, we will also tell you on the website or by email.',
        ),
      ],
    },
    {
      heading: '13. Contact',
      blocks: [p('Questions about this policy or your data: ', contactLink(), '.')],
    },
  ],
};

/*
 * The policy once AI runs on the Talvio LLM service (MDI-221), shown while NEXT_PUBLIC_FLAG_LLM_SERVICE
 * is on. OpenAI is no longer used then: documents are processed on our AWS servers, models run on
 * Amazon Bedrock in the United States, and AI content is deleted only by retention (7 days for
 * content, 30 days for job records), not when an account is removed. MDI-224 makes this the only
 * version when the OpenAI routes are removed.
 */
const LLM_SERVICE_SECTIONS: Record<string, LegalDocument['sections'][number]['blocks']> = {
  '5. AI features': [
    p(
      'When you import a resume, answer the optional questions, improve a resume or tailor one to a job post, the text needed for that task is sent to our own AI service, which runs on Amazon Web Services. Your profile or resume content, your answers and any job post you paste are processed there, and the AI models run through Amazon Bedrock in the United States. Amazon Web Services does not share this content with the companies that make the models or use it to train them.',
    ),
    p(
      'This happens only when you use those features, and AI suggestions apply only after you review them. You can build a resume without them.',
    ),
  ],
  '6. Who we share data with': [
    p('We share personal data only with the providers that help us run Talvio:'),
    ul(
      [strong('Supabase:'), ' sign-in, database and storage of your profile and resumes.'],
      [strong('Vercel:'), ' website hosting and anonymous page-view statistics.'],
      [
        strong('Amazon Web Services:'),
        ' storage of generated PDF files, delivery of account emails, and our AI service, including the AI models on Amazon Bedrock.',
      ],
      [strong('Sentry:'), ' error monitoring and session replay on our production website.'],
      [strong('Google:'), ' sign-in, if you choose to sign in with it.'],
    ),
    p(
      'We may also disclose data when the law requires it, or to a successor if Talvio is transferred to another company, under the same protections.',
    ),
  ],
  '7. Where your data is processed': [
    p(
      'Our providers may process data outside Georgia, including in the United States and the European Union. AI features are processed in the United States.',
    ),
  ],
  '8. How long we keep your data': [
    p(
      'We keep your account, profile, resumes and PDFs for as long as you have an account. When you ask us to delete your account, we delete them. Technical logs are kept for a shorter period by our hosting providers. Copies in backups are removed as those backups expire.',
    ),
    p(
      'What you send to the AI features is kept only as long as the task needs it and is then deleted automatically: uploaded files within 24 hours, and the text of your documents, answers, job posts and AI results within 7 days. Records of AI tasks without that text (for example when a task ran and how much of the daily limit it used) are deleted within 30 days. These copies are not deleted the moment you delete your account; they are removed on this schedule.',
    ),
  ],
};

export const PRIVACY_LLM_SERVICE: LegalDocument = {
  ...PRIVACY,
  lastUpdated: PRIVACY_LLM_SERVICE_LAST_UPDATED,
  sections: PRIVACY.sections.map((section) => ({
    ...section,
    blocks: LLM_SERVICE_SECTIONS[section.heading] ?? section.blocks,
  })),
};

/** The policy that matches how the running build processes AI requests. */
export function privacyPolicy(flags: Pick<FeatureFlags, 'llmService'> = featureFlags()): LegalDocument {
  return flags.llmService ? PRIVACY_LLM_SERVICE : PRIVACY;
}

/** Sitemap date of the policy `privacyPolicy` shows under the same flags. */
export function privacyLastModified(flags: Pick<FeatureFlags, 'llmService'> = featureFlags()): string {
  return flags.llmService ? PRIVACY_LLM_SERVICE_LAST_MODIFIED : PRIVACY_LAST_MODIFIED;
}
