import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AppPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return redirect('/account');
  }

  return redirect('/home');
}
