'use client';
import React from 'react';
import { cn } from '@lib/utils/tailwind';
import { Icon, IconType } from '@components/icons';
import { Button } from '@components/ui';

export interface TabComponentProps {
  title: string;
  icon: IconType;
  error?: string;
  hasError?: boolean;
  disabled?: boolean;
  validate?: () => Promise<boolean>;
}

export interface TabProps {
  tabs: TabComponentProps[];
  currentTab: number;
  setCurrentTab: (tab: number) => void;
  className?: string;
}

export const Tabs = React.memo(function Tabs({ tabs, currentTab, setCurrentTab, className }: TabProps) {
  return (
    <div
      className={cn(
        'w-full lg:h-full lg:absolute bg-popover group px-2 shadow-sm lg:w-16 overflow-x-hidden transition-width duration-300',
        className,
      )}
    >
      <div className={'relative flex lg:flex-col w-full items-start justify-start lg:flex-wrap lg:gap-2'}>
        {tabs.map((tab, index) => {
          return (
            <Button
              key={tab.title}
              variant={'ghost'}
              onClick={() => setCurrentTab(index)}
              className={cn(
                'text-sm text-left text-secondary px-4 gap-0 justify-start',
                currentTab === index && 'bg-accent text-primary',
                tab.hasError && 'border border-error',
              )}
            >
              <Icon type={tab.icon} className="size-4" />
            </Button>
          );
        })}
      </div>
    </div>
  );
});
