import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ClipboardList } from "lucide-react";

import { api } from "@/lib/api";
import type { CalcInputs, CalcResult, Canal, SavedCalculation } from "@/lib/types";
import { DEFAULT_INPUTS } from "@/lib/calc-defaults";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculatorForm } from "@/components/calc/CalculatorForm";
import { HistoryPanel } from "@/components/calc/HistoryPanel";

type Tab = "novo" | "historico";

export const Route = createFileRoute("/app/calculadora")({
  head: () => ({ meta: [{ title: "Calculadora — Precificação 3D" }] }),
  validateSearch: (search: Record<string, unknown>): { tab: Tab } => ({
    tab: search.tab === "historico" ? "historico" : "novo",
  }),
  component: CalculadoraPage,
});

// converte NaN -> 0 recursivamente (inputs numéricos vazios)
function sanitize<T>(value: T): T {
  if (typeof value === "number") {
    return (Number.isFinite(value) ? value : 0) as T;
  }
  if (Array.isArray(value)) {
    return value.map(sanitize) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitize(v);
    }
    return out as T;
  }
  return value;
}

function buildCalcPayload(values: CalcInputs): CalcInputs {
  const clean = sanitize(values);
  // remove campos de identificação (não fazem parte do cálculo)
  const { link, foto_url, ...calc } = clean;
  void link;
  void foto_url;
  return calc as CalcInputs;
}

function CalculadoraPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tab } = Route.useSearch();

  const methods = useForm<CalcInputs>({ defaultValues: DEFAULT_INPUTS });

  const [result, setResult] = useState<CalcResult | null>(null);
  const [resultMeta, setResultMeta] = useState<{
    canal: Canal;
    link?: string;
    foto_url?: string;
  } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const setTab = (next: Tab) =>
    navigate({ to: "/app/calculadora", search: { tab: next } });

  const calcMutation = useMutation({
    mutationFn: (payload: CalcInputs) =>
      api.post<CalcResult>("/calculations/calculate", payload),
    onSuccess: (data, payload) => {
      setResult(data);
      const values = methods.getValues();
      setResultMeta({
        canal: payload.canal,
        link: values.link || undefined,
        foto_url: photoFile ? URL.createObjectURL(photoFile) : values.foto_url || undefined,
      });
      toast.success("Cálculo realizado!");
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao calcular."),
  });

  const runCalculate = (values: CalcInputs) => {
    if ((Number(values.margemLucro) || 0) >= 100) {
      toast.error("A margem de lucro deve ser menor que 100%.");
      return;
    }
    calcMutation.mutate(buildCalcPayload(values));
  };

  const handleCalculate = () => {
    runCalculate(methods.getValues());
  };

  const saveMutation = useMutation({
    mutationFn: async (nome: string) => {
      const values = methods.getValues();
      let foto_url = values.foto_url || undefined;
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const up = await api.post<{ url: string }>("/uploads", fd, { isFormData: true });
        foto_url = up.url;
      }
      return api.post<SavedCalculation>("/calculations", {
        nome,
        canal: values.canal,
        inputs: buildCalcPayload(values),
        resultado: result,
        link: values.link || null,
        foto_url: foto_url || null,
      });
    },
    onSuccess: () => {
      toast.success("Cálculo salvo no histórico!");
      queryClient.invalidateQueries({ queryKey: ["calculations"] });
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao salvar."),
  });

  const historyQuery = useQuery({
    queryKey: ["calculations"],
    queryFn: () => api.get<SavedCalculation[]>("/calculations"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => api.delete<void>(`/calculations/${id}`),
    onSuccess: () => {
      toast.success("Cálculo removido.");
      queryClient.invalidateQueries({ queryKey: ["calculations"] });
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao excluir."),
  });

  const handleReset = () => {
    methods.reset(DEFAULT_INPUTS);
    setPhotoFile(null);
    setResult(null);
    setResultMeta(null);
  };

  const handleReload = (item: SavedCalculation) => {
    methods.reset({
      ...DEFAULT_INPUTS,
      ...item.inputs,
      link: item.link ?? "",
      foto_url: item.foto_url ?? "",
    });
    setPhotoFile(null);
    setTab("novo");
    runCalculate({
      ...item.inputs,
      link: item.link ?? "",
      foto_url: item.foto_url ?? "",
    } as CalcInputs);
  };

  const historyCount = historyQuery.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gradient">Calculadora de Precificação 3D</h1>
        <p className="text-sm text-muted-foreground">
          Informe os custos de produção e descubra o preço de venda ideal da sua peça.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="novo">
            <Plus className="mr-1 h-4 w-4" /> Novo Cálculo
          </TabsTrigger>
          <TabsTrigger value="historico">
            <ClipboardList className="mr-1 h-4 w-4" /> Histórico
            {historyCount > 0 && (
              <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {historyCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "novo" ? (
        <FormProvider {...methods}>
          <CalculatorForm
            onCalculate={handleCalculate}
            isCalculating={calcMutation.isPending}
            result={result}
            resultMeta={resultMeta}
            photoFile={photoFile}
            onPhotoChange={setPhotoFile}
            onSave={(nome) => saveMutation.mutate(nome)}
            isSaving={saveMutation.isPending}
            onReset={handleReset}
          />
        </FormProvider>
      ) : (
        <HistoryPanel
          items={historyQuery.data ?? []}
          isLoading={historyQuery.isLoading}
          isError={historyQuery.isError}
          errorMessage={(historyQuery.error as Error | null)?.message}
          onReload={handleReload}
          onDelete={(id) => deleteMutation.mutate(id)}
          deletingId={deleteMutation.variables ?? null}
        />
      )}
    </div>
  );
}
