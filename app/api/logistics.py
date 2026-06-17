from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.logistics import DistanceRequest, DistanceResponse
from app.services.logistics_service import LogisticsError, calcular_distancia

router = APIRouter(prefix="/logistics", tags=["logistics"])


@router.post("/distance", response_model=DistanceResponse)
async def distance(body: DistanceRequest, _: User = Depends(get_current_user)):
    try:
        result = await calcular_distancia(
            body.cep_origem, body.num_origem, body.cep_destino, body.num_destino
        )
    except LogisticsError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return result
