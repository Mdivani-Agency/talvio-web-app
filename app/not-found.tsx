import { NotFoundError } from '@components/views';
import { PRIVATE_ROBOTS } from '@/lib/public-metadata';

export const metadata = { robots: PRIVATE_ROBOTS };

export default function NotFound() {
  return <NotFoundError />;
}
