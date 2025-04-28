from datetime import datetime
from importlib import metadata
from pytest import Session
from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Table, Text, select
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker,relationship
from sqlalchemy import create_engine

DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

class CategoryInfo(Base):
    __tablename__ = "category_info"
    tablename = Column(String, primary_key=True)
    tablefields = Column(JSON)  # Stores list of {name, type}

class User(Base):
    __tablename__ = "users"
    username = Column(String, primary_key=True)
    mail = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)


Base.metadata.create_all(bind=engine)

# Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

