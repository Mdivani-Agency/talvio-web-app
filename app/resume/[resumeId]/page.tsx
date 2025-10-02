import EditResumePage from "./edit-resume";

export default async function ResumePage({ params }: { params: Promise<{ resumeId: string }> }) {
  const { resumeId } = await params;

  return <EditResumePage resumeId={decodeURIComponent(resumeId)} />;
}
