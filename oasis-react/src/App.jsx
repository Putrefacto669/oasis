import React, { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { supabase } from './lib/supabaseClient'
import './index.css'

Chart.register(...registerables)

function App() {
  const [logueado, setLogueado] = useState(false)
  const [email, setEmail] = useState('admin@oasistraveler.com')
  const [password, setPassword] = useState('admin123')
  const [errorLogin, setErrorLogin] = useState('')
  const [pagina, setPagina] = useState('dashboard')
  const [habitaciones, setHabitaciones] = useState([])
  const [reservas, setReservas] = useState([])
  const [fecha, setFecha] = useState('')
  const [modoOscuro, setModoOscuro] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

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

  // Funciones de offline
  const guardarOffline = (tabla, datos) => {
    const offlineData = JSON.parse(localStorage.getItem('offline_changes') || '[]')
    offlineData.push({ tabla, datos, timestamp: new Date().toISOString() })
    localStorage.setItem('offline_changes', JSON.stringify(offlineData))
    console.log('💾 Cambio guardado offline:', { tabla, datos })
  }

  const sincronizarOffline = async () => {
    const offlineChanges = JSON.parse(localStorage.getItem('offline_changes') || '[]')
    if (offlineChanges.length === 0) return
    console.log('🔄 Sincronizando cambios offline:', offlineChanges.length)
    for (const change of offlineChanges) {
      try {
        if (change.tabla === 'rooms') {
          await supabase.from('rooms').insert([change.datos])
        } else if (change.tabla === 'reservations') {
          await supabase.from('reservations').insert([change.datos])
        }
      } catch (error) {
        console.error('❌ Error sincronizando:', error)
      }
    }
    localStorage.removeItem('offline_changes')
    mostrarNotificacion('✅ Datos sincronizados con el servidor', 'success')
  }

  // Funciones de Supabase
  const cargarHabitacionesDesdeSupabase = async () => {
    try {
      if (!isOnline) {
        const cachedRooms = localStorage.getItem('cached_rooms')
        if (cachedRooms) setHabitaciones(JSON.parse(cachedRooms))
        return
      }
      const { data, error } = await supabase.from('rooms').select('*').order('id')
      if (error) throw error
      if (data && data.length > 0) {
        const habitacionesFormateadas = data.map(h => ({
          id: h.id,
          name: h.name,
          type: h.type === 'private' ? 'Privada' : 'Compartida',
          price: h.base_price,
          status: h.status === 'available' ? 'Disponible' : 'Ocupado'
        }))
        setHabitaciones(habitacionesFormateadas)
        localStorage.setItem('cached_rooms', JSON.stringify(habitacionesFormateadas))
      }
    } catch (error) {
      console.error('Error cargando habitaciones:', error)
      const cachedRooms = localStorage.getItem('cached_rooms')
      if (cachedRooms) setHabitaciones(JSON.parse(cachedRooms))
    }
  }

  const cargarReservasDesdeSupabase = async () => {
    try {
      if (!isOnline) {
        const cachedReservas = localStorage.getItem('cached_reservas')
        if (cachedReservas) setReservas(JSON.parse(cachedReservas))
        return
      }
      const { data, error } = await supabase.from('reservations').select('*').order('created_at', { ascending: false })
      if (error) throw error
      if (data && data.length > 0) {
        const reservasFormateadas = data.map(r => ({
          id: r.id,
          guest_name: r.guest_name,
          guest_email: r.guest_email,
          guest_phone: r.guest_phone || '',
          room_name: r.room_name,
          check_in: r.check_in,
          check_out: r.check_out,
          total_amount: r.total_amount,
          status: r.status === 'confirmed' ? 'Confirmada' : r.status === 'checkin' ? 'Check-in' : 'Pendiente',
          channel: r.channel
        }))
        setReservas(reservasFormateadas)
        localStorage.setItem('cached_reservas', JSON.stringify(reservasFormateadas))
      }
    } catch (error) {
      console.error('Error cargando reservas:', error)
      const cachedReservas = localStorage.getItem('cached_reservas')
      if (cachedReservas) setReservas(JSON.parse(cachedReservas))
    }
  }

  const agregarHabitacion = async (habitacion) => {
    const nuevaHabitacion = {
      name: habitacion.nombre,
      type: habitacion.tipo === 'Privada' ? 'private' : 'shared',
      base_price: parseInt(habitacion.precio),
      status: habitacion.estado === 'Disponible' ? 'available' : 'occupied'
    }
    if (!isOnline) {
      guardarOffline('rooms', nuevaHabitacion)
      const nuevaUI = {
        id: Date.now(),
        name: habitacion.nombre,
        type: habitacion.tipo,
        price: parseInt(habitacion.precio),
        status: habitacion.estado
      }
      setHabitaciones([...habitaciones, nuevaUI])
      mostrarNotificacion('💾 Habitación guardada localmente (offline)', 'warning')
      return true
    }
    try {
      const { error } = await supabase.from('rooms').insert([nuevaHabitacion])
      if (error) throw error
      await cargarHabitacionesDesdeSupabase()
      mostrarNotificacion('✅ Habitación agregada', 'success')
      return true
    } catch (error) {
      mostrarNotificacion('❌ Error: ' + error.message, 'error')
      return false
    }
  }

  const editarHabitacion = async (id, habitacion) => {
    try {
      const { error } = await supabase.from('rooms').update({
        name: habitacion.nombre,
        type: habitacion.tipo === 'Privada' ? 'private' : 'shared',
        base_price: parseInt(habitacion.precio),
        status: habitacion.estado === 'Disponible' ? 'available' : 'occupied'
      }).eq('id', id)
      if (error) throw error
      await cargarHabitacionesDesdeSupabase()
      mostrarNotificacion('✅ Habitación actualizada', 'success')
      return true
    } catch (error) {
      mostrarNotificacion('❌ Error: ' + error.message, 'error')
      return false
    }
  }

  const eliminarHabitacion = async (id) => {
    if (confirm('¿Eliminar esta habitación?')) {
      try {
        const { error } = await supabase.from('rooms').delete().eq('id', id)
        if (error) throw error
        await cargarHabitacionesDesdeSupabase()
        mostrarNotificacion('✅ Habitación eliminada', 'success')
      } catch (error) {
        mostrarNotificacion('❌ Error: ' + error.message, 'error')
      }
    }
  }

  const agregarReserva = async (reserva) => {
    if (new Date(reserva.checkout) <= new Date(reserva.checkin)) {
      mostrarNotificacion('❌ La fecha de check-out debe ser posterior al check-in', 'error')
      return false
    }
    const habitacion = habitaciones.find(h => h.id === parseInt(reserva.habitacionId))
    if (!habitacion) {
      mostrarNotificacion('❌ Habitación no encontrada', 'error')
      return false
    }
    const inicio = new Date(reserva.checkin)
    const fin = new Date(reserva.checkout)
    const noches = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24))
    const total = habitacion.price * noches
    const nuevaReserva = {
      guest_name: reserva.huesped,
      guest_email: reserva.email,
      guest_phone: reserva.telefono,
      room_id: parseInt(reserva.habitacionId),
      room_name: habitacion.name,
      check_in: reserva.checkin,
      check_out: reserva.checkout,
      total_amount: total,
      status: reserva.estado === 'Confirmada' ? 'confirmed' : 'pending',
      channel: reserva.canal
    }
    if (!isOnline) {
      guardarOffline('reservations', nuevaReserva)
      const nuevaUI = {
        id: Date.now(),
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
      setReservas([nuevaUI, ...reservas])
      mostrarNotificacion('💾 Reserva guardada localmente (offline)', 'warning')
      return true
    }
    try {
      const { error } = await supabase.from('reservations').insert([nuevaReserva])
      if (error) throw error
      await cargarReservasDesdeSupabase()
      mostrarNotificacion(`✅ Reserva creada - Total: $${total}`, 'success')
      return true
    } catch (error) {
      mostrarNotificacion('❌ Error: ' + error.message, 'error')
      return false
    }
  }

  const editarReserva = async (id, reserva) => {
    if (new Date(reserva.checkout) <= new Date(reserva.checkin)) {
      mostrarNotificacion('❌ La fecha de check-out debe ser posterior al check-in', 'error')
      return false
    }
    const habitacion = habitaciones.find(h => h.id === parseInt(reserva.habitacionId))
    if (!habitacion) {
      mostrarNotificacion('❌ Habitación no encontrada', 'error')
      return false
    }
    const inicio = new Date(reserva.checkin)
    const fin = new Date(reserva.checkout)
    const noches = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24))
    const total = habitacion.price * noches
    try {
      const { error } = await supabase.from('reservations').update({
        guest_name: reserva.huesped,
        guest_email: reserva.email,
        guest_phone: reserva.telefono,
        room_id: parseInt(reserva.habitacionId),
        room_name: habitacion.name,
        check_in: reserva.checkin,
        check_out: reserva.checkout,
        total_amount: total,
        status: reserva.estado === 'Confirmada' ? 'confirmed' : 'pending',
        channel: reserva.canal
      }).eq('id', id)
      if (error) throw error
      await cargarReservasDesdeSupabase()
      mostrarNotificacion(`✅ Reserva actualizada - Total: $${total}`, 'success')
      return true
    } catch (error) {
      mostrarNotificacion('❌ Error: ' + error.message, 'error')
      return false
    }
  }

  const eliminarReserva = async (id) => {
    if (confirm('¿Cancelar esta reserva?')) {
      try {
        const { error } = await supabase.from('reservations').delete().eq('id', id)
        if (error) throw error
        await cargarReservasDesdeSupabase()
        mostrarNotificacion('✅ Reserva cancelada', 'success')
      } catch (error) {
        mostrarNotificacion('❌ Error: ' + error.message, 'error')
      }
    }
  }

  // Efectos
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
    if (sesion) {
      setLogueado(true)
      setCargando(true)
      Promise.all([cargarHabitacionesDesdeSupabase(), cargarReservasDesdeSupabase()]).finally(() => {
        setCargando(false)
      })
    } else {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (pagina === 'reportes') {
      setTimeout(() => {
        generarGraficos()
      }, 100)
    }
  }, [pagina, reservas, habitaciones])

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      mostrarNotificacion('🔄 Conexión restablecida. Sincronizando datos...', 'success')
      await sincronizarOffline()
      await cargarHabitacionesDesdeSupabase()
      await cargarReservasDesdeSupabase()
    }
    const handleOffline = () => {
      setIsOnline(false)
      mostrarNotificacion('📡 Sin conexión. Los cambios se guardarán localmente.', 'warning')
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const mostrarNotificacion = (message, type = 'success') => {
    setNotificacion({ show: true, message, type })
    setTimeout(() => setNotificacion({ show: false, message: '', type: '' }), 3000)
  }

  // Gráficos
  const generarGraficos = () => {
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

  // Exportar Excel
  const exportarHabitacionesExcel = () => {
    const datos = habitaciones.map(h => ({ 'ID': h.id, 'Nombre': h.name, 'Tipo': h.type, 'Precio': h.price, 'Estado': h.status }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Habitaciones')
    XLSX.writeFile(wb, `habitaciones_${new Date().toISOString().slice(0,10)}.xlsx`)
    mostrarNotificacion('📊 Habitaciones exportadas a Excel', 'success')
  }

  const exportarReservasExcel = () => {
    const datos = reservas.map(r => ({ 'ID': r.id, 'Huésped': r.guest_name, 'Email': r.guest_email, 'Habitación': r.room_name, 'Check-in': r.check_in, 'Check-out': r.check_out, 'Total': r.total_amount, 'Estado': r.status, 'Canal': r.channel }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Reservas')
    XLSX.writeFile(wb, `reservas_${new Date().toISOString().slice(0,10)}.xlsx`)
    mostrarNotificacion('📊 Reservas exportadas a Excel', 'success')
  }

  // Filtros
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
  const habitacionesPaginadas = habitacionesFiltradas.slice((paginaActualHab - 1) * itemsPorPagina, paginaActualHab * itemsPorPagina)
  const reservasPaginadas = reservasFiltradas.slice((paginaActualRes - 1) * itemsPorPagina, paginaActualRes * itemsPorPagina)
  const totalPaginasHab = Math.ceil(habitacionesFiltradas.length / itemsPorPagina)
  const totalPaginasRes = Math.ceil(reservasFiltradas.length / itemsPorPagina)

  // Gantt
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

  // PDF
  const imprimirReporte = () => window.print()
  const descargarPDF = async () => {
    const elemento = document.getElementById('reporteCompleto')
    if (!elemento) {
      mostrarNotificacion('No hay contenido para exportar', 'error')
      return
    }
    try {
      const canvas = await html2canvas(elemento, { scale: 2, backgroundColor: '#ffffff', logging: false })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 190
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      pdf.save(`reporte_oasis_${new Date().toISOString().slice(0, 10)}.pdf`)
      mostrarNotificacion('✅ PDF generado correctamente', 'success')
    } catch (error) {
      mostrarNotificacion('❌ Error al generar PDF', 'error')
    }
  }

  // Login/Logout
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

  // Modales
  const abrirModalHabitacion = (habitacion = null) => {
    if (habitacion) {
      setFormHabitacion({ id: habitacion.id, nombre: habitacion.name, tipo: habitacion.type, precio: habitacion.price, estado: habitacion.status })
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
    if (modalHabitacion.editando) editarHabitacion(modalHabitacion.editando.id, formHabitacion)
    else agregarHabitacion(formHabitacion)
    setModalHabitacion({ abierto: false, editando: null })
  }
  const guardarReserva = (e) => {
    e.preventDefault()
    if (modalReserva.editando) editarReserva(modalReserva.editando.id, formReserva)
    else agregarReserva(formReserva)
    setModalReserva({ abierto: false, editando: null })
  }

  // Dashboard
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
        {!isOnline && <div style={{ background: '#f59e0b', color: 'white', padding: '10px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}><i className="fas fa-wifi"></i> Modo offline - Los datos pueden estar desactualizados</div>}
        <div className="metrics-grid">
          <div className="metric-card" style={{ background: '#1e4a3b' }}><div>🏨 Ocupación</div><div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{ocupacion}%</div><div>{ocupadas}/{totalHabs} habitaciones</div></div>
          <div className="metric-card" style={{ background: '#c47a5c' }}><div>📅 Llegadas hoy</div><div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{llegadasHoy}</div><div>Check-ins pendientes</div></div>
          <div className="metric-card" style={{ background: '#0f3b2f' }}><div>💰 ADR · Tarifa Media</div><div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${adr}</div><div>Por habitación ocupada</div></div>
        </div>
        <h3>📋 Últimas reservas</h3>
        <table className="data-table">
          <thead><tr><th>Huésped</th><th>Habitación</th><th>Fechas</th><th>Total</th></tr></thead>
          <tbody>
            {reservas.slice(0, 5).map(r => <tr key={r.id}><td>{r.guest_name}</td><td>{r.room_name}</td><td>{r.check_in} → {r.check_out}</td><td>${r.total_amount}</td></tr>)}
            {reservas.length === 0 && <tr><td colSpan="4">No hay reservas registradas</td></tr>}
          </tbody>
        </table>
      </>
    )
  }

  // Reportes
  const ReportesContent = () => {
    const totalHabs = habitaciones.length
    const ocupadas = habitaciones.filter(h => h.status === 'Ocupado').length
    const ocupacion = totalHabs > 0 ? Math.round((ocupadas / totalHabs) * 100) : 0
    const ingresos = reservas.reduce((sum, r) => sum + r.total_amount, 0)
    const exportarHabitacionesPython = () => { window.open('http://localhost:8000/api/export/habitaciones', '_blank'); mostrarNotificacion('📊 Exportando habitaciones...', 'success') }
    const exportarReservasPython = () => { window.open('http://localhost:8000/api/export/reservas', '_blank'); mostrarNotificacion('📊 Exportando reservas...', 'success') }
    const descargarPDFPython = () => { window.open('http://localhost:8000/api/reports/generar-pdf', '_blank'); mostrarNotificacion('📄 Generando PDF...', 'success') }
    return (
      <div id="reporteCompleto">
        <div className="page-header"><h1 className="page-title"><i className="fas fa-chart-line"></i> Reportes y Análisis</h1></div>
        <div className="report-actions no-print" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={descargarPDFPython}><i className="fas fa-file-pdf"></i> Descargar PDF (Python)</button>
          <button className="btn-secondary" onClick={imprimirReporte}><i className="fas fa-print"></i> Imprimir</button>
          <button className="btn-secondary" onClick={exportarHabitacionesPython}><i className="fas fa-file-excel"></i> Exportar Habitaciones</button>
          <button className="btn-secondary" onClick={exportarReservasPython}><i className="fas fa-file-excel"></i> Exportar Reservas</button>
        </div>
        <div className="metrics-grid">
          <div className="metric-card" style={{ background: '#1e4a3b' }}><div>📊 Ocupación Actual</div><div style={{ fontSize: '2rem' }}>{ocupacion}%</div><div>{ocupadas}/{totalHabs} habitaciones</div></div>
          <div className="metric-card" style={{ background: '#c47a5c' }}><div>💰 Ingresos Totales</div><div style={{ fontSize: '2rem' }}>${ingresos}</div><div>Período actual</div></div>
          <div className="metric-card" style={{ background: '#0f3b2f' }}><div>📅 Total Reservas</div><div style={{ fontSize: '2rem' }}>{reservas.length}</div><div>Reservas registradas</div></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '32px' }}>
          <div className="card-grafico"><h3>📈 Ocupación por día</h3><canvas ref={chartOcupacionRef} height="200"></canvas></div>
          <div className="card-grafico"><h3>📊 Ingresos mensuales</h3><canvas ref={chartIngresosRef} height="200"></canvas></div>
          <div className="card-grafico"><h3>🥧 Reservas por canal</h3><canvas ref={chartCanalesRef} height="200"></canvas></div>
        </div>
        <div style={{ marginTop: '32px' }}>
          <h3>📋 Detalle de Reservas</h3>
          <table className="data-table">
            <thead><tr><th>Huésped</th><th>Habitación</th><th>Check-in</th><th>Check-out</th><th>Total</th><th>Canal</th></tr></thead>
            <tbody>
              {reservas.map(r => <tr key={r.id}><td>{r.guest_name}</td>
              <td>{r.room_name}</td>
              <td>{r.check_in}</td>
              <td>{r.check_out}</td>
              <td>${r.total_amount}</td>
              <td>{r.channel}</td></tr>)}
              {reservas.length === 0 && <tr><td colSpan="6">No hay reservas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Login
  if (!logueado) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1e4a3b, #0f3b2f)' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ color: '#1e4a3b' }}>Oasis<span style={{ color: '#c47a5c' }}>Traveler</span></h1>
            <p>Sistema de Gestión Hotelera</p>
          </div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '12px' }} /></div>
            <div style={{ marginBottom: '20px' }}><label>Contraseña</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '12px' }} /></div>
            <button type="submit" style={{ width: '100%', background: '#1e4a3b', color: 'white', border: 'none', padding: '12px', borderRadius: '30px', cursor: 'pointer', fontWeight: 500 }}>Ingresar</button>
            {errorLogin && <div style={{ color: 'red', marginTop: '16px', textAlign: 'center' }}>{errorLogin}</div>}
          </form>
        </div>
      </div>
    )
  }

  if (cargando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}><i className="fas fa-spinner fa-pulse" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i><p>Cargando datos...</p></div>
      </div>
    )
  }

  return (
    <div className="app">
      {notificacion.show && <div className={`toast ${notificacion.type === 'error' ? 'toast-error' : ''}`}>{notificacion.message}</div>}
      <aside className="sidebar">
        <div className="logo-area"><h2>Oasis<span>Traveler</span></h2><p>Gestión Hotelera</p></div>
        <nav className="nav-menu">
          <div className={`nav-item ${pagina === 'dashboard' ? 'active' : ''}`} onClick={() => setPagina('dashboard')}><i className="fas fa-tachometer-alt"></i><span>Dashboard</span></div>
          <div className={`nav-item ${pagina === 'habitaciones' ? 'active' : ''}`} onClick={() => setPagina('habitaciones')}><i className="fas fa-door-open"></i><span>Habitaciones</span></div>
          <div className={`nav-item ${pagina === 'reservas' ? 'active' : ''}`} onClick={() => setPagina('reservas')}><i className="fas fa-calendar-check"></i><span>Reservas</span></div>
          <div className={`nav-item ${pagina === 'reportes' ? 'active' : ''}`} onClick={() => setPagina('reportes')}><i className="fas fa-chart-line"></i><span>Reportes</span></div>
          <div className={`nav-item ${pagina === 'gantt' ? 'active' : ''}`} onClick={() => setPagina('gantt')}><i className="fas fa-calendar-alt"></i><span>Calendario</span></div>
          <div className={`nav-item ${pagina === 'canales' ? 'active' : ''}`} onClick={() => setPagina('canales')}><i className="fas fa-globe"></i><span>Canales</span></div>
          <div className={`nav-item ${pagina === 'configuracion' ? 'active' : ''}`} onClick={() => setPagina('configuracion')}><i className="fas fa-sliders-h"></i><span>Configuración</span></div>
        </nav>
        <div className="user-footer"><div className="avatar">AD</div><div className="user-info"><div className="name">Administrador</div><div className="role">Admin</div></div></div>
      </aside>
      <main className="main-content">
        <div className="topbar">
          <div className="date-badge"><i className="far fa-calendar-alt"></i> {fecha}</div>
          <div className="topbar-actions">
            <button onClick={() => setModoOscuro(!modoOscuro)}><i className={modoOscuro ? "fas fa-sun" : "fas fa-moon"}></i></button>
            <button onClick={() => { cargarHabitacionesDesdeSupabase(); cargarReservasDesdeSupabase(); }}><i className="fas fa-sync-alt"></i> Actualizar</button>
            <button className="btn-primary-sm" onClick={() => abrirModalReserva()}><i className="fas fa-plus"></i> Nueva reserva</button>
            <button className="btn-logout" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Salir</button>
          </div>
        </div>
        <div className="page-container">
          {pagina === 'dashboard' && <DashboardContent />}
          {pagina === 'habitaciones' && (
            <>
              <div className="page-header">
                <h1 className="page-title"><i className="fas fa-door-open"></i> Habitaciones</h1>
                <div style={{ display: 'flex', gap: '12px' }}><button className="btn-secondary" onClick={exportarHabitacionesExcel}><i className="fas fa-file-excel"></i> Exportar</button><button className="btn-primary" onClick={() => abrirModalHabitacion()}><i className="fas fa-plus"></i> Nueva</button></div>
              </div>
              <input type="text" className="search-input" placeholder="🔍 Buscar por nombre, tipo o estado..." value={filtroHabitacion} onChange={(e) => { setFiltroHabitacion(e.target.value); setPaginaActualHab(1) }} />
              <table className="data-table">
                <thead><tr><th>Nombre</th><th>Tipo</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>{habitacionesPaginadas.map(h => <tr key={h.id}><td>{h.name}</td>
                <td>{h.type}</td>
                <td>${h.price}</td>
                <td><span className={`status-badge ${h.status === 'Disponible' ? 'available' : 'occupied'}`}>{h.status}</span></td>
                <td><button className="btn-icon btn-edit" title="Editar" onClick={() => abrirModalHabitacion(h)}><i className="fas fa-pen"></i></button><button className="btn-icon btn-delete" title="Eliminar" onClick={() => eliminarHabitacion(h.id)}><i className="fas fa-trash"></i></button></td></tr>)}</tbody>
              </table>
              {totalPaginasHab > 1 && <div className="pagination"><button onClick={() => setPaginaActualHab(p => Math.max(1, p - 1))} disabled={paginaActualHab === 1}>Anterior</button><span>Página {paginaActualHab} de {totalPaginasHab}</span><button onClick={() => setPaginaActualHab(p => Math.min(totalPaginasHab, p + 1))} disabled={paginaActualHab === totalPaginasHab}>Siguiente</button></div>}
            </>
          )}
          {pagina === 'reservas' && (
            <>
              <div className="page-header">
                <h1 className="page-title"><i className="fas fa-calendar-check"></i> Reservas</h1>
                <div style={{ display: 'flex', gap: '12px' }}><button className="btn-secondary" onClick={exportarReservasExcel}><i className="fas fa-file-excel"></i> Exportar</button><button className="btn-primary" onClick={() => abrirModalReserva()}><i className="fas fa-plus"></i> Nueva</button></div>
              </div>
              <input type="text" className="search-input" placeholder="🔍 Buscar por huésped, email, habitación o estado..." value={filtroReserva} onChange={(e) => { setFiltroReserva(e.target.value); setPaginaActualRes(1) }} />
              <table className="data-table">
                <thead><tr><th>Huésped</th><th>Email</th><th>Habitación</th><th>Check-in</th><th>Check-out</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>{reservasPaginadas.map(r => <tr key={r.id}><td>{r.guest_name}</td>
                <td>{r.guest_email}</td>
                <td>{r.room_name}</td>
                <td>{r.check_in}</td>
                <td>{r.check_out}</td>
                <td>${r.total_amount}</td>
                <td><span className="status-badge confirmed">{r.status}</span></td>
                <td><button className="btn-icon btn-edit" title="Editar" onClick={() => abrirModalReserva(r)}><i className="fas fa-pen"></i></button><button className="btn-icon btn-delete" title="Eliminar" onClick={() => eliminarReserva(r.id)}><i className="fas fa-trash"></i></button></td></tr>)}</tbody>
              </table>
              {totalPaginasRes > 1 && <div className="pagination"><button onClick={() => setPaginaActualRes(p => Math.max(1, p - 1))} disabled={paginaActualRes === 1}>Anterior</button><span>Página {paginaActualRes} de {totalPaginasRes}</span><button onClick={() => setPaginaActualRes(p => Math.min(totalPaginasRes, p + 1))} disabled={paginaActualRes === totalPaginasRes}>Siguiente</button></div>}
            </>
          )}
          {pagina === 'reportes' && <ReportesContent />}
          {pagina === 'gantt' && <GanttContent />}
          {pagina === 'canales' && (
            <>
              <div className="page-header"><h1 className="page-title"><i className="fas fa-globe"></i> Canales</h1></div>
              <table className="data-table"><thead><tr><th>Canal</th><th>Estado</th><th>Reservas/mes</th><th>Comisión</th></tr></thead><tbody>
                <tr><td>🏨 Booking.com</td><td><span className="status-badge confirmed">Conectado</span></td><td>12</td><td>15%</td></tr>
                <tr><td>✈️ Expedia</td><td><span className="status-badge confirmed">Conectado</span></td><td>5</td><td>18%</td></tr>
                <tr><td>💚 Directo</td><td><span className="status-badge confirmed">Activo</span></td><td>8</td><td>0%</td></tr>
              </tbody></table>
            </>
          )}
          {pagina === 'configuracion' && (
            <>
              <div className="page-header"><h1 className="page-title"><i className="fas fa-sliders-h"></i> Configuración</h1></div>
              <form onSubmit={(e) => { e.preventDefault(); mostrarNotificacion('⚙️ Configuración guardada', 'success'); }}>
                <div className="form-group"><label>Nombre del hotel</label><input type="text" defaultValue="Oasis Traveler - Lanquín" /></div>
                <div className="form-group"><label>Email de contacto</label><input type="email" defaultValue="info@oasistraveler.com" /></div>
                <div className="form-group"><label>Teléfono</label><input type="text" defaultValue="+502 1234 5678" /></div>
                <button type="submit" className="btn-primary">Guardar</button>
              </form>
            </>
          )}
        </div>
      </main>
      {modalHabitacion.abierto && (
        <div className="modal-overlay" onClick={() => setModalHabitacion({ abierto: false, editando: null })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{modalHabitacion.editando ? 'Editar Habitación' : 'Nueva Habitación'}</h2><button onClick={() => setModalHabitacion({ abierto: false, editando: null })}>&times;</button></div>
            <form onSubmit={guardarHabitacion}>
              <div className="form-group"><label>Nombre</label><input type="text" value={formHabitacion.nombre} onChange={e => setFormHabitacion({ ...formHabitacion, nombre: e.target.value })} required /></div>
              <div className="form-group"><label>Tipo</label><select value={formHabitacion.tipo} onChange={e => setFormHabitacion({ ...formHabitacion, tipo: e.target.value })}><option>Privada</option><option>Compartida</option></select></div>
              <div className="form-group"><label>Precio ($)</label><input type="number" value={formHabitacion.precio} onChange={e => setFormHabitacion({ ...formHabitacion, precio: e.target.value })} required /></div>
              <div className="form-group"><label>Estado</label><select value={formHabitacion.estado} onChange={e => setFormHabitacion({ ...formHabitacion, estado: e.target.value })}><option>Disponible</option><option>Ocupado</option></select></div>
              <div className="modal-buttons"><button type="button" className="btn-secondary" onClick={() => setModalHabitacion({ abierto: false, editando: null })}>Cancelar</button><button type="submit" className="btn-primary">Guardar</button></div>
            </form>
          </div>
        </div>
      )}
      {modalReserva.abierto && (
        <div className="modal-overlay" onClick={() => setModalReserva({ abierto: false, editando: null })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{modalReserva.editando ? 'Editar Reserva' : 'Nueva Reserva'}</h2><button onClick={() => setModalReserva({ abierto: false, editando: null })}>&times;</button></div>
            <form onSubmit={guardarReserva}>
              <div className="form-group"><label>Huésped</label><input type="text" value={formReserva.huesped} onChange={e => setFormReserva({ ...formReserva, huesped: e.target.value })} required /></div>
              <div className="form-group"><label>Email</label><input type="email" value={formReserva.email} onChange={e => setFormReserva({ ...formReserva, email: e.target.value })} required /></div>
              <div className="form-group"><label>Teléfono</label><input type="text" value={formReserva.telefono} onChange={e => setFormReserva({ ...formReserva, telefono: e.target.value })} /></div>
              <div className="form-group"><label>Habitación</label><select value={formReserva.habitacionId} onChange={e => setFormReserva({ ...formReserva, habitacionId: e.target.value })} required><option value="">Seleccionar</option>{habitaciones.map(h => <option key={h.id} value={h.id}>{h.name} - ${h.price}</option>)}</select></div>
              <div className="form-group"><label>Check-in</label><input type="date" value={formReserva.checkin} onChange={e => setFormReserva({ ...formReserva, checkin: e.target.value })} required /></div>
              <div className="form-group"><label>Check-out</label><input type="date" value={formReserva.checkout} onChange={e => setFormReserva({ ...formReserva, checkout: e.target.value })} required /></div>
              <div className="form-group"><label>Canal</label><select value={formReserva.canal} onChange={e => setFormReserva({ ...formReserva, canal: e.target.value })}><option value="direct">Directo</option><option value="booking">Booking</option><option value="expedia">Expedia</option></select></div>
              <div className="form-group"><label>Estado</label><select value={formReserva.estado} onChange={e => setFormReserva({ ...formReserva, estado: e.target.value })}><option>Confirmada</option><option>Pendiente</option></select></div>
              <div className="modal-buttons"><button type="button" className="btn-secondary" onClick={() => setModalReserva({ abierto: false, editando: null })}>Cancelar</button><button type="submit" className="btn-primary">Guardar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App