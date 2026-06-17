from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.api.deps import get_current_user
from app.models.user import User
from app.services.upload_service import UploadError, salvar_foto

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_foto(file: UploadFile, _: User = Depends(get_current_user)):
    try:
        url = await salvar_foto(file)
    except UploadError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return {"url": url}
