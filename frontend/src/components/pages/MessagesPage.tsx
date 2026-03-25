import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageItem } from "@/types/crm";

type MessagesPageProps = {
  messagesData: MessageItem[];
};

export function MessagesPage({ messagesData }: MessagesPageProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card className="border-blue-100 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle>Conversas recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {messagesData.slice(0, 8).map((message) => (
            <div key={message.id} className="rounded-lg border border-slate-200 px-3 py-2">
              <p className="text-sm font-semibold text-slate-900">{message.lead?.name ?? "Lead"}</p>
              <p className="line-clamp-2 text-xs text-slate-600">{message.content}</p>
              <p className="text-[11px] text-slate-400">
                {new Date(message.createdAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
          {!messagesData.length ? <p className="text-sm text-slate-500">Sem conversas para mostrar.</p> : null}
        </CardContent>
      </Card>

      <Card className="border-blue-100 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle>Proximos retornos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Mensagens totais carregadas: {messagesData.length}</p>
          <p>
            Ultimo envio: {" "}
            {messagesData[0] ? new Date(messagesData[0].createdAt).toLocaleString("pt-BR") : "sem registros"}
          </p>
          <p>Use o board na aba Home para mover oportunidades e atualizar contexto.</p>
        </CardContent>
      </Card>
    </section>
  );
}
