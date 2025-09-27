import { Label, Avatar, AvatarFallback, AvatarImage } from '@components/ui';
import { User } from '@lib/types';

type AccountUserProps = {
  sessionUser: User;
};

export const AccountUser = ({ sessionUser }: AccountUserProps) => {
  return (
    <section className={'flex items-center w-full py-4 pr-8'}>
      <div className={'flex items-center gap-4'}>
          <Avatar className={'size-8'}>
            <AvatarImage src={sessionUser.image || ''} />
            <AvatarFallback>
              {sessionUser.name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
        <div>
          <Label>{sessionUser.name}</Label>
          <span className={'text-sm text-secondary-900'}>{sessionUser.email}</span>
        </div>
      </div>
    </section>
  );
};
