'use client';

import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { cn } from '@lib/utils/tailwind';
import { Label, Select, SelectContent, SelectItem, SelectTrigger } from '@components/ui';
import { Icon } from '@components/icons';
import { RESUME_COLORS_MAP } from '@lib/utils/tailwind';

const PREDEFINED_COLORS = [
  RESUME_COLORS_MAP.talvio,
  RESUME_COLORS_MAP.ember,
  RESUME_COLORS_MAP.black,
  RESUME_COLORS_MAP.grayLight,
];

export interface ColorPaletteSelectorProps {
  value: string;
  disabled?: boolean;
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onSelect: (color: string) => void;
}

export const ColorPaletteSelector: React.FC<ColorPaletteSelectorProps> = ({
  value,
  className,
  disabled,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState<string>(value);

  const handleSelect = (color: string) => {
    setColor(color);
    onSelect(color);
    setOpen(false);
  };

  return (
    <Select
      disabled={disabled}
      value={value}
      open={open}
      onOpenChange={setOpen}
      onValueChange={handleSelect}
    >
      <SelectTrigger aria-label="Resume color" style={{ background: color }} className={cn("flex items-center p-2 max-h-8 hover:cursor-pointer", className)}>
        <Icon type="Paint" className="size-4 text-muted-foreground" />
      </SelectTrigger>
      <SelectContent className='bg-popover'>
        <HexColorPicker className="w-full rounded mb-4" color={color} onChange={setColor} />
        <Label variant={'muted'} size="sm">
          Custom Color
        </Label>
        <div className="grid grid-cols-4 gap-1 gap-2 my-2">
          <button
            type="button"
            className={`w-full aspect-square rounded ${value === color ? 'ring-1 ring-primary' : ''}`}
            style={{ background: color }}
            aria-label={`Select ${color}`}
            onClick={() => handleSelect(color)}
          />
        </div>
        <Label variant={'muted'} size="sm">
          Suggested Colors
        </Label>
        <div className="grid grid-cols-4 gap-1 my-2">
          {PREDEFINED_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-full aspect-square rounded ${value === color ? 'ring-1 ring-primary' : ''}`}
                style={{ background: color }}
                aria-label={`Select ${color}`}
                onClick={() => handleSelect(color)}
              />
          ))}
        </div>
      </SelectContent>
    </Select>
  );
};
