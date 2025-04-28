from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from models import User, get_db
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from jose.exceptions import JWTError
from jose import jwt

# Secret and hashing
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme),db:Session=Depends(get_db)):
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(User).filter(User.mail == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user

def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return user
    


# Registration Logic
def register_user(data, db: Session):
    # Check if the user already exists based on email
    existing_user = db.query(User).filter(User.mail == data.mail).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    # Hash the password before storing it
    hashed_password = get_password_hash(data.password)

    # Create the new user object
    new_user = User(
        username=data.username,
        mail=data.mail,
        role=data.role,
        hashed_password=hashed_password
    )

    # Add the new user to the database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Return success message
    return {"message": "User registered successfully"}

# Login Logic
def login_user(form_data, db: Session):
    user = db.query(User).filter(User.mail == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token_data = {
        "sub": user.mail,
        "role": user.role,
        "username": user.username
    }
    token = create_access_token(token_data, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer", "role": user.role}

