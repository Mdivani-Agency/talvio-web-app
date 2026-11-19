import { Loading } from '@components/views';

import { WithResumeHeader } from './views/resume-public-header';

export default function ResumeLoading() {
  return (
    <WithResumeHeader>
      <Loading message={'Loading...'} />
    </WithResumeHeader>
  );
}
