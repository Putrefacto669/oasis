import React, { useState } from 'react'

// Datos de prueba
const reservasPrueba = [
  { id: 1, guest_name: 'Carlos Méndez', guest_email: 'carlos@mail.com', room_name: 'Dormitorio Mixto', check_in: '2026-05-26', check_out: '2026-05-28', total_amount: 90, status: 'confirmed' },
  { id: 2, guest_name: 'Laura Gómez', guest_email: 'laura@mail.com', room_name: 'Habitación Deluxe', check_in: '2026-05-26', check_out: '2026-05-29', total_amount: 255, status: 'confirmed' },
  { id: 3, guest_name: 'Javier Ruiz', guest_email: 'javier@mail.com', room_name: 'Doble Estándar', check_in: '2026-05-27', check_out: '2026-05-30', total_amount: 195, status: 'confirmed' },
]

export default function Reservations() {
  const [reservations, setReservations] = useState(reservasPrueba)

  const handleDelete = (id) => {
    if (confirm('¿Cancelar esta reserva?')) {
      setReservations(reservations.filter(r => r.id !== id))
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-calendar-check"></i> Reservas
        </h1>
        <button className="btn-primary" onClick={() => alert('Nueva reserva')}>
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
          {reservations.map(r => (
            <tr key={r.id}>
              <td>{r.guest_name}</td>
              <td>{r.guest_email}</td>
              <td>{r.room_name}</td>
              <td>{r.check_in}</td>
              <td>{r.check_out}</td>
              <td>${r.total_amount}</td>
              <td>
                <span className={`status-badge ${r.status}`}>
                  {r.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                </span>
              </td>
              <td>
                <button className="btn-icon" onClick={() => alert('Editar reserva')}>
                  <i className="fas fa-edit"></i>
                </button>
                <button className="btn-icon" onClick={() => handleDelete(r.id)}>
                  <i className="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          ))}
          {reservations.length === 0 && (
            <tr><td colSpan="8">No hay reservas registradas</td></tr>
          )}
        </tbody>
      </table>
    </>
  )
}