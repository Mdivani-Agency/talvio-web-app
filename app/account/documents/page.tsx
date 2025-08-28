'use client';
import { Button, Card, CardContent, CardHeader, CardTitle } from "@components/ui";
import { getDocuments } from "@lib/clients/media.client";
import { useUserSession } from "@lib/providers";
import { useQuery } from "@tanstack/react-query";

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
      <h1 className="text-2xl font-bold">Documents</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {
        documents.map((document) => (
          <Card key={document.key}>
            <CardHeader>
              <CardTitle className="text-primary font-semibold text-md">{document.name}.{document.type.split('/')[1]}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a className="text-primary p-2 bg-secondary" href={document.publicUrl} target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              </Button>
            </CardContent>
          </Card>
        ))
      }
      </div>
    </section>
  );
};
