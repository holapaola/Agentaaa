import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppClient } from "@/types";

interface Props {
  allClients: AppClient[];
  loadedClient: AppClient | null;
  onClientChange: (client: AppClient) => void;
}

export default function ClientSelector({ allClients, loadedClient, onClientChange }: Props) {
  if (allClients.length <= 1) return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted-foreground font-body whitespace-nowrap">Creating for:</span>
      <Select
        value={loadedClient?.id ?? ""}
        onValueChange={(id) => {
          const c = allClients.find((x) => x.id === id);
          if (c) onClientChange(c);
        }}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select a client…" />
        </SelectTrigger>
        <SelectContent>
          {allClients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
