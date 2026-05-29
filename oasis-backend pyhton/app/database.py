from supabase import create_client, Client
import os
from dotenv import load_dotenv
import sys

# Cargar variables de entorno desde diferentes ubicaciones posibles
load_dotenv()  # Cargar desde el directorio actual
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))  # Cargar desde la raíz

# También intentar cargar desde la ruta absoluta
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"✅ Archivo .env encontrado en: {env_path}")
else:
    print(f"❌ Archivo .env NO encontrado en: {env_path}")

SUPABASE_URL = "https://unkbcfqmgvfmxyvlcqpc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVua2JjZnFtZ3ZmbXh5dmxjcXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MjY1ODQsImV4cCI6MjA5NTUwMjU4NH0.EeQ2srU-Ovni96AXSd_ZWblZMNgN1qwJYbUjCiBoiJE"

# Depuración
print(f"📁 SUPABASE_URL: {SUPABASE_URL}")
print(f"🔑 SUPABASE_KEY: {SUPABASE_KEY[:50] if SUPABASE_KEY else 'None'}...")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: Las credenciales de Supabase no se encontraron.")
    print("Asegúrate de tener un archivo .env en la raíz del proyecto con:")
    print("SUPABASE_URL=tu_url")
    print("SUPABASE_KEY=tu_key")
    sys.exit(1)

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Conexión a Supabase exitosa")
except Exception as e:
    print(f"❌ Error al conectar a Supabase: {e}")
    sys.exit(1)

def get_supabase():
    return supabase
