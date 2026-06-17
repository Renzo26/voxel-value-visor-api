from typing import Optional

from pydantic import BaseModel


class DistanceRequest(BaseModel):
    cep_origem: str
    num_origem: Optional[str] = None
    cep_destino: str
    num_destino: Optional[str] = None


class DistanceResponse(BaseModel):
    distancia_km: float
    origem: str
    destino: str
