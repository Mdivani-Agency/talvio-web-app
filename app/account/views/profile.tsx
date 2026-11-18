import { Profile } from '@lib/types';
import { formatLocation } from '@lib/utils';
import { Globe, Mail, MapPin, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { PROFILE_SECTION_TITLES } from '@/lib/account-copy';
import { ProfileBlock } from './profile-block';

type ProfileProps = {
  profile: Profile;
};

const iconClassName = 'size-[1.4rem] shrink-0 text-muted-foreground';

export const ProfileSection = ({ profile }: ProfileProps) => {
  const location = profile.city || profile.country ? formatLocation({ city: profile.city, country: profile.country }) : '';
  const contacts: { key: string; icon: ReactNode; content: ReactNode }[] = [
    profile.email && { key: 'email', icon: <Mail aria-hidden="true" className={iconClassName} />, content: profile.email },
    profile.phone && { key: 'phone', icon: <Phone aria-hidden="true" className={iconClassName} />, content: profile.phone },
    profile.website && {
      key: 'website',
      icon: <Globe aria-hidden="true" className={iconClassName} />,
      content: (
        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="break-all hover:underline">
          {profile.website.replace(/^https?:\/\//, '')}
        </a>
      ),
    },
    location && { key: 'location', icon: <MapPin aria-hidden="true" className={iconClassName} />, content: location },
  ].filter(Boolean) as { key: string; icon: ReactNode; content: ReactNode }[];

  return (
    <ProfileBlock title={PROFILE_SECTION_TITLES.profile} bodyClassName="flex flex-col gap-3">
      <div>
        <p className="text-lg font-semibold text-primary">
          {profile.firstName} {profile.lastName}
        </p>
        {profile.role ? <p className="text-sm text-muted-foreground">{profile.role}</p> : null}
      </div>
      {contacts.length ? (
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {contacts.map((contact) => (
            <li key={contact.key} className="flex min-w-0 items-center gap-1.5">
              {contact.icon}
              <span className="min-w-0 break-words">{contact.content}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {profile.tagline ? <p className="text-sm leading-[1.5]">{profile.tagline}</p> : null}
    </ProfileBlock>
  );
};
