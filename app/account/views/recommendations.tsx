import { Recommendation } from '@lib/types';
import { ExternalLink } from 'lucide-react';
import { PROFILE_SECTION_TITLES } from '@/lib/account-copy';
import { ProfileBlock, hairlineListClassName } from './profile-block';

type RecommendationsSectionProps = {
  recommendations: Recommendation[];
};

export const RecommendationsSection = ({ recommendations }: RecommendationsSectionProps) => {
  return (
    <ProfileBlock title={PROFILE_SECTION_TITLES.recommendations} bodyClassName={hairlineListClassName}>
      {recommendations.map(({ name, url, additionalDetails }, index) => (
        <article key={index} className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-md font-semibold text-primary">{name}</h3>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${name} (opens in a new tab)`}
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink aria-hidden="true" className="size-4" />
              </a>
            ) : null}
          </div>
          {additionalDetails ? <p className="text-sm leading-[1.5]">{additionalDetails}</p> : null}
        </article>
      ))}
    </ProfileBlock>
  );
};
