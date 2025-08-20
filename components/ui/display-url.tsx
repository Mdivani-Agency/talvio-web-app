import { cn, formatUrl } from '@lib/utils';
import { Icon } from '@components/icons';

type DisplayUrlProps = {
  url: string;
  type?: string;
  className?: string;
};

export const DisplayUrl = ({ url, className }: DisplayUrlProps) => {
  const formattedUrl = formatUrl(url);

  return (
    <a
      className={cn(
        'flex items-center gap-1 text-sm text-secondary-900 hover:text-primary hover:underline transition-colors',
        className,
      )}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon type={'Web'} className={'size-3 text-primary'} />
      {formattedUrl}
    </a>
  );
};
