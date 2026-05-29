from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.database import get_supabase
import pandas as pd
import io
from datetime import datetime

router = APIRouter(prefix="/api/export", tags=["export"])

@router.get("/reservas")
async def export_reservas():
    """Exportar reservas a Excel"""
    try:
        supabase = get_supabase()
        
        # Obtener reservas
        response = supabase.table("reservations").select("*").execute()
        reservas = response.data
        
        print(f"📊 Reservas encontradas: {len(reservas)}")
        
        if not reservas:
            raise HTTPException(status_code=404, detail="No hay reservas para exportar")
        
        # Crear DataFrame
        df = pd.DataFrame(reservas)
        
        # Seleccionar y renombrar columnas
        columnas = {
            'id': 'ID',
            'guest_name': 'Huésped',
            'guest_email': 'Email',
            'guest_phone': 'Teléfono',
            'room_name': 'Habitación',
            'check_in': 'Check-in',
            'check_out': 'Check-out',
            'total_amount': 'Total',
            'status': 'Estado',
            'channel': 'Canal'
        }
        
        # Filtrar columnas que existen
        columnas_existentes = {k: v for k, v in columnas.items() if k in df.columns}
        df_export = df[list(columnas_existentes.keys())].rename(columns=columnas_existentes)
        
        # Crear archivo Excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df_export.to_excel(writer, sheet_name='Reservas', index=False)
            
            # Ajustar ancho de columnas
            worksheet = writer.sheets['Reservas']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 30)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={"Content-Disposition": f"attachment; filename=reservas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"}
        )
        
    except Exception as e:
        print(f"❌ Error exportando reservas: {e}")
        raise HTTPException(status_code=500, detail=f"Error al exportar: {str(e)}")


@router.get("/habitaciones")
async def export_habitaciones():
    """Exportar habitaciones a Excel"""
    try:
        supabase = get_supabase()
        
        # Obtener habitaciones
        response = supabase.table("rooms").select("*").execute()
        habitaciones = response.data
        
        print(f"📊 Habitaciones encontradas: {len(habitaciones)}")
        
        if not habitaciones:
            raise HTTPException(status_code=404, detail="No hay habitaciones para exportar")
        
        # Crear DataFrame
        df = pd.DataFrame(habitaciones)
        
        # Seleccionar y renombrar columnas
        columnas = {
            'id': 'ID',
            'name': 'Nombre',
            'type': 'Tipo',
            'base_price': 'Precio Base',
            'status': 'Estado'
        }
        
        # Filtrar columnas que existen
        columnas_existentes = {k: v for k, v in columnas.items() if k in df.columns}
        df_export = df[list(columnas_existentes.keys())].rename(columns=columnas_existentes)
        
        # Convertir valores para mejor visualización
        if 'Tipo' in df_export.columns:
            df_export['Tipo'] = df_export['Tipo'].map({'private': 'Privada', 'shared': 'Compartida'}).fillna(df_export['Tipo'])
        
        if 'Estado' in df_export.columns:
            df_export['Estado'] = df_export['Estado'].map({'available': 'Disponible', 'occupied': 'Ocupado'}).fillna(df_export['Estado'])
        
        # Crear archivo Excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df_export.to_excel(writer, sheet_name='Habitaciones', index=False)
            
            # Ajustar ancho de columnas
            worksheet = writer.sheets['Habitaciones']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 30)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={"Content-Disposition": f"attachment; filename=habitaciones_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"}
        )
        
    except Exception as e:
        print(f"❌ Error exportando habitaciones: {e}")
        raise HTTPException(status_code=500, detail=f"Error al exportar: {str(e)}")