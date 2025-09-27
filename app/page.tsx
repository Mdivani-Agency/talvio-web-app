import { authClient } from "@lib/auth.client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppPage() {
  const headersList = await headers();
  const { data } = await authClient.getSession({ fetchOptions: { headers: headersList } });

  if (data?.user) {
    return redirect('/account');
  }

  return redirect('/home');
}
