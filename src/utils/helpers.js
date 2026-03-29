// Temperature conversion
export const cToF = (c) => (c == null ? null : Math.round((c * 9) / 5 + 32))
export const fToC = (f) => (f == null ? null : Math.round(((f - 32) * 5) / 9))

export function convertTemp(value, unit) {
  if (value == null) return '--'
  return unit === 'F' ? `${cToF(value)}°F` : `${Math.round(value)}°C`
}

export function convertTempValue(value, unit) {
  if (value == null) return null
  return unit === 'F' ? cToF(value) : Math.round(value)
}

// IST time formatter
export function toIST(isoString) {
  if (!isoString) return '--'
  try {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '--'
  }
}

// Convert ISO sunrise/sunset string to minutes since midnight (for charts)
export function timeToMinutes(isoString) {
  if (!isoString) return null
  try {
    const date = new Date(isoString)
    const ist = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    return ist.getHours() * 60 + ist.getMinutes()
  } catch {
    return null
  }
}

export function minutesToTime(minutes) {
  if (minutes == null) return '--'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

// Format hour label from ISO string
export function formatHour(isoString) {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    const h = date.getHours()
    if (h === 0) return '12 AM'
    if (h === 12) return '12 PM'
    return h > 12 ? `${h - 12} PM` : `${h} AM`
  } catch {
    return ''
  }
}

// Format date for chart axis
export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } catch {
    return dateStr
  }
}

// AQI color & label
export function aqiInfo(aqi) {
  if (aqi == null) return { label: '--', color: '#8892a4' }
  if (aqi <= 50)  return { label: 'Good', color: '#68d391' }
  if (aqi <= 100) return { label: 'Moderate', color: '#f6ad55' }
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: '#fc8181' }
  if (aqi <= 200) return { label: 'Unhealthy', color: '#e53e3e' }
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#b794f4' }
  return { label: 'Hazardous', color: '#c53030' }
}

// Wind direction degrees to compass label
export function degreesToCompass(deg) {
  if (deg == null) return '--'
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

// Visibility in km
export function formatVisibility(m) {
  if (m == null) return '--'
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

// Get daily index for a given date from hourly data
export function getHourlyForDate(hourlyTime, values, dateStr) {
  if (!hourlyTime || !values) return []
  return hourlyTime.reduce((acc, t, i) => {
    if (t.startsWith(dateStr)) {
      acc.push({ time: t, value: values[i] })
    }
    return acc
  }, [])
}

// Get daily data index for a given date
export function getDailyIndex(dailyTime, dateStr) {
  if (!dailyTime) return -1
  return dailyTime.findIndex((t) => t === dateStr)
}
