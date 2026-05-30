
using System;
using System.ComponentModel.DataAnnotations;
namespace OasisPOS.API.models
{
    public class Consumo
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int HabitacionId { get; set; }

        [Required]
        public string HabitacionNombre { get; set; } = string.Empty;

        [Required]
        public string Concepto { get; set; } = string.Empty;

        [Required]
        public decimal Monto { get; set; }

        public int Cantidad { get; set; } = 1;

        public DateTime Fecha { get; set; } = DateTime.Now;

        public string Estado { get; set; } = "pendiente";
    }
}
