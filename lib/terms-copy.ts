import { LEGAL_LAST_UPDATED, contactLink, operatorLink, p, ul, type LegalDocument } from './legal-copy';

/** Terms of Service, published as written in the Linear document attached to MDI-322. */
export const TERMS: LegalDocument = {
  title: 'Terms of Service',
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      heading: '1. Who we are',
      blocks: [
        p(
          'Talvio is operated by ',
          operatorLink(),
          ', a company based in Georgia. In these terms, "Talvio", "we" and "us" mean MDIO. These terms are an agreement between you and MDIO. You can reach us at ',
          contactLink(),
          '.',
        ),
      ],
    },
    {
      heading: '2. Agreeing to these terms',
      blocks: [
        p(
          'By creating an account or using Talvio, you agree to these terms. If you do not agree, do not use Talvio. You must be at least 16 years old to use Talvio.',
        ),
      ],
    },
    {
      heading: '3. Your account',
      blocks: [
        p(
          'You sign in with an email code, Google or LinkedIn. Keep access to your email and sign-in provider secure, because anyone who can use them can open your account. You are responsible for what happens in your account. Each person may have one account. Tell us at once if you think someone else has used yours.',
        ),
      ],
    },
    {
      heading: '4. What Talvio does',
      blocks: [
        p(
          'Talvio lets you keep your career details in a profile, build resumes from templates and download them as PDF files. Talvio is in beta. Features may change, and the service may contain errors or be unavailable at times.',
        ),
      ],
    },
    {
      heading: '5. Free use and the monthly limit',
      blocks: [
        p('Talvio is free to use. No payment card is needed.'),
        ul(
          ['Each account can create 3 new resume PDFs in each calendar month.'],
          ['The count resets on the first day of each month at 00:00 UTC. Unused PDFs do not carry over.'],
          ['Editing, previewing and downloading a PDF you already created do not count. A failed attempt does not count.'],
        ),
        p(
          'This free allowance is permanent. For as long as Talvio operates, we will not charge for it and we will not reduce it.',
        ),
        p('We may limit or close accounts that are created to get around the monthly limit.'),
      ],
    },
    {
      heading: '6. Your content',
      blocks: [
        p(
          'You own the information you add to Talvio and the resumes you create. You may use your resume PDFs for any lawful purpose.',
        ),
        p(
          'You give us permission to store, process and display your content only as needed to provide Talvio to you. This includes sending text to our AI provider when you choose to use an AI feature.',
        ),
        p(
          'You are responsible for your content. Make sure it is accurate and that you have the right to include it, especially where it names or quotes other people.',
        ),
      ],
    },
    {
      heading: '7. AI assistance',
      blocks: [
        p(
          'Some optional features use AI, such as turning an imported resume into profile fields and asking questions that suggest edits. AI output can be wrong or incomplete. Review every suggestion before you keep it. You decide what goes into your resume.',
        ),
        p('We may limit how often AI features can be used each day.'),
      ],
    },
    {
      heading: '8. No guarantee of results',
      blocks: [
        p(
          "Talvio helps you produce a resume. We do not guarantee that a resume will lead to an interview or a job, or that it will be read correctly by any employer's software, including applicant tracking systems.",
        ),
      ],
    },
    {
      heading: '9. Acceptable use',
      blocks: [
        p('You agree not to:'),
        ul(
          ['use Talvio for anything unlawful or to impersonate another person;'],
          ["add other people's personal information without their permission;"],
          ['try to get around the monthly limit, daily limits or security controls;'],
          ['copy, scrape or overload the service with automated tools;'],
          ['resell Talvio or offer it to others as your own service.'],
        ),
      ],
    },
    {
      heading: '10. Our content',
      blocks: [
        p(
          'The Talvio website, templates and software belong to MDIO or its licensors. We give you a personal, non-transferable right to use them to create your own resumes. This does not give you ownership of the templates or the software.',
        ),
      ],
    },
    {
      heading: '11. Changes and availability',
      blocks: [
        p(
          'We may add, change or remove features, especially during beta, and we may pause the service for maintenance. If we ever decide to close Talvio, we will give reasonable notice on the website or by email where we can, so that you can download your PDFs.',
        ),
      ],
    },
    {
      heading: '12. Ending your use',
      blocks: [
        p(
          'You can stop using Talvio at any time. To close your account, email ',
          contactLink(),
          '. We may suspend or close an account that breaks these terms.',
        ),
      ],
    },
    {
      heading: '13. Disclaimer',
      blocks: [
        p(
          'To the extent the law allows, Talvio is provided "as is" and "as available", without warranties of any kind, whether express or implied.',
        ),
      ],
    },
    {
      heading: '14. Limits on our liability',
      blocks: [
        p(
          'To the extent the law allows, MDIO is not liable for indirect or consequential loss, lost data, or a lost job opportunity arising from your use of Talvio. Nothing in these terms limits liability that cannot be limited by law.',
        ),
      ],
    },
    {
      heading: '15. Privacy',
      blocks: [
        p('Our ', { text: 'Privacy Policy', href: '/privacy-policy' }, ' explains what personal data we collect and how we use it.'),
      ],
    },
    {
      heading: '16. Changes to these terms',
      blocks: [
        p(
          'We may update these terms. We will post the new version on this page and change the date at the top. If a change is significant, we will also tell you on the website or by email. If you keep using Talvio after a change, you accept the updated terms. An update will not remove or reduce the free allowance described in section 5.',
        ),
      ],
    },
    {
      heading: '17. Governing law',
      blocks: [
        p(
          'These terms are governed by the laws of Georgia, the country. The courts of Georgia have jurisdiction over any dispute. If you are a consumer, this does not take away rights that the law of your own country gives you and that cannot be waived.',
        ),
      ],
    },
    {
      heading: '18. Contact',
      blocks: [p('Questions about these terms: ', contactLink(), '.')],
    },
  ],
};
