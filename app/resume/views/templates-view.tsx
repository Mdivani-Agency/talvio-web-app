import Image from "next/image";
import { TemplateKey, TemplateList } from "@lib/types";
import { Template } from "@pdf-tlv/resume";
import TemplatesSelector from "./templates";
import { useState } from "react";
import { Loading } from "@components/views";

type TemplatesViewProps = {
  selectedTemplate: TemplateKey;
  initialLevel: 'entry' | 'mid' | 'senior';
  templates?: TemplateList;
  onChange: (template: Template, key: TemplateKey) => void;
};

export default function TemplatesView({ selectedTemplate, initialLevel, templates, onChange }: TemplatesViewProps) {
  const [currentLevel, setCurrentLevel] = useState<'entry' | 'mid' | 'senior'>(initialLevel);

  if (!templates) {
    return <Loading message="Loading resume templates..." />;
  }

  return (
    <TemplatesSelector level={currentLevel} templatesContainerClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-4" onChangeLevel={setCurrentLevel}>
      {templates[currentLevel].map(({ template, name, imageUrl, key }) => (
        <div key={`${currentLevel} ${selectedTemplate}`} className={'w-full mx-2'} onClick={() => onChange(template, key)}>
          <div
            className={`relative w-full aspect-[210/297] shadow-md ${
              selectedTemplate === key ? 'border-2 border-blue-500' : ''
            }`}
          >
            <Image src={imageUrl} fill alt={`${currentLevel} ${name}`} />
          </div>
        </div>
      ))}
    </TemplatesSelector>
  );
}
