#nullable disable
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;           

namespace OasisPOS.API.Services
{
    public class SupabaseService
    {
        private readonly HttpClient _httpClient;
        private readonly string _supabaseUrl;
        private readonly string _supabaseKey;

        public SupabaseService(IConfiguration configuration)
        {
            _httpClient = new HttpClient();
            _supabaseUrl = configuration["Supabase:Url"] ?? "";
            _supabaseKey = configuration["Supabase:Key"] ?? "";

            Console.WriteLine($"🔑 Supabase URL: {_supabaseUrl}");
            Console.WriteLine($"🔑 Supabase Key: {_supabaseKey?.Substring(0, 20)}...");

            _httpClient.DefaultRequestHeaders.Add("apikey", _supabaseKey);
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_supabaseKey}");
        }

        public async Task<Dictionary<string, object>> ObtenerHabitacion(int id)
        {
            try
            {
                var url = $"{_supabaseUrl}/rest/v1/rooms?id=eq.{id}&select=*";
                Console.WriteLine($"📡 GET: {url}");

                var response = await _httpClient.GetAsync(url);
                var json = await response.Content.ReadAsStringAsync();

                Console.WriteLine($"📥 Respuesta: {response.StatusCode}");
                Console.WriteLine($"📄 JSON: {json}");

                if (response.IsSuccessStatusCode)
                {
                    var habitaciones = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(json);
                    if (habitaciones != null && habitaciones.Count > 0)
                    {
                        return habitaciones[0];
                    }
                }
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> RegistrarConsumo(int habitacionId, string habitacionNombre, string concepto, decimal monto, int cantidad)
        {
            try
            {
                var consumo = new
                {
                    habitacion_id = habitacionId,
                    habitacion_nombre = habitacionNombre,
                    concepto = concepto,
                    monto = monto,
                    cantidad = cantidad,
                    fecha = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    estado = "pendiente"
                };

                var json = JsonSerializer.Serialize(consumo);
                var url = $"{_supabaseUrl}/rest/v1/consumos";

                Console.WriteLine($"📤 POST: {url}");
                Console.WriteLine($"📦 Body: {json}");

                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(url, content);
                var responseBody = await response.Content.ReadAsStringAsync();

                Console.WriteLine($"📥 Respuesta: {response.StatusCode}");
                Console.WriteLine($"📄 Body: {responseBody}");

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error: {ex.Message}");
                return false;
            }
        }

        public async Task<string> ObtenerConsumosHabitacion(int id)
        {
            var response = await _httpClient.GetAsync($"{_supabaseUrl}/rest/v1/consumos?habitacion_id=eq.{id}&select=*");
            return await response.Content.ReadAsStringAsync();
        }
    }
}
