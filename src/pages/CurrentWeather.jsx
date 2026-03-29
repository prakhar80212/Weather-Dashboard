import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'

import { useGeolocation } from '../hooks/useGeolocation'
import { useWeather } from '../hooks/useWeather'
import MetricCard from '../components/MetricCard'
import ChartWrapper from '../components/ChartWrapper'
import { LoadingState } from '../components/Skeleton'
import CustomTooltip from '../components/CustomTooltip'
import {
  convertTemp, convertTempValue, toIST, formatHour,
  aqiInfo, formatVisibility, getDailyIndex, degreesToCompass
} from '../utils/helpers'

const CHART_COLORS = {
  blue:   '#63b3ed',
  cyan:   '#4fd1c5',
  amber:  '#f6ad55',
  rose:   '#fc8181',
  green:  '#68d391',
  purple: '#b794f4',
  grid:   'rgba(255,255,255,0.04)',
  axis:   '#4b5563',
}

const axisStyle = { fill: CHART_COLORS.axis, fontSize: 11, fontFamily: 'DM Mono' }

export default function CurrentWeather() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [tempUnit, setTempUnit] = useState('C')
  const { coords, location, error: gpsError } = useGeolocation()

  const { data, loading, error } = useWeather(coords, selectedDate)

  const dateStr = selectedDate.toISOString().split('T')[0]

  // ── Derived data ──────────────────────────────────────────────────────────
  const daily = useMemo(() => {
    if (!data?.weather?.daily) return null
    const d = data.weather.daily
    const i = getDailyIndex(d.time, dateStr)
    if (i === -1) return null
    return {
      tempMax:     d.temperature_2m_max?.[i],
      tempMin:     d.temperature_2m_min?.[i],
      precip:      d.precipitation_sum?.[i],
      windMax:     d.windspeed_10m_max?.[i],
      precipProb:  d.precipitation_probability_max?.[i],
      sunrise:     d.sunrise?.[i],
      sunset:      d.sunset?.[i],
      uvIndex:     d.uv_index_max?.[i],
    }
  }, [data, dateStr])

  const current = data?.weather?.current_weather

  const airCurrent = useMemo(() => {
    if (!data?.air?.current) return null
    return data.air.current
  }, [data])

  // Hourly slices for the selected date
  const hourly = useMemo(() => {
    if (!data?.weather?.hourly) return null
    const h = data.weather.hourly
    const slice = (arr) => {
      if (!arr) return []
      const startIdx = h.time.findIndex(t => t.startsWith(dateStr))
      if (startIdx === -1) return []
      return h.time.slice(startIdx, startIdx + 24).map((t, i) => ({
        label: formatHour(t),
        value: arr[startIdx + i],
      }))
    }

    return {
      temp:     slice(h.temperature_2m),
      humidity: slice(h.relativehumidity_2m),
      precip:   slice(h.precipitation),
      vis:      slice(h.visibility),
      wind:     slice(h.windspeed_10m),
    }
  }, [data, dateStr])

  const airHourly = useMemo(() => {
    if (!data?.air?.hourly) return null
    const h = data.air.hourly
    const startIdx = h.time?.findIndex(t => t.startsWith(dateStr))
    if (startIdx === -1 || startIdx == null) return null
    return h.time.slice(startIdx, startIdx + 24).map((t, i) => ({
      label: formatHour(t),
      pm10:  h.pm10?.[startIdx + i],
      pm25:  h.pm2_5?.[startIdx + i],
    }))
  }, [data, dateStr])

  const tempHourlyData = useMemo(() => {
    if (!hourly?.temp) return []
    return hourly.temp.map(d => ({
      ...d,
      value: convertTempValue(d.value, tempUnit),
    }))
  }, [hourly, tempUnit])

  // ── AQI info ──────────────────────────────────────────────────────────────
  const aqi = airCurrent?.european_aqi
  const { label: aqiLabel, color: aqiColor } = aqiInfo(aqi)

  if (loading || !data) {
    return (
      <div className="pt-8">
        {gpsError && <GpsError message={gpsError} />}
        <PageHeader date={selectedDate} onDateChange={setSelectedDate} location={location} />
        <LoadingState count={12} />
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        className="pt-8 flex flex-col items-center justify-center py-24 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="text-4xl">⚠️</div>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
      </motion.div>
    )
  }

  return (
    <div className="pt-8 space-y-8">
      {gpsError && <GpsError message={gpsError} />}

      {/* Header */}
      <PageHeader date={selectedDate} onDateChange={setSelectedDate} location={location} />

      {/* ── Section 1: Weather Variables ─────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <SectionLabel>Weather conditions</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Current Temp"
            value={current?.temperature != null ? convertTempValue(current.temperature, tempUnit) : '--'}
            unit={tempUnit === 'C' ? '°C' : '°F'}
            sub={`Feels like ${current?.temperature != null ? convertTemp(current.temperature, tempUnit) : '--'}`}
            icon="🌡️"
            accentColor={CHART_COLORS.rose}
            large
            rightSlot={<TempToggle value={tempUnit} onChange={setTempUnit} />}
          />
          <MetricCard
            label="Max / Min"
            value={`${daily?.tempMax != null ? convertTempValue(daily.tempMax, tempUnit) : '--'} / ${daily?.tempMin != null ? convertTempValue(daily.tempMin, tempUnit) : '--'}`}
            unit={tempUnit === 'C' ? '°C' : '°F'}
            icon="↕️"
            accentColor={CHART_COLORS.amber}
          />
          <MetricCard
            label="Precipitation"
            value={daily?.precip ?? '--'}
            unit="mm"
            icon="🌧️"
            accentColor={CHART_COLORS.blue}
          />
          <MetricCard
            label="Humidity"
            value={data?.weather?.hourly?.relativehumidity_2m?.[new Date().getHours()] ?? '--'}
            unit="%"
            icon="💧"
            accentColor={CHART_COLORS.cyan}
          />
          <MetricCard
            label="UV Index"
            value={daily?.uvIndex ?? '--'}
            sub={daily?.uvIndex >= 8 ? 'Very High' : daily?.uvIndex >= 6 ? 'High' : daily?.uvIndex >= 3 ? 'Moderate' : 'Low'}
            icon="☀️"
            accentColor={CHART_COLORS.amber}
          />
          <MetricCard
            label="Sunrise"
            value={toIST(daily?.sunrise)}
            icon="🌅"
            accentColor={CHART_COLORS.amber}
          />
          <MetricCard
            label="Sunset"
            value={toIST(daily?.sunset)}
            icon="🌇"
            accentColor={CHART_COLORS.purple}
          />
          <MetricCard
            label="Max Wind"
            value={daily?.windMax ?? '--'}
            unit="km/h"
            sub={current?.winddirection != null ? `Dir: ${degreesToCompass(current.winddirection)}` : ''}
            icon="💨"
            accentColor={CHART_COLORS.cyan}
          />
          <MetricCard
            label="Precip Prob"
            value={daily?.precipProb ?? '--'}
            unit="%"
            icon="☔"
            accentColor={CHART_COLORS.blue}
          />
        </div>
      </motion.section>

      {/* ── Section 2: Air Quality ────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <SectionLabel>Air quality</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <motion.div
            className="rounded-2xl p-4 col-span-2 sm:col-span-1"
            style={{ background: 'var(--bg-card)', border: `1px solid ${aqiColor}40` }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
          >
            <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>AQI</div>
            <div className="text-5xl font-semibold mb-1" style={{ color: aqiColor }}>{aqi ?? '--'}</div>
            <div className="text-sm font-medium" style={{ color: aqiColor }}>{aqiLabel}</div>
          </motion.div>
          <MetricCard label="PM10"    value={airCurrent?.pm10?.toFixed(1) ?? '--'}              unit="μg/m³" icon="🔵" accentColor={CHART_COLORS.blue} />
          <MetricCard label="PM2.5"   value={airCurrent?.pm2_5?.toFixed(1) ?? '--'}             unit="μg/m³" icon="🟣" accentColor={CHART_COLORS.purple} />
          <MetricCard label="CO"      value={airCurrent?.carbon_monoxide?.toFixed(0) ?? '--'}   unit="μg/m³" icon="🟠" accentColor={CHART_COLORS.amber} />
          <MetricCard label="NO₂"     value={airCurrent?.nitrogen_dioxide?.toFixed(1) ?? '--'}  unit="μg/m³" icon="🟡" accentColor={CHART_COLORS.amber} />
          <MetricCard label="SO₂"     value={airCurrent?.sulphur_dioxide?.toFixed(1) ?? '--'}   unit="μg/m³" icon="🟤" accentColor={CHART_COLORS.rose} />
          <MetricCard label="CO₂"     value="~415"                                              unit="ppm"   icon="🌍" accentColor={CHART_COLORS.green} sub="Global avg" />
        </div>
      </motion.section>

      {/* ── Section 3: Hourly Charts ──────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <SectionLabel>Hourly breakdown</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Temperature */}
          <ChartWrapper
            title="Temperature"
            minWidth={640}
            rightSlot={
              <TempToggle value={tempUnit} onChange={setTempUnit} />
            }
          >
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={tempHourlyData} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="label" tick={axisStyle} interval={2} />
                <YAxis tick={axisStyle} unit={tempUnit === 'C' ? '°' : '°'} />
                <Tooltip content={<CustomTooltip unit={tempUnit === 'C' ? '°C' : '°F'} />} />
                <Line type="monotone" dataKey="value" name="Temp" stroke={CHART_COLORS.rose} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: CHART_COLORS.rose }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* Humidity */}
          <ChartWrapper title="Relative Humidity" minWidth={640}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hourly?.humidity} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="label" tick={axisStyle} interval={2} />
                <YAxis tick={axisStyle} unit="%" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip unit="%" />} />
                <ReferenceLine y={80} stroke={CHART_COLORS.blue} strokeDasharray="4 4" opacity={0.5} />
                <Line type="monotone" dataKey="value" name="Humidity" stroke={CHART_COLORS.cyan} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* Precipitation */}
          <ChartWrapper title="Precipitation" minWidth={640}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourly?.precip} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="label" tick={axisStyle} interval={2} />
                <YAxis tick={axisStyle} unit=" mm" />
                <Tooltip content={<CustomTooltip unit="mm" />} />
                <Bar dataKey="value" name="Precip" fill={CHART_COLORS.blue} radius={[3, 3, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* Visibility */}
          <ChartWrapper title="Visibility" minWidth={640}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hourly?.vis} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="label" tick={axisStyle} interval={2} />
                <YAxis tick={axisStyle} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} unit=" m" />
                <Tooltip content={<CustomTooltip formatter={formatVisibility} />} />
                <Line type="monotone" dataKey="value" name="Visibility" stroke={CHART_COLORS.green} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* Wind Speed */}
          <ChartWrapper title="Wind Speed (10m)" minWidth={640}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hourly?.wind} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="label" tick={axisStyle} interval={2} />
                <YAxis tick={axisStyle} unit=" km/h" />
                <Tooltip content={<CustomTooltip unit="km/h" />} />
                <Line type="monotone" dataKey="value" name="Wind" stroke={CHART_COLORS.cyan} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* PM10 & PM2.5 Combined */}
          <ChartWrapper title="PM10 & PM2.5" minWidth={640}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={airHourly} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="label" tick={axisStyle} interval={2} />
                <YAxis tick={axisStyle} unit=" μg" />
                <Tooltip content={<CustomTooltip unit="μg/m³" />} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                <Line type="monotone" dataKey="pm10" name="PM10"  stroke={CHART_COLORS.blue}   strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="pm25" name="PM2.5" stroke={CHART_COLORS.purple} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>

        </div>
      </motion.section>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function PageHeader({ date, onDateChange, location }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <motion.h1
          className="text-2xl font-semibold"
          style={{ color: 'var(--text-primary)' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isToday(date) ? "Today's Weather" : formatDisplayDate(date)}
        </motion.h1>
        <div className="flex items-center gap-2 mt-0.5">
          <AnimatePresence mode="wait">
            {location ? (
              <motion.span
                key={location}
                className="text-sm flex items-center gap-1"
                style={{ color: 'var(--accent-blue)' }}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
                {location}
              </motion.span>
            ) : (
              <motion.span
                key="detecting"
                className="text-sm"
                style={{ color: 'var(--text-muted)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Detecting location…
              </motion.span>
            )}
          </AnimatePresence>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>· Open-Meteo</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <DatePicker
          selected={date}
          onChange={onDateChange}
          maxDate={new Date()}
          dateFormat="dd MMM yyyy"
          customInput={<DateInput />}
          popperPlacement="bottom-end"
        />
      </div>
    </div>
  )
}

const DateInput = ({ value, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    {value}
  </button>
)

function TempToggle({ value, onChange }) {
  return (
    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {['C', 'F'].map(u => (
        <button
          key={u}
          onClick={() => onChange(u)}
          className="px-3 py-1 text-xs font-medium transition-all"
          style={{
            background: value === u ? 'rgba(99,179,237,0.15)' : 'transparent',
            color: value === u ? 'var(--accent-blue)' : 'var(--text-muted)',
          }}
        >
          °{u}
        </button>
      ))}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <motion.h2
      className="text-xs font-semibold uppercase tracking-widest mb-3"
      style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.h2>
  )
}

function GpsError({ message }) {
  return (
    <motion.div
      className="rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2"
      style={{ background: 'rgba(246,173,85,0.08)', border: '1px solid rgba(246,173,85,0.2)', color: 'var(--accent-amber)' }}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span>⚠️</span> {message}
    </motion.div>
  )
}

function isToday(date) {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function formatDisplayDate(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
