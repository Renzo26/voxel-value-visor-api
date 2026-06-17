"""
Lógica de precificação para impressão 3D.

Portada fielmente da calculadora HTML v2.6 (canais Shopee, Mercado Livre e
Entrega Própria), incluindo a resolução iterativa do preço de venda quando a
taxa do canal depende do próprio preço (faixas escalonadas).
"""
import math

from app.schemas.calculation import CalcInputs, CalcResult

# chave -> (preço R$, vida útil meses, watts)
IMPRESSORAS: dict[str, dict] = {
    "ender3":         {"preco": 1259,  "meses": 36, "watts": 270},
    "ender3v2neo":    {"preco": 1299,  "meses": 36, "watts": 350},
    "ender3s1":       {"preco": 1399,  "meses": 36, "watts": 350},
    "ender3v3se":     {"preco": 1599,  "meses": 36, "watts": 350},
    "sovol":          {"preco": 1899,  "meses": 36, "watts": 500},
    "elegoomars5":    {"preco": 2599,  "meses": 48, "watts": 50},
    "k1se":           {"preco": 2299,  "meses": 48, "watts": 350},
    "bambuA1":        {"preco": 3189,  "meses": 48, "watts": 150},
    "ender3v3plus":   {"preco": 3554,  "meses": 48, "watts": 350},
    "elegoocentauri": {"preco": 3299,  "meses": 48, "watts": 300},
    "bambuA1combo":   {"preco": 5760,  "meses": 48, "watts": 150},
    "k1max":          {"preco": 5299,  "meses": 48, "watts": 800},
    "bambuP1S":       {"preco": 14066, "meses": 60, "watts": 300},
    "bambuk2plus":    {"preco": 9999,  "meses": 60, "watts": 800},
}


class PricingError(Exception):
    """Entrada inválida para o cálculo (ex.: margem >= 100%)."""


# ─────────────────────────── Formatação pt-BR ───────────────────────────
def fmt(v: float) -> str:
    s = f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {s}"


def pct(v: float) -> str:
    return f"{v:.1f}%"


def _ceil2(v: float) -> float:
    return math.ceil(v * 100) / 100


# ─────────────────────────── Shopee ───────────────────────────
def _shopee_comissao(preco: float, vendedor: str, frete_gratis: bool) -> dict:
    if preco < 80:
        pct_val, fixo = 0.20, (7 if vendedor == "cpf" else 4)
    elif preco < 100:
        pct_val, fixo = 0.14, (19 if vendedor == "cpf" else 16)
    elif preco < 200:
        pct_val, fixo = 0.14, (23 if vendedor == "cpf" else 20)
    else:
        pct_val, fixo = 0.14, (29 if vendedor == "cpf" else 26)
    if frete_gratis:
        pct_val += 0.06
    return {"pct": pct_val, "fixo": fixo, "total": preco * pct_val + fixo}


# ─────────────────────────── Mercado Livre ───────────────────────────
def _ml_taxa_fixa(preco: float) -> float:
    if preco <= 12.50:
        return preco * 0.5
    if preco <= 29.00:
        return 6.25
    if preco <= 50.00:
        return 6.50
    if preco <= 78.99:
        return 6.75
    return 0.0


def _ml_comissao_pct(plano: str) -> float:
    return 0.125 if plano == "classico" else 0.175


# ─────────────────────────── Cálculo principal ───────────────────────────
def calcular(inp: CalcInputs) -> CalcResult:
    # Depreciação por hora
    custo_depre_hora = 0.0
    chave = inp.impressora.chave
    if chave == "custom":
        vida = inp.impressora.vidaUtilCustom or 36
        custo_depre_hora = (inp.impressora.valorCustom / vida) / (inp.horasMes or 200)
    elif chave in IMPRESSORAS:
        imp = IMPRESSORAS[chave]
        custo_depre_hora = (imp["preco"] / imp["meses"]) / (inp.horasMes or 200)

    # Custos
    custo_material = (inp.precoFilamento / 1000) * inp.pesoPeca
    custo_energia = (inp.consumoWatts / 1000) * inp.tempoImpressao * inp.custoKwh
    custo_depre = custo_depre_hora * inp.tempoImpressao
    custo_acabamento = inp.acabamento.tempo * inp.acabamento.custoHora if inp.acabamento.ativo else 0.0
    custo_pintura = inp.pintura.tempo * inp.pintura.custoHora if inp.pintura.ativo else 0.0

    custo_logistica = 0.0
    if inp.logistica.distancia > 0 and inp.logistica.consumoCarro > 0:
        custo_logistica = (inp.logistica.distancia / inp.logistica.consumoCarro) * inp.logistica.precoCombustivel * 2

    custo_base = (
        custo_material + custo_energia + custo_depre + custo_acabamento
        + custo_pintura + custo_logistica + inp.logistica.custoEmbalagem + inp.logistica.maoObra
    )

    custo_ajustado = custo_base * (1 + inp.coefFalha / 100)

    if inp.margemLucro >= 100:
        raise PricingError("Margem não pode ser 100% ou mais.")
    margem_fator = 1 - (inp.margemLucro / 100)

    # Canal de venda
    detalhes_canal: dict = {}
    if inp.canal == "shopee":
        roas = inp.shopee.roas
        p = custo_ajustado / margem_fator
        for _ in range(20):
            com = _shopee_comissao(p, inp.shopee.vendedor, inp.shopee.freteGratis)
            ads = p / roas if roas > 0 else 0
            denom = 1 - com["pct"] - (1 / roas if roas > 0 else 0) - (inp.margemLucro / 100)
            p = (custo_ajustado + com["fixo"] + ads) / denom
        preco_final = _ceil2(p)
        com = _shopee_comissao(preco_final, inp.shopee.vendedor, inp.shopee.freteGratis)
        ads = preco_final / roas if roas > 0 else 0
        taxa_canal = com["total"] + ads
        detalhes_canal = {"shopee": {
            "comissaoPct": pct(com["pct"] * 100),
            "taxaFixa": fmt(com["fixo"]),
            "totalComissao": fmt(com["total"]),
            "custoAds": fmt(ads),
        }}
    elif inp.canal == "ml":
        com_pct = _ml_comissao_pct(inp.ml.plano)
        p = custo_ajustado / margem_fator
        for _ in range(20):
            fixo = _ml_taxa_fixa(p)
            p = (custo_ajustado + fixo) / (1 - com_pct - (inp.margemLucro / 100))
        preco_final = _ceil2(p)
        fixo = _ml_taxa_fixa(preco_final)
        taxa_canal = preco_final * com_pct + fixo
        detalhes_canal = {"ml": {
            "plano": "Clássico" if inp.ml.plano == "classico" else "Premium",
            "comissaoPct": pct(com_pct * 100),
            "taxaFixa": fmt(fixo),
            "totalComissao": fmt(taxa_canal),
        }}
    else:  # propria
        preco_final = _ceil2(custo_ajustado / margem_fator)
        taxa_canal = inp.propria.custoFrete
        detalhes_canal = {"propria": {
            "tributacao": "Pessoa Física" if inp.propria.vendedor == "pf" else "MEI",
            "custoFrete": fmt(inp.propria.custoFrete),
        }}

    lucro_final = preco_final - custo_ajustado - taxa_canal
    margem_real = (lucro_final / preco_final) * 100 if preco_final > 0 else 0

    return CalcResult(
        precoFinal=round(preco_final, 2),
        lucroFinal=round(lucro_final, 2),
        custoTotal=round(custo_ajustado, 2),
        margemReal=round(margem_real, 2),
        taxaCanal=round(taxa_canal, 2),
        custos={
            "material": round(custo_material, 2),
            "energia": round(custo_energia, 2),
            "depreciacao": round(custo_depre, 2),
            "acabamento": round(custo_acabamento, 2),
            "pintura": round(custo_pintura, 2),
            "logistica": round(custo_logistica, 2),
            "embalagem": round(inp.logistica.custoEmbalagem, 2),
            "maoObra": round(inp.logistica.maoObra, 2),
            "ajusteFalha": round(custo_ajustado - custo_base, 2),
        },
        detalhesCanal=detalhes_canal,
    )
