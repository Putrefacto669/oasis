import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const menuItems = [
  { path: '/', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
  { path: '/rooms', icon: 'fas fa-door-open', label: 'Habitaciones' },
  { path: '/reservations', icon: 'fas fa-calendar-check', label: 'Reservas' },
  { path: '/reports', icon: 'fas fa-chart-line', label: 'Reportes' },
  { path: '/channels', icon: 'fas fa-globe', label: 'Canales' },
  { path: '/settings', icon: 'fas fa-sliders-h', label: 'Configuración' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside className="sidebar">
      <div className="logo-area">
        <h2>Oasis<span>Traveler</span></h2>
        <p>Gestión Hotelera</p>
      </div>

      <nav className="nav-menu">
        {menuItems.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="user-footer">
        <div className="avatar">AD</div>
        <div className="user-info">
          <div className="name">Administrador</div>
          <div className="role">Admin</div>
        </div>
      </div>
    </aside>
  )
}