import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createLocalClient } from './local/localClient'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

/**
 * When real Supabase credentials are present we use the real client.
 * Otherwise we fall back to an in-browser mock backed by localStorage so the
 * entire app runs locally with no backend setup. See lib/local/localClient.ts.
 */
export const isLocalMode = !hasSupabaseConfig

if (isLocalMode) {
  console.info(
    '[SwimCoach] Running in LOCAL MODE — data is stored in your browser. ' +
      'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to use a real Supabase project.',
  )
}

export const supabase: SupabaseClient = isLocalMode
  ? (createLocalClient() as unknown as SupabaseClient)
  : createClient(supabaseUrl!, supabaseAnonKey!)
