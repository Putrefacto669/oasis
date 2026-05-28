import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://unkbcfqmgvfmxyvlcqpc.supabase.co'

const supabaseAnonKey =
  'sb_publishable_N343JLW_njuzgcMSbyF13A_mO2xq-ir'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)