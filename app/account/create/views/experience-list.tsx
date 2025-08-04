'use client';
import { useState } from 'react';
import { SortableList } from '@components/views';
import { cn } from '@lib/utils';
import { Experience } from '@lib/types';
import { ExperienceForm } from './forms/experience.form';
import { Button, Collapsible } from '@components/ui';
import { Icon } from '@components/icons';

type ExperienceWithId = Experience & { id: string };

interface ExperienceLabelProps {
  item: Experience;
  isExpanded?: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const ExpandExperienceLabel = ({ item, isExpanded, onToggle, onDelete }: ExperienceLabelProps) => {
  return (
    <div className={'flex items-center justify-between'}>
      <h3 className={'text-md font-semibold text-foreground'}>
        {isExpanded ? `Edit ${item.company}` : item.company}
      </h3>
      <div className={'flex items-center gap-2'}>
        <Button
          onClick={onToggle}
          className={cn('py-1 text-primary cursor-pointer hover:text-primary-300', isExpanded && 'scale-y-[-1]')}
          variant="ghost"
          size="icon"
        >
          <Icon type="ChevronDown" className={cn('size-6 transition-transform text-foreground/50', isExpanded && 'scale-y-[-1]')} />
        </Button>
        <Button onClick={onDelete} variant="ghost" size="icon">
          <Icon type="TrashBin" className="size-4 text-foreground/50" />
        </Button>
      </div>
    </div>
  );
};

type ExperienceListProps = {
  items: Array<ExperienceWithId>;
  onReorder: (items: Array<ExperienceWithId>) => void;
  handleUpdateExperience: (index: number, experience: ExperienceWithId) => void;
  handleRemoveExperience: (index: number) => void;
};

export const ExperienceList = ({
  items,
  onReorder,
  handleUpdateExperience,
  handleRemoveExperience,
}: ExperienceListProps) => {
  const [expandedExperienceId, setExpandedExperienceId] = useState<string | null>(null);

  const onUpdateExperience = (index: number, experience: ExperienceWithId) => {
    handleUpdateExperience(index, experience);
    setExpandedExperienceId(null);
  };

  return (
    <SortableList
      items={items}
      canDrag={!expandedExperienceId}
      onReorder={onReorder}
      renderItem={({ item, index }) => (
        <Collapsible
          className={'bg-card w-full'}
          open={expandedExperienceId === item.id}
          label={
            <ExpandExperienceLabel
              item={item}
              isExpanded={expandedExperienceId === item.id}
              onToggle={() => setExpandedExperienceId(expandedExperienceId === item.id ? null : item.id)}
              onDelete={() => handleRemoveExperience(index)}
            />
          }
          key={item.id}
        >
          <ExperienceForm
            className="mt-2"
            action="edit"
            onSubmit={(experience) => onUpdateExperience(index, { ...item, ...experience })}
            onCancel={() => setExpandedExperienceId(null)}
            defaultValues={item}
          />
        </Collapsible>
      )}
    />
  );
};
