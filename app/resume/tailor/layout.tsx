import { WithResumeHeader } from '../views/resume-public-header';

/** Tailor is not the editor, so it keeps the public header that `/resume` screens outside the editor use. */
export default function TailorLayout({ children }: { children: React.ReactNode }) {
  return <WithResumeHeader>{children}</WithResumeHeader>;
}
