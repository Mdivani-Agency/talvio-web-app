'use client';

import { ReactNode, useId, useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Icon } from '@components/icons';

export interface ListInputProps {
  label: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}

interface MultiListInputProps<T extends string> {
  label: string;
  badge?: ReactNode;
  items: Record<T, ListInputProps>;
}

type MultiInputState<T extends string> = Record<T, { value: string }>;

const ListItem = ({ item, onRemove }: { item: string; onRemove: () => void }) => {
  return (
    <div
      className={'relative p-2.5 px-3 pr-6 w-auto bg-accent text-sm text-left text-accent-foreground rounded-md font-medium'}
    >
      {item}
      <Button
        onClick={onRemove}
        variant={'ghost'}
        size={'icon'}
        type="button"
        aria-label={`Remove ${item}`}
        className='absolute right-1 top-1/2 -translate-y-1/2'
      >
        &times;
      </Button>
    </div>
  );
};

export const MultiListInput = <T extends string>({ items, label, badge }: MultiListInputProps<T>) => {
  const baseId = useId();
  const keys = Object.keys(items) as T[];
  const [state, setState] = useState<MultiInputState<T>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: { value: '' } }), {} as MultiInputState<T>),
  );

  const handleAdd = (key: T) => {
    items[key].onAdd(state[key].value);
    setState((prev) => ({ ...prev, [key]: { value: '' } }));
  };

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 flex items-center gap-2 text-sm leading-[1.4286] font-medium text-foreground">
        {label}
        {badge}
      </legend>
      {keys.map((key) => {
        const { items: subItems = [], onRemove } = items[key];
        return subItems.map((item, index) => <ListItem key={index} item={item} onRemove={() => onRemove(index)} />);
      })}
      {keys.map((key) => {
        const inputId = `${baseId}-${key}`;
        const itemLabel = items[key].label;
        return (
          <div key={key} className="grid min-w-0 content-start gap-1.5">
            <Label htmlFor={inputId} size="sm" className="leading-[1.4286] font-medium text-foreground">
              {itemLabel}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id={inputId}
                placeholder={`Add ${itemLabel.toLowerCase()}`}
                value={state[key].value}
                onChange={(e) => setState((prev) => ({ ...prev, [key]: { value: e.target.value } }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd(key)}
              />
              <Button
                type="button"
                variant={'ghost'}
                size={'icon'}
                className={'size-12'}
                aria-label={`Add to ${itemLabel.toLowerCase()}`}
                onClick={() => handleAdd(key)}
              >
                <Icon type="Add" className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        );
      })}
    </fieldset>
  );
};
