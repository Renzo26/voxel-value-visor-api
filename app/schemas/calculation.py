import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# ─────────────────────────── Inputs do cálculo ───────────────────────────
class ShopeeInput(BaseModel):
    vendedor: Literal["cpf", "cnpj"] = "cpf"
    freteGratis: bool = False
    roas: float = 0


class MLInput(BaseModel):
    vendedor: Literal["mei", "simples"] = "mei"
    plano: Literal["classico", "premium"] = "classico"
    precoRef: float = 0


class PropriaInput(BaseModel):
    vendedor: Literal["pf", "mei"] = "pf"
    custoFrete: float = 0


class ImpressoraInput(BaseModel):
    chave: str = ""
    valorCustom: float = 0
    vidaUtilCustom: float = 36


class ExtraInput(BaseModel):
    ativo: bool = False
    tempo: float = 0
    custoHora: float = 0


class LogisticaInput(BaseModel):
    distancia: float = 0
    consumoCarro: float = 0
    precoCombustivel: float = 6.49
    custoEmbalagem: float = 0
    maoObra: float = 0


class CalcInputs(BaseModel):
    canal: Literal["shopee", "ml", "propria"]
    shopee: ShopeeInput = Field(default_factory=ShopeeInput)
    ml: MLInput = Field(default_factory=MLInput)
    propria: PropriaInput = Field(default_factory=PropriaInput)
    impressora: ImpressoraInput = Field(default_factory=ImpressoraInput)
    horasMes: float = 200
    coefFalha: float = 0
    precoFilamento: float = 0
    pesoPeca: float = 0
    consumoWatts: float = 0
    tempoImpressao: float = 0
    custoKwh: float = 0.83
    acabamento: ExtraInput = Field(default_factory=ExtraInput)
    pintura: ExtraInput = Field(default_factory=ExtraInput)
    logistica: LogisticaInput = Field(default_factory=LogisticaInput)
    margemLucro: float = 0
    # Identificação do produto (não entra no cálculo, mas o front mantém no form)
    link: Optional[str] = None
    foto_url: Optional[str] = None


# ─────────────────────────── Resultado do cálculo ───────────────────────────
class CalcCustos(BaseModel):
    material: float
    energia: float
    depreciacao: float
    acabamento: float
    pintura: float
    logistica: float
    embalagem: float
    maoObra: float
    ajusteFalha: float


class CalcResult(BaseModel):
    precoFinal: float
    lucroFinal: float
    custoTotal: float
    margemReal: float
    taxaCanal: float
    custos: CalcCustos
    detalhesCanal: dict


# ─────────────────────────── Histórico ───────────────────────────
class CalculationIn(BaseModel):
    nome: str = Field(min_length=1, max_length=80)
    canal: Literal["shopee", "ml", "propria"]
    inputs: dict
    resultado: dict
    link: Optional[str] = None
    foto_url: Optional[str] = None


class CalculationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nome: str
    canal: str
    inputs: dict
    resultado: dict
    link: Optional[str] = None
    foto_url: Optional[str] = None
    created_at: datetime
