'use client';

import { ReactNode, useState } from 'react';
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
      className={'relative p-2.5 px-3 pr-6 w-auto bg-card text-sm text-left text-card-foreground rounded-md font-medium'}
    >
      {item}
      <Button
        onClick={onRemove}
        variant={'ghost'}
        size={'icon'}
        type="button"
        className='absolute right-1 top-1/2 -translate-y-1/2'
      >
        &times;
      </Button>
    </div>
  );
};

export const MultiListInput = <T extends string>({ items, label, badge }: MultiListInputProps<T>) => {
  const keys = Object.keys(items) as T[];
  const [state, setState] = useState<MultiInputState<T>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: { value: '' } }), {} as MultiInputState<T>),
  );

  const handleAdd = (key: T) => {
    items[key].onAdd(state[key].value);
    setState((prev) => ({ ...prev, [key]: { value: '' } }));
  };

  return (
    <div className="flex flex-col gap-2">
      <Label size='sm' variant={'muted'}>{label}{badge}</Label>
      {keys.map((key) => {
        const { items: subItems = [], onRemove } = items[key];
        return subItems.map((item, index) => <ListItem key={index} item={item} onRemove={() => onRemove(index)} />);
      })}
      {keys.map((key) => (
        <div key={key} className="flex gap-2 items-center">
          <Input
            placeholder={`Add ${items[key].label}`}
            value={state[key].value}
            onChange={(e) => setState((prev) => ({ ...prev, [key]: { value: e.target.value } }))}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd(key)}
          />
          <Button type="button" variant={'ghost'} size={'icon'} className={'size-10'} onClick={() => handleAdd(key)}>
            <Icon type="Add" className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};
