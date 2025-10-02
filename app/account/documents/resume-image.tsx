import { pdfUrlToImage } from "@hooks/use-pdf-image";
import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@lib/utils";
import { Loading } from "@components/views";
import { fetchPdfFile } from "@lib/clients/media.client";

interface ResumeImageProps {
  pdfUrl: string;
  className?: string;
}

export function ResumeImage({ pdfUrl, className }: ResumeImageProps) {
  const [image, setImage] = useState<string>();

  useEffect(() => {
    fetchPdfFile(pdfUrl).then(async (blob) => {
      const url = URL.createObjectURL(blob);
      const images = await pdfUrlToImage(url);
      setImage(images[0]);
    });
  }, [pdfUrl]);

  if (!image) return <Loading message="" />;

  return (
    <div className={cn("relative w-full h-full", className)}>
      <Image src={image} alt="Resume Render" fill className="object-contain" />
    </div>
  );
}
