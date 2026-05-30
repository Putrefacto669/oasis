using System;
using System.Collections.Generic;
namespace OasisPOS.API.models
{
    public class ConsumoDTO
    {
        public int HabitacionId { get; set; }
        public string Concepto { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public int Cantidad { get; set; } = 1;
    }

    public class ConsumoResponseDTO
    {
        public int Id { get; set; }
        public int HabitacionId { get; set; }
        public string HabitacionNombre { get; set; } = string.Empty;
        public string Concepto { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public int Cantidad { get; set; }
        public decimal Subtotal { get; set; }
        public DateTime Fecha { get; set; }
        public string Estado { get; set; } = string.Empty;
    }

    public class FacturaDTO
    {
        public int HabitacionId { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
    }

    public class FacturaResponseDTO
    {
        public int HabitacionId { get; set; }
        public string HabitacionNombre { get; set; } = string.Empty;
        public List<ConsumoResponseDTO> Consumos { get; set; } = new();
        public decimal Subtotal { get; set; }
        public decimal Impuesto { get; set; }
        public decimal Total { get; set; }
        public DateTime FechaEmision { get; set; }
    }
}
