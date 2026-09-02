import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { DEFAULT_SIGNED_IN_ROUTE } from "@/lib/habits/constants";

export const metadata: Metadata = {
  title: "Sign in",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
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
    <Card data-auth-card className="shadow-glow">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in with your username or email and password.
        </CardDescription>
      </CardHeader>
      <CardBody>
        <LoginForm next={next} initialError={first(params.error)} />
      </CardBody>
    </Card>
  );
}
