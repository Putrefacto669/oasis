import React, { useState } from 'react'

// Datos de prueba
const habitacionesPrueba = [
  { id: 1, name: 'Dormitorio Mixto', type: 'shared', base_price: 45, status: 'available' },
  { id: 2, name: 'Habitación Deluxe', type: 'private', base_price: 85, status: 'occupied' },
  { id: 3, name: 'Habitación Cuádruple', type: 'private', base_price: 95, status: 'available' },
  { id: 4, name: 'Doble Estándar', type: 'private', base_price: 65, status: 'occupied' },
  { id: 5, name: 'Habitación Triple', type: 'private', base_price: 75, status: 'available' },
  { id: 6, name: 'Queen Bathroom', type: 'private', base_price: 110, status: 'available' },
]

export default function Rooms() {
  const [rooms, setRooms] = useState(habitacionesPrueba)

  const handleDelete = (id) => {
    if (confirm('¿Eliminar esta habitación?')) {
      setRooms(rooms.filter(r => r.id !== id))
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-door-open"></i> Habitaciones
        </h1>
        <button className="btn-primary" onClick={() => alert('Agregar habitación')}>
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
          {rooms.map(r => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.type === 'private' ? '🚪 Privada' : '🛏️ Compartida'}</td>
              <td>${r.base_price}</td>
              <td>
                <span className={`status-badge ${r.status}`}>
                  {r.status === 'available' ? 'Disponible' : 'Ocupado'}
                </span>
              </td>
              <td>
                <button className="btn-icon" onClick={() => alert('Editar habitación')}>
                  <i className="fas fa-edit"></i>
                </button>
                <button className="btn-icon" onClick={() => handleDelete(r.id)}>
                  <i className="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          ))}
          {rooms.length === 0 && (
            <tr><td colSpan="5">No hay habitaciones registradas</td></tr>
          )}
        </tbody>
      </table>
    </>
  )
}