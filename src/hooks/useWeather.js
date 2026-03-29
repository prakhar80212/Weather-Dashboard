import { useState, useEffect, useCallback } from 'react'
import { fetchCurrentWeather } from '../services/api'

export function useWeather(coords, date) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!coords || !date) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetchCurrentWeather(coords.lat, coords.lon, date)
      setData(result)
    } catch (err) {
      setError('Failed to fetch weather data. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [coords, date])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load }
}
