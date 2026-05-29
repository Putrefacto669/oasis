// API Base URL
const API_URL = 'http://localhost:8000/api';

// Obtener datos del dashboard
export const getDashboardData = async () => {
  try {
    const response = await fetch(`${API_URL}/reports/dashboard`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return null;
  }
};

// Obtener ocupación semanal
export const getWeeklyOccupancy = async () => {
  try {
    const response = await fetch(`${API_URL}/reports/ocupacion-semanal`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weekly occupancy:', error);
    return null;
  }
};

// Obtener ingresos mensuales
export const getMonthlyRevenue = async () => {
  try {
    const response = await fetch(`${API_URL}/reports/ingresos-mensuales`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    return null;
  }
};

// Obtener datos de canales
export const getChannelsData = async () => {
  try {
    const response = await fetch(`${API_URL}/reports/canales`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching channels:', error);
    return null;
  }
};

// Exportar reservas a Excel
export const exportReservasExcel = () => {
  window.open(`${API_URL}/export/reservas`, '_blank');
};

// Exportar habitaciones a Excel
export const exportHabitacionesExcel = () => {
  window.open(`${API_URL}/export/habitaciones`, '_blank');
};

// Generar PDF
export const generarPDF = () => {
  window.open(`${API_URL}/reports/generar-pdf`, '_blank');
};

// Obtener análisis predictivo
export const getPredictiveAnalysis = async () => {
  try {
    const response = await fetch(`${API_URL}/reports/analisis-predictivo`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching predictive analysis:', error);
    return null;
  }
};