import { PageEnter } from "@/components/app/PageEnter";

/** Remounts on in-app navigations so page-enter CSS can replay. Chrome lives in layout. */
export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageEnter>{children}</PageEnter>;
}
