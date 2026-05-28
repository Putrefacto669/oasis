import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

export default function Topbar({ onNewReservation }) {
  const [date, setDate] = useState('')
  const { logout } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    const updateDate = () => {
      const now = new Date()
      setDate(now.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }))
    }
    updateDate()
    const interval = setInterval(updateDate, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="topbar">
      <div className="date-badge">
        <i className="far fa-calendar-alt"></i> {date}
      </div>

      <div className="topbar-actions">
        <button onClick={toggleDarkMode} className="btn-darkmode">
          <i className={darkMode ? 'fas fa-sun' : 'fas fa-moon'}></i>
        </button>
        <button onClick={() => window.location.reload()}>
          <i className="fas fa-sync-alt"></i> Actualizar
        </button>
        <button onClick={onNewReservation} className="btn-primary-sm">
          <i className="fas fa-plus"></i> Nueva reserva
        </button>
        <button onClick={handleLogout} className="btn-logout">
          <i className="fas fa-sign-out-alt"></i> Salir
        </button>
      </div>
    </div>
  )
}