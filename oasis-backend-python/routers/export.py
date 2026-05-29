from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.database import get_supabase
import pandas as pd
import io
from datetime import datetime

router = APIRouter(prefix="/api/export", tags=["export"])

@router.get("/reservas")
async def export_reservas():
    """Exportar reservas a Excel"""
    supabase = get_supabase()
    reservas = supabase.table("reservations").select("*").execute()
    df = pd.DataFrame(reservas.data)
    
    if df.empty:
        raise HTTPException(status_code=404, detail="No hay reservas para exportar")
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Reservas', index=False)
    
    output.seek(0)
    
    return FileResponse(
        path=output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename=f'reservas_{datetime.now().strftime("%Y%m%d")}.xlsx'
    )

@router.get("/habitaciones")
async def export_habitaciones():
    """Exportar habitaciones a Excel"""
    supabase = get_supabase()
    habitaciones = supabase.table("rooms").select("*").execute()
    df = pd.DataFrame(habitaciones.data)
    
    if df.empty:
        raise HTTPException(status_code=404, detail="No hay habitaciones para exportar")
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Habitaciones', index=False)
    
    output.seek(0)
    
    return FileResponse(
        path=output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename=f'habitaciones_{datetime.now().strftime("%Y%m%d")}.xlsx'
    )