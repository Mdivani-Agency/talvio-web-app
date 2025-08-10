'use client';
import { useState } from 'react';
import { SortableList } from '@components/views';
import { cn } from '@lib/utils';
import { Education } from '@lib/types';
import { Button, Collapsible } from '@components/ui';
import { Icon } from '@components/icons';
import { EducationForm } from './forms/education.form';

type EducationWithId = Education & { id: string };

interface EducationLabelProps {
  item: EducationWithId;
  isExpanded?: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const ExpandEducationLabel = ({ item, isExpanded, onToggle, onDelete }: EducationLabelProps) => {
  return (
    <div className={'flex items-center justify-between'}>
      <h3 className={'text-md font-semibold text-foreground'}>
        {isExpanded ? `Edit ${item.name}` : item.name}
      </h3>
      <div className={'flex items-center gap-2'}>
        <Button
          onClick={onToggle}
          className={cn('py-1 text-primary cursor-pointer hover:text-primary-300', isExpanded && 'scale-y-[-1]')}
          variant="ghost"
          size="icon"
        >
          <Icon type={isExpanded ? 'ChevronUp'  : 'Edit'} className={cn('size-4 transition-transform text-foreground/50', isExpanded && 'scale-y-[-1]')} />
        </Button>
        <Button onClick={onDelete} variant="ghost" size="icon">
          <Icon type="TrashBin" className="size-4 text-foreground/50" />
        </Button>
      </div>
    </div>
  );
};

type EducationListProps = {
  items: Array<EducationWithId>;
  onReorder: (items: Array<EducationWithId>) => void;
  handleUpdateEducation: (index: number, education: EducationWithId) => void;
  handleRemoveEducation: (index: number) => void;
};

export const EducationList = ({
  items,
  onReorder,
  handleUpdateEducation,
  handleRemoveEducation,
}: EducationListProps) => {
  const [expandedEducationId, setExpandedEducationId] = useState<string | null>(null);

  const onUpdateEducation = (index: number, education: EducationWithId) => {
    handleUpdateEducation(index, education);
    setExpandedEducationId(null);
  };

  return (
    <SortableList
      items={items}
      canDrag={!expandedEducationId}
      onReorder={onReorder}
      renderItem={({ item, index }) => (
        <Collapsible
          className={'bg-card w-full'}
          open={expandedEducationId === item.id}
          label={
            <ExpandEducationLabel
              item={item}
              isExpanded={expandedEducationId === item.id}
              onToggle={() => setExpandedEducationId(expandedEducationId === item.id ? null : item.id)}
              onDelete={() => handleRemoveEducation(index)}
            />
          }
          key={item.id}
        >
          <EducationForm
            className="mt-2"
            action="edit"
            onSubmit={(education) => onUpdateEducation(index, { ...item, ...education })}
            defaultValues={item}
          />
        </Collapsible>
      )}
    />
  );
};
