import { Loading } from '@components/views';
import { APPLICATIONS_LOADING } from '@/lib/applications-copy';

export default function ApplicationsLoading() {
  return <Loading message={APPLICATIONS_LOADING} />;
}
