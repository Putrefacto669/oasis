import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ onNewReservation }) {
  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <Topbar onNewReservation={onNewReservation} />
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}