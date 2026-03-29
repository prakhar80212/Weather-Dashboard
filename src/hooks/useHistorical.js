import { useState, useEffect, useCallback } from 'react'
import { fetchHistoricalWeather } from '../services/api'

export function useHistorical(coords, startDate, endDate) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!coords || !startDate || !endDate) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetchHistoricalWeather(coords.lat, coords.lon, startDate, endDate)
      setData(result)
    } catch (err) {
      setError('Failed to fetch historical data. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [coords, startDate, endDate])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load }
}
