import React, { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay usuario guardado en localStorage
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // Login simulado - siempre exitoso con las credenciales correctas
    if (email === 'admin@oasistraveler.com' && password === 'admin123') {
      const user = { id: 1, email, name: 'Administrador' }
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      return { user }
    }
    throw new Error('Credenciales incorrectas')
  }

  const logout = async () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}