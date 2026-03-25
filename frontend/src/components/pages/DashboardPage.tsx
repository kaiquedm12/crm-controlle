import { ReactNode } from "react";

type DashboardPageProps = {
  metricsSection: ReactNode;
  createLeadSection: ReactNode;
  boardSection: ReactNode;
};

export function DashboardPage({ metricsSection, createLeadSection, boardSection }: DashboardPageProps) {
  return (
    <>
      {metricsSection}
      {createLeadSection}
      {boardSection}
    </>
  );
}
