import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.models.calculation import Calculation
from app.models.user import User
from app.schemas.calculation import CalcInputs, CalcResult, CalculationIn, CalculationOut
from app.services.pricing_service import PricingError, calcular

router = APIRouter(prefix="/calculations", tags=["calculations"])


@router.post("/calculate", response_model=CalcResult)
async def calculate(body: CalcInputs, _: User = Depends(get_current_user)):
    try:
        return calcular(body)
    except PricingError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("", response_model=list[CalculationOut])
async def list_calculations(
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    result = await db.scalars(
        select(Calculation)
        .where(Calculation.user_id == user.id)
        .order_by(Calculation.created_at.desc())
    )
    return result.all()


@router.post("", response_model=CalculationOut, status_code=status.HTTP_201_CREATED)
async def save_calculation(
    body: CalculationIn,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    calc = Calculation(
        user_id=user.id,
        nome=body.nome,
        canal=body.canal,
        inputs=body.inputs,
        resultado=body.resultado,
        link=body.link,
        foto_url=body.foto_url,
    )
    db.add(calc)
    await db.commit()
    await db.refresh(calc)
    return calc


@router.delete("/{calc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calculation(
    calc_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    calc = await db.scalar(
        select(Calculation).where(Calculation.id == calc_id, Calculation.user_id == user.id)
    )
    if not calc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cálculo não encontrado")
    await db.delete(calc)
    await db.commit()
