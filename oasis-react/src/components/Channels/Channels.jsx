import React from 'react'

export default function Channels() {
  return (
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
  )
}