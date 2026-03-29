import { useState, useEffect } from 'react'

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    )
    const data = await res.json()
    const { city, town, village, suburb, state, country } = data.address ?? {}
    const place = city || town || village || suburb || state || ''
    return place ? `${place}, ${country}` : country ?? 'Unknown'
  } catch {
    return null
  }
}

export function useGeolocation() {
  const [coords, setCoords] = useState(null)
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        setCoords({ lat, lon })
        setLoading(false)
        const name = await reverseGeocode(lat, lon)
        setLocation(name)
      },
      () => {
        setCoords({ lat: 19.076, lon: 72.8777 })
        setLocation('Mumbai, India')
        setError('Location access denied. Showing Mumbai by default.')
        setLoading(false)
      },
      { timeout: 8000, maximumAge: 300000 }
    )
  }, [])

  return { coords, location, error, loading }
}
