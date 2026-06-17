export type Canal = "shopee" | "ml" | "propria";

export interface CalcInputs {
  canal: Canal;
  shopee: { vendedor: "cpf" | "cnpj"; freteGratis: boolean; roas: number };
  ml: { vendedor: "mei" | "simples"; plano: "classico" | "premium"; precoRef: number };
  propria: { vendedor: "pf" | "mei"; custoFrete: number };
  impressora: { chave: string; valorCustom: number; vidaUtilCustom: number };
  horasMes: number;
  coefFalha: number;
  precoFilamento: number;
  pesoPeca: number;
  consumoWatts: number;
  tempoImpressao: number;
  custoKwh: number;
  acabamento: { ativo: boolean; tempo: number; custoHora: number };
  pintura: { ativo: boolean; tempo: number; custoHora: number };
  logistica: {
    distancia: number;
    consumoCarro: number;
    precoCombustivel: number;
    custoEmbalagem: number;
    maoObra: number;
  };
  margemLucro: number;
  // optional product identification (not part of calc, but kept in form)
  link?: string;
  foto_url?: string;
}

export interface CalcCustos {
  material: number;
  energia: number;
  depreciacao: number;
  acabamento: number;
  pintura: number;
  logistica: number;
  embalagem: number;
  maoObra: number;
  ajusteFalha: number;
}

export interface CalcResult {
  precoFinal: number;
  lucroFinal: number;
  custoTotal: number;
  margemReal: number;
  taxaCanal: number;
  custos: CalcCustos;
  detalhesCanal: {
    shopee?: {
      comissaoPct: string;
      taxaFixa: string;
      totalComissao: string;
      custoAds: string;
    };
    ml?: {
      plano: string;
      comissaoPct: string;
      taxaFixa: string;
      totalComissao: string;
    };
    propria?: {
      tributacao: string;
      custoFrete: string;
    };
  };
}

export interface SavedCalculation {
  id: string | number;
  nome: string;
  canal: Canal;
  inputs: CalcInputs;
  resultado: CalcResult;
  link?: string | null;
  foto_url?: string | null;
  created_at?: string;
}

export interface DistanceResult {
  distancia_km: number;
  origem: string;
  destino: string;
}

export const CANAL_LABELS: Record<Canal, string> = {
  shopee: "🟠 Shopee",
  ml: "🟡 Mercado Livre",
  propria: "🟢 Entrega Própria",
};
