import { authClient } from "@lib/auth.client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppPage() {
  const headersList = await headers();
  console.log('headersList', headersList);
  const { data, error } = await authClient.getSession({ fetchOptions: { headers: headersList } });

  console.log('data', data);
  console.log('error', error);
  if (data?.user) {
    return redirect('/account');
  }

  return redirect('/home');
}
