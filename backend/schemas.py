from datetime import date, datetime
from pydantic import BaseModel
from typing import Any, List, Dict, Literal,Optional

from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String

class FieldDefinition(BaseModel):
    name: str
    type: Literal["string", "integer", "float", "boolean", "date"]

class CategoryCreate(BaseModel):
    category_name: str
    fields: List[FieldDefinition]

class FieldDeleteRequest(BaseModel):
    category_name: str
    field_name: str

class CategoryDelete(BaseModel):
    category_name: str

class AssetInput(BaseModel):
    table_name: str
    data: Dict[str, Any]

class ReassignAssetInput(BaseModel):
    table_name: str
    identifier: str  
    user_name: Optional[str] = None
    user_id: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    section: Optional[str] = None
    date_of_return: Optional[date] = None
    date_of_reassign: Optional[date] = None
    date_of_update: Optional[date] = None
    remarks: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role:str

class UserCreate(BaseModel):
    username: str
    mail: str
    password: str
    role: str = "User"

class UserLogin(BaseModel):
    mail: str
    password: str


    class Config:
        orm_mode = True

