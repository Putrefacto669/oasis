import React, { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import './index.css'

Chart.register(...registerables)

// ============================================
// DATOS DE PRUEBA
// ============================================
const habitacionesPrueba = [
  { id: 1, name: 'Dormitorio Mixto', type: 'Compartida', price: 45, status: 'Disponible' },
  { id: 2, name: 'Habitación Deluxe', type: 'Privada', price: 85, status: 'Ocupado' },
  { id: 3, name: 'Habitación Cuádruple', type: 'Privada', price: 95, status: 'Disponible' },
  { id: 4, name: 'Doble Estándar', type: 'Privada', price: 65, status: 'Disponible' },
  { id: 5, name: 'Habitación Triple', type: 'Privada', price: 75, status: 'Ocupado' },
  { id: 6, name: 'Queen Bathroom', type: 'Privada', price: 110, status: 'Disponible' },
  { id: 7, name: 'Suite Presidencial', type: 'Privada', price: 150, status: 'Disponible' },
  { id: 8, name: 'Habitación Familiar', type: 'Privada', price: 120, status: 'Ocupado' },
  { id: 9, name: 'Dormitorio Femenino', type: 'Compartida', price: 45, status: 'Disponible' },
  { id: 10, name: 'Dormitorio Masculino', type: 'Compartida', price: 45, status: 'Disponible' },
]

const reservasPrueba = [
  { id: 1, guest_name: 'Carlos Méndez', guest_email: 'carlos@mail.com', guest_phone: '12345678', room_name: 'Dormitorio Mixto', check_in: '2026-05-28', check_out: '2026-05-30', total_amount: 90, status: 'Confirmada', channel: 'booking' },
  { id: 2, guest_name: 'Laura Gómez', guest_email: 'laura@mail.com', guest_phone: '87654321', room_name: 'Habitación Deluxe', check_in: '2026-05-28', check_out: '2026-05-31', total_amount: 255, status: 'Confirmada', channel: 'direct' },
  { id: 3, guest_name: 'Javier Ruiz', guest_email: 'javier@mail.com', guest_phone: '55555555', room_name: 'Doble Estándar', check_in: '2026-05-29', check_out: '2026-06-01', total_amount: 195, status: 'Confirmada', channel: 'expedia' },
  { id: 4, guest_name: 'Ana Torres', guest_email: 'ana@mail.com', guest_phone: '11112222', room_name: 'Habitación Triple', check_in: '2026-05-30', check_out: '2026-06-02', total_amount: 225, status: 'Confirmada', channel: 'booking' },
  { id: 5, guest_name: 'Pedro Ramírez', guest_email: 'pedro@mail.com', guest_phone: '33334444', room_name: 'Queen Bathroom', check_in: '2026-05-31', check_out: '2026-06-03', total_amount: 330, status: 'Pendiente', channel: 'direct' },
]

function App() {
  const [logueado, setLogueado] = useState(false)
  const [email, setEmail] = useState('admin@oasistraveler.com')
  const [password, setPassword] = useState('admin123')
  const [errorLogin, setErrorLogin] = useState('')
  const [pagina, setPagina] = useState('dashboard')
  const [habitaciones, setHabitaciones] = useState(habitacionesPrueba)
  const [reservas, setReservas] = useState(reservasPrueba)
  const [fecha, setFecha] = useState('')
  const [modoOscuro, setModoOscuro] = useState(false)

  // Estados para filtros y paginación
  const [filtroHabitacion, setFiltroHabitacion] = useState('')
  const [filtroReserva, setFiltroReserva] = useState('')
  const [paginaActualHab, setPaginaActualHab] = useState(1)
  const [paginaActualRes, setPaginaActualRes] = useState(1)
  const [notificacion, setNotificacion] = useState({ show: false, message: '', type: '' })
  const itemsPorPagina = 5

  // Refs para gráficos
  const chartOcupacionRef = useRef(null)
  const chartIngresosRef = useRef(null)
  const chartCanalesRef = useRef(null)
  let chartOcupacion = null
  let chartIngresos = null
  let chartCanales = null

  // Modal states
  const [modalHabitacion, setModalHabitacion] = useState({ abierto: false, editando: null })
  const [modalReserva, setModalReserva] = useState({ abierto: false, editando: null })
  const [formHabitacion, setFormHabitacion] = useState({ nombre: '', tipo: 'Privada', precio: '', estado: 'Disponible' })
  const [formReserva, setFormReserva] = useState({
    huesped: '', email: '', telefono: '', habitacionId: '', 
    checkin: '', checkout: '', canal: 'direct', estado: 'Confirmada'
  })

  // ============================================
  // EFECTOS INICIALES
  // ============================================

  useEffect(() => {
    const actualizarFecha = () => {
      const ahora = new Date()
      setFecha(ahora.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    }
    actualizarFecha()
    const intervalo = setInterval(actualizarFecha, 60000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    if (modoOscuro) document.body.classList.add('dark-mode')
    else document.body.classList.remove('dark-mode')
  }, [modoOscuro])

  useEffect(() => {
    const sesion = localStorage.getItem('usuario')
    if (sesion) setLogueado(true)
  }, [])

  useEffect(() => {
    if (pagina === 'reportes') {
      setTimeout(() => {
        generarGraficos()
      }, 100)
    }
  }, [pagina, reservas, habitaciones])

  // Mostrar notificación
  const mostrarNotificacion = (message, type = 'success') => {
    setNotificacion({ show: true, message, type })
    setTimeout(() => setNotificacion({ show: false, message: '', type: '' }), 3000)
  }

  // ============================================
  // CRUD HABITACIONES
  // ============================================

  const eliminarHabitacion = (id) => {
    if (confirm('¿Eliminar esta habitación?')) {
      setHabitaciones(habitaciones.filter(h => h.id !== id))
      mostrarNotificacion('✅ Habitación eliminada', 'success')
    }
  }

  const agregarHabitacionLocal = (habitacion) => {
    const nueva = {
      id: habitaciones.length + 1,
      name: habitacion.nombre,
      type: habitacion.tipo,
      price: parseInt(habitacion.precio),
      status: habitacion.estado
    }
    setHabitaciones([...habitaciones, nueva])
    mostrarNotificacion('✅ Habitación agregada', 'success')
    return true
  }

  const editarHabitacionLocal = (id, habitacion) => {
    setHabitaciones(habitaciones.map(h => 
      h.id === id ? {
        ...h,
        name: habitacion.nombre,
        type: habitacion.tipo,
        price: parseInt(habitacion.precio),
        status: habitacion.estado
      } : h
    ))
    mostrarNotificacion('✅ Habitación actualizada', 'success')
    return true
  }

  // ============================================
  // CRUD RESERVAS
  // ============================================

  const eliminarReserva = (id) => {
    if (confirm('¿Cancelar esta reserva?')) {
      setReservas(reservas.filter(r => r.id !== id))
      mostrarNotificacion('✅ Reserva cancelada', 'success')
    }
  }

  const calcularTotal = (habitacionNombre, checkin, checkout) => {
    const habitacion = habitaciones.find(h => h.name === habitacionNombre)
    if (!habitacion) return 0
    const inicio = new Date(checkin)
    const fin = new Date(checkout)
    const noches = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24))
    return habitacion.price * noches
  }

  const agregarReservaLocal = (reserva) => {
    if (new Date(reserva.checkout) <= new Date(reserva.checkin)) {
      mostrarNotificacion('❌ La fecha de check-out debe ser posterior al check-in', 'error')
      return false
    }

    const habitacion = habitaciones.find(h => h.id === parseInt(reserva.habitacionId))
    if (!habitacion) {
      mostrarNotificacion('❌ Habitación no encontrada', 'error')
      return false
    }

    const total = calcularTotal(habitacion.name, reserva.checkin, reserva.checkout)
    
    const nueva = {
      id: reservas.length + 1,
      guest_name: reserva.huesped,
      guest_email: reserva.email,
      guest_phone: reserva.telefono,
      room_name: habitacion.name,
      check_in: reserva.checkin,
      check_out: reserva.checkout,
      total_amount: total,
      status: reserva.estado,
      channel: reserva.canal
    }
    setReservas([...reservas, nueva])
    mostrarNotificacion(`✅ Reserva creada - Total: $${total}`, 'success')
    return true
  }

  const editarReservaLocal = (id, reserva) => {
    if (new Date(reserva.checkout) <= new Date(reserva.checkin)) {
      mostrarNotificacion('❌ La fecha de check-out debe ser posterior al check-in', 'error')
      return false
    }

    const habitacion = habitaciones.find(h => h.id === parseInt(reserva.habitacionId))
    if (!habitacion) {
      mostrarNotificacion('❌ Habitación no encontrada', 'error')
      return false
    }

    const total = calcularTotal(habitacion.name, reserva.checkin, reserva.checkout)

    setReservas(reservas.map(r => 
      r.id === id ? {
        ...r,
        guest_name: reserva.huesped,
        guest_email: reserva.email,
        guest_phone: reserva.telefono,
        room_name: habitacion.name,
        check_in: reserva.checkin,
        check_out: reserva.checkout,
        total_amount: total,
        status: reserva.estado,
        channel: reserva.canal
      } : r
    ))
    mostrarNotificacion(`✅ Reserva actualizada - Total: $${total}`, 'success')
    return true
  }

  // ============================================
  // GRÁFICOS
  // ============================================

  const generarGraficos = () => {
    // 1. Gráfico de ocupación por día
    const ultimos7Dias = []
    const ocupacionData = []
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date()
      fecha.setDate(fecha.getDate() - i)
      const fechaStr = fecha.toISOString().slice(0, 10)
      ultimos7Dias.push(fechaStr.slice(5))
      
      const ocupadasDia = reservas.filter(r => r.check_in <= fechaStr && r.check_out > fechaStr).length
      ocupacionData.push(ocupadasDia)
    }

    if (chartOcupacionRef.current) {
      if (chartOcupacion) chartOcupacion.destroy()
      chartOcupacion = new Chart(chartOcupacionRef.current, {
        type: 'line',
        data: {
          labels: ultimos7Dias,
          datasets: [{
            label: 'Habitaciones ocupadas',
            data: ocupacionData,
            borderColor: '#1e4a3b',
            backgroundColor: 'rgba(30, 74, 59, 0.1)',
            fill: true,
            tension: 0.3
          }]
        },
        options: { responsive: true, maintainAspectRatio: true }
      })
    }

    // 2. Gráfico de ingresos por mes
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
    const ingresosData = [1250, 1450, 1890, 2100, 1780, reservas.reduce((sum, r) => sum + r.total_amount, 0)]

    if (chartIngresosRef.current) {
      if (chartIngresos) chartIngresos.destroy()
      chartIngresos = new Chart(chartIngresosRef.current, {
        type: 'bar',
        data: {
          labels: meses,
          datasets: [{
            label: 'Ingresos ($)',
            data: ingresosData,
            backgroundColor: '#c47a5c',
            borderRadius: 8
          }]
        },
        options: { responsive: true, maintainAspectRatio: true }
      })
    }

    // 3. Gráfico de reservas por canal
    const canales = { direct: 0, booking: 0, expedia: 0, whatsapp: 0 }
    reservas.forEach(r => {
      if (canales[r.channel] !== undefined) canales[r.channel]++
      else canales.direct++
    })

    if (chartCanalesRef.current) {
      if (chartCanales) chartCanales.destroy()
      chartCanales = new Chart(chartCanalesRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Directo', 'Booking.com', 'Expedia', 'WhatsApp'],
          datasets: [{
            data: [canales.direct, canales.booking, canales.expedia, canales.whatsapp || 0],
            backgroundColor: ['#1e4a3b', '#c47a5c', '#f59e0b', '#3b82f6']
          }]
        },
        options: { responsive: true, maintainAspectRatio: true }
      })
    }
  }

  // ============================================
  // EXPORTAR A EXCEL
  // ============================================

  const exportarHabitacionesExcel = () => {
    const datos = habitaciones.map(h => ({
      'ID': h.id,
      'Nombre': h.name,
      'Tipo': h.type,
      'Precio': h.price,
      'Estado': h.status
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Habitaciones')
    XLSX.writeFile(wb, `habitaciones_${new Date().toISOString().slice(0,10)}.xlsx`)
    mostrarNotificacion('📊 Habitaciones exportadas a Excel', 'success')
  }

  const exportarReservasExcel = () => {
    const datos = reservas.map(r => ({
      'ID': r.id,
      'Huésped': r.guest_name,
      'Email': r.guest_email,
      'Habitación': r.room_name,
      'Check-in': r.check_in,
      'Check-out': r.check_out,
      'Total': r.total_amount,
      'Estado': r.status,
      'Canal': r.channel
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Reservas')
    XLSX.writeFile(wb, `reservas_${new Date().toISOString().slice(0,10)}.xlsx`)
    mostrarNotificacion('📊 Reservas exportadas a Excel', 'success')
  }

  // ============================================
  // FILTROS Y PAGINACIÓN
  // ============================================

  const habitacionesFiltradas = habitaciones.filter(h =>
    h.name.toLowerCase().includes(filtroHabitacion.toLowerCase()) ||
    h.type.toLowerCase().includes(filtroHabitacion.toLowerCase()) ||
    h.status.toLowerCase().includes(filtroHabitacion.toLowerCase())
  )

  const reservasFiltradas = reservas.filter(r =>
    r.guest_name.toLowerCase().includes(filtroReserva.toLowerCase()) ||
    r.room_name.toLowerCase().includes(filtroReserva.toLowerCase()) ||
    r.status.toLowerCase().includes(filtroReserva.toLowerCase()) ||
    r.guest_email.toLowerCase().includes(filtroReserva.toLowerCase())
  )

  const habitacionesPaginadas = habitacionesFiltradas.slice(
    (paginaActualHab - 1) * itemsPorPagina,
    paginaActualHab * itemsPorPagina
  )

  const reservasPaginadas = reservasFiltradas.slice(
    (paginaActualRes - 1) * itemsPorPagina,
    paginaActualRes * itemsPorPagina
  )

  const totalPaginasHab = Math.ceil(habitacionesFiltradas.length / itemsPorPagina)
  const totalPaginasRes = Math.ceil(reservasFiltradas.length / itemsPorPagina)

  // ============================================
  // CALENDARIO GANTT
  // ============================================

  const GanttContent = () => {
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const hoy = new Date()
    const fechas = []
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy)
      fecha.setDate(hoy.getDate() + i)
      fechas.push(fecha)
    }

    return (
      <div>
        <div className="page-header">
          <h1 className="page-title"><i className="fas fa-calendar-alt"></i> Calendario de Ocupación</h1>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ width: '200px' }}>Habitación</th>
                {fechas.map((f, i) => (
                  <th key={i} style={{ textAlign: 'center', minWidth: '100px' }}>
                    {diasSemana[f.getDay() === 0 ? 6 : f.getDay() - 1]}<br />
                    {f.getDate()}/{f.getMonth() + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habitaciones.map(habitacion => {
                const reservasHabitacion = reservas.filter(r => r.room_name === habitacion.name)
                return (
                  <tr key={habitacion.id}>
                    <td><strong>{habitacion.name}</strong></td>
                    {fechas.map((fecha, idx) => {
                      const fechaStr = fecha.toISOString().slice(0, 10)
                      const reserva = reservasHabitacion.find(r => r.check_in <= fechaStr && r.check_out > fechaStr)
                      return (
                        <td key={idx} style={{
                          textAlign: 'center',
                          backgroundColor: reserva ? '#1e4a3b' : '#e2e8f0',
                          color: reserva ? 'white' : '#475569',
                          borderRadius: '8px'
                        }}>
                          {reserva ? '📅 Ocupado' : '🟢 Libre'}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ============================================
  // PDF Y IMPRESIÓN
  // ============================================

  const imprimirReporte = () => {
    window.print()
  }

  const descargarPDF = async () => {
    const elemento = document.getElementById('reporteCompleto')
    if (!elemento) {
      mostrarNotificacion('No hay contenido para exportar', 'error')
      return
    }

    try {
      const canvas = await html2canvas(elemento, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 190
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.setFontSize(16)
      pdf.setTextColor(30, 74, 59)
      pdf.text('Oasis Traveler - Reporte de Gestión', 105, 15, { align: 'center' })
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Generado: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' })
      
      pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight)
      pdf.save(`reporte_oasis_${new Date().toISOString().slice(0, 10)}.pdf`)
      mostrarNotificacion('✅ PDF generado correctamente', 'success')
    } catch (error) {
      mostrarNotificacion('❌ Error al generar PDF', 'error')
    }
  }

  // ============================================
  // LOGIN / LOGOUT
  // ============================================

  const handleLogin = (e) => {
    e.preventDefault()
    if (email === 'admin@oasistraveler.com' && password === 'admin123') {
      setLogueado(true)
      setErrorLogin('')
      localStorage.setItem('usuario', JSON.stringify({ email, nombre: 'Administrador' }))
      mostrarNotificacion('✅ Bienvenido Administrador', 'success')
    } else {
      setErrorLogin('❌ Email o contraseña incorrectos')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('usuario')
    setLogueado(false)
    mostrarNotificacion('👋 Sesión cerrada', 'info')
  }

  // ============================================
  // MODALES
  // ============================================

  const abrirModalHabitacion = (habitacion = null) => {
    if (habitacion) {
      setFormHabitacion({
        id: habitacion.id,
        nombre: habitacion.name,
        tipo: habitacion.type,
        precio: habitacion.price,
        estado: habitacion.status
      })
      setModalHabitacion({ abierto: true, editando: habitacion })
    } else {
      setFormHabitacion({ nombre: '', tipo: 'Privada', precio: '', estado: 'Disponible' })
      setModalHabitacion({ abierto: true, editando: null })
    }
  }

  const abrirModalReserva = (reserva = null) => {
    const hoy = new Date().toISOString().slice(0, 10)
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    
    if (reserva) {
      const habitacionEncontrada = habitaciones.find(h => h.name === reserva.room_name)
      setFormReserva({
        id: reserva.id,
        huesped: reserva.guest_name,
        email: reserva.guest_email,
        telefono: reserva.guest_phone || '',
        habitacionId: habitacionEncontrada?.id || '',
        checkin: reserva.check_in,
        checkout: reserva.check_out,
        canal: reserva.channel || 'direct',
        estado: reserva.status
      })
      setModalReserva({ abierto: true, editando: reserva })
    } else {
      setFormReserva({
        huesped: '', email: '', telefono: '', habitacionId: '', 
        checkin: hoy, checkout: manana.toISOString().slice(0, 10),
        canal: 'direct', estado: 'Confirmada'
      })
      setModalReserva({ abierto: true, editando: null })
    }
  }

  const guardarHabitacion = (e) => {
    e.preventDefault()
    if (modalHabitacion.editando) {
      editarHabitacionLocal(modalHabitacion.editando.id, formHabitacion)
    } else {
      agregarHabitacionLocal(formHabitacion)
    }
    setModalHabitacion({ abierto: false, editando: null })
  }

  const guardarReserva = (e) => {
    e.preventDefault()
    let exito = false
    if (modalReserva.editando) {
      exito = editarReservaLocal(modalReserva.editando.id, formReserva)
    } else {
      exito = agregarReservaLocal(formReserva)
    }
    if (exito) {
      setModalReserva({ abierto: false, editando: null })
    }
  }

  // ============================================
  // COMPONENTE DASHBOARD
  // ============================================

  const DashboardContent = () => {
    const totalHabs = habitaciones.length
    const ocupadas = habitaciones.filter(h => h.status === 'Ocupado').length
    const ocupacion = totalHabs > 0 ? Math.round((ocupadas / totalHabs) * 100) : 0
    const hoy = new Date().toISOString().slice(0, 10)
    const llegadasHoy = reservas.filter(r => r.check_in === hoy && r.status === 'Confirmada').length
    const ingresos = reservas.reduce((sum, r) => sum + r.total_amount, 0)
    const adr = ocupadas > 0 ? Math.round(ingresos / ocupadas) : 0

    return (
      <>
        <div className="page-header">
          <h1 className="page-title"><i className="fas fa-chart-line"></i> Dashboard</h1>
        </div>
        <div className="metrics-grid">
          <div className="metric-card" style={{ background: '#1e4a3b' }}>
            <div>🏨 Ocupación</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{ocupacion}%</div>
            <div>{ocupadas}/{totalHabs} habitaciones</div>
          </div>
          <div className="metric-card" style={{ background: '#c47a5c' }}>
            <div>📅 Llegadas hoy</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{llegadasHoy}</div>
            <div>Check-ins pendientes</div>
          </div>
          <div className="metric-card" style={{ background: '#0f3b2f' }}>
            <div>💰 ADR · Tarifa Media</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${adr}</div>
            <div>Por habitación ocupada</div>
          </div>
        </div>
        <h3>📋 Últimas reservas</h3>
        <table className="data-table">
          <thead><tr><th>Huésped</th><th>Habitación</th><th>Fechas</th><th>Total</th></tr></thead>
          <tbody>
            {reservas.slice(0, 5).map(r => (
              <tr key={r.id}>
                <td>{r.guest_name}</td>
                <td>{r.room_name}</td>
                <td>{r.check_in} → {r.check_out}</td>
                <td>${r.total_amount}</td>
              </tr>
            ))}
            {reservas.length === 0 && (
              <tr>
                <td colSpan="4">No hay reservas</td>
              </tr>
            )}
          </tbody>
        </table>
      </>
    )
  }

  // ============================================
  // COMPONENTE REPORTES
  // ============================================

  const ReportesContent = () => {
    const totalHabs = habitaciones.length
    const ocupadas = habitaciones.filter(h => h.status === 'Ocupado').length
    const ocupacion = totalHabs > 0 ? Math.round((ocupadas / totalHabs) * 100) : 0
    const ingresos = reservas.reduce((sum, r) => sum + r.total_amount, 0)

    return (
      <div id="reporteCompleto">
        <div className="page-header">
          <h1 className="page-title"><i className="fas fa-chart-line"></i> Reportes y Análisis</h1>
        </div>

        <div className="report-actions no-print" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={descargarPDF}>
            <i className="fas fa-file-pdf"></i> Descargar PDF
          </button>
          <button className="btn-secondary" onClick={imprimirReporte}>
            <i className="fas fa-print"></i> Imprimir
          </button>
          <button className="btn-secondary" onClick={exportarHabitacionesExcel}>
            <i className="fas fa-file-excel"></i> Exportar Habitaciones
          </button>
          <button className="btn-secondary" onClick={exportarReservasExcel}>
            <i className="fas fa-file-excel"></i> Exportar Reservas
          </button>
        </div>

        <div className="metrics-grid">
          <div className="metric-card" style={{ background: '#1e4a3b' }}>
            <div>📊 Ocupación Actual</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{ocupacion}%</div>
            <div>{ocupadas}/{totalHabs} habitaciones ocupadas</div>
          </div>
          <div className="metric-card" style={{ background: '#c47a5c' }}>
            <div>💰 Ingresos Totales</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${ingresos}</div>
            <div>Período actual</div>
          </div>
          <div className="metric-card" style={{ background: '#0f3b2f' }}>
            <div>📅 Total Reservas</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{reservas.length}</div>
            <div>Reservas registradas</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '32px' }}>
          <div className="card-grafico">
            <h3>📈 Ocupación por día (últimos 7 días)</h3>
            <canvas ref={chartOcupacionRef} height="200"></canvas>
          </div>
          
          <div className="card-grafico">
            <h3>📊 Ingresos mensuales</h3>
            <canvas ref={chartIngresosRef} height="200"></canvas>
          </div>
          
          <div className="card-grafico">
            <h3>🥧 Reservas por canal</h3>
            <canvas ref={chartCanalesRef} height="200"></canvas>
          </div>
        </div>

        <div style={{ marginTop: '32px' }}>
          <h3>📋 Detalle de Reservas</h3>
          <table className="data-table">
            <thead><tr><th>Huésped</th><th>Habitación</th><th>Check-in</th><th>Check-out</th><th>Total</th><th>Canal</th></tr></thead>
            <tbody>
              {reservas.map(r => (
                <tr key={r.id}>
                  <td>{r.guest_name}</td>
                  <td>{r.room_name}</td>
                  <td>{r.check_in}</td>
                  <td>{r.check_out}</td>
                  <td>${r.total_amount}</td>
                  <td>{r.channel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ============================================
  // PANTALLA DE LOGIN
  // ============================================

  if (!logueado) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1e4a3b, #0f3b2f)' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ color: '#1e4a3b' }}>Oasis<span style={{ color: '#c47a5c' }}>Traveler</span></h1>
            <p>Sistema de Gestión Hotelera</p>
          </div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
            </div>
            <button type="submit" style={{ width: '100%', background: '#1e4a3b', color: 'white', border: 'none', padding: '12px', borderRadius: '30px', cursor: 'pointer', fontWeight: 500 }}>Ingresar</button>
            {errorLogin && <div style={{ color: 'red', marginTop: '16px', textAlign: 'center' }}>{errorLogin}</div>}
          </form>
        </div>
      </div>
    )
  }

  // ============================================
  // DASHBOARD PRINCIPAL
  // ============================================

  return (
    <div className="app">
      {/* NOTIFICACIÓN FLOTANTE */}
      {notificacion.show && (
        <div className={`toast ${notificacion.type === 'error' ? 'toast-error' : ''}`}>
          {notificacion.message}
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-area">
          <h2>Oasis<span>Traveler</span></h2>
          <p>Gestión Hotelera</p>
        </div>
        <nav className="nav-menu">
          <div className={`nav-item ${pagina === 'dashboard' ? 'active' : ''}`} onClick={() => setPagina('dashboard')}>
            <i className="fas fa-tachometer-alt"></i><span>Dashboard</span>
          </div>
          <div className={`nav-item ${pagina === 'habitaciones' ? 'active' : ''}`} onClick={() => setPagina('habitaciones')}>
            <i className="fas fa-door-open"></i><span>Habitaciones</span>
          </div>
          <div className={`nav-item ${pagina === 'reservas' ? 'active' : ''}`} onClick={() => setPagina('reservas')}>
            <i className="fas fa-calendar-check"></i><span>Reservas</span>
          </div>
          <div className={`nav-item ${pagina === 'reportes' ? 'active' : ''}`} onClick={() => setPagina('reportes')}>
            <i className="fas fa-chart-line"></i><span>Reportes</span>
          </div>
          <div className={`nav-item ${pagina === 'gantt' ? 'active' : ''}`} onClick={() => setPagina('gantt')}>
            <i className="fas fa-calendar-alt"></i><span>Calendario</span>
          </div>
          <div className={`nav-item ${pagina === 'canales' ? 'active' : ''}`} onClick={() => setPagina('canales')}>
            <i className="fas fa-globe"></i><span>Canales</span>
          </div>
          <div className={`nav-item ${pagina === 'configuracion' ? 'active' : ''}`} onClick={() => setPagina('configuracion')}>
            <i className="fas fa-sliders-h"></i><span>Configuración</span>
          </div>
        </nav>
        <div className="user-footer">
          <div className="avatar">AD</div>
          <div className="user-info">
            <div className="name">Administrador</div>
            <div className="role">Admin</div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div className="topbar">
          <div className="date-badge">
            <i className="far fa-calendar-alt"></i> {fecha}
          </div>
          <div className="topbar-actions">
            <button onClick={() => setModoOscuro(!modoOscuro)}>
              <i className={modoOscuro ? "fas fa-sun" : "fas fa-moon"}></i>
            </button>
            <button onClick={() => { window.location.reload() }}>
              <i className="fas fa-sync-alt"></i> Actualizar
            </button>
            <button className="btn-primary-sm" onClick={() => abrirModalReserva()}>
              <i className="fas fa-plus"></i> Nueva reserva
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Salir
            </button>
          </div>
        </div>

        <div className="page-container">
          {/* DASHBOARD */}
          {pagina === 'dashboard' && <DashboardContent />}
          
          {/* HABITACIONES CON FILTRO Y EXPORTACIÓN */}
          {pagina === 'habitaciones' && (
            <>
              <div className="page-header">
                <h1 className="page-title"><i className="fas fa-door-open"></i> Habitaciones</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-secondary" onClick={exportarHabitacionesExcel}>
                    <i className="fas fa-file-excel"></i> Exportar
                  </button>
                  <button className="btn-primary" onClick={() => abrirModalHabitacion()}>
                    <i className="fas fa-plus"></i> Nueva habitación
                  </button>
                </div>
              </div>

              {/* Filtro de búsqueda */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre, tipo o estado..."
                  value={filtroHabitacion}
                  onChange={(e) => {
                    setFiltroHabitacion(e.target.value)
                    setPaginaActualHab(1)
                  }}
                  style={{ width: '300px' }}
                />
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {habitacionesPaginadas.map(h => (
                    <tr key={h.id}>
                      <td>{h.name}</td>
                      <td>{h.type}</td>
                      <td>${h.price}</td>
                      <td>
                        <span className={`status-badge ${h.status === 'Disponible' ? 'available' : 'occupied'}`}>
                          {h.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn-icon btn-edit" title="Editar habitación" onClick={() => abrirModalHabitacion(h)}>
                          <i className="fas fa-pen"></i>
                        </button>
                        <button className="btn-icon btn-delete" title="Eliminar habitación" onClick={() => eliminarHabitacion(h.id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginación */}
              {totalPaginasHab > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => setPaginaActualHab(p => Math.max(1, p - 1))}
                    disabled={paginaActualHab === 1}
                  >
                    Anterior
                  </button>
                  <span style={{ padding: '8px 16px' }}>
                    Página {paginaActualHab} de {totalPaginasHab}
                  </span>
                  <button
                    className="btn-secondary"
                    onClick={() => setPaginaActualHab(p => Math.min(totalPaginasHab, p + 1))}
                    disabled={paginaActualHab === totalPaginasHab}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* RESERVAS CON FILTRO Y EXPORTACIÓN */}
          {pagina === 'reservas' && (
            <>
              <div className="page-header">
                <h1 className="page-title"><i className="fas fa-calendar-check"></i> Reservas</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-secondary" onClick={exportarReservasExcel}>
                    <i className="fas fa-file-excel"></i> Exportar
                  </button>
                  <button className="btn-primary" onClick={() => abrirModalReserva()}>
                    <i className="fas fa-plus"></i> Nueva reserva
                  </button>
                </div>
              </div>

              {/* Filtro de búsqueda */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar por huésped, email, habitación o estado..."
                  value={filtroReserva}
                  onChange={(e) => {
                    setFiltroReserva(e.target.value)
                    setPaginaActualRes(1)
                  }}
                  style={{ width: '350px' }}
                />
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Huésped</th>
                    <th>Email</th>
                    <th>Habitación</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservasPaginadas.map(r => (
                    <tr key={r.id}>
                      <td>{r.guest_name}</td>
                      <td>{r.guest_email}</td>
                      <td>{r.room_name}</td>
                      <td>{r.check_in}</td>
                      <td>{r.check_out}</td>
                      <td>${r.total_amount}</td>
                      <td>
                        <span className="status-badge confirmed">
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn-icon btn-edit" title="Editar reserva" onClick={() => abrirModalReserva(r)}>
                          <i className="fas fa-pen"></i>
                        </button>
                        <button className="btn-icon btn-delete" title="Eliminar reserva" onClick={() => eliminarReserva(r.id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginación */}
              {totalPaginasRes > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => setPaginaActualRes(p => Math.max(1, p - 1))}
                    disabled={paginaActualRes === 1}
                  >
                    Anterior
                  </button>
                  <span style={{ padding: '8px 16px' }}>
                    Página {paginaActualRes} de {totalPaginasRes}
                  </span>
                  <button
                    className="btn-secondary"
                    onClick={() => setPaginaActualRes(p => Math.min(totalPaginasRes, p + 1))}
                    disabled={paginaActualRes === totalPaginasRes}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
          
          {pagina === 'reportes' && <ReportesContent />}
          {pagina === 'gantt' && <GanttContent />}
          
          {pagina === 'canales' && (
            <>
              <div className="page-header">
                <h1 className="page-title"><i className="fas fa-globe"></i> Canales de Distribución</h1>
              </div>
              <table className="data-table">
                <thead><tr><th>Canal</th><th>Estado</th><th>Reservas/mes</th><th>Comisión</th></tr></thead>
                <tbody>
                  <tr><td>🏨 Booking.com</td><td><span className="status-badge confirmed">Conectado</span></td><td>12</td><td>15%</td></tr>
                  <tr><td>✈️ Expedia</td><td><span className="status-badge confirmed">Conectado</span></td><td>5</td><td>18%</td></tr>
                  <tr><td>💚 Directo</td><td><span className="status-badge confirmed">Activo</span></td><td>8</td><td>0%</td></tr>
                  <tr><td>📱 WhatsApp</td><td><span className="status-badge confirmed">Activo</span></td><td>3</td><td>0%</td></tr>
                </tbody>
              </table>
            </>
          )}
          
          {pagina === 'configuracion' && (
            <>
              <div className="page-header">
                <h1 className="page-title"><i className="fas fa-sliders-h"></i> Configuración</h1>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); mostrarNotificacion('⚙️ Configuración guardada', 'success'); }}>
                <div className="form-group">
                  <label>Nombre del hotel</label>
                  <input type="text" defaultValue="Oasis Traveler - Lanquín" />
                </div>
                <div className="form-group">
                  <label>Email de contacto</label>
                  <input type="email" defaultValue="info@oasistraveler.com" />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="text" defaultValue="+502 1234 5678" />
                </div>
                <button type="submit" className="btn-primary">Guardar configuración</button>
              </form>
            </>
          )}
        </div>
      </main>

      {/* MODAL HABITACIÓN */}
      {modalHabitacion.abierto && (
        <div className="modal-overlay" onClick={() => setModalHabitacion({ abierto: false, editando: null })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalHabitacion.editando ? 'Editar Habitación' : 'Nueva Habitación'}</h2>
              <button onClick={() => setModalHabitacion({ abierto: false, editando: null })} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={guardarHabitacion}>
              <div className="form-group"><label>Nombre</label><input type="text" value={formHabitacion.nombre} onChange={e => setFormHabitacion({ ...formHabitacion, nombre: e.target.value })} required /></div>
              <div className="form-group"><label>Tipo</label><select value={formHabitacion.tipo} onChange={e => setFormHabitacion({ ...formHabitacion, tipo: e.target.value })}><option>Privada</option><option>Compartida</option></select></div>
              <div className="form-group"><label>Precio por noche ($)</label><input type="number" value={formHabitacion.precio} onChange={e => setFormHabitacion({ ...formHabitacion, precio: e.target.value })} required /></div>
              <div className="form-group"><label>Estado</label><select value={formHabitacion.estado} onChange={e => setFormHabitacion({ ...formHabitacion, estado: e.target.value })}><option>Disponible</option><option>Ocupado</option></select></div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalHabitacion({ abierto: false, editando: null })}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESERVA */}
      {modalReserva.abierto && (
        <div className="modal-overlay" onClick={() => setModalReserva({ abierto: false, editando: null })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalReserva.editando ? 'Editar Reserva' : 'Nueva Reserva'}</h2>
              <button onClick={() => setModalReserva({ abierto: false, editando: null })} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={guardarReserva}>
              <div className="form-group"><label>Huésped</label><input type="text" value={formReserva.huesped} onChange={e => setFormReserva({ ...formReserva, huesped: e.target.value })} required /></div>
              <div className="form-group"><label>Email</label><input type="email" value={formReserva.email} onChange={e => setFormReserva({ ...formReserva, email: e.target.value })} required /></div>
              <div className="form-group"><label>Teléfono</label><input type="text" value={formReserva.telefono} onChange={e => setFormReserva({ ...formReserva, telefono: e.target.value })} /></div>
              <div className="form-group"><label>Habitación</label><select value={formReserva.habitacionId} onChange={e => setFormReserva({ ...formReserva, habitacionId: e.target.value })} required>
                <option value="">Seleccionar</option>
                {habitaciones.map(h => <option key={h.id} value={h.id}>{h.name} - ${h.price}</option>)}
              </select></div>
              <div className="form-group"><label>Check-in</label><input type="date" value={formReserva.checkin} onChange={e => setFormReserva({ ...formReserva, checkin: e.target.value })} required /></div>
              <div className="form-group"><label>Check-out</label><input type="date" value={formReserva.checkout} onChange={e => setFormReserva({ ...formReserva, checkout: e.target.value })} required /></div>
              <div className="form-group"><label>Canal</label><select value={formReserva.canal} onChange={e => setFormReserva({ ...formReserva, canal: e.target.value })}>
                <option value="direct">Directo</option>
                <option value="booking">Booking.com</option>
                <option value="expedia">Expedia</option>
              </select></div>
              <div className="form-group"><label>Estado</label><select value={formReserva.estado} onChange={e => setFormReserva({ ...formReserva, estado: e.target.value })}>
                <option>Confirmada</option>
                <option>Pendiente</option>
              </select></div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalReserva({ abierto: false, editando: null })}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App