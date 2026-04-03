import hashlib
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import settings


def _derive_user_key(user_id: str) -> bytes:
    master = settings.ENCRYPTION_MASTER_KEY.encode()
    return hashlib.pbkdf2_hmac("sha256", master, user_id.encode(), 100_000)


def encrypt_value(plaintext: str, user_id: str) -> tuple[bytes, bytes, bytes]:
    key = _derive_user_key(user_id)
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ct_with_tag = aesgcm.encrypt(nonce, plaintext.encode(), None)
    ciphertext = ct_with_tag[:-16]
    tag = ct_with_tag[-16:]
    return ciphertext, nonce, tag


def decrypt_value(ciphertext: bytes, nonce: bytes, tag: bytes, user_id: str) -> str:
    key = _derive_user_key(user_id)
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(nonce, ciphertext + tag, None)
    return plaintext.decode()
