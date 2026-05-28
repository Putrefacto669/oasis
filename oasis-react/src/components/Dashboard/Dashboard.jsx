import React, { useState, useEffect } from 'react'

// Datos de prueba (mientras conectas Supabase)
const habitacionesPrueba = [
  { id: 1, name: 'Dormitorio Mixto', type: 'shared', base_price: 45, status: 'available' },
  { id: 2, name: 'Habitación Deluxe', type: 'private', base_price: 85, status: 'occupied' },
  { id: 3, name: 'Habitación Cuádruple', type: 'private', base_price: 95, status: 'available' },
  { id: 4, name: 'Doble Estándar', type: 'private', base_price: 65, status: 'occupied' },
  { id: 5, name: 'Habitación Triple', type: 'private', base_price: 75, status: 'available' },
  { id: 6, name: 'Queen Bathroom', type: 'private', base_price: 110, status: 'available' },
]

const reservasPrueba = [
  { id: 1, guest_name: 'Carlos Méndez', room_name: 'Dormitorio Mixto', check_in: '2026-05-26', check_out: '2026-05-28', total_amount: 90 },
  { id: 2, guest_name: 'Laura Gómez', room_name: 'Habitación Deluxe', check_in: '2026-05-26', check_out: '2026-05-29', total_amount: 255 },
  { id: 3, guest_name: 'Javier Ruiz', room_name: 'Doble Estándar', check_in: '2026-05-27', check_out: '2026-05-30', total_amount: 195 },
]

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    occupancy: 0,
    occupiedRooms: 0,
    totalRooms: 0,
    arrivalsToday: 0,
    adr: 0,
  })
  const [reservations, setReservations] = useState([])

  useEffect(() => {
    // Calcular métricas con datos de prueba
    const totalRooms = habitacionesPrueba.length
    const occupiedRooms = habitacionesPrueba.filter(r => r.status === 'occupied').length
    const occupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
    
    const today = new Date().toISOString().slice(0, 10)
    const arrivalsToday = reservasPrueba.filter(r => r.check_in === today).length
    
    const totalRevenue = reservasPrueba.reduce((sum, r) => sum + (r.total_amount || 0), 0)
    const adr = occupiedRooms > 0 ? Math.round(totalRevenue / occupiedRooms) : 0

    setMetrics({
      occupancy,
      occupiedRooms,
      totalRooms,
      arrivalsToday,
      adr,
    })
    setReservations(reservasPrueba.slice(0, 5))
  }, [])

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-chart-line"></i> Dashboard
        </h1>
      </div>

      <div className="metrics-grid">
        <div className="metric-card" style={{ background: 'var(--primary)' }}>
          <div>🏨 Ocupación</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{metrics.occupancy}%</div>
          <div>{metrics.occupiedRooms}/{metrics.totalRooms} habitaciones</div>
        </div>
        <div className="metric-card" style={{ background: 'var(--accent)' }}>
          <div>📅 Llegadas hoy</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{metrics.arrivalsToday}</div>
          <div>Check-ins pendientes</div>
        </div>
        <div className="metric-card" style={{ background: 'var(--primary-dark)' }}>
          <div>💰 ADR · Tarifa Media</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>${metrics.adr}</div>
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
          {reservations.map(r => (
            <tr key={r.id}>
              <td>{r.guest_name}</td>
              <td>{r.room_name}</td>
              <td>{r.check_in} → {r.check_out}</td>
              <td>${r.total_amount}</td>
            </tr>
          ))}
          {reservations.length === 0 && (
            <tr><td colSpan="4">No hay reservas registradas</td></tr>
          )}
        </tbody>
      </table>
    </>
  )
}