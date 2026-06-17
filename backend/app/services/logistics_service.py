"""Cálculo de distância entre dois CEPs (ViaCEP + Nominatim + Haversine)."""
import math

import httpx

_NOMINATIM_HEADERS = {"User-Agent": "calculadora-3d/1.0 (precificacao)"}


class LogisticsError(Exception):
    """Falha ao resolver CEP / geocodificar endereço."""


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def _coordenadas(client: httpx.AsyncClient, cep: str, numero: str | None) -> tuple[float, float, str]:
    cep_limpo = "".join(ch for ch in cep if ch.isdigit())
    if len(cep_limpo) != 8:
        raise LogisticsError(f"CEP inválido: {cep}. Deve ter 8 dígitos.")

    via = (await client.get(f"https://viacep.com.br/ws/{cep_limpo}/json/")).json()
    if via.get("erro"):
        raise LogisticsError(f"CEP {cep} não encontrado.")

    partes = [via.get("logradouro", "")]
    if numero:
        partes.append(numero)
    partes += [via.get("localidade", ""), via.get("uf", ""), "Brasil"]
    endereco = ", ".join(p for p in partes if p)

    geo = (
        await client.get(
            "https://nominatim.openstreetmap.org/search",
            params={"format": "json", "q": endereco, "limit": 1},
            headers=_NOMINATIM_HEADERS,
        )
    ).json()
    if not geo:
        raise LogisticsError(f"Não foi possível geocodificar: {endereco}")
    return float(geo[0]["lat"]), float(geo[0]["lon"]), endereco


async def calcular_distancia(
    cep_origem: str, num_origem: str | None, cep_destino: str, num_destino: str | None
) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        lat1, lon1, end1 = await _coordenadas(client, cep_origem, num_origem)
        lat2, lon2, end2 = await _coordenadas(client, cep_destino, num_destino)
    dist = _haversine(lat1, lon1, lat2, lon2)
    return {"distancia_km": round(dist, 1), "origem": end1, "destino": end2}
