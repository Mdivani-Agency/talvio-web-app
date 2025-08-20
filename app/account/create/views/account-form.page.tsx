'use client';
import { Button } from "@components/ui";
import { AccountForm } from "./account.form";
import { useState } from "react";
import { UploadModal } from "@components/modals";
import { useResumeParser } from "@hooks/use-resume-parser";
import { transformFromParsedToAccount } from "@lib/utils/forms";
import { toast } from "sonner";
import { Loading } from "@components/views";
import { UploadIcon } from "lucide-react";
import { useAccountContext } from "../../providers/state-provider";

export default function AccountFormPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { send } = useAccountContext();

  const { parseResumeText, loading } = useResumeParser({
    onResumeParsed: (parsedResume) => {
      const transformed = transformFromParsedToAccount(parsedResume);
      send({ type: 'SET_PARTIAL_DTO', value: transformed });
    },
    onTextExtracted: (text) => {
      send({ type: 'SET_RESUME_TEXT', value: text });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileUpload = (file: File) => {
    parseResumeText(file);
  };

  if (loading) {
    return <Loading message="Parsing resume..." />;
  }

  return (
    <section className="container flex flex-col gap-4 mx-auto">
      <h1 className="text-2xl font-bold mt-8">Let&apos;s Build Your Profile!</h1>
      <p className="text-sm font-medium text-muted-foreground">
        Please fill out your details as thoroughly as possible. The more information you provide, the more tailored
        and professional your resume will be. Don&apos;t worry about perfect wording or grammar—our AI will
        automatically review and polish the formatting at the end. Focus on sharing your key achievements, skills, and
        experience to make your profile stand out!
      </p>
      <div className="flex justify-start">
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <UploadIcon className="size-4" />
          Import from resume
        </Button>
      </div>
      <AccountForm onSubmit={(data) => send({ type: 'SET_ACCOUNT_DTO', value: data })} />
      <UploadModal
        title="Upload Resume"
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileUpload={handleFileUpload}
      />
    </section>
  );
}
