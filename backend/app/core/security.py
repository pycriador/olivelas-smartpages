"""
Security utilities: Password hashing, JWT token handling, API Key hashing and validation.
Follows Loft Security Specifications.
"""
from __future__ import annotations

import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple
import bcrypt
from cryptography.fernet import Fernet, InvalidToken
import jwt

from app.core.config import settings
from app.core.errors import AuthenticationError


def _get_fernet() -> Fernet:
    """Derives a deterministic 32-byte url-safe base64 Fernet key from settings.SECRET_KEY."""
    digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    fernet_key = base64.urlsafe_b64encode(digest)
    return Fernet(fernet_key)


def encrypt_secret(plain_text: Optional[str]) -> Optional[str]:
    """Encrypts a sensitive string (API key or Git token) for secure storage at rest."""
    if not plain_text:
        return plain_text
    try:
        f = _get_fernet()
        if plain_text.startswith("gAAAAA"):
            f.decrypt(plain_text.encode("utf-8"))
            return plain_text
    except Exception:
        pass
    f = _get_fernet()
    return f.encrypt(plain_text.encode("utf-8")).decode("utf-8")


def decrypt_secret(cipher_text: Optional[str]) -> Optional[str]:
    """Decrypts a Fernet-encrypted secret string. Falls back to raw string if not encrypted."""
    if not cipher_text:
        return cipher_text
    try:
        f = _get_fernet()
        return f.decrypt(cipher_text.encode("utf-8")).decode("utf-8")
    except (InvalidToken, Exception):
        return cipher_text


def hash_password(password: str) -> str:
    """Hashes a raw password using bcrypt."""
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(
    subject: str,
    claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Creates a signed JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "iat": now.timestamp(),
        "exp": expire.timestamp(),
    }
    if claims:
        to_encode.update(claims)

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token expired. Please log in again.")
    except jwt.InvalidTokenError as e:
        raise AuthenticationError(f"Invalid authentication token: {str(e)}")


def generate_api_key(token_type: str = "deploy") -> Tuple[str, str, str]:
    """
    Generates a secure API key with high entropy.
    Returns: (raw_secret, key_prefix, key_hash)
    Example raw_secret: opsp_deploy_8f9c2d1e_...
    """
    random_part = secrets.token_urlsafe(32).replace("-", "").replace("_", "")
    prefix = f"opsp_{token_type}_{random_part[:8]}"
    raw_secret = f"{prefix}_{random_part[8:]}"
    key_hash = hash_api_key(raw_secret)
    return raw_secret, prefix, key_hash


def hash_api_key(raw_secret: str) -> str:
    """Hashes an API key using SHA-256 for secure storage."""
    return hashlib.sha256(raw_secret.encode("utf-8")).hexdigest()
