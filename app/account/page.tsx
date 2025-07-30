'use client';

import { SessionContext } from "@lib/providers";
import { useContext } from "react";

export default function AccountPage() {
  const { session } = useContext(SessionContext);

  return <div>Welcome {session?.user.email}</div>;
}
