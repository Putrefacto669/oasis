import React, { useState, useEffect } from 'react'

export default function RoomModal({ isOpen, onClose, onSave, room }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'private',
    base_price: '',
    status: 'available'
  })

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name,
        type: room.type,
        base_price: room.base_price,
        status: room.status
      })
    } else {
      setFormData({
        name: '',
        type: 'private',
        base_price: '',
        status: 'available'
      })
    }
  }, [room])

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
            <i className="fas fa-door-open"></i>
            {room ? ' Editar Habitación' : ' Nueva Habitación'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre de la habitación</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ej: Suite Presidencial"
            />
          </div>

          <div className="form-group">
            <label>Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="private">Privada</option>
              <option value="shared">Compartida</option>
            </select>
          </div>

          <div className="form-group">
            <label>Precio por noche ($)</label>
            <input
              type="number"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
              required
              placeholder="99"
            />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="available">Disponible</option>
              <option value="occupied">Ocupado</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Guardar habitación</button>
          </div>
        </form>
      </div>
    </div>
  )
}