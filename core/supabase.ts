import { createClient } from "@supabase/supabase-js"

export const createSupabaseClient = (accessToken?: string | null) =>
  createClient(
    process.env.PLASMO_PUBLIC_SUPABASE_URL,
    process.env.PLASMO_PUBLIC_SUPABASE_KEY,
    {
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      }
    }
  )
