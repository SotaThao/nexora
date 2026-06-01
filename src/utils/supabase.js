import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const supabaseSync = {
  push: async (key, value) => {
    if (!isSupabaseConfigured) return
    try {
      let parsedData
      try {
        parsedData = JSON.parse(value)
      } catch (e) {
        parsedData = value
      }

      await supabase
        .from('nexora_sync')
        .upsert(
          { 
            id: key, 
            data: parsedData, 
            updated_at: new Date().toISOString() 
          },
          { onConflict: 'id' }
        )
    } catch (e) {
      console.error('Supabase sync push error:', e)
    }
  },
  remove: async (key) => {
    if (!isSupabaseConfigured) return
    try {
      await supabase
        .from('nexora_sync')
        .delete()
        .eq('id', key)
    } catch (e) {
      console.error('Supabase sync remove error:', e)
    }
  },
  pullAll: async () => {
    if (!isSupabaseConfigured) return
    try {
      const { data, error } = await supabase
        .from('nexora_sync')
        .select('*')
      
      if (error) throw error
      if (data) {
        data.forEach(row => {
          const valueStr = typeof row.data === 'object' ? JSON.stringify(row.data) : row.data
          sessionStorage.setItem(row.id, valueStr)
          localStorage.setItem(row.id, valueStr)
        })
      }
    } catch (e) {
      console.error('Supabase pull error:', e)
    }
  },
  subscribe: (onUpdate) => {
    if (!isSupabaseConfigured) return null
    const channel = supabase
      .channel('nexora-sync-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nexora_sync' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const row = payload.new
          const valueStr = typeof row.data === 'object' ? JSON.stringify(row.data) : row.data
          onUpdate(row.id, valueStr)
        } else if (payload.eventType === 'DELETE') {
          const row = payload.old
          onUpdate(row.id, null)
        }
      })
      .subscribe()
    return channel
  }
}
