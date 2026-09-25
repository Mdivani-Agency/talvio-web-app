'use client';
import { useState } from 'react';
import { SortableList } from '@components/views';
import { cn } from '@lib/utils';
import { Button, Collapsible } from '@components/ui';
import { Icon } from '@components/icons';

type FormWithId<T> = T & { id: string };

interface FormLabelProps {
  name: string;
  isExpanded?: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const ExpandFormLabel = ({ name, isExpanded, onToggle, onDelete }: FormLabelProps) => {
  return (
    <div className={'flex items-center justify-between'}>
      <h3 className={'text-md font-semibold text-foreground'}>
        {isExpanded ? `Edit ${name}` : name}
      </h3>
      <div className={'flex items-center gap-2'}>
        <Button
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          className={cn('py-1 text-primary cursor-pointer hover:text-primary-300', isExpanded && 'scale-y-[-1]')}
          variant="ghost"
          size="icon"
        >
          <Icon type={isExpanded ? 'ChevronUp'  : 'Edit'} className={cn('size-4 transition-transform text-foreground/50', isExpanded && 'scale-y-[-1]')} />
        </Button>
        <Button
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          variant="ghost"
          size="icon"
        >
          <Icon type="TrashBin" className="size-4 text-foreground/50" />
        </Button>
      </div>
    </div>
  );
};

type FormListProps<T> = {
  items: Array<FormWithId<T>>;
  labelKey: keyof T;
  renderForm: (form: T, onSubmit: (form: T) => void) => React.ReactNode;
  onReorder: (items: Array<FormWithId<T>>) => void;
  handleUpdateForm: (index: number, form: FormWithId<T>) => void;
  handleRemoveForm: (index: number) => void;
};

export const FormList = <T,>({
  items,
  labelKey,
  renderForm,
  onReorder,
  handleUpdateForm,
  handleRemoveForm,
}: FormListProps<T>) => {
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);

  const onUpdateForm = (index: number, form: FormWithId<T>) => {
    handleUpdateForm(index, form);
    setExpandedFormId(null);
  };

  return (
    <SortableList
      items={items}
      canDrag={!expandedFormId}
      onReorder={onReorder}
      renderItem={({ item, index }) => (
        <Collapsible
          className={'bg-card w-full'}
          open={expandedFormId === item.id}
          label={
            <ExpandFormLabel
              name={item[labelKey] as string}
              isExpanded={expandedFormId === item.id}
              onToggle={() => setExpandedFormId(expandedFormId === item.id ? null : item.id)}
              onDelete={() => handleRemoveForm(index)}
            />
          }
          key={item.id}
        >
          {renderForm(item, (form) => onUpdateForm(index, { ...item, ...form }))}
        </Collapsible>
      )}
    />
  );
};
