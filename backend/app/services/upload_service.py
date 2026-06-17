"""Armazenamento de fotos de produto em disco local, servidas como estáticos."""
import os
import uuid

from fastapi import UploadFile

from app.core.config import get_settings

settings = get_settings()

_ALLOWED = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
_MAX_BYTES = 3 * 1024 * 1024  # 3 MB


class UploadError(Exception):
    """Arquivo inválido (tipo ou tamanho)."""


async def salvar_foto(file: UploadFile) -> str:
    if file.content_type not in _ALLOWED:
        raise UploadError("Formato inválido. Use JPG, PNG ou WebP.")

    conteudo = await file.read()
    if len(conteudo) > _MAX_BYTES:
        raise UploadError("Imagem muito grande. Máximo 3MB.")

    os.makedirs(settings.upload_dir, exist_ok=True)
    nome = f"{uuid.uuid4().hex}{_ALLOWED[file.content_type]}"
    caminho = os.path.join(settings.upload_dir, nome)
    with open(caminho, "wb") as f:
        f.write(conteudo)

    base = settings.public_base_url.rstrip("/")
    return f"{base}/uploads/{nome}"
