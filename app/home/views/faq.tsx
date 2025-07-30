import Image from 'next/image';
import { DetailsList } from '@components/ui';

const faqs = [
  {
    question: 'What is Talvio?',
    answer:
      'Talvio is a platform that allows you to create and manage ATS friendly resumes, track your job applications, and get feedback on your resume.',
  },
  {
    question: 'How do I create a resume?',
    answer: 'You can create a resume by signing up for a free account and following the steps to create a resume.',
  },
  {
    question: 'Is it really free?',
    answer:
      'Yes, you receive free credits on signup to create and download your first resume in PDF format. No credit card required.',
  },
  {
    question: 'What if free credits are not enough?',
    answer:
      'You can purchase more credits to create more resumes. Credits are available in packages of 300, 1000, and 10000 and have no expiration date.',
  },
  {
    question: 'Will I get a refund if my subscription is cancelled?',
    answer:
      'No, we do not have subscriptions at all, so no surprise charges with us. Just pay for what you use for and in case you have left over credits you can come back to use them any time in the future. Credits never expire.',
  },
  {
    question: 'Is my data safe?',
    answer:
      'Yes, We are GDPR compliant and do not sell your data to third parties, utilise high security measures to protect your data and have a zero tolerance policy for any data breaches.',
  },
  {
    question: 'What if I want to delete my account?',
    answer:
      'You can delete your account at any time by going to the account settings page and clicking the "Delete Account" button. All associated data will be deleted from our servers and cannot be recovered.',
  },
  {
    question: 'How do I get support?',
    answer: 'You can contact us via email at contact@talvio.co or via our social media channels.',
  },
];

export const Faq = () => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full">
      <div className="relative hidden w-full aspect-[1.42] lg:mt-12 2xl:mt-16 lg:block">
        <Image src="/faq.png" placeholder={'blur'} blurDataURL={'/faq.png'} alt="FAQ" fill />
      </div>
      <article className="w-full">
        <DetailsList qa={faqs} />
      </article>
    </section>
  );
};
