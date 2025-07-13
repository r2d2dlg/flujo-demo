from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    department = Column(String)  # e.g., 'Administracion', 'Mercadeo', etc.

class Category(Base):
    __tablename__ = 'categories'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    type = Column(String(10), nullable=False)  # 'income' or 'expense'
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    cash_flows = relationship('CashFlow', backref='category', lazy=True)

class CashFlow(Base):
    __tablename__ = 'cash_flows'
    
    id = Column(Integer, primary_key=True)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String(200))
    date = Column(Date, nullable=False)
    type = Column(String(10), nullable=False)  # 'income' or 'expense'
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProyeccionLinea(Base):
    __tablename__ = 'f_proyeccion_linea'
    id = Column(Integer, primary_key=True)
    fecha = Column(Date, nullable=False, unique=True)
    utilizado = Column(Integer, default=0)
    linea_credito_fase2 = Column(Integer, default=0)
    linea_credito_fase3 = Column(Integer, default=0)
    disponible = Column(Integer) 