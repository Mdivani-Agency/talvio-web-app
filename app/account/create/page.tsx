'use client';
import { Loading } from "@components/views";
import { useAccountContext } from "../providers/state-provider";
import AccountFormPage from "./views/account-form.page";
import { AccountQuestions } from "./views/account-questions.page";
import { redirect } from "next/navigation";

export default function CreateAccountPage() {
  const { state, userId } = useAccountContext();

  if (state.matches({ newAccount: 'accountForm'})) {
    return <AccountFormPage />;
  }

  if (state.matches({ newAccount: 'accountQuestions'})) {
    return <AccountQuestions userId={userId} />;
  }

  if (state.matches('existingAccount')) {
    return redirect('/account');
  }

  return <Loading message="Loading account data..." />;
}
