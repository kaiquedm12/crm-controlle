import { ReactNode } from "react";

type AdminPageProps = {
  content: ReactNode;
};

export function AdminPage({ content }: AdminPageProps) {
  return <>{content}</>;
}
