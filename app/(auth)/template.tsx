import { PageEnter } from "@/components/app/PageEnter";

/** Same fade as the app shell for login / signup. */
export default function AuthTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageEnter>{children}</PageEnter>;
}
