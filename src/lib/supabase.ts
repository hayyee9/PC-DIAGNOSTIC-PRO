import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. ' +
        'Please add them in Vercel Settings > Environment Variables.'
      )
    }

    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }

  return _supabase
}