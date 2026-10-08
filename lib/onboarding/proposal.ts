import type { AccountDto, DeepPartial } from '@lib/types';

export function mergeAccountProposal(source: AccountDto, proposal: DeepPartial<AccountDto>): AccountDto {
  return {
    ...source,
    ...proposal,
    profile: {
      ...source.profile,
      ...proposal.profile,
    },
    languages: proposal.languages ?? source.languages,
    links: proposal.links ?? source.links,
    experience: proposal.experience ?? source.experience,
    education: proposal.education ?? source.education,
    skills: proposal.skills ?? source.skills,
    tools: proposal.tools ?? source.tools,
    projects: proposal.projects ?? source.projects,
  };
}
