import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://unkbcfqmgvfmxyvlcqpc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVua2JjZnFtZ3ZmbXh5dmxjcXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MjY1ODQsImV4cCI6MjA5NTUwMjU4NH0.EeQ2srU-Ovni96AXSd_ZWblZMNgN1qwJYbUjCiBoiJE'

// Configuración adicional para forzar el envío de la API key
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    },
  },
})