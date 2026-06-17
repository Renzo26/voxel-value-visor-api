import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Printer,
  Zap,
  Spool,
  Paintbrush,
  MapPin,
  Percent,
  Tag,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  RefreshCw,
  Save,
  Calculator,
} from "lucide-react";

import type { CalcInputs, CalcResult, Canal } from "@/lib/types";
import { CANAL_LABELS } from "@/lib/types";
import { api } from "@/lib/api";
import {
  PRINTERS,
  PRINTER_GROUPS,
  CUSTOM_PRINTER_KEY,
  getPrinter,
} from "@/lib/printers";
import { CHANNEL_INFO } from "@/lib/calc-defaults";
import { formatBRL } from "@/lib/format";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { SectionCardTitle, Field, NumberField, InfoBox } from "./ui";
import { ResultPanel } from "./ResultPanel";

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function CalculatorForm({
  onCalculate,
  isCalculating,
  result,
  resultMeta,
  photoFile,
  onPhotoChange,
  onSave,
  isSaving,
  onReset,
}: {
  onCalculate: () => void;
  isCalculating: boolean;
  result: CalcResult | null;
  resultMeta: { canal: Canal; link?: string; foto_url?: string } | null;
  photoFile: File | null;
  onPhotoChange: (file: File | null) => void;
  onSave: (nome: string) => void;
  isSaving: boolean;
  onReset: () => void;
}) {
  const { register, watch, setValue } = useFormContext<CalcInputs>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [useCep, setUseCep] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [cep, setCep] = useState({
    cep_origem: "",
    num_origem: "",
    cep_destino: "",
    num_destino: "",
  });

  const canal = watch("canal");
  const chave = watch("impressora.chave");
  const valorCustom = watch("impressora.valorCustom");
  const vidaUtilCustom = watch("impressora.vidaUtilCustom");
  const horasMes = watch("horasMes");
  const acabamentoOn = watch("acabamento.ativo");
  const pinturaOn = watch("pintura.ativo");
  const freteGratis = watch("shopee.freteGratis");
  const fotoUrlValue = watch("foto_url");

  // autopopular watts ao escolher impressora
  useEffect(() => {
    if (chave !== CUSTOM_PRINTER_KEY) {
      const p = getPrinter(chave);
      if (p) setValue("consumoWatts", p.watts);
    }
  }, [chave, setValue]);

  // prévia de depreciação (apenas visual)
  const isCustom = chave === CUSTOM_PRINTER_KEY;
  const preco = isCustom ? Number(valorCustom) || 0 : getPrinter(chave)?.preco ?? 0;
  const meses = isCustom ? Number(vidaUtilCustom) || 1 : getPrinter(chave)?.vidaUtil ?? 1;
  const deprecMensal = meses > 0 ? preco / meses : 0;
  const deprecHora = horasMes > 0 ? deprecMensal / horasMes : 0;

  const photoPreview = photoFile ? URL.createObjectURL(photoFile) : fotoUrlValue || "";

  useEffect(() => {
    return () => {
      if (photoFile) URL.revokeObjectURL(photoPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoFile]);

  const distanceMutation = useMutation({
    mutationFn: () =>
      api.post<{ distancia_km: number; origem: string; destino: string }>(
        "/logistics/distance",
        cep,
      ),
    onSuccess: (data) => {
      setValue("logistica.distancia", data.distancia_km);
      toast.success(`Distância calculada: ${data.distancia_km} km`);
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao calcular a rota."),
  });

  const handlePhoto = (file: File | null) => {
    if (!file) {
      onPhotoChange(null);
      return;
    }
    if (!VALID_TYPES.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("A imagem deve ter no máximo 3MB.");
      return;
    }
    onPhotoChange(file);
  };

  const channelInfoText =
    canal === "shopee"
      ? watch("shopee.vendedor") === "cpf"
        ? CHANNEL_INFO.shopeeCpf
        : CHANNEL_INFO.shopeeCnpj
      : canal === "ml"
        ? CHANNEL_INFO.ml
        : CHANNEL_INFO.propria;

  return (
    <div className="space-y-6">
      {/* 1. Canal de venda */}
      <Card>
        <CardHeader>
          <SectionCardTitle icon={<Tag className="h-4 w-4" />}>Canal de venda</SectionCardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={canal} onValueChange={(v) => setValue("canal", v as Canal)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="shopee">{CANAL_LABELS.shopee}</TabsTrigger>
              <TabsTrigger value="ml">{CANAL_LABELS.ml}</TabsTrigger>
              <TabsTrigger value="propria">{CANAL_LABELS.propria}</TabsTrigger>
            </TabsList>
          </Tabs>

          {canal === "shopee" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tipo de vendedor">
                <Select
                  value={watch("shopee.vendedor")}
                  onValueChange={(v) => setValue("shopee.vendedor", v as "cpf" | "cnpj")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Frete Grátis? (+6%)">
                <div className="flex h-9 items-center gap-2">
                  <Switch
                    checked={freteGratis}
                    onCheckedChange={(c) => setValue("shopee.freteGratis", c)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {freteGratis ? "Sim" : "Não"}
                  </span>
                </div>
              </Field>
              <NumberField label="ROAS Ads (0 se não usar)" name="shopee.roas" min={0} />
            </div>
          )}

          {canal === "ml" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Vendedor">
                <Select
                  value={watch("ml.vendedor")}
                  onValueChange={(v) => setValue("ml.vendedor", v as "mei" | "simples")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mei">MEI</SelectItem>
                    <SelectItem value="simples">Simples</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Anúncio">
                <Select
                  value={watch("ml.plano")}
                  onValueChange={(v) => setValue("ml.plano", v as "classico" | "premium")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classico">Clássico</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <NumberField label="Preço estimado (R$)" name="ml.precoRef" min={0} />
            </div>
          )}

          {canal === "propria" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tributação">
                <Select
                  value={watch("propria.vendedor")}
                  onValueChange={(v) => setValue("propria.vendedor", v as "pf" | "mei")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pf">Pessoa Física (PF)</SelectItem>
                    <SelectItem value="mei">MEI</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <NumberField label="Custo de frete/pedido (R$)" name="propria.custoFrete" min={0} />
            </div>
          )}

          <InfoBox>{channelInfoText}</InfoBox>
        </CardContent>
      </Card>

      {/* 2. Impressora & Depreciação */}
      <Card>
        <CardHeader>
          <SectionCardTitle icon={<Printer className="h-4 w-4" />}>
            Impressora &amp; Depreciação
          </SectionCardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Impressora">
            <Select
              value={chave}
              onValueChange={(v) => setValue("impressora.chave", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRINTER_GROUPS.map((g) => (
                  <SelectGroup key={g.key}>
                    <SelectLabel>{g.label}</SelectLabel>
                    {PRINTERS.filter((p) => p.grupo === g.key).map((p) => (
                      <SelectItem key={p.chave} value={p.chave}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
                <SelectGroup>
                  <SelectLabel>⚙️ Personalizada</SelectLabel>
                  <SelectItem value={CUSTOM_PRINTER_KEY}>Outra (personalizada)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          {isCustom && (
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Valor pago (R$)" name="impressora.valorCustom" min={0} />
              <NumberField
                label="Vida útil (meses)"
                name="impressora.vidaUtilCustom"
                min={1}
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Horas de impressão por mês"
              name="horasMes"
              min={1}
              hint="Padrão: 200"
            />
            <NumberField
              label="⚠️ Coeficiente de falha (%)"
              name="coefFalha"
              min={0}
              hint="Padrão: 10%"
            />
          </div>

          <div className="grid gap-3 rounded-lg border border-border bg-secondary/40 p-3 text-sm sm:grid-cols-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Depreciação mensal</span>
              <span className="font-medium">{formatBRL(deprecMensal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Depreciação por hora</span>
              <span className="font-medium">{formatBRL(deprecHora)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Material & Energia */}
      <Card>
        <CardHeader>
          <SectionCardTitle icon={<Spool className="h-4 w-4" />}>Material &amp; Energia</SectionCardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField label="Preço filamento/resina (R$/kg)" name="precoFilamento" min={0} />
          <NumberField label="Peso da peça (g)" name="pesoPeca" min={0} />
          <NumberField
            label="Consumo (Watts)"
            name="consumoWatts"
            min={0}
            hint="Autopreenchido pela impressora"
          />
          <NumberField label="Tempo de impressão (h)" name="tempoImpressao" min={0} />
          <NumberField label="Custo kWh (R$)" name="custoKwh" min={0} hint="Padrão: 0,83" />
        </CardContent>
      </Card>

      {/* 4. Acabamento & Pintura */}
      <Card>
        <CardHeader>
          <SectionCardTitle icon={<Paintbrush className="h-4 w-4" />}>
            Acabamento &amp; Pintura
          </SectionCardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex items-center gap-3">
              <Switch
                checked={acabamentoOn}
                onCheckedChange={(c) => setValue("acabamento.ativo", c)}
              />
              <span className="text-sm font-medium">Inclui acabamento?</span>
            </div>
            {acabamentoOn && (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <NumberField label="Tempo (h)" name="acabamento.tempo" min={0} />
                <NumberField label="Custo/hora (R$)" name="acabamento.custoHora" min={0} />
              </div>
            )}
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-3">
              <Switch checked={pinturaOn} onCheckedChange={(c) => setValue("pintura.ativo", c)} />
              <span className="text-sm font-medium">Inclui pintura?</span>
            </div>
            {pinturaOn && (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <NumberField label="Tempo (h)" name="pintura.tempo" min={0} />
                <NumberField label="Custo/hora (R$)" name="pintura.custoHora" min={0} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 5. Logística & CEP */}
      <Card>
        <CardHeader>
          <SectionCardTitle icon={<MapPin className="h-4 w-4" />}>Logística &amp; CEP</SectionCardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={useCep} onCheckedChange={setUseCep} />
            <span className="text-sm font-medium">Descobrir distância usando CEP?</span>
          </div>

          {useCep && (
            <div className="space-y-3 rounded-lg border border-border bg-secondary/40 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="CEP de origem">
                  <Input
                    value={cep.cep_origem}
                    onChange={(e) => setCep((p) => ({ ...p, cep_origem: e.target.value }))}
                    placeholder="00000-000"
                  />
                </Field>
                <Field label="Nº origem">
                  <Input
                    value={cep.num_origem}
                    onChange={(e) => setCep((p) => ({ ...p, num_origem: e.target.value }))}
                  />
                </Field>
                <Field label="CEP de destino">
                  <Input
                    value={cep.cep_destino}
                    onChange={(e) => setCep((p) => ({ ...p, cep_destino: e.target.value }))}
                    placeholder="00000-000"
                  />
                </Field>
                <Field label="Nº destino">
                  <Input
                    value={cep.num_destino}
                    onChange={(e) => setCep((p) => ({ ...p, num_destino: e.target.value }))}
                  />
                </Field>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => distanceMutation.mutate()}
                disabled={distanceMutation.isPending}
              >
                {distanceMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Calcular Rota
              </Button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumberField label="Distância (km, ida)" name="logistica.distancia" min={0} />
            <NumberField label="Consumo carro (km/l)" name="logistica.consumoCarro" min={0} />
            <NumberField
              label="Preço combustível (R$/l)"
              name="logistica.precoCombustivel"
              min={0}
              hint="Padrão: 6,49"
            />
            <NumberField label="Custo embalagem/pedido (R$)" name="logistica.custoEmbalagem" min={0} />
            <NumberField label="Mão de obra/peça (R$)" name="logistica.maoObra" min={0} />
          </div>
        </CardContent>
      </Card>

      {/* 6. Margem de Lucro */}
      <Card>
        <CardHeader>
          <SectionCardTitle icon={<Percent className="h-4 w-4" />}>Margem de Lucro</SectionCardTitle>
        </CardHeader>
        <CardContent>
          <NumberField
            label="Margem desejada (%)"
            name="margemLucro"
            min={0}
            hint="Entre 0 e 99"
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* 7. Identificação do produto */}
      <Card>
        <CardHeader>
          <SectionCardTitle icon={<ImageIcon className="h-4 w-4" />}>
            Identificação do Produto (opcional)
          </SectionCardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Link do produto (URL)">
            <Input placeholder="https://..." {...register("link")} />
          </Field>
          {watch("link") && (
            <a
              href={watch("link")}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Abrir link →
            </a>
          )}

          <Field label="Foto (JPG/PNG/WebP, máx. 3MB)">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
            />
            {photoPreview ? (
              <div className="flex items-center gap-3">
                <img
                  src={photoPreview}
                  alt="Prévia"
                  className="h-20 w-20 rounded-lg border border-border object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handlePhoto(null);
                    setValue("foto_url", "");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X className="h-4 w-4" /> Remover
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" /> Selecionar foto
              </Button>
            )}
          </Field>
        </CardContent>
      </Card>

      {/* Ação */}
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={onCalculate} disabled={isCalculating}>
          {isCalculating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="h-4 w-4" />
          )}
          ⚡ Calcular Preço de Venda
        </Button>
      </div>

      {/* Resultado */}
      {result && resultMeta && (
        <div className="space-y-4">
          <ResultPanel
            result={result}
            canal={resultMeta.canal}
            link={resultMeta.link}
            fotoUrl={resultMeta.foto_url}
          />
          <div className="flex flex-wrap gap-3">
            <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
              <Button onClick={() => setSaveOpen(true)}>
                <Save className="h-4 w-4" /> 💾 Salvar este Cálculo
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Salvar cálculo</DialogTitle>
                  <DialogDescription>
                    Dê um nome para identificar este cálculo no histórico.
                  </DialogDescription>
                </DialogHeader>
                <Field label="Nome do cálculo">
                  <Input
                    autoFocus
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Ex.: Vaso geométrico médio"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && saveName.trim()) {
                        onSave(saveName.trim());
                        setSaveOpen(false);
                        setSaveName("");
                      }
                    }}
                  />
                </Field>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    disabled={!saveName.trim() || isSaving}
                    onClick={() => {
                      onSave(saveName.trim());
                      setSaveOpen(false);
                      setSaveName("");
                    }}
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4" /> 🔄 Novo Cálculo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Começar um novo cálculo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O formulário será limpo e o resultado atual descartado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onReset}>Limpar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
