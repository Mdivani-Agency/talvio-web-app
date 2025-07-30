import { Icon } from '@components/icons';
import { cn } from '@lib/utils';

export function Loading({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-screen', className)}>
      <Icon type={'Spinner'} className="animate-spin mb-4" />
      <div className="text-lg font-medium">{message}</div>
    </div>
  );
}
