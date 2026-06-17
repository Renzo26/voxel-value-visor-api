import {
  DollarSign,
  TrendingUp,
  Package,
  Percent,
  Store,
  Zap,
  Spool,
  Printer,
  ExternalLink,
} from "lucide-react";
import type { CalcResult, Canal } from "@/lib/types";
import { CANAL_LABELS } from "@/lib/types";
import { formatBRL, formatPct } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function Metric({
  icon,
  label,
  value,
  tone,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "success" | "danger" | "default";
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-4",
        highlight && "bg-gradient-brand text-primary-foreground border-transparent shadow-soft",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 text-xs",
          highlight ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-2 text-2xl font-bold",
          tone === "success" && "text-success",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function ResultPanel({
  result,
  canal,
  link,
  fotoUrl,
}: {
  result: CalcResult;
  canal: Canal;
  link?: string;
  fotoUrl?: string;
}) {
  const lucroTone = result.lucroFinal >= 0 ? "success" : "danger";
  const c = result.custos;

  return (
    <div className="space-y-6">
      {(fotoUrl || link) && (
        <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          {fotoUrl && (
            <img
              src={fotoUrl}
              alt="Produto"
              className="h-24 w-24 rounded-lg border border-border object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <Badge variant="secondary">{CANAL_LABELS[canal]}</Badge>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center gap-1 truncate text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {link}
              </a>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          highlight
          icon={<DollarSign className="h-4 w-4" />}
          label="Preço de Venda Sugerido"
          value={formatBRL(result.precoFinal)}
        />
        <Metric
          icon={<TrendingUp className="h-4 w-4" />}
          label="Lucro Líquido"
          value={formatBRL(result.lucroFinal)}
          tone={lucroTone}
        />
        <Metric
          icon={<Package className="h-4 w-4" />}
          label="Custo Total"
          value={formatBRL(result.custoTotal)}
        />
        <Metric
          icon={<Percent className="h-4 w-4" />}
          label="Margem Real"
          value={formatPct(result.margemReal)}
        />
        <Metric
          icon={<Store className="h-4 w-4" />}
          label="Taxa do Canal"
          value={formatBRL(result.taxaCanal)}
        />
        <Metric icon={<Zap className="h-4 w-4" />} label="Custo Energia" value={formatBRL(c.energia)} />
        <Metric
          icon={<Spool className="h-4 w-4" />}
          label="Custo Material"
          value={formatBRL(c.material)}
        />
        <Metric
          icon={<Printer className="h-4 w-4" />}
          label="Depreciação"
          value={formatBRL(c.depreciacao)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Composição do Custo</h3>
          <Row label="Material" value={formatBRL(c.material)} />
          <Row label="Energia" value={formatBRL(c.energia)} />
          <Row label="Depreciação" value={formatBRL(c.depreciacao)} />
          <Row label="Acabamento" value={formatBRL(c.acabamento)} />
          <Row label="Pintura" value={formatBRL(c.pintura)} />
          <Row label="Logística" value={formatBRL(c.logistica)} />
          <Row label="Embalagem" value={formatBRL(c.embalagem)} />
          <Row label="Mão de obra" value={formatBRL(c.maoObra)} />
          <Row label="Ajuste de falha" value={formatBRL(c.ajusteFalha)} />
          <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-sm font-bold">
            <span>Custo Total</span>
            <span>{formatBRL(result.custoTotal)}</span>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Detalhes do canal</h3>
          {canal === "shopee" && result.detalhesCanal.shopee && (
            <>
              <Row label="Comissão (%)" value={result.detalhesCanal.shopee.comissaoPct} />
              <Row label="Taxa fixa" value={result.detalhesCanal.shopee.taxaFixa} />
              <Row label="Total comissão" value={result.detalhesCanal.shopee.totalComissao} />
              <Row label="Custo Ads" value={result.detalhesCanal.shopee.custoAds} />
            </>
          )}
          {canal === "ml" && result.detalhesCanal.ml && (
            <>
              <Row label="Plano" value={result.detalhesCanal.ml.plano} />
              <Row label="Comissão (%)" value={result.detalhesCanal.ml.comissaoPct} />
              <Row label="Taxa fixa" value={result.detalhesCanal.ml.taxaFixa} />
              <Row label="Total comissão" value={result.detalhesCanal.ml.totalComissao} />
            </>
          )}
          {canal === "propria" && result.detalhesCanal.propria && (
            <>
              <Row label="Tributação" value={result.detalhesCanal.propria.tributacao} />
              <Row label="Custo frete" value={result.detalhesCanal.propria.custoFrete} />
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
