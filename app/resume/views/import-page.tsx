import { UploadFile } from "@components/ui";
import { useResumeParser } from "@hooks/use-resume-parser";
import { profileToResumeDocument } from "@lib/models/resume-document";
import { transformFromParsedToAccount } from "@lib/utils";
import { useResumeContext } from "../providers/state-provider";
import { toast } from "sonner";
import { Loading } from "@components/views";
import Image from "next/image";
import { useUserSession } from "@lib/providers";
import { redirect, useSearchParams } from "next/navigation";
import { signInHref } from "@lib/auth/sign-in-href";

export default function ImportResumePage() {
  const { session, isPending: isAuthenticating } = useUserSession();
  const { send, state } = useResumeContext();
  const { resumeDto } = state.context;
  const searchParams = useSearchParams();

  const { parseResumeText, loading } = useResumeParser({
    onResumeParsed: (parsedResume) => {
      const transformed = transformFromParsedToAccount(parsedResume);
      const resume = profileToResumeDocument(transformed);
      const name = `${transformed.profile.firstName} ${transformed.profile.lastName}`.trim() || 'my resume';

      send({ type: 'UPLOAD_RESUME', value: {
        resume,
        name,
        template: resumeDto.template,
        color: resumeDto.color,
        fontSize: resumeDto.fontSize,
      } });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isAuthenticating) {
    return <Loading message="Authenticating..." />;
  }

  if (!session) {
    const template = searchParams.get('template');
    return redirect(signInHref(template ? `/resume?template=${encodeURIComponent(template)}` : '/resume'));
  }

  return (
    <section className="grid grid-cols-5 h-screen">
      <div className="relative h-full col-span-3 p-16">
        {loading ? <Loading className="absolute top-0 left-0 w-full h-full" message="Parsing resume..." /> : (
        <div className="flex flex-col items-center justify-center gap-8 h-full max-w-screen-lg mx-auto">
          <div className="flex flex-col gap-4 text-center">
            <h1 className="text-xl font-bold">Upload your resume</h1>
            <p className="text-md text-muted-foreground">
              Once you upload your resume, our AI will review it and generate tailored questions to help you improve your answers and make your resume stronger
            </p>
          </div>
          <UploadFile onFileUpload={parseResumeText} status="idle" />
        </div>
        )}
      </div>
      <div className="h-full flex items-center justify-center col-span-2">
        <figure className={'relative w-full h-full'}>
          <Image
            className="overflow-x-visible object-cover"
            alt={'Robo handing resume'}
            src={'/robo-hand.png'}
            placeholder={'blur'}
            blurDataURL={'/robo-hand-blur.png'}
            priority={false}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            fill
          />
        </figure>
      </div>
    </section>
  );
}
