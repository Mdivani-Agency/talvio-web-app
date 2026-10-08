'use client';
import React, { useState, ReactElement, PropsWithChildren } from 'react';
import { cn } from '@lib/utils/tailwind';
import { Tabs, TabComponentProps } from '../tabs';
import { Button } from '@components/ui';

const TabContent = ({ children }: PropsWithChildren<TabComponentProps>) => {
  return children;
};

interface TabNavigationProps {
  children: ReactElement<TabComponentProps>[];
  withActionButtons?: boolean;
  className?: string;
}

const Root = ({ children, className, withActionButtons = true }: TabNavigationProps) => {
  const [currentTab, setCurrentTab] = useState(0);

  const tabContentItems = React.Children.map(children, (child) => ({
    title: child?.props?.title,
    error: child?.props?.error,
    hasError: child.props?.hasError,
    content: child,
    validate: child?.props?.validate,
    icon: child?.props?.icon,
  }));

  const currentTabContent = tabContentItems[currentTab].content;

  return (
    <div className={cn('relative lg:flex justify-start overflow-y-auto lg:overflow-y-hidden', className)}>
      <Tabs className={'pt-12'} tabs={tabContentItems} currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <div className={'lg:flex flex-col w-full h-full pb-12'}>
        <div className={'px-4 pt-6 w-full lg:h-full lg:overflow-y-auto lg:p-4 lg:pl-20'}>{currentTabContent}</div>
        {withActionButtons && (
          <div
            className={
              'absolute bottom-0 left-0 right-0 flex justify-between p-2.5 border-t border-input lg:pl-20'
            }
          >
            <Button
              disabled={currentTab === 0}
              size={'sm'}
              variant={'ghost'}
              onClick={() => setCurrentTab(currentTab - 1)}
            >
              Back
            </Button>
            <Button
              disabled={currentTab === tabContentItems.length - 1}
              size={'sm'}
              variant={'ghost'}
              onClick={() => setCurrentTab(currentTab + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const TabNavigation = Object.assign(Root, { TabContent });
