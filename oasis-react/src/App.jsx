import React, { useState, useEffect } from 'react'

// ============================================
// DATOS DE PRUEBA (funcionan sin Supabase)
// ============================================
const habitacionesPrueba = [
  { id: 1, name: 'Dormitorio Mixto', type: 'shared', base_price: 45, status: 'available' },
  { id: 2, name: 'Habitación Deluxe', type: 'private', base_price: 85, status: 'available' },
  { id: 3, name: 'Habitación Cuádruple', type: 'private', base_price: 95, status: 'available' },
  { id: 4, name: 'Doble Estándar', type: 'private', base_price: 65, status: 'available' },
  { id: 5, name: 'Habitación Triple', type: 'private', base_price: 75, status: 'available' },
  { id: 6, name: 'Queen Bathroom', type: 'private', base_price: 110, status: 'available' },
]

const reservasPrueba = [
  { id: 1, guest_name: 'Carlos Méndez', guest_email: 'carlos@mail.com', guest_phone: '12345678', room_name: 'Dormitorio Mixto', check_in: '2026-05-28', check_out: '2026-05-30', total_amount: 90, status: 'confirmed', channel: 'booking' },
  { id: 2, guest_name: 'Laura Gómez', guest_email: 'laura@mail.com', guest_phone: '87654321', room_name: 'Habitación Deluxe', check_in: '2026-05-28', check_out: '2026-05-31', total_amount: 255, status: 'confirmed', channel: 'direct' },
  { id: 3, guest_name: 'Javier Ruiz', guest_email: 'javier@mail.com', guest_phone: '55555555', room_name: 'Doble Estándar', check_in: '2026-05-29', check_out: '2026-06-01', total_amount: 195, status: 'confirmed', channel: 'expedia' },
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

  // ============================================
  // CRUD HABITACIONES (local)
  // ============================================

  const eliminarHabitacion = (id) => {
    if (confirm('¿Eliminar esta habitación?')) {
      setHabitaciones(habitaciones.filter(h => h.id !== id))
    }
  }

  const agregarHabitacionLocal = (habitacion) => {
    const nueva = {
      id: habitaciones.length + 1,
      name: habitacion.nombre,
      type: habitacion.tipo === 'Privada' ? 'private' : 'shared',
      base_price: parseInt(habitacion.precio),
      status: habitacion.estado === 'Disponible' ? 'available' : 'occupied'
    }
    setHabitaciones([...habitaciones, nueva])
    alert('✅ Habitación agregada')
    return true
  }

  const editarHabitacionLocal = (id, habitacion) => {
    setHabitaciones(habitaciones.map(h => 
      h.id === id ? {
        ...h,
        name: habitacion.nombre,
        type: habitacion.tipo === 'Privada' ? 'private' : 'shared',
        base_price: parseInt(habitacion.precio),
        status: habitacion.estado === 'Disponible' ? 'available' : 'occupied'
      } : h
    ))
    alert('✅ Habitación actualizada')
    return true
  }

  // ============================================
  // CRUD RESERVAS (local)
  // ============================================

  const eliminarReserva = (id) => {
    if (confirm('¿Cancelar esta reserva?')) {
      setReservas(reservas.filter(r => r.id !== id))
      alert('✅ Reserva cancelada')
    }
  }

  const calcularTotal = (habitacionId, checkin, checkout) => {
    const habitacion = habitaciones.find(h => h.id === parseInt(habitacionId))
    if (!habitacion) return 0
    const inicio = new Date(checkin)
    const fin = new Date(checkout)
    const noches = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24))
    return habitacion.base_price * noches
  }

  const agregarReservaLocal = (reserva) => {
    // Validar fechas
    if (new Date(reserva.checkout) <= new Date(reserva.checkin)) {
      alert('❌ La fecha de check-out debe ser posterior al check-in')
      return false
    }

    const habitacion = habitaciones.find(h => h.id === parseInt(reserva.habitacionId))
    if (!habitacion) {
      alert('❌ Habitación no encontrada')
      return false
    }

    const total = calcularTotal(reserva.habitacionId, reserva.checkin, reserva.checkout)
    
    const nueva = {
      id: reservas.length + 1,
      guest_name: reserva.huesped,
      guest_email: reserva.email,
      guest_phone: reserva.telefono,
      room_name: habitacion.name,
      check_in: reserva.checkin,
      check_out: reserva.checkout,
      total_amount: total,
      status: reserva.estado === 'Confirmada' ? 'confirmed' : 'pending',
      channel: reserva.canal
    }
    setReservas([...reservas, nueva])
    alert(`✅ Reserva creada - Total: $${total}`)
    return true
  }

  const editarReservaLocal = (id, reserva) => {
    if (new Date(reserva.checkout) <= new Date(reserva.checkin)) {
      alert('❌ La fecha de check-out debe ser posterior al check-in')
      return false
    }

    const habitacion = habitaciones.find(h => h.id === parseInt(reserva.habitacionId))
    if (!habitacion) {
      alert('❌ Habitación no encontrada')
      return false
    }

    const total = calcularTotal(reserva.habitacionId, reserva.checkin, reserva.checkout)

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
        status: reserva.estado === 'Confirmada' ? 'confirmed' : 'pending',
        channel: reserva.canal
      } : r
    ))
    alert(`✅ Reserva actualizada - Total: $${total}`)
    return true
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
    } else {
      setErrorLogin('❌ Email o contraseña incorrectos')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('usuario')
    setLogueado(false)
  }

  // ============================================
  // MODALES
  // ============================================

  const abrirModalHabitacion = (habitacion = null) => {
    if (habitacion) {
      setFormHabitacion({
        id: habitacion.id,
        nombre: habitacion.name,
        tipo: habitacion.type === 'private' ? 'Privada' : 'Compartida',
        precio: habitacion.base_price,
        estado: habitacion.status === 'available' ? 'Disponible' : 'Ocupado'
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
        estado: reserva.status === 'confirmed' ? 'Confirmada' : 'Pendiente'
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
    const ocupadas = habitaciones.filter(h => h.status === 'occupied').length
    const ocupacion = totalHabs > 0 ? Math.round((ocupadas / totalHabs) * 100) : 0
    const hoy = new Date().toISOString().slice(0, 10)
    const llegadasHoy = reservas.filter(r => r.check_in === hoy && r.status === 'confirmed').length
    const ingresos = reservas.reduce((sum, r) => sum + (r.total_amount || 0), 0)
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
          <thead>
            <tr>
              <th>Huésped</th>
              <th>Habitación</th>
              <th>Fechas</th>
              <th>Total</th>
            </tr>
          </thead>
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
                <td colSpan="4">No hay reservas registradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </>
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
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '12px' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '12px' }}
              />
            </div>
            <button
              type="submit"
              style={{ width: '100%', background: '#1e4a3b', color: 'white', border: 'none', padding: '12px', borderRadius: '30px', cursor: 'pointer', fontWeight: 500 }}
            >
              Ingresar
            </button>
            {errorLogin && <div style={{ color: 'red', marginTop: '16px', textAlign: 'center' }}>{errorLogin}</div>}
          </form>
        </div>
      </div>
    )
  }

  // ============================================
  // DASHBOARD PRINCIPAL (logueado)
  // ============================================

  return (
    <div className="app">
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
            <button onClick={() => window.location.reload()}>
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
          {/* Dashboard */}
          {pagina === 'dashboard' && <DashboardContent />}
          
          {/* Habitaciones */}
          {pagina === 'habitaciones' && (
            <>
              <div className="page-header">
                <h1 className="page-title"><i className="fas fa-door-open"></i> Habitaciones</h1>
                <button className="btn-primary" onClick={() => abrirModalHabitacion()}>
                  <i className="fas fa-plus"></i> Nueva habitación
                </button>
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
                  {habitaciones.map(h => (
                    <tr key={h.id}>
                      <td>{h.name}</td>
                      <td>{h.type === 'private' ? 'Privada' : 'Compartida'}</td>
                      <td>${h.base_price}</td>
                      <td>
                        <span className={`status-badge ${h.status === 'available' ? 'available' : 'occupied'}`}>
                          {h.status === 'available' ? 'Disponible' : 'Ocupado'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-icon" onClick={() => abrirModalHabitacion(h)}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn-icon" onClick={() => eliminarHabitacion(h.id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          
          {/* Reservas */}
          {pagina === 'reservas' && (
            <>
              <div className="page-header">
                <h1 className="page-title"><i className="fas fa-calendar-check"></i> Reservas</h1>
                <button className="btn-primary" onClick={() => abrirModalReserva()}>
                  <i className="fas fa-plus"></i> Nueva reserva
                </button>
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
                  {reservas.map(r => (
                    <tr key={r.id}>
                      <td>{r.guest_name}</td>
                      <td>{r.guest_email}</td>
                      <td>{r.room_name}</td>
                      <td>{r.check_in}</td>
                      <td>{r.check_out}</td>
                      <td>${r.total_amount}</td>
                      <td>
                        <span className="status-badge confirmed">
                          {r.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-icon" onClick={() => abrirModalReserva(r)}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn-icon" onClick={() => eliminarReserva(r.id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          
          {/* Reportes */}
          {pagina === 'reportes' && (
            <>
              <div className="page-header">
                <h1 className="page-title"><i className="fas fa-chart-line"></i> Reportes</h1>
              </div>
              <div className="metrics-grid">
                <div className="metric-card" style={{ background: '#1e4a3b' }}>
                  <div>Ocupación Actual</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {habitaciones.length > 0 ? Math.round((habitaciones.filter(h => h.status === 'occupied').length / habitaciones.length) * 100) : 0}%
                  </div>
                </div>
                <div className="metric-card" style={{ background: '#c47a5c' }}>
                  <div>Ingresos Totales</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    ${reservas.reduce((sum, r) => sum + (r.total_amount || 0), 0)}
                  </div>
                </div>
                <div className="metric-card" style={{ background: '#0f3b2f' }}>
                  <div>Total Reservas</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{reservas.length}</div>
                </div>
              </div>
              <button className="btn-primary" onClick={() => alert('📄 PDF - Próximamente con datos reales')}>
                <i className="fas fa-file-pdf"></i> Descargar PDF
              </button>
              <button className="btn-secondary" style={{ marginLeft: '12px' }} onClick={() => window.print()}>
                <i className="fas fa-print"></i> Imprimir
              </button>
            </>
          )}
          
          {/* Canales */}
          {pagina === 'canales' && (
            <>
              <div className="page-header">
                <h1 className="page-title"><i className="fas fa-globe"></i> Canales de Distribución</h1>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>Canal</th><th>Estado</th><th>Reservas/mes</th><th>Comisión</th></tr>
                </thead>
                <tbody>
                  <tr><td>🏨 Booking.com</td><td><span className="status-badge confirmed">Conectado</span></td><td>12</td><td>15%</td></tr>
                  <tr><td>✈️ Expedia</td><td><span className="status-badge confirmed">Conectado</span></td><td>5</td><td>18%</td></tr>
                  <tr><td>💚 Directo</td><td><span className="status-badge confirmed">Activo</span></td><td>8</td><td>0%</td></tr>
                  <tr><td>📱 WhatsApp</td><td><span className="status-badge confirmed">Activo</span></td><td>3</td><td>0%</td></tr>
                </tbody>
              </table>
            </>
          )}
          
          {/* Configuración */}
          {pagina === 'configuracion' && (
            <>
              <div className="page-header">
                <h1 className="page-title"><i className="fas fa-sliders-h"></i> Configuración</h1>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); alert('Configuración guardada'); }}>
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
                <div className="form-group">
                  <label>Política de cancelación (días)</label>
                  <input type="number" defaultValue="2" />
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
                {habitaciones.map(h => <option key={h.id} value={h.id}>{h.name} - ${h.base_price}</option>)}
              </select></div>
              <div className="form-group"><label>Check-in</label><input type="date" value={formReserva.checkin} onChange={e => setFormReserva({ ...formReserva, checkin: e.target.value })} required /></div>
              <div className="form-group"><label>Check-out</label><input type="date" value={formReserva.checkout} onChange={e => setFormReserva({ ...formReserva, checkout: e.target.value })} required /></div>
              <div className="form-group"><label>Canal</label><select value={formReserva.canal} onChange={e => setFormReserva({ ...formReserva, canal: e.target.value })}><option value="direct">Directo</option><option value="booking">Booking.com</option><option value="expedia">Expedia</option></select></div>
              <div className="form-group"><label>Estado</label><select value={formReserva.estado} onChange={e => setFormReserva({ ...formReserva, estado: e.target.value })}><option>Confirmada</option><option>Pendiente</option></select></div>
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