import React, { useState, useEffect } from 'react'

export default function ReservationModal({ isOpen, onClose, onSave, reservation, rooms }) {
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    room_id: '',
    room_name: '',
    check_in: '',
    check_out: '',
    channel: 'direct',
    status: 'confirmed',
    total_amount: 0
  })

  useEffect(() => {
    if (reservation) {
      setFormData({
        guest_name: reservation.guest_name,
        guest_email: reservation.guest_email,
        guest_phone: reservation.guest_phone || '',
        room_id: reservation.room_id,
        room_name: reservation.room_name,
        check_in: reservation.check_in,
        check_out: reservation.check_out,
        channel: reservation.channel,
        status: reservation.status,
        total_amount: reservation.total_amount
      })
    } else {
      const today = new Date().toISOString().slice(0, 10)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setFormData({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        room_id: '',
        room_name: '',
        check_in: today,
        check_out: tomorrow.toISOString().slice(0, 10),
        channel: 'direct',
        status: 'confirmed',
        total_amount: 0
      })
    }
  }, [reservation])

  useEffect(() => {
    // Calcular total cuando cambia habitación o fechas
    if (formData.room_id && formData.check_in && formData.check_out) {
      const room = rooms.find(r => r.id === parseInt(formData.room_id))
      if (room) {
        const start = new Date(formData.check_in)
        const end = new Date(formData.check_out)
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
        const total = room.base_price * nights
        setFormData(prev => ({ ...prev, total_amount: total, room_name: room.name }))
      }
    }
  }, [formData.room_id, formData.check_in, formData.check_out, rooms])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-calendar-plus"></i>
            {reservation ? ' Editar Reserva' : ' Nueva Reserva'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del huésped *</label>
            <input
              type="text"
              value={formData.guest_name}
              onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
              required
              placeholder="Ej: María González"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.guest_email}
              onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
              required
              placeholder="maria@ejemplo.com"
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              value={formData.guest_phone}
              onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
              placeholder="+502 1234 5678"
            />
          </div>

          <div className="form-group">
            <label>Habitación *</label>
            <select
              value={formData.room_id}
              onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
              required
            >
              <option value="">Seleccionar habitación</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name} - ${r.base_price}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Check-in *</label>
            <input
              type="date"
              value={formData.check_in}
              onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Check-out *</label>
            <input
              type="date"
              value={formData.check_out}
              onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Canal</label>
            <select
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
            >
              <option value="direct">Directo</option>
              <option value="booking">Booking.com</option>
              <option value="expedia">Expedia</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="confirmed">Confirmada</option>
              <option value="checkin">Check-in</option>
              <option value="pending">Pendiente</option>
            </select>
          </div>

          <div className="form-group">
            <label>Total a pagar</label>
            <input type="text" value={`$${formData.total_amount}`} disabled />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Guardar reserva</button>
          </div>
        </form>
      </div>
    </div>
  )
}