from fastapi import APIRouter
from app.database import get_supabase
import pandas as pd
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/ocupacion-historica")
async def get_historical_occupancy(months: int = 6):
    """Ocupación histórica de los últimos N meses"""
    supabase = get_supabase()
    reservas = supabase.table("reservations").select("*").execute()
    df = pd.DataFrame(reservas.data)
    
    if df.empty:
        return {"fechas": [], "ocupacion": []}
    
    df['check_in'] = pd.to_datetime(df['check_in'])
    df['mes'] = df['check_in'].dt.to_period('M')
    
    ocupacion_mensual = df.groupby('mes').size().reset_index(name='count')
    
    return {
        "meses": [str(m) for m in ocupacion_mensual['mes'].tolist()],
        "ocupacion": ocupacion_mensual['count'].tolist()
    }

@router.get("/top-huespedes")
async def get_top_guests(limit: int = 10):
    """Top huéspedes que más han gastado"""
    supabase = get_supabase()
    reservas = supabase.table("reservations").select("*").execute()
    df = pd.DataFrame(reservas.data)
    
    if df.empty:
        return {"huespedes": [], "gastos": []}
    
    top = df.groupby('guest_name')['total_amount'].sum().nlargest(limit).reset_index()
    
    return {
        "huespedes": top['guest_name'].tolist(),
        "gastos": top['total_amount'].tolist()
    }

@router.get("/ingresos-por-habitacion")
async def get_revenue_by_room():
    """Ingresos generados por cada habitación"""
    supabase = get_supabase()
    reservas = supabase.table("reservations").select("*").execute()
    df = pd.DataFrame(reservas.data)
    
    if df.empty:
        return {"habitaciones": [], "ingresos": []}
    
    ingresos = df.groupby('room_name')['total_amount'].sum().reset_index()
    ingresos = ingresos.sort_values('total_amount', ascending=False)
    
    return {
        "habitaciones": ingresos['room_name'].tolist(),
        "ingresos": ingresos['total_amount'].tolist()
    }