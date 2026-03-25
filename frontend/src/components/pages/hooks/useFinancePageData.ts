import { useEffect, useState } from "react";
import { getDealsReport } from "@/services/api";
import { DealsReport } from "@/types/crm";

type Params = {
  token: string;
  activeSection: string;
  onError: (message: string) => void;
};

export function useFinancePageData({ token, activeSection, onError }: Params) {
  const [dealsReportData, setDealsReportData] = useState<DealsReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (activeSection !== "finance") {
        return;
      }

      setLoading(true);
      try {
        const report = await getDealsReport(token);
        if (!cancelled) {
          setDealsReportData(report);
        }
      } catch (error) {
        if (!cancelled) {
          onError(error instanceof Error ? error.message : "Nao foi possivel carregar financeiro");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeSection, onError, token]);

  return { dealsReportData, setDealsReportData, loading };
}
