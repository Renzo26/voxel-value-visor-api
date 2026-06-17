import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
_ALGORITHM = "HS256"


class AuthError(Exception):
    """Falha de autenticação (credenciais ou token inválidos)."""


class ConflictError(Exception):
    """Recurso já existe (ex.: username duplicado)."""


def hash_password(password: str) -> str:
    return _pwd.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _pwd.verify(password, password_hash)


def _create_token(payload: dict, ttl_ms: int) -> str:
    now = datetime.now(timezone.utc)
    to_encode = {
        **payload,
        "iat": now,
        "exp": now + timedelta(milliseconds=ttl_ms),
    }
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=_ALGORITHM)


def create_access_token(user_id: uuid.UUID | str, role: str) -> str:
    return _create_token({"sub": str(user_id), "role": role, "type": "access"}, settings.jwt_access_ttl_ms)


def create_refresh_token(user_id: uuid.UUID | str) -> str:
    return _create_token({"sub": str(user_id), "type": "refresh"}, settings.jwt_refresh_ttl_ms)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[_ALGORITHM])
    except JWTError as exc:
        raise AuthError("Token inválido ou expirado") from exc
