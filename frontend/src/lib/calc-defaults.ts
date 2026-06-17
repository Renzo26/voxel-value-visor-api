import type { CalcInputs } from "./types";

export const DEFAULT_INPUTS: CalcInputs = {
  canal: "shopee",
  shopee: { vendedor: "cpf", freteGratis: false, roas: 0 },
  ml: { vendedor: "mei", plano: "classico", precoRef: 0 },
  propria: { vendedor: "pf", custoFrete: 0 },
  impressora: { chave: "ender3", valorCustom: 0, vidaUtilCustom: 36 },
  horasMes: 200,
  coefFalha: 10,
  precoFilamento: 0,
  pesoPeca: 0,
  consumoWatts: 270,
  tempoImpressao: 0,
  custoKwh: 0.83,
  acabamento: { ativo: false, tempo: 0, custoHora: 0 },
  pintura: { ativo: false, tempo: 0, custoHora: 0 },
  logistica: {
    distancia: 0,
    consumoCarro: 0,
    precoCombustivel: 6.49,
    custoEmbalagem: 0,
    maoObra: 0,
  },
  margemLucro: 0,
  link: "",
  foto_url: "",
};

export const CHANNEL_INFO = {
  shopeeCpf:
    "Shopee (CPF): comissão de 20% (até R$79) ou 14% (≥R$80); taxa fixa a partir de R$7/item; +6% se Frete Grátis.",
  shopeeCnpj:
    "Shopee (CNPJ): mesma comissão; taxa fixa a partir de R$4/item; +6% se Frete Grátis.",
  ml: "Mercado Livre: Clássico 12,5% ou Premium 17,5% + taxa fixa para produtos ≤ R$79. MEI = DAS R$81,05/mês fixo · Simples ≈ 6% sobre faturamento.",
  propria:
    "Entrega Própria: sem taxa de marketplace. PF pode ser tributado no IRPF · MEI = DAS R$81,05/mês fixo.",
};
