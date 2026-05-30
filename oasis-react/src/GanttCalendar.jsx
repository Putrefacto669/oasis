import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const GanttCalendar = ({ habitaciones, reservas, onReservaUpdate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Obtener año y mes actual
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Nombres de meses y días
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  // Obtener días del mes
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startWeekDay = firstDayOfMonth.getDay();
  
  // Construir matriz de días
  const days = [];
  // Días del mes anterior
  const prevMonthDays = startWeekDay;
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({ date, isCurrentMonth: false });
  }
  // Días del mes actual
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  // Días del mes siguiente (para completar 42 días = 6 semanas)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  // Navegación
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const goToday = () => {
    setCurrentDate(new Date());
  };

  // Verificar si una fecha tiene reserva en una habitación
  const getReservaEnFecha = (habitacionId, fecha) => {
    const fechaStr = fecha.toISOString().slice(0, 10);
    const habitacion = habitaciones.find(h => h.id === habitacionId);
    return reservas.find(r => 
      r.room_name === habitacion?.name &&
      r.check_in <= fechaStr && r.check_out > fechaStr
    );
  };

  // Mover reserva a nueva fecha
  const moverReserva = async (reservaId, newDate, habitacionId) => {
    setLoading(true);
    const reserva = reservas.find(r => r.id === reservaId);
    if (!reserva) return;
    
    const nights = Math.ceil((new Date(reserva.check_out) - new Date(reserva.check_in)) / (1000 * 60 * 60 * 24));
    const newCheckOut = new Date(newDate);
    newCheckOut.setDate(newDate.getDate() + nights);
    
    const { error } = await supabase.from('reservations').update({
      check_in: newDate.toISOString().slice(0, 10),
      check_out: newCheckOut.toISOString().slice(0, 10)
    }).eq('id', reservaId);
    
    if (!error) {
      alert(`✅ Reserva movida al ${newDate.toLocaleDateString()}`);
      onReservaUpdate();
    } else {
      alert('❌ Error al mover la reserva');
    }
    setLoading(false);
  };

  // Verificar si una fecha es hoy
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-calendar-alt"></i> Calendario de Ocupación
        </h1>
      </div>

      {/* Controles */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={prevMonth}>
            <i className="fas fa-chevron-left"></i> Anterior
          </button>
          <button className="btn-secondary" onClick={goToday}>
            <i className="fas fa-calendar-day"></i> Hoy
          </button>
          <button className="btn-secondary" onClick={nextMonth}>
            Siguiente <i className="fas fa-chevron-right"></i>
          </button>
        </div>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary)' }}>
          {monthNames[month]} {year}
        </h2>
        <div></div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <i className="fas fa-spinner fa-pulse"></i> Actualizando...
        </div>
      )}

      {/* Calendario */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '700px'
        }}>
          <thead>
            <tr style={{ background: 'var(--primary)', color: 'white' }}>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                Habitación
              </th>
              {days.slice(0, 7).map((day, idx) => (
                <th key={idx} style={{
                  padding: '12px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.2)',
                  minWidth: '100px'
                }}>
                  {dayNames[day.date.getDay()]}
                  <br />
                  <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    {day.date.getDate()}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Renderizar 6 filas (semanas) */}
            {[0, 1, 2, 3, 4, 5].map(weekIdx => (
              <tr key={weekIdx}>
                {weekIdx === 0 && (
                  <td rowSpan="6" style={{
                    verticalAlign: 'top',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    width: '200px'
                  }}>
                    <div style={{ padding: '12px' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>🏨 Habitaciones</h4>
                      {habitaciones.map(h => (
                        <div key={h.id} style={{
                          padding: '8px',
                          borderBottom: '1px solid var(--border)',
                          fontWeight: 'bold'
                        }}>
                          {h.name}
                        </div>
                      ))}
                    </div>
                  </td>
                )}
                {days.slice(weekIdx * 7, (weekIdx + 1) * 7).map((day, colIdx) => {
                  const isCurrentMonth = day.isCurrentMonth;
                  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                  const today = isToday(day.date);
                  
                  return (
                    <td key={colIdx} style={{
                      padding: '4px',
                      border: '1px solid var(--border)',
                      backgroundColor: !isCurrentMonth ? 'var(--bg-main)' : (isWeekend ? 'var(--bg-main)' : 'var(--bg-card)'),
                      verticalAlign: 'top',
                      minWidth: '100px',
                      height: '80px'
                    }}>
                      <div style={{
                        fontSize: '0.7rem',
                        padding: '2px 4px',
                        textAlign: 'right',
                        color: !isCurrentMonth ? 'var(--text-secondary)' : (today ? 'var(--accent)' : 'var(--text-primary)'),
                        fontWeight: today ? 'bold' : 'normal'
                      }}>
                        {day.date.getDate()}
                        {today && <span style={{ marginLeft: '4px', fontSize: '0.6rem' }}>●</span>}
                      </div>
                      <div style={{ fontSize: '0.7rem' }}>
                        {habitaciones.map(habitacion => {
                          const reserva = getReservaEnFecha(habitacion.id, day.date);
                          if (reserva) {
                            const isFirstDay = reserva.check_in === day.date.toISOString().slice(0, 10);
                            return (
                              <div
                                key={habitacion.id}
                                onClick={() => {
                                  if (isFirstDay && confirm(`Mover reserva de ${reserva.guest_name} a ${day.date.toLocaleDateString()}?`)) {
                                    moverReserva(reserva.id, day.date, habitacion.id);
                                  }
                                }}
                                style={{
                                  background: '#1e4a3b',
                                  color: 'white',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  marginBottom: '2px',
                                  fontSize: '0.65rem',
                                  cursor: isFirstDay ? 'pointer' : 'default',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                title={isFirstDay ? `Haz clic para mover ${reserva.guest_name}` : reserva.guest_name}
                              >
                                {isFirstDay ? '📅 ' + reserva.guest_name.split(' ')[0] : '▪️'}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'var(--bg-main)',
        borderRadius: '12px',
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
        fontSize: '12px'
      }}>
        <div><span style={{ display: 'inline-block', width: '16px', height: '16px', background: '#1e4a3b', borderRadius: '4px', marginRight: '8px' }}></span> Día ocupado</div>
        <div><span style={{ display: 'inline-block', width: '16px', height: '16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', marginRight: '8px' }}></span> Día libre</div>
        <div><span style={{ display: 'inline-block', width: '16px', height: '16px', background: '#c47a5c', borderRadius: '50%', marginRight: '8px' }}></span> Hoy</div>
        <div><span style={{ display: 'inline-block', width: '16px', height: '16px', background: '#e2e8f0', borderRadius: '4px', marginRight: '8px' }}></span> Otro mes</div>
        <div><i className="fas fa-mouse-pointer"></i> Haz clic en 📅 para mover reservas</div>
      </div>
    </div>
  );
};

export default GanttCalendar;
