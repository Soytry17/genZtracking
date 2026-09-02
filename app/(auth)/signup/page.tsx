import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/SignupForm";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { DEFAULT_SIGNED_IN_ROUTE } from "@/lib/habits/constants";

export const metadata: Metadata = {
  title: "Create account",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const nextParam = first(params.next);
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : DEFAULT_SIGNED_IN_ROUTE;

  return (
    <Card data-auth-card className="w-full shadow-glow">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>
          Pick a username, then sign in with it or your email.
        </CardDescription>
      </CardHeader>
      <CardBody>
        <SignupForm next={next} />
      </CardBody>
    </Card>
  );
}
