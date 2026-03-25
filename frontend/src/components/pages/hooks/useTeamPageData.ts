import { useEffect, useState } from "react";
import { getUsersPerformanceReport } from "@/services/api";
import { UserPerformanceMetric } from "@/types/crm";

type Params = {
  token: string;
  activeSection: string;
  onError: (message: string) => void;
};

export function useTeamPageData({ token, activeSection, onError }: Params) {
  const [teamPerformanceData, setTeamPerformanceData] = useState<UserPerformanceMetric[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (activeSection !== "team") {
        return;
      }

      setLoading(true);
      try {
        const performance = await getUsersPerformanceReport(token);
        if (!cancelled) {
          setTeamPerformanceData(performance);
        }
      } catch (error) {
        if (!cancelled) {
          onError(error instanceof Error ? error.message : "Nao foi possivel carregar equipe");
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

  return { teamPerformanceData, loading };
}
