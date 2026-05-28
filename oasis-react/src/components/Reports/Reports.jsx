import React, { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default function Reports() {
  const channelChartRef = useRef(null)
  const revenueChartRef = useRef(null)
  let channelChartInstance = null
  let revenueChartInstance = null

  useEffect(() => {
    // Gráfico de canales
    if (channelChartRef.current) {
      if (channelChartInstance) channelChartInstance.destroy()
      channelChartInstance = new Chart(channelChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Booking.com', 'Directo', 'Expedia', 'WhatsApp'],
          datasets: [{
            data: [1250, 890, 450, 320],
            backgroundColor: ['#1e4a3b', '#c47a5c', '#f59e0b', '#3b82f6']
          }]
        }
      })
    }

    // Gráfico de ingresos
    if (revenueChartRef.current) {
      if (revenueChartInstance) revenueChartInstance.destroy()
      revenueChartInstance = new Chart(revenueChartRef.current, {
        type: 'line',
        data: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          datasets: [{
            label: 'Ingresos',
            data: [1250, 1450, 1890, 2100, 1780, 2200],
            borderColor: '#1e4a3b',
            tension: 0.3,
            fill: true,
            backgroundColor: 'rgba(30,74,59,0.1)'
          }]
        }
      })
    }

    return () => {
      if (channelChartInstance) channelChartInstance.destroy()
      if (revenueChartInstance) revenueChartInstance.destroy()
    }
  }, [])

  return (
    <div id="reportContent">
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-chart-line"></i> Reportes
        </h1>
      </div>

      <div className="report-actions no-print" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => window.print()} className="btn-secondary">
          <i className="fas fa-print"></i> Imprimir
        </button>
        <button onClick={() => alert('PDF generado')} className="btn-primary">
          <i className="fas fa-file-pdf"></i> Descargar PDF
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card" style={{ background: 'var(--primary)' }}>
          <div>Ocupación Actual</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>75%</div>
        </div>
        <div className="metric-card" style={{ background: 'var(--accent)' }}>
          <div>Ingresos Totales</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>$6,500</div>
        </div>
        <div className="metric-card" style={{ background: 'var(--primary-dark)' }}>
          <div>ADR Promedio</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>$85</div>
        </div>
      </div>

      <h3>📊 Ingresos por Canal</h3>
      <canvas ref={channelChartRef} height="120" style={{ margin: '20px 0' }}></canvas>

      <h3>📈 Evolución de Ingresos</h3>
      <canvas ref={revenueChartRef} height="120" style={{ margin: '20px 0' }}></canvas>
    </div>
  )
}