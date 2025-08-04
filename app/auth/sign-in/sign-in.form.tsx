'use client';
import { Form, FormControl, FormItem } from "@components/ui/form";
import { signInSchema, SignInValues } from "./schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";

interface SignInFormProps {
  onSubmit: (values: SignInValues) => void;
}


export const SignInForm = ({ onSubmit }: SignInFormProps) => {
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
    },
  });

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4">
        <FormItem>
          <FormControl>
            <Input {...form.register('email')} placeholder="Email" />
          </FormControl>
        </FormItem>
        <Button type="button" onClick={form.handleSubmit(onSubmit)}>With Email</Button>
      </form>
    </Form>
  )
}
