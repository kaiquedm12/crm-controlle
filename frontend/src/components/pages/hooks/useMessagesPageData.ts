import { useEffect, useState } from "react";
import { getMessages } from "@/services/api";
import { MessageItem } from "@/types/crm";

type Params = {
  token: string;
  activeSection: string;
  onError: (message: string) => void;
};

export function useMessagesPageData({ token, activeSection, onError }: Params) {
  const [messagesData, setMessagesData] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (activeSection !== "messages") {
        return;
      }

      setLoading(true);
      try {
        const messages = await getMessages(token);
        if (!cancelled) {
          setMessagesData(messages);
        }
      } catch (error) {
        if (!cancelled) {
          onError(error instanceof Error ? error.message : "Nao foi possivel carregar mensagens");
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

  return { messagesData, loading };
}
