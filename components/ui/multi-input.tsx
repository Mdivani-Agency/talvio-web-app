import { Input, Button } from '@components/ui';
import { cn } from '@lib/utils';
import { Icon } from '@components/icons';
import { TagList } from './tag-list';

type Option = {
  name: string;
  additionalInfo?: string;
};

type MultiInputProps = {
  options: Option[];
  currentOption: string;
  errorMessage?: string;
  placeholder?: string;
  containerClassName?: string;
  showAddButton?: boolean;
  setCurrentOption: (value: string) => void;
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  handleManage?: () => void;
};

export const MultiInput = ({
  options,
  currentOption,
  errorMessage,
  containerClassName,
  placeholder,
  showAddButton = true,
  setCurrentOption,
  onAdd,
  onRemove,
  handleManage,
}: MultiInputProps) => {
  const handleAdd = () => {
    if (currentOption) {
      onAdd(currentOption.trim());
    }
  };

  return (
    <div className={'mb-2'}>
      <div className={cn('flex items-center gap-2', containerClassName)}>
        <Input
          error={errorMessage}
          value={currentOption}
          onChange={(e) => setCurrentOption(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && currentOption) {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          onBlur={() => {
            if (currentOption) {
              handleAdd();
            }
          }}
        />
        {showAddButton && (
          <Button type="button" variant={'ghost'} size={'icon'} className={'size-10'} onClick={handleAdd}>
            <Icon type={'Add'} className={'size-4'} />
          </Button>
        )}
      </div>
      <div className={'max-w-full w-full flex items-center justify-between'}>
        <TagList options={options} onRemove={onRemove} />
        {handleManage && (
          <Button
            type="button"
            variant={'ghost'}
            size={'sm'}
            disabled={options.length === 0}
            onClick={handleManage}
            className={'text-sm whitespace-nowrap ml-auto'}
          >
            Manage Items
          </Button>
        )}
      </div>
    </div>
  );
};
