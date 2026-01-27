import { useEffect, useState, useCallback } from 'react'
import { RegionService, Region } from '../services/regionService'
import { supabase } from '../supabaseClient'

export function useRegionsData() {
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRegions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await RegionService.getAllRegions()
      const sorted = [...data].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      )
      setRegions(sorted)
    } catch (e: any) {
      console.error('Error in useRegionsData:', e);
      setError(e?.message || 'Failed to load regions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRegions()
    const channel = supabase
      .channel('regions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'regions' },
        () => {
          fetchRegions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchRegions])

  return { regions, loading, error, refresh: fetchRegions }
}

