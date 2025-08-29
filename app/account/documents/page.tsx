'use client';
import { Icon } from "@components/icons";
import { Button, Card, CardContent, CardFooter, Label } from "@components/ui";
import { getDocuments } from "@lib/clients/media.client";
import { useUserSession } from "@lib/providers";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { ResumeImage } from "./resume-image";

export default function DocumentsPage() {
  const { session } = useUserSession();

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', session?.user?.id],
    queryFn: async () => {
      if (session?.user?.id) {
        const { items } = await getDocuments(session.user.id);
        return items;
      }
      return [];
    },
    enabled: !!session?.user?.id,
  });

  return (
    <section className="flex flex-col gap-8 p-4">
      <h1 className="text-xl font-bold">Your Resumes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {
        documents.length === 0 && (
          <Card className="w-56 px-4">
            <CardContent className="h-48 bg-background flex justify-center items-center rounded-md">
              <Button className="rounded-full size-10">
                <PlusIcon className="w-4 h-4" />
              </Button>
            </CardContent>
            <CardFooter className="px-0">
              <Label variant="muted" size="sm">
                Create resume
              </Label>
            </CardFooter>
          </Card>
        )
      }
      {
        documents.map((document) => (
          <Card className="w-56 px-4" key={document.key}>
            <CardContent className="h-48 bg-background flex flex-col gap-2 justify-center items-center rounded-md">
              <ResumeImage pdfUrl={document.publicUrl} className="w-full h-full" />
            </CardContent>
            <CardFooter className="flex justify-center justify-between px-0">
              <Label variant="muted" size="sm" asChild>
                <a className="text-primary p-2" href={document.publicUrl} target="_blank" rel="noopener noreferrer">
                  {document.name}.{document.type.split('/')[1]}
                </a>
              </Label>
              <Link href={`/resume/${document.key}`}>
                <Icon type={'Edit'} className="size-4" />
              </Link>
            </CardFooter>
          </Card>
        ))
      }
      </div>
    </section>
  );
};
