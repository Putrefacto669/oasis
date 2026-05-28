import React, { useState } from 'react'

export default function Settings() {
  const [settings, setSettings] = useState({
    hotelName: 'Oasis Traveler - Lanquín',
    contactEmail: 'info@oasistraveler.com',
    contactPhone: '+502 1234 5678',
    cancelPolicy: 2,
    tax: 12
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('⚙️ Configuración guardada (conexión con Supabase pendiente)')
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title"><i className="fas fa-sliders-h"></i> Configuración</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre del hotel</label>
          <input
            type="text"
            value={settings.hotelName}
            onChange={(e) => setSettings({ ...settings, hotelName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Email de contacto</label>
          <input
            type="email"
            value={settings.contactEmail}
            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Teléfono</label>
          <input
            type="text"
            value={settings.contactPhone}
            onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Política de cancelación (días)</label>
          <input
            type="number"
            value={settings.cancelPolicy}
            onChange={(e) => setSettings({ ...settings, cancelPolicy: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Impuesto (%)</label>
          <input
            type="number"
            value={settings.tax}
            onChange={(e) => setSettings({ ...settings, tax: e.target.value })}
          />
        </div>

        <button type="submit" className="btn-primary">
          <i className="fas fa-save"></i> Guardar configuración
        </button>
      </form>
    </>
  )
}