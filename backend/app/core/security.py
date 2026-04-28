from passlib.context import CryptContext

# pbkdf2_sha256: default for new hashes. bcrypt: verify legacy hashes from older stacks.
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256", "bcrypt"], #what we are currently using for hashing
    deprecated="auto", #anything else is considered deprecated
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)
