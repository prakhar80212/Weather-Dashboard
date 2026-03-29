import axios from 'axios'
import { format } from 'date-fns'

const WEATHER_BASE = 'https://api.open-meteo.com/v1'
const AIR_BASE = 'https://air-quality-api.open-meteo.com/v1'
const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1'

function fmt(date) {
  return format(date, 'yyyy-MM-dd')
}

export async function fetchCurrentWeather(lat, lon, date) {
  const dateStr = fmt(date)

  const [weatherRes, airRes] = await Promise.all([
    axios.get(`${WEATHER_BASE}/forecast`, {
      params: {
        latitude: lat,
        longitude: lon,
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_sum',
          'windspeed_10m_max',
          'precipitation_probability_max',
          'sunrise',
          'sunset',
          'uv_index_max',
        ].join(','),
        hourly: [
          'temperature_2m',
          'relativehumidity_2m',
          'precipitation',
          'visibility',
          'windspeed_10m',
          'apparent_temperature',
        ].join(','),
        current_weather: true,
        timezone: 'auto',
        start_date: dateStr,
        end_date: dateStr,
      },
    }),
    axios.get(`${AIR_BASE}/air-quality`, {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: [
          'pm10',
          'pm2_5',
          'carbon_monoxide',
          'nitrogen_dioxide',
          'sulphur_dioxide',
          'european_aqi',
        ].join(','),
        current: ['european_aqi', 'pm10', 'pm2_5', 'carbon_monoxide', 'nitrogen_dioxide', 'sulphur_dioxide'].join(','),
        timezone: 'auto',
        start_date: dateStr,
        end_date: dateStr,
      },
    }),
  ])

  return {
    weather: weatherRes.data,
    air: airRes.data,
  }
}

export async function fetchHistoricalWeather(lat, lon, startDate, endDate) {
  const start = fmt(startDate)
  const end = fmt(endDate)

  const [weatherRes, airRes] = await Promise.all([
    axios.get(`${ARCHIVE_BASE}/archive`, {
      params: {
        latitude: lat,
        longitude: lon,
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'temperature_2m_mean',
          'precipitation_sum',
          'windspeed_10m_max',
          'winddirection_10m_dominant',
          'sunrise',
          'sunset',
        ].join(','),
        timezone: 'auto',
        start_date: start,
        end_date: end,
      },
    }),
    axios.get(`${AIR_BASE}/air-quality`, {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: ['pm10', 'pm2_5'].join(','),
        timezone: 'auto',
        start_date: start,
        end_date: end,
      },
    }).catch(() => ({ data: null })),
  ])

  return {
    weather: weatherRes.data,
    air: airRes.data,
  }
}
