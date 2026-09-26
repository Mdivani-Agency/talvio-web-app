'use client';
import { Icon } from '@components/icons';
import { Button, ColorPaletteSelector, Select, SelectContent, SelectItem, SelectTrigger } from '@components/ui';
import { cn } from '@lib/utils/tailwind';

type ResumeActionBarProps = {
  color: string;
  imageCount: number;
  currentIndex: number;
  fontSize: 'sm' | 'md' | 'lg';
  className?: string;
  onFontSizeChange: (fontSize: 'sm' | 'md' | 'lg') => void;
  setColor: (color: string) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  handleDownload: () => void;
  handlePreviewOpen: () => void;
  action?: React.ReactNode;
  disabled?: boolean;
};

export const ResumeActionBar = ({
  color,
  imageCount,
  currentIndex,
  className,
  fontSize,
  action,
  onFontSizeChange,
  setColor,
  goToPrevious,
  goToNext,
  handleDownload,
  handlePreviewOpen,
  disabled = false,
}: ResumeActionBarProps) => {
  return (
    <div
      className={cn(
        'flex justify-between items-center w-4/5 bg-popover shadow-md rounded-sm p-2 px-4 mx-auto transition',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {action}
        <Select
          value={fontSize}
          onValueChange={onFontSizeChange}
          disabled={disabled}
        >
          <SelectTrigger aria-label="Font size" className="flex justify-center items-center gap-1 max-h-8 p-1 hover:cursor-pointer">
            <Icon type="FontSize" className="size-4" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">S</SelectItem>
            <SelectItem value="md">M</SelectItem>
            <SelectItem value="lg">L</SelectItem>
          </SelectContent>
        </Select>
        <ColorPaletteSelector
          value={color}
          onSelect={setColor}
          disabled={disabled}
        />
      </div>
      <div className="flex justify-center items-center">
        <button type="button" aria-label="Previous page" onClick={goToPrevious}>
          <Icon type="ChevronLeft" className="size-4 text-muted-foreground" />
        </button>
        <span className="block my-2 text-center text-sm text-muted-foreground">
          Page {currentIndex + 1} of {imageCount}
        </span>
        <button type="button" aria-label="Next page" onClick={goToNext}>
          <Icon type="ChevronRight" className="size-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex gap-2">
        <Button
          className="shadow-sm"
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Download resume"
          onClick={handleDownload}
          disabled={imageCount === 0}
        >
          <Icon type="Download" className="size-4 text-muted-foreground" />
        </Button>
        <Button
          className="size-8 text-neutral-800 hover:cursor-pointer"
          type="button"
          variant="ghost"
          aria-label="Full size preview"
          disabled={imageCount === 0}
          onClick={handlePreviewOpen}
        >
          <Icon type="Zoom" className="size-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
};
