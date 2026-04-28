from passlib.context import CryptContext

# Use pbkdf2_sha256 to avoid bcrypt backend issues on Windows/Python 3.14
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"], #what we are currently using for hashing
    deprecated="auto", #anything else is considered deprecated
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)
