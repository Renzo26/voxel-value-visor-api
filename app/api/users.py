import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session, require_master
from app.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.services.auth_service import hash_password

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(require_master)])

PROTECTED_USERNAME = "admin"


@router.get("", response_model=list[UserOut])
async def list_users(db: AsyncSession = Depends(get_session)):
    result = await db.scalars(select(User).order_by(User.created_at))
    return result.all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(body: UserCreate, db: AsyncSession = Depends(get_session)):
    exists = await db.scalar(select(User).where(User.username == body.username))
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Usuário já existe")
    user = User(username=body.username, password_hash=hash_password(body.password), role=body.role)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_session)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    if user.username == PROTECTED_USERNAME:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário protegido não pode ser excluído")
    await db.delete(user)
    await db.commit()
