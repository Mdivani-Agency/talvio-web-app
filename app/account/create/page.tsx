import { AccountForm } from "./views/account.form";

export default function CreateAccountPage() {
  return (
    <section className="container flex flex-col gap-4 mx-auto">
      <h1 className="text-2xl font-bold mt-8">Let&apos;s Build Your Resume!</h1>
      <p className="text-sm font-medium text-muted-foreground">
        Please fill out your details as thoroughly as possible. The more information you provide, the more tailored
        and professional your resume will be. Don&apos;t worry about perfect wording or grammar—our AI will
        automatically review and polish the formatting at the end. Focus on sharing your key achievements, skills, and
        experience to make your profile stand out!
      </p>
      <AccountForm />
    </section>
  );
}
