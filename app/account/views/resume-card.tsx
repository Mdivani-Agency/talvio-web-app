import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Resume } from "@lib/types";
import { Icon } from "@components/icons";
import Link from "next/link";

export const ResumeCard = ({ resume }: { resume?: Resume }) => {

  if (!resume || !resume.media) {
    return (
      <Card className="gap-0">
        <CardHeader>
          <CardTitle className="flex flex-col gap-6">
            <Icon type="Document" className="size-8" />
            <span className="text-lg font-medium">My Resume</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href={resume ? `/resume/${resume.id}` : '/resume'}>
            <Icon type="Add" className="size-4" />
            Create Resume
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle className="flex flex-col gap-6">
          <Icon type="Document" className="size-8" />
          <span className="text-lg font-medium">My Resume</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-between">
        <a className="text-sm text-primary underline cursor-pointer" href={resume.media?.url} target="_blank" rel="noopener noreferrer">
          {resume.name}.{resume.media.url.split('.').pop()}
        </a>
        <Link href={`/resume/${resume.id}`}>
          <Icon type="Edit" className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
};
