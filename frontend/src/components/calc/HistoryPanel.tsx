import { RefreshCw, Trash2, ExternalLink, Inbox } from "lucide-react";
import type { SavedCalculation } from "@/lib/types";
import { CANAL_LABELS } from "@/lib/types";
import { formatBRL, formatPct, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function HistoryPanel({
  items,
  isLoading,
  isError,
  errorMessage,
  onReload,
  onDelete,
  deletingId,
}: {
  items: SavedCalculation[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onReload: (item: SavedCalculation) => void;
  onDelete: (id: string | number) => void;
  deletingId?: string | number | null;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center text-sm text-destructive">
        {errorMessage || "Erro ao carregar o histórico."}
      </Card>
    );
  }

  if (!items.length) {
    return (
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Inbox className="h-7 w-7" />
        </div>
        <div>
          <p className="font-medium">Nenhum cálculo salvo ainda</p>
          <p className="text-sm text-muted-foreground">
            Faça um cálculo na aba “Novo Cálculo” e salve para vê-lo aqui.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const r = item.resultado;
        const lucroPos = (r?.lucroFinal ?? 0) >= 0;
        return (
          <Card key={item.id} className="flex flex-col overflow-hidden">
            {item.foto_url ? (
              <img
                src={item.foto_url}
                alt={item.nome}
                className="h-36 w-full object-cover"
              />
            ) : (
              <div className="flex h-36 w-full items-center justify-center bg-secondary/50 text-muted-foreground">
                Sem foto
              </div>
            )}
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary">{CANAL_LABELS[item.canal]}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(item.created_at)}
                </span>
              </div>
              <div>
                <h3 className="truncate font-semibold">{item.nome}</h3>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 truncate text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {item.link}
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-[11px] text-muted-foreground">Preço de Venda</p>
                  <p className="font-bold">{formatBRL(r?.precoFinal)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Lucro Líquido</p>
                  <p className={cn("font-bold", lucroPos ? "text-success" : "text-destructive")}>
                    {formatBRL(r?.lucroFinal)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Custo Base</p>
                  <p className="font-medium">{formatBRL(r?.custoTotal)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Margem Real</p>
                  <p className="font-medium">{formatPct(r?.margemReal)}</p>
                </div>
              </div>

              <div className="mt-auto flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => onReload(item)}
                >
                  <RefreshCw className="h-4 w-4" /> Recarregar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir cálculo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        “{item.nome}” será removido permanentemente do histórico.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
