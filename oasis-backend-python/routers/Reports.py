from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.database import get_supabase
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import io
import os
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/reports", tags=["reports"])

# Configurar estilo de gráficos
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

@router.get("/dashboard")
async def get_dashboard_data():
    """Obtener datos para el dashboard (métricas principales)"""
    supabase = get_supabase()
    
    # Obtener habitaciones
    rooms = supabase.table("rooms").select("*").execute()
    habitaciones = rooms.data
    
    # Obtener reservas
    reservations = supabase.table("reservations").select("*").execute()
    reservas = reservations.data
    
    total_rooms = len(habitaciones)
    occupied_rooms = len([r for r in habitaciones if r.get('status') == 'occupied'])
    occupancy = round((occupied_rooms / total_rooms) * 100) if total_rooms > 0 else 0
    
    today = datetime.now().strftime("%Y-%m-%d")
    arrivals_today = len([r for r in reservas if r.get('check_in') == today and r.get('status') == 'confirmed'])
    
    total_revenue = sum([r.get('total_amount', 0) for r in reservas])
    adr = round(total_revenue / occupied_rooms) if occupied_rooms > 0 else 0
    
    return {
        "occupancy": occupancy,
        "occupied_rooms": occupied_rooms,
        "total_rooms": total_rooms,
        "arrivals_today": arrivals_today,
        "total_revenue": total_revenue,
        "adr": adr
    }

@router.get("/ocupacion-semanal")
async def get_weekly_occupancy():
    """Gráfico de ocupación de los últimos 7 días"""
    supabase = get_supabase()
    reservas = supabase.table("reservations").select("*").execute()
    df = pd.DataFrame(reservas.data)
    
    if df.empty:
        return {"fechas": [], "ocupacion": []}
    
    df['check_in'] = pd.to_datetime(df['check_in'])
    df['check_out'] = pd.to_datetime(df['check_out'])
    
    # Últimos 7 días
    fechas = [(datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(6, -1, -1)]
    ocupacion = []
    
    for fecha in fechas:
        fecha_dt = pd.to_datetime(fecha)
        ocupadas = len(df[(df['check_in'] <= fecha_dt) & (df['check_out'] > fecha_dt)])
        ocupacion.append(ocupadas)
    
    return {"fechas": fechas, "ocupacion": ocupacion}

@router.get("/ingresos-mensuales")
async def get_monthly_revenue():
    """Ingresos por mes"""
    supabase = get_supabase()
    reservas = supabase.table("reservations").select("*").execute()
    df = pd.DataFrame(reservas.data)
    
    if df.empty:
        return {"meses": [], "ingresos": []}
    
    df['check_in'] = pd.to_datetime(df['check_in'])
    df['mes'] = df['check_in'].dt.month
    df['nombre_mes'] = df['check_in'].dt.strftime('%B')
    
    ingresos_mensuales = df.groupby('nombre_mes')['total_amount'].sum().reset_index()
    
    meses_orden = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    
    return {
        "meses": meses_orden[:6],
        "ingresos": [ingresos_mensuales[ingresos_mensuales['nombre_mes'] == m]['total_amount'].sum() if m in ingresos_mensuales['nombre_mes'].values else 0 for m in meses_orden[:6]]
    }

@router.get("/canales")
async def get_channels_data():
    """Reservas por canal"""
    supabase = get_supabase()
    reservas = supabase.table("reservations").select("*").execute()
    df = pd.DataFrame(reservas.data)
    
    if df.empty:
        return {"canales": [], "cantidad": []}
    
    canales = df.groupby('channel').size().reset_index(name='count')
    return {"canales": canales['channel'].tolist(), "cantidad": canales['count'].tolist()}

@router.get("/exportar-excel")
async def export_to_excel():
    """Exportar todas las reservas a Excel"""
    supabase = get_supabase()
    reservas = supabase.table("reservations").select("*").execute()
    
    df = pd.DataFrame(reservas.data)
    
    if df.empty:
        raise HTTPException(status_code=404, detail="No hay datos para exportar")
    
    # Crear archivo Excel
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Reservas', index=False)
    
    output.seek(0)
    
    return FileResponse(
        path=output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename=f'reporte_reservas_{datetime.now().strftime("%Y%m%d")}.xlsx'
    )

@router.get("/generar-pdf")
async def generate_pdf():
    """Generar reporte en PDF"""
    supabase = get_supabase()
    reservas = supabase.table("reservations").select("*").execute()
    habitaciones = supabase.table("rooms").select("*").execute()
    
    # Crear gráfico de ocupación
    plt.figure(figsize=(10, 6))
    
    df_reservas = pd.DataFrame(reservas.data)
    df_reservas['check_in'] = pd.to_datetime(df_reservas['check_in'])
    ocupacion_diaria = df_reservas.groupby(df_reservas['check_in'].dt.date).size()
    
    plt.plot(ocupacion_diaria.index, ocupacion_diaria.values, marker='o', color='#1e4a3b', linewidth=2)
    plt.title('Ocupación Diaria', fontsize=14, fontweight='bold')
    plt.xlabel('Fecha')
    plt.ylabel('N° de Reservas')
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    # Guardar gráfico
    grafico_path = 'grafico_ocupacion.png'
    plt.savefig(grafico_path, dpi=100, bbox_inches='tight')
    plt.close()
    
    # Crear PDF con reportlab
    pdf_path = f'reporte_oasis_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Título
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e4a3b'),
        alignment=1,
        spaceAfter=30
    )
    story.append(Paragraph("Oasis Traveler - Reporte de Gestión", title_style))
    story.append(Spacer(1, 12))
    
    # Fecha
    date_style = ParagraphStyle(
        'DateStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.grey,
        alignment=1
    )
    story.append(Paragraph(f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", date_style))
    story.append(Spacer(1, 20))
    
    # Métricas
    total_reservas = len(reservas.data)
    total_habitaciones = len(habitaciones.data)
    ingresos_totales = sum(r.get('total_amount', 0) for r in reservas.data)
    
    data_metrics = [
        ['Métrica', 'Valor'],
        ['Total Reservas', str(total_reservas)],
        ['Total Habitaciones', str(total_habitaciones)],
        ['Ingresos Totales', f'${ingresos_totales:,.2f}']
    ]
    
    table_metrics = Table(data_metrics, colWidths=[200, 200])
    table_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#1e4a3b')),
        ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(table_metrics)
    story.append(Spacer(1, 20))
    
    # Agregar gráfico
    story.append(Paragraph("Gráfico de Ocupación", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    from reportlab.platypus import Image
    img = Image(grafico_path, width=6*inch, height=4*inch)
    story.append(img)
    
    # Generar PDF
    doc.build(story)
    
    # Limpiar archivo temporal
    if os.path.exists(grafico_path):
        os.remove(grafico_path)
    
    return FileResponse(
        path=pdf_path,
        media_type='application/pdf',
        filename=pdf_path
    )

@router.get("/analisis-predictivo")
async def get_predictive_analysis():
    """Análisis predictivo de ocupación (usando regresión simple)"""
    supabase = get_supabase()
    reservas = supabase.table("reservations").select("*").execute()
    df = pd.DataFrame(reservas.data)
    
    if df.empty or len(df) < 7:
        return {"prediccion": "No hay suficientes datos para predicción", "proxima_semana": 0}
    
    df['check_in'] = pd.to_datetime(df['check_in'])
    ocupacion_por_dia = df.groupby(df['check_in'].dt.date).size().reset_index(name='count')
    
    if len(ocupacion_por_dia) < 3:
        return {"prediccion": "Datos insuficientes", "proxima_semana": 0}
    
    # Regresión lineal simple
    from scipy import stats
    x = range(len(ocupacion_por_dia))
    y = ocupacion_por_dia['count'].values
    
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
    prediccion = slope * (len(ocupacion_por_dia) + 7) + intercept
    
    return {
        "prediccion": "Estable" if abs(slope) < 0.5 else "Creciente" if slope > 0 else "Decreciente",
        "tendencia": round(slope, 2),
        "proxima_semana": max(0, int(prediccion)),
        "confianza": round(r_value ** 2 * 100, 1)
    }