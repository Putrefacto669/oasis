from pydantic import BaseModel
from typing import Optional
from datetime import date

class Reserva(BaseModel):
    id: int
    guest_name: str
    guest_email: str
    room_name: str
    check_in: date
    check_out: date
    total_amount: float
    status: str
    channel: str

class Habitacion(BaseModel):
    id: int
    name: str
    type: str
    base_price: float
    status: str

class ReporteOcupacion(BaseModel):
    fecha: str
    ocupadas: int
    total: int
    porcentaje: float

class ReporteIngresos(BaseModel):
    mes: str
    ingresos: float