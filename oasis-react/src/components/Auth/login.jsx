import React, { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('admin@oasistraveler.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Login fijo - funciona siempre
    if (email === 'admin@oasistraveler.com' && password === 'admin123') {
      localStorage.setItem('user', JSON.stringify({ id: 1, email, name: 'Administrador' }))
      window.location.href = '/'
    } else {
      setError('❌ Email o contraseña incorrectos')
    }

    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e4a3b, #0f3b2f)'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '32px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: '#1e4a3b' }}>Oasis<span style={{ color: '#c47a5c' }}>Traveler</span></h1>
          <p>Sistema de Gestión Hotelera</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@oasistraveler.com"
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="admin123"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          {error && (
            <div style={{ color: 'red', marginTop: '16px', textAlign: 'center' }}>
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}