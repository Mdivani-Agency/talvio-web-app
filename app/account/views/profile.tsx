import { Profile } from '@lib/types';
import { Button, Card, CardContent, DisplayUrl, Label } from '@components/ui';
import { formatLocation } from '@lib/utils';
import { Icon } from '@components/icons';

type ProfileProps = {
  profile: Profile;
};

export const ProfileSection = ({ profile }: ProfileProps) => {
  return (
    <section className={'w-full pr-8'}>
      <Label
        variant={'default'}
        size='lg'
        className='mb-2'
      >
        Profile
        <Button variant={'ghost'} size={'icon'} className={'ml-auto'}>
          <Icon type={'Edit'} />
        </Button>
      </Label>
      <Card>
        <CardContent>
        <div className={'flex flex-col mb-1'}>
          <span className={'text-lg font-semibold'}>
            {profile.firstName} {profile.lastName}
          </span>
          <span className={'text-sm text-muted-foreground font-regular'}>{profile.role}</span>
        </div>
        <div className={'flex items-center gap-4'}>
          <div className={'flex items-center gap-1'}>
            <Icon className={'size-3 text-primary'} type={'Email'} />
            <span className={'text-sm'}>{profile.email}</span>
          </div>
          {profile.website && <DisplayUrl url={profile.website} />}
          {profile.phone && (
            <div className={'flex items-center gap-1'}>
              <Icon className={'size-3 text-primary'} type={'Phone'} />
              <span className={'text-sm'}>{profile.phone}</span>
            </div>
          )}
          {(profile.city || profile.country) && (
            <div className={'flex items-center gap-1'}>
              <Icon className={'size-3 text-primary'} type={'Pin'} />
              <span className={'text-sm'}>
                {formatLocation({ city: profile.city, country: profile.country })}
              </span>
            </div>
          )}
        </div>
        {profile.tagline && (
          <div className={'py-2'}>
            <p className={'text-sm'}>{profile.tagline}</p>
          </div>
        )}
        </CardContent>
      </Card>
    </section>
  );
};
