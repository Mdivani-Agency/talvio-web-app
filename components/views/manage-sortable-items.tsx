'use client';
import { CircleAlert } from 'lucide-react';
import { memo, useId, useState, type ReactNode } from 'react';
import { Button, Label, MultiInput } from '@components/ui';
import { SortModal } from '@components/modals';
import { cn } from '@lib/utils';
import { Icon } from '@components/icons';

export type SortableItem = { name: string; id: string };

type ManageSortableItemsProps = {
  /** The visible label above the input; it also names the input for screen readers. */
  label: string;
  /** Sits at the end of the label row, such as a switch that changes how the list works. */
  labelAside?: ReactNode;
  items?: Array<SortableItem>;
  errorsMessage?: string;
  currentOption: string;
  modalLabel?: string;
  placeholder?: string;
  setCurrentOption: (value: string) => void;
  addItem: (item: string) => void;
  removeItem: (index: number) => void;
  handleSave: (items: SortableItem[]) => void;
};

export const ManageSortableItems = memo(function ManageSortableItems({
  label,
  labelAside,
  items = [],
  errorsMessage,
  modalLabel = 'Reorder your skills and select up to 6 to display on your resume',
  placeholder = 'Add Skills',
  currentOption,
  setCurrentOption,
  addItem,
  removeItem,
  handleSave,
}: ManageSortableItemsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputId = useId();
  const messageId = `${inputId}-message`;

  return (
    <div className="grid min-w-0 content-start gap-1.5">
      {labelAside ? (
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={inputId} size="sm" className="leading-[1.4286] font-medium text-foreground">
            {label}
          </Label>
          {labelAside}
        </div>
      ) : (
        <Label htmlFor={inputId} size="sm" className="leading-[1.4286] font-medium text-foreground">
          {label}
        </Label>
      )}
      <MultiInput
        id={inputId}
        describedBy={errorsMessage ? messageId : undefined}
        invalid={Boolean(errorsMessage)}
        options={items}
        currentOption={currentOption}
        setCurrentOption={setCurrentOption}
        onAdd={addItem}
        onRemove={removeItem}
        placeholder={placeholder}
        showAddButton={false}
        handleManage={() => setIsOpen(true)}
      />
      {errorsMessage ? (
        <p id={messageId} className="flex items-start gap-1.5 text-sm leading-[1.4286] text-foreground">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-destructive" strokeWidth={2} />
          <span>{errorsMessage}</span>
        </p>
      ) : null}
      <SortModal
        fields={items}
        title={modalLabel}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        renderItem={(params) => (
          <RenderItem name={params.item.name} isDragging={params.isDragging} onRemove={params.onRemove} />
        )}
        onSave={handleSave}
      />
    </div>
  );
});

const RenderItem = ({
  name,
  isDragging,
  onRemove,
}: {
  name: string;
  isDragging: boolean;
  onRemove: () => void;
}) => {
  return (
    <div className={cn('w-full flex items-center justify-between text-md font-medium', isDragging && 'opacity-50')}>
      {name}
      <Button type="button" variant={'ghost'} size={'icon'} className={'size-6'} onClick={() => onRemove()}>
        <Icon type={'TrashBin'} className={'size-4'} />
      </Button>
    </div>
  );
}
